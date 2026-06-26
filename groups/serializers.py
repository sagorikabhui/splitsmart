from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, GroupMember

User = get_user_model()

class GroupMemberSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    avatar = serializers.ImageField(source='user.avatar', read_only=True)

    class Meta:
        model = GroupMember
        fields = ['id', 'user', 'user_name', 'user_email', 'avatar', 'role', 'joined_at']


class GroupSerializer(serializers.ModelSerializer):
    members_detail = GroupMemberSerializer(source='group_members', many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    total_members = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'group_type', 'image', 'created_by',
                  'created_by_name', 'members_detail', 'total_members', 'created_at']
        read_only_fields = ['created_by']

    def get_total_members(self, obj):
        return obj.group_members.count()