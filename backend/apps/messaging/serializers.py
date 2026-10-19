from rest_framework import serializers
from django.utils import timezone
from .models import Message, Notification

class MessageSerializer(serializers.ModelSerializer):
    content = serializers.CharField(write_only=True, required=False)
    text = serializers.CharField(required=False)
    is_read = serializers.BooleanField(required=False)
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            'id', 'sender', 'sender_name', 'recipient', 'recipient_name',
            'text', 'content', 'is_read', 'sent_at', 'read_at'
        )
        read_only_fields = ('sender', 'sender_name', 'recipient_name', 'sent_at', 'read_at')

    def get_sender_name(self, obj):
        u = obj.sender
        if hasattr(u, 'company_profile') and u.company_profile.company_name:
            return u.company_profile.company_name
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.username

    def get_recipient_name(self, obj):
        u = obj.recipient
        if hasattr(u, 'company_profile') and u.company_profile.company_name:
            return u.company_profile.company_name
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.username

    def validate(self, attrs):
        if not attrs.get('text') and attrs.get('content'):
            attrs['text'] = attrs.pop('content')
        elif 'content' in attrs:
            attrs.pop('content')
        if self.instance is None and not attrs.get('text'):
            raise serializers.ValidationError({'text': 'Message text/content is required.'})
        return attrs

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['content'] = instance.text
        ret['is_read'] = instance.read_at is not None
        return ret

    def update(self, instance, validated_data):
        is_read = validated_data.pop('is_read', None)
        if is_read is True and instance.read_at is None:
            instance.read_at = timezone.now()
        elif is_read is False:
            instance.read_at = None
        return super().update(instance, validated_data)

class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ('id', 'user', 'recipient_name', 'message', 'type', 'is_read', 'created_at')
        read_only_fields = ('created_at', 'recipient_name')
        extra_kwargs = {
            'user': {'required': False}
        }

    def get_recipient_name(self, obj):
        u = obj.user
        if not u:
            return "System"
        if hasattr(u, 'company_profile') and u.company_profile.company_name:
            return u.company_profile.company_name
        full = f"{u.first_name} {u.last_name}".strip()
        return full or u.username

