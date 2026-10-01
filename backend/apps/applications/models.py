from django.db import models
from apps.accounts.models import CandidateProfile
from apps.jobs.models import Job

class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = "APPLIED", "Applied"
        REVIEWING = "REVIEWING", "Reviewing"
        INTERVIEW = "INTERVIEW", "Interview"
        OFFERED = "OFFERED", "Offered"
        REJECTED = "REJECTED", "Rejected"

    candidate = models.ForeignKey(CandidateProfile, on_delete=models.CASCADE, related_name="applications")
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="applications")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    resume_file = models.FileField(upload_to='resumes/applications/', null=True, blank=True)
    cover_letter = models.TextField(blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('candidate', 'job')

    def __str__(self):
        return f"{self.candidate.user.username} applied to {self.job.title}"
