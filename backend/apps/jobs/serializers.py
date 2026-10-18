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
    skills = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            'id', 'company', 'title', 'description', 'location', 
            'employment_type', 'workplace_type', 'salary_min', 'salary_max', 
            'status', 'deadline', 'created_at', 'updated_at', 'job_skills', 'skills'
        )
        read_only_fields = ('company', 'created_at', 'updated_at', 'skills')

    def get_skills(self, obj):
        return [js.skill.name for js in obj.job_skills.all() if js.skill]

    def _sync_skills(self, job):
        if not hasattr(self, 'initial_data') or not isinstance(self.initial_data, dict):
            return
        if 'skills' not in self.initial_data:
            return
        raw_skills = self.initial_data.get('skills')
        if not isinstance(raw_skills, list):
            return
        keep_ids = []
        for item in raw_skills:
            skill_name = item.get('name', '').strip() if isinstance(item, dict) else str(item).strip()
            if not skill_name:
                continue
            skill_obj = Skill.objects.filter(name__iexact=skill_name).first()
            if not skill_obj:
                skill_obj = Skill.objects.create(name=skill_name)
            js, _ = JobSkill.objects.get_or_create(job=job, skill=skill_obj)
            keep_ids.append(js.id)
        JobSkill.objects.filter(job=job).exclude(id__in=keep_ids).delete()

    def create(self, validated_data):
        job = super().create(validated_data)
        self._sync_skills(job)
        return job

    def update(self, instance, validated_data):
        job = super().update(instance, validated_data)
        self._sync_skills(job)
        return job

class SavedJobSerializer(serializers.ModelSerializer):
    job = JobSerializer(read_only=True)
    job_id = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(), source='job', write_only=True
    )

    class Meta:
        model = SavedJob
        fields = ('id', 'candidate', 'job', 'job_id', 'created_at')
        read_only_fields = ('candidate', 'created_at')
