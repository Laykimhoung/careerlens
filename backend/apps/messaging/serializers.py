from rest_framework import serializers
from .models import Message, Notification

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ('id', 'sender', 'recipient', 'text', 'sent_at', 'read_at')
        read_only_fields = ('sender', 'sent_at', 'read_at')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'user', 'message', 'type', 'is_read', 'created_at')
        read_only_fields = ('user', 'created_at')
