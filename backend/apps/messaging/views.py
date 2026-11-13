from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Message, Notification
from .serializers import MessageSerializer, NotificationSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "messaging"

    def get_queryset(self):
        user = self.request.user
        if user.role == user.Role.ADMIN:
            return Message.objects.select_related('sender', 'recipient').all().order_by('-sent_at')
        return Message.objects.select_related('sender', 'recipient').filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by('-sent_at')

    def perform_create(self, serializer):
        msg = serializer.save(sender=self.request.user)
        if msg.recipient != self.request.user:
            sender_name = f"{self.request.user.first_name} {self.request.user.last_name}".strip() or self.request.user.username
            Notification.objects.create(
                user=msg.recipient,
                message=f"New message from {sender_name}: {msg.text[:50]}",
                type=Notification.Type.INFO
            )

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if user.role != user.Role.ADMIN:
            if instance.recipient == user and instance.sender != user:
                # Recipients may only toggle read status, never rewrite message text or recipient
                attempted_keys = set(serializer.validated_data.keys())
                if attempted_keys - {'is_read'}:
                    raise PermissionDenied("Recipients can only mark a message as read.")
            elif instance.sender != user:
                raise PermissionDenied("You are not authorized to modify this message.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if user.role != user.Role.ADMIN and instance.sender != user:
            raise PermissionDenied("Only the sender or an admin can delete this message.")
        instance.delete()

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        message = self.get_object()
        if message.recipient == request.user or request.user.role == request.user.Role.ADMIN:
            message.read_at = timezone.now()
            message.save()
            return Response({'status': 'Message marked as read'})
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == user.Role.ADMIN:
            return Notification.objects.select_related('user').all().order_by('-created_at')
        return Notification.objects.select_related('user').filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        if self.request.user.role == self.request.user.Role.ADMIN:
            target_user = serializer.validated_data.get('user') or self.request.user
        else:
            target_user = self.request.user
        serializer.save(user=target_user)

    @action(detail=True, methods=['post', 'patch'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        if notification.user == request.user or request.user.role == request.user.Role.ADMIN:
            notification.is_read = True
            notification.save()
            return Response({'status': 'Notification marked as read'})
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=False, methods=['post', 'patch'])
    def mark_all_read(self, request):
        qs = self.get_queryset().filter(is_read=False)
        updated_count = qs.update(is_read=True)
        return Response({'status': 'All notifications marked as read', 'updated': updated_count})


