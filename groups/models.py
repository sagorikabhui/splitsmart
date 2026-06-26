from django.db import models
from django.conf import settings

class Group(models.Model):
    GROUP_TYPES = [
        ('home', 'Home'),
        ('trip', 'Trip'),
        ('office', 'Office'),
        ('friends', 'Friends'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    group_type = models.CharField(max_length=20, choices=GROUP_TYPES, default='other')
    image = models.ImageField(upload_to='groups/', blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_groups')
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, through='GroupMember', related_name='joined_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'groups'

    def __str__(self):
        return self.name


class GroupMember(models.Model):
    ROLES = [
        ('admin', 'Admin'),
        ('member', 'Member'),
    ]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='group_members')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_memberships')
    role = models.CharField(max_length=10, choices=ROLES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'group_members'
        unique_together = ('group', 'user')

    def __str__(self):
        return f"{self.user} in {self.group.name}"