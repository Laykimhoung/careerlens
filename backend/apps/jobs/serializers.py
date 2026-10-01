from rest_framework import serializers
from .models import Skill, Job, JobSkill, SavedJob
from apps.accounts.serializers import CompanyProfileSerializer

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'

class JobSkillSerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    skill_id = serializers.PrimaryKeyRelatedField(
        queryset=Skill.objects.all(), source='skill', write_only=True
    )

    class Meta:
        model = JobSkill
        fields = ('id', 'skill', 'skill_id')

class JobSerializer(serializers.ModelSerializer):
    company = CompanyProfileSerializer(read_only=True)
    job_skills = JobSkillSerializer(many=True, read_only=True)

    class Meta:
        model = Job
        fields = (
            'id', 'company', 'title', 'description', 'location', 
            'employment_type', 'workplace_type', 'salary_min', 'salary_max', 
            'status', 'deadline', 'created_at', 'updated_at', 'job_skills'
        )
        read_only_fields = ('company', 'created_at', 'updated_at')

class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(), source='job', write_only=True
    )

    class Meta:
        model = SavedJob
        fields = ('id', 'candidate', 'job', 'job_id', 'created_at')
        read_only_fields = ('candidate', 'created_at')
