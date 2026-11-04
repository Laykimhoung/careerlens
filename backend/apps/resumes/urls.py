from django.urls import path
from .views import (
    ResumeUploadView,
    LatestResumeView,
    ResumeDetailView,
    ResumeParsedDataView,
    ResumeAnalyzeView,
    ImprovementDiagnosisView,
    ImprovementQuestionnaireView,
    ImprovementGenerateView,
    ResumeVersionsListView,
    ResumeVersionDetailView,
    ApproveResumeVersionView,
    ReanalyzeResumeVersionView,
    RestoreResumeVersionView,
    ExportDocxResumeView,
    UsageSummaryView,
)

urlpatterns = [
    # Core Resume Analyzer
    path('upload/', ResumeUploadView.as_view(), name='resume_upload'),
    path('latest/', LatestResumeView.as_view(), name='latest_resume'),
    path('<int:pk>/', ResumeDetailView.as_view(), name='resume_detail'),
    path('<int:pk>/parsed-data/', ResumeParsedDataView.as_view(), name='resume_parsed_data'),
    path('<int:pk>/analyze/', ResumeAnalyzeView.as_view(), name='resume_analyze'),

    # CV Improvement Studio & Versions
    path('improvement/diagnosis/', ImprovementDiagnosisView.as_view(), name='improvement_diagnosis'),
    path('improvement/questionnaire/', ImprovementQuestionnaireView.as_view(), name='improvement_questionnaire'),
    path('improvement/generate/', ImprovementGenerateView.as_view(), name='improvement_generate'),
    path('improvement/versions/', ResumeVersionsListView.as_view(), name='resume_versions'),
    path('improvement/versions/<int:pk>/', ResumeVersionDetailView.as_view(), name='resume_version_detail'),
    path('improvement/versions/<int:pk>/approve/', ApproveResumeVersionView.as_view(), name='approve_resume_version'),
    path('improvement/versions/<int:pk>/reanalyze/', ReanalyzeResumeVersionView.as_view(), name='reanalyze_resume_version'),
    path('improvement/versions/<int:pk>/restore/', RestoreResumeVersionView.as_view(), name='restore_resume_version'),
    path('improvement/versions/<int:pk>/export-docx/', ExportDocxResumeView.as_view(), name='export_docx_resume'),

    # Usage & Quota
    path('usage/', UsageSummaryView.as_view(), name='usage_summary'),
    path('usage/upgrade/', UsageSummaryView.as_view(), name='upgrade_usage'),
]

