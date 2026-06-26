from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import Group, GroupMember
from .serializers import GroupSerializer

User = get_user_model()

class GroupListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        groups = Group.objects.filter(group_members__user=request.user, is_active=True)
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            group = serializer.save(created_by=request.user)
            # Automatically add creator as admin member
            GroupMember.objects.create(group=group, user=request.user, role='admin')
            return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            group = Group.objects.get(pk=pk, group_members__user=request.user)
            serializer = GroupSerializer(group)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            group = Group.objects.get(pk=pk, created_by=request.user)
            serializer = GroupSerializer(group, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            group = Group.objects.get(pk=pk, created_by=request.user)
            group.is_active = False
            group.save()
            return Response({'message': 'Group deleted successfully'}, status=status.HTTP_200_OK)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)


class AddMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            group = Group.objects.get(pk=pk, created_by=request.user)
            email = request.data.get('email')
            try:
                user = User.objects.get(email=email)
                if GroupMember.objects.filter(group=group, user=user).exists():
                    return Response({'error': 'User already in group'}, status=status.HTTP_400_BAD_REQUEST)
                GroupMember.objects.create(group=group, user=user, role='member')
                return Response({'message': f'{user.get_full_name()} added successfully'}, status=status.HTTP_201_CREATED)
            except User.DoesNotExist:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)


class RemoveMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, user_id):
        try:
            group = Group.objects.get(pk=pk, created_by=request.user)
            try:
                member = GroupMember.objects.get(group=group, user_id=user_id)
                member.delete()
                return Response({'message': 'Member removed successfully'}, status=status.HTTP_200_OK)
            except GroupMember.DoesNotExist:
                return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        except Group.DoesNotExist:
            return Response({'error': 'Group not found'}, status=status.HTTP_404_NOT_FOUND)