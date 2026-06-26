from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Expense, ExpenseSplit, Settlement

User = get_user_model()

class ExpenseSplitSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = ExpenseSplit
        fields = ['id', 'user', 'user_name', 'user_email', 'amount_owed', 'percentage', 'is_settled', 'settled_at']


class ExpenseSerializer(serializers.ModelSerializer):
    splits = ExpenseSplitSerializer(many=True, read_only=True)
    paid_by_name = serializers.CharField(source='paid_by.get_full_name', read_only=True)
    split_members = serializers.ListField(write_only=True, required=False)

    class Meta:
        model = Expense
        fields = ['id', 'title', 'description', 'amount', 'category', 'split_type',
                  'paid_by', 'paid_by_name', 'group', 'receipt_image', 'date',
                  'is_settled', 'splits', 'split_members', 'created_at']
        read_only_fields = ['created_by', 'paid_by']

    def create(self, validated_data):
        split_members = validated_data.pop('split_members', [])
        expense = Expense.objects.create(**validated_data)

        if split_members:
            split_type = expense.split_type
            total_amount = expense.amount

            if split_type == 'equal':
                split_amount = total_amount / len(split_members)
                for member_id in split_members:
                    try:
                        user = User.objects.get(id=member_id)
                        ExpenseSplit.objects.create(
                            expense=expense,
                            user=user,
                            amount_owed=round(split_amount, 2)
                        )
                    except User.DoesNotExist:
                        pass
        return expense


class SettlementSerializer(serializers.ModelSerializer):
    paid_by_name = serializers.CharField(source='paid_by.get_full_name', read_only=True)
    paid_to_name = serializers.CharField(source='paid_to.get_full_name', read_only=True)

    class Meta:
        model = Settlement
        fields = ['id', 'paid_by', 'paid_by_name', 'paid_to', 'paid_to_name',
                  'amount', 'group', 'note', 'upi_transaction_id', 'created_at']
        read_only_fields = ['paid_by']