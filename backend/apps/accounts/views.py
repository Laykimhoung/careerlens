from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer, 
    UserSerializer, 
    CandidateProfileSerializer, 
    CompanyProfileSerializer
)
from .models import CandidateProfile, CompanyProfile
from .permissions import IsOwnerOrReadOnly

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class CurrentUserView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the authenticated user's core details.
    """
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

class CandidateProfileViewSet(viewsets.ModelViewSet):
    """
    View, list, and update candidate profiles.
    Only the profile owner can update their profile.
    """
    queryset = CandidateProfile.objects.all()
    serializer_class = CandidateProfileSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        # Allow searching/filtering if needed later
        return super().get_queryset()

class CompanyProfileViewSet(viewsets.ModelViewSet):
    """
    View, list, and update company profiles.
    Only the profile owner can update their profile.
    """
    queryset = CompanyProfile.objects.all()
    serializer_class = CompanyProfileSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrReadOnly)

    def get_queryset(self):
        # Allow searching/filtering if needed later
        return super().get_queryset()

