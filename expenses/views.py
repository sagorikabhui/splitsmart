from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from .models import Expense, ExpenseSplit, Settlement
from .serializers import ExpenseSerializer, SettlementSerializer

User = get_user_model()

class ExpenseListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        expenses = Expense.objects.filter(
            Q(paid_by=request.user) | Q(splits__user=request.user)
        ).distinct()
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ExpenseSerializer(data=request.data)
        if serializer.is_valid():
            expense = serializer.save(
                paid_by=request.user,
                created_by=request.user
            )
            return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ExpenseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            expense = Expense.objects.get(pk=pk)
            serializer = ExpenseSerializer(expense)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Expense.DoesNotExist:
            return Response({'error': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            expense = Expense.objects.get(pk=pk, created_by=request.user)
            serializer = ExpenseSerializer(expense, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Expense.DoesNotExist:
            return Response({'error': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            expense = Expense.objects.get(pk=pk, created_by=request.user)
            expense.delete()
            return Response({'message': 'Expense deleted successfully'}, status=status.HTTP_200_OK)
        except Expense.DoesNotExist:
            return Response({'error': 'Expense not found'}, status=status.HTTP_404_NOT_FOUND)


class BalanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        balances = {}

        # Money others owe to me
        splits_owed_to_me = ExpenseSplit.objects.filter(
            expense__paid_by=user,
            is_settled=False
        ).exclude(user=user)

        for split in splits_owed_to_me:
            other_user = split.user
            if other_user.id not in balances:
                balances[other_user.id] = {
                    'user_id': other_user.id,
                    'user_name': other_user.get_full_name(),
                    'user_email': other_user.email,
                    'amount': 0
                }
            balances[other_user.id]['amount'] += float(split.amount_owed)

        # Money I owe to others
        my_splits = ExpenseSplit.objects.filter(
            user=user,
            is_settled=False
        ).exclude(expense__paid_by=user)

        for split in my_splits:
            other_user = split.expense.paid_by
            if other_user.id not in balances:
                balances[other_user.id] = {
                    'user_id': other_user.id,
                    'user_name': other_user.get_full_name(),
                    'user_email': other_user.email,
                    'amount': 0
                }
            balances[other_user.id]['amount'] -= float(split.amount_owed)

        return Response(list(balances.values()), status=status.HTTP_200_OK)


class SettlementView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SettlementSerializer(data=request.data)
        if serializer.is_valid():
            settlement = serializer.save(paid_by=request.user)
            # Mark related splits as settled
            ExpenseSplit.objects.filter(
                user=request.user,
                expense__paid_by=settlement.paid_to,
                is_settled=False
            ).update(is_settled=True)
            return Response(SettlementSerializer(settlement).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
class SimplifyDebtsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all unsettled splits in user's groups
        group_ids = user.joined_groups.values_list('id', flat=True)

        # Build balance map
        balances = {}

        splits = ExpenseSplit.objects.filter(
            expense__group__in=group_ids,
            is_settled=False
        ).select_related('expense__paid_by', 'user')

        for split in splits:
            payer = split.expense.paid_by
            ower = split.user

            if payer == ower:
                continue

            # Payer is owed money
            if payer.id not in balances:
                balances[payer.id] = {
                    'user_id': payer.id,
                    'user_name': payer.get_full_name(),
                    'amount': 0
                }
            balances[payer.id]['amount'] += float(split.amount_owed)

            # Ower owes money
            if ower.id not in balances:
                balances[ower.id] = {
                    'user_id': ower.id,
                    'user_name': ower.get_full_name(),
                    'amount': 0
                }
            balances[ower.id]['amount'] -= float(split.amount_owed)

        # Simplification algorithm
        creditors = []
        debtors = []

        for user_id, data in balances.items():
            if data['amount'] > 0:
                creditors.append(data.copy())
            elif data['amount'] < 0:
                debtors.append(data.copy())

        transactions = []

        while creditors and debtors:
            creditor = creditors[0]
            debtor = debtors[0]

            amount = min(creditor['amount'], abs(debtor['amount']))

            transactions.append({
                'from_user': debtor['user_name'],
                'to_user': creditor['user_name'],
                'amount': round(amount, 2)
            })

            creditor['amount'] -= amount
            debtor['amount'] += amount

            if creditor['amount'] == 0:
                creditors.pop(0)
            if debtor['amount'] == 0:
                debtors.pop(0)

        return Response({
            'simplified_transactions': transactions,
            'total_transactions': len(transactions)
        }, status=status.HTTP_200_OK)
        
class UPIPaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        paid_to_id = request.data.get('paid_to')
        amount = request.data.get('amount')
        note = request.data.get('note', 'SplitSmart Settlement')

        try:
            paid_to_user = User.objects.get(id=paid_to_id)

            if not paid_to_user.upi_id:
                return Response({
                    'error': 'This user has not added their UPI ID yet!'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Generate UPI deep link
            upi_link = f"upi://pay?pa={paid_to_user.upi_id}&pn={paid_to_user.get_full_name()}&am={amount}&cu=INR&tn={note}"

            return Response({
                'upi_link': upi_link,
                'upi_id': paid_to_user.upi_id,
                'user_name': paid_to_user.get_full_name(),
                'amount': amount
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                'error': 'User not found!'
            }, status=status.HTTP_404_NOT_FOUND)