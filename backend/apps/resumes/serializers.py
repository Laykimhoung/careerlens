from rest_framework import serializers
from .models import Resume, ResumeVersion, CandidateUsage


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = (
            'id', 'file', 'file_name', 'target_role', 'parsed_data',
            'analysis', 'is_active', 'created_at', 'updated_at',
        )
        read_only_fields = ('created_at', 'updated_at')


class ResumeVersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeVersion
        fields = (
            'id', 'version_number', 'title', 'template', 'content',
            'is_current', 'is_approved', 'reanalysis_data', 'created_at', 'updated_at',
        )
        read_only_fields = ('version_number', 'created_at', 'updated_at')


class CandidateUsageSerializer(serializers.ModelSerializer):
    improvements_remaining = serializers.SerializerMethodField()

    class Meta:
        model = CandidateUsage
        fields = (
            'plan_tier', 'improvements_used', 'improvements_limit',
            'improvements_remaining', 'updated_at',
        )

    def get_improvements_remaining(self, obj):
        return max(0, obj.improvements_limit - obj.improvements_used)

