from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import CandidateProfile, CompanyProfile, CandidateSkill, AuditLog

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Allows authentication using either username or email address.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields[self.username_field].required = False

    def validate(self, attrs):
        identifier = attrs.get(self.username_field) or self.initial_data.get("email") or ""
        identifier = str(identifier).strip()
        if identifier:
            user_obj = User.objects.filter(username__iexact=identifier).first()
            if not user_obj and "@" in identifier:
                user_obj = User.objects.filter(email__iexact=identifier).first()
            if user_obj:
                attrs[self.username_field] = user_obj.username
            else:
                attrs[self.username_field] = identifier
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined', 'password')
        read_only_fields = ('username', 'role', 'is_active', 'date_joined')

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined', 'password')
        read_only_fields = ('date_joined',)

    def create(self, validated_data):
        password = validated_data.pop('password', None) or 'CareerLens2026!Demo'
        user = User(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == User.Role.CANDIDATE:
            CandidateProfile.objects.get_or_create(user=user)
        elif user.role == User.Role.COMPANY:
            CompanyProfile.objects.get_or_create(
                user=user,
                defaults={'company_name': f"{user.first_name} {user.last_name}".strip() or user.username}
            )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if password:
            instance.set_password(password)
        instance.save()

        if instance.role == User.Role.CANDIDATE:
            CandidateProfile.objects.get_or_create(user=instance)
        elif instance.role == User.Role.COMPANY:
            CompanyProfile.objects.get_or_create(
                user=instance,
                defaults={'company_name': f"{instance.first_name} {instance.last_name}".strip() or instance.username}
            )
        return instance


class CandidateSkillSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='skill.name', read_only=True)
    skill_id = serializers.IntegerField(source='skill.id', read_only=True)

    class Meta:
        model = CandidateSkill
        fields = ('id', 'skill_id', 'name', 'proficiency')


class CandidateProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    skills = CandidateSkillSerializer(many=True, read_only=True)

    class Meta:
        model = CandidateProfile
        fields = ('id', 'user', 'university', 'major', 'graduation_year', 'bio', 'resume_file', 'skills')
        read_only_fields = ('user',)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        is_admin = bool(request and request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)

        # Allow updating user first_name / last_name (and email / is_active for admin)
        if hasattr(self, 'initial_data') and isinstance(self.initial_data, dict):
            user = instance.user
            user_changed = False
            if 'first_name' in self.initial_data:
                user.first_name = self.initial_data['first_name']
                user_changed = True
            if 'last_name' in self.initial_data:
                user.last_name = self.initial_data['last_name']
                user_changed = True
            if is_admin:
                if 'email' in self.initial_data and self.initial_data['email']:
                    user.email = self.initial_data['email']
                    user_changed = True
                if 'is_active' in self.initial_data:
                    val = self.initial_data['is_active']
                    user.is_active = val if isinstance(val, bool) else str(val).lower() in ('true', '1', 'active')
                    user_changed = True
            if user_changed:
                user.save()

            # Allow clearing resume_file when null or empty string is explicitly sent in JSON
            if 'resume_file' in self.initial_data and self.initial_data.get('resume_file') in (None, ''):
                if instance.resume_file:
                    instance.resume_file.delete(save=False)
                instance.resume_file = None
                validated_data.pop('resume_file', None)

            # Sync candidate skills if 'skills' array is provided
            if 'skills' in self.initial_data and isinstance(self.initial_data['skills'], list):
                from apps.jobs.models import Skill
                raw_skills = self.initial_data['skills']
                desired = []
                for item in raw_skills:
                    if isinstance(item, str) and item.strip():
                        desired.append((item.strip(), CandidateSkill.Proficiency.INTERMEDIATE))
                    elif isinstance(item, dict) and item.get('name', '').strip():
                        prof = item.get('proficiency', CandidateSkill.Proficiency.INTERMEDIATE)
                        if prof not in CandidateSkill.Proficiency.values:
                            prof = CandidateSkill.Proficiency.INTERMEDIATE
                        desired.append((item['name'].strip(), prof))

                keep_skill_ids = []
                for skill_name, prof in desired:
                    skill_obj = Skill.objects.filter(name__iexact=skill_name).first()
                    if not skill_obj:
                        skill_obj = Skill.objects.create(name=skill_name)
                    cs, _ = CandidateSkill.objects.update_or_create(
                        candidate=instance,
                        skill=skill_obj,
                        defaults={'proficiency': prof}
                    )
                    keep_skill_ids.append(cs.id)
                CandidateSkill.objects.filter(candidate=instance).exclude(id__in=keep_skill_ids).delete()

        return super().update(instance, validated_data)


class CompanyProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_verified = serializers.SerializerMethodField()
    company_size = serializers.CharField(source='size', read_only=True)

    class Meta:
        model = CompanyProfile
        fields = (
            'id', 'user', 'company_name', 'industry', 'size', 'company_size',
            'location', 'website', 'verification_status', 'is_verified'
        )
        read_only_fields = ('user', 'verification_status', 'is_verified', 'company_size')

    def get_is_verified(self, obj):
        return obj.verification_status == CompanyProfile.VerificationStatus.VERIFIED

    def update(self, instance, validated_data):
        request = self.context.get('request')
        is_admin = bool(request and request.user and request.user.is_authenticated and request.user.role == User.Role.ADMIN)

        if hasattr(self, 'initial_data') and isinstance(self.initial_data, dict):
            if 'company_size' in self.initial_data and 'size' not in validated_data:
                instance.size = self.initial_data['company_size'] or ''

            if is_admin:
                if 'verification_status' in self.initial_data:
                    new_status = self.initial_data['verification_status']
                    if new_status in CompanyProfile.VerificationStatus.values:
                        instance.verification_status = new_status
                elif 'is_verified' in self.initial_data:
                    ver_bool = self.initial_data['is_verified']
                    is_ver = ver_bool if isinstance(ver_bool, bool) else str(ver_bool).lower() in ('true', '1', 'verified')
                    instance.verification_status = (
                        CompanyProfile.VerificationStatus.VERIFIED
                        if is_ver
                        else CompanyProfile.VerificationStatus.PENDING
                    )

            user = instance.user
            user_changed = False
            if 'first_name' in self.initial_data:
                user.first_name = self.initial_data['first_name']
                user_changed = True
            if 'last_name' in self.initial_data:
                user.last_name = self.initial_data['last_name']
                user_changed = True
            if 'email' in self.initial_data and self.initial_data['email']:
                user.email = self.initial_data['email']
                user_changed = True
            if is_admin and 'is_active' in self.initial_data:
                val = self.initial_data['is_active']
                user.is_active = val if isinstance(val, bool) else str(val).lower() in ('true', '1', 'active')
                user_changed = True
            if user_changed:
                user.save()

        return super().update(instance, validated_data)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name', 'role')

    def create(self, validated_data):
        user = User.objects.create(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data['role']
        )
        user.set_password(validated_data['password'])
        user.save()

        initial = getattr(self, 'initial_data', {}) or {}

        # Automatically create the corresponding profile
        if user.role == User.Role.CANDIDATE:
            grad_year = initial.get('graduation_year')
            try:
                grad_year = int(grad_year) if grad_year else None
            except (TypeError, ValueError):
                grad_year = None
            CandidateProfile.objects.create(
                user=user,
                university=initial.get('university', '') or '',
                major=initial.get('major', '') or '',
                graduation_year=grad_year,
                bio=initial.get('bio', '') or '',
            )
        elif user.role == User.Role.COMPANY:
            CompanyProfile.objects.create(
                user=user,
                company_name=initial.get('company_name') or user.username,
                industry=initial.get('industry', '') or '',
                size=initial.get('size') or initial.get('company_size') or '',
                location=initial.get('location', '') or '',
                website=initial.get('website', '') or '',
            )

        return user


class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor.username', read_only=True, default='System')

    class Meta:
        model = AuditLog
        fields = ('id', 'actor', 'actor_username', 'action', 'target_type', 'target_id', 'details', 'created_at')
        read_only_fields = ('actor', 'actor_username', 'action', 'target_type', 'target_id', 'details', 'created_at')

