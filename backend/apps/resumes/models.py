from django.db import models


class Resume(models.Model):
    candidate = models.ForeignKey(
        'accounts.CandidateProfile',
        on_delete=models.CASCADE,
        related_name='uploaded_resumes',
    )
    file = models.FileField(upload_to='resumes/uploads/', null=True, blank=True)
    file_name = models.CharField(max_length=255, blank=True)
    target_role = models.CharField(max_length=255, blank=True)
    parsed_data = models.JSONField(default=dict)
    analysis = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Resume #{self.id} for {self.candidate.user.username} ({self.target_role or 'General'})"


class ResumeVersion(models.Model):
    candidate = models.ForeignKey(
        'accounts.CandidateProfile',
        on_delete=models.CASCADE,
        related_name='resume_versions',
    )
    version_number = models.PositiveIntegerField(default=1)
    title = models.CharField(max_length=255, default='Draft CV')
    template = models.CharField(max_length=50, default='modern')
    content = models.JSONField(default=dict)
    is_current = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    reanalysis_data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-version_number']

    def __str__(self):
        return f"CV v{self.version_number} - {self.title} ({self.candidate.user.username})"


class CandidateUsage(models.Model):
    candidate = models.OneToOneField(
        'accounts.CandidateProfile',
        on_delete=models.CASCADE,
        related_name='cv_usage',
    )
    plan_tier = models.CharField(max_length=20, default='FREE')  # FREE or PREMIUM
    improvements_used = models.PositiveIntegerField(default=0)
    improvements_limit = models.PositiveIntegerField(default=5)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Usage for {self.candidate.user.username} ({self.plan_tier}: {self.improvements_used}/{self.improvements_limit})"

