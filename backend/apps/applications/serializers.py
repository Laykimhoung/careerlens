from rest_framework import serializers
from .models import Application
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
