from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Message, Notification
from .serializers import MessageSerializer, NotificationSerializer

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == user.Role.ADMIN:
            return Message.objects.select_related('sender', 'recipient').all().order_by('-sent_at')
        return Message.objects.select_related('sender', 'recipient').filter(
            Q(sender=user) | Q(recipient=user)
        ).order_by('-sent_at')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

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
        target_user = serializer.validated_data.get('user') or self.request.user
        serializer.save(user=target_user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        if notification.user == request.user or request.user.role == request.user.Role.ADMIN:
            notification.is_read = True
            notification.save()
            return Response({'status': 'Notification marked as read'})
        return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)


