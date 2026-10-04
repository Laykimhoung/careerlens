from django.db import models

class Message(models.Model):
    sender = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name="sent_messages")
    recipient = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name="received_messages")
    text = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Message from {self.sender.username} to {self.recipient.username} at {self.sent_at}"

class Notification(models.Model):
    class Type(models.TextChoices):
        INFO = "INFO", "Info"
        ALERT = "ALERT", "Alert"
        SUCCESS = "SUCCESS", "Success"

    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name="notifications")
    message = models.TextField()
    type = models.CharField(max_length=20, choices=Type.choices, default=Type.INFO)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.username}: {self.message[:20]}"

