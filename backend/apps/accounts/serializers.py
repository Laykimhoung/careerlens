from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import CandidateProfile, CompanyProfile

User = get_user_model()

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

        # Automatically create the corresponding profile
        if user.role == User.Role.CANDIDATE:
            CandidateProfile.objects.create(user=user)
        elif user.role == User.Role.COMPANY:
            CompanyProfile.objects.create(user=user, company_name=user.username)
        
        return user
