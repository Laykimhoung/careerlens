from rest_framework import serializers
from .models import Application, ApplicationStatusHistory, Interview, Offer, ApplicationNote
from apps.jobs.serializers import JobSerializer

class ApplicationSerializer(serializers.ModelSerializer):
    job_details = JobSerializer(source='job', read_only=True)
    job_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Application
        fields = (
            'id', 'candidate', 'job_id', 'job_details', 'status', 
            'resume_file', 'cover_letter', 'applied_at', 'updated_at'
        )
        read_only_fields = ('candidate', 'applied_at', 'updated_at', 'status')

class ApplicationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = ('status',)

class ApplicationStatusHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationStatusHistory
        fields = '__all__'
        read_only_fields = ('application', 'changed_by', 'old_status', 'new_status', 'note', 'created_at')

class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = ('id', 'application', 'scheduled_by', 'scheduled_at', 'meeting_link', 'location', 'status', 'feedback')
        read_only_fields = ('scheduled_by',)

class OfferSerializer(serializers.ModelSerializer):
    class Meta:
        model = Offer
        fields = ('id', 'application', 'salary', 'currency', 'message', 'status', 'sent_at', 'responded_at')
        read_only_fields = ('sent_at', 'responded_at')

class ApplicationNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationNote
        fields = ('id', 'application', 'author', 'note', 'created_at', 'updated_at')
        read_only_fields = ('author', 'created_at', 'updated_at')

