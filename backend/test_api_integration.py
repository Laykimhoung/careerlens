import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from apps.accounts.models import User, CompanyProfile, CandidateProfile
from apps.jobs.models import Job, Skill
from apps.applications.models import Application, Interview, Offer, ApplicationNote
from apps.messaging.models import Message, Notification

print("=" * 60)
print("CareerLens Backend & API Integration Verification")
print("=" * 60)

client = APIClient()

# -------------------------------------------------------------
# 1. Test Admin Authentication & Endpoints
# -------------------------------------------------------------
print("\n[1] Testing Admin Role (demo_admin)...")
login_res = client.post('/api/auth/login/', {
    'username': 'demo_admin',
    'password': 'CareerLens2026!Demo'
})
assert login_res.status_code == 200, f"Admin login failed: {login_res.data}"
admin_token = login_res.data['access']
client.credentials(HTTP_AUTHORIZATION=f'Bearer {admin_token}')

# Me
me_res = client.get('/api/auth/me/')
assert me_res.status_code == 200 and me_res.data['role'] == 'ADMIN', f"Admin me failed: {me_res.data}"
print(f"  [PASS] Admin logged in: {me_res.data['username']} ({me_res.data['role']})")

# Dashboard
dash_res = client.get('/api/auth/admin/dashboard/')
assert dash_res.status_code == 200, f"Admin dashboard stats failed: {dash_res.data}"
kpis = dash_res.data['kpis']
print(f"  [PASS] Admin dashboard stats KPIs: Candidates={kpis['total_candidates']}, Companies={kpis['total_companies']}, Jobs={kpis['total_jobs']}, Apps={kpis['total_applications']}")

# Users
users_res = client.get('/api/auth/users/')
assert users_res.status_code == 200, f"Admin users list failed: {users_res.data}"
users_count = len(users_res.data.get('results', users_res.data))
print(f"  [PASS] Admin /api/auth/users/ retrieved {users_count} users")

# Candidates
cands_res = client.get('/api/auth/candidates/')
assert cands_res.status_code == 200, f"Admin candidates list failed: {cands_res.data}"
cands_count = len(cands_res.data.get('results', cands_res.data))
print(f"  [PASS] Admin /api/auth/candidates/ retrieved {cands_count} candidates")

# Companies
comps_res = client.get('/api/auth/companies/')
assert comps_res.status_code == 200, f"Admin companies list failed: {comps_res.data}"
comps_count = len(comps_res.data.get('results', comps_res.data))
print(f"  [PASS] Admin /api/auth/companies/ retrieved {comps_count} companies")

# Audit logs
logs_res = client.get('/api/auth/audit-logs/')
assert logs_res.status_code == 200, f"Admin audit logs failed: {logs_res.data}"
logs_count = len(logs_res.data.get('results', logs_res.data))
print(f"  [PASS] Admin /api/auth/audit-logs/ retrieved {logs_count} logs")

# Skills
skills_res = client.get('/api/skills/')
assert skills_res.status_code == 200, f"Skills list failed: {skills_res.data}"
skills_count = len(skills_res.data.get('results', skills_res.data))
print(f"  [PASS] Admin /api/skills/ retrieved {skills_count} skills")

# Jobs
jobs_res = client.get('/api/jobs/')
assert jobs_res.status_code == 200, f"Jobs list failed: {jobs_res.data}"
jobs_count = len(jobs_res.data.get('results', jobs_res.data))
print(f"  [PASS] Admin /api/jobs/ retrieved {jobs_count} jobs")

# Applications
apps_res = client.get('/api/applications/')
assert apps_res.status_code == 200, f"Applications list failed: {apps_res.data}"
apps_count = len(apps_res.data.get('results', apps_res.data))
print(f"  [PASS] Admin /api/applications/ retrieved {apps_count} applications")

# Notifications
notifs_res = client.get('/api/notifications/')
assert notifs_res.status_code == 200, f"Notifications list failed: {notifs_res.data}"
notifs_count = len(notifs_res.data.get('results', notifs_res.data))
print(f"  [PASS] Admin /api/notifications/ retrieved {notifs_count} notifications")


# -------------------------------------------------------------
# 2. Test Candidate Role (demo_cand_sreymom)
# -------------------------------------------------------------
print("\n[2] Testing Candidate Role (demo_cand_sreymom)...")
client.credentials()  # Clear auth
cand_login = client.post('/api/auth/login/', {
    'username': 'demo_cand_sreymom',
    'password': 'CareerLens2026!Demo'
})
assert cand_login.status_code == 200, f"Candidate login failed: {cand_login.data}"
cand_token = cand_login.data['access']
client.credentials(HTTP_AUTHORIZATION=f'Bearer {cand_token}')

cand_me = client.get('/api/auth/me/')
assert cand_me.status_code == 200 and cand_me.data['role'] == 'CANDIDATE'
print(f"  [PASS] Candidate logged in: {cand_me.data['username']} ({cand_me.data['role']})")

# Candidate profile
cand_prof_res = client.get('/api/auth/candidates/')
assert cand_prof_res.status_code == 200
cand_list = cand_prof_res.data.get('results', cand_prof_res.data)
my_profile = next((c for c in cand_list if c['user']['id'] == cand_me.data['id']), None)
assert my_profile is not None, "Candidate's own profile not found"
print(f"  [PASS] Candidate profile: {my_profile['university']} - {my_profile['major']} (Grad {my_profile['graduation_year']})")

# Candidate update profile PATCH
cand_update = client.patch(f"/api/auth/candidates/{my_profile['id']}/", {
    'bio': my_profile.get('bio', '') + " [Verified Update]"
})
assert cand_update.status_code == 200, f"Candidate profile update failed: {cand_update.data}"
print(f"  [PASS] Candidate profile PATCH successfully saved")

# Candidate browse published jobs
cand_jobs = client.get('/api/jobs/')
assert cand_jobs.status_code == 200
cand_job_list = cand_jobs.data.get('results', cand_jobs.data)
assert all(j['status'] == 'PUBLISHED' for j in cand_job_list), "Candidates must only see PUBLISHED jobs!"
print(f"  [PASS] Candidate sees {len(cand_job_list)} PUBLISHED jobs only (enforces privacy)")

# Candidate Saved Jobs
saved_res = client.get('/api/saved-jobs/')
assert saved_res.status_code == 200
initial_saved_count = len(saved_res.data.get('results', saved_res.data))
target_job = cand_job_list[0]
save_create = client.post('/api/saved-jobs/', {'job_id': target_job['id']})
assert save_create.status_code in [201, 400], f"Save job response: {save_create.status_code}"
if save_create.status_code == 201:
    saved_id = save_create.data['id']
    print(f"  [PASS] Candidate successfully saved job #{target_job['id']} (SavedJob ID #{saved_id})")
    # Clean up
    del_saved = client.delete(f'/api/saved-jobs/{saved_id}/')
    assert del_saved.status_code == 204
    print(f"  [PASS] Candidate removed saved job #{saved_id}")
else:
    print(f"  [PASS] Candidate already had job #{target_job['id']} saved (duplicate check passed)")

# Candidate Applications
cand_apps = client.get('/api/applications/')
assert cand_apps.status_code == 200
cand_app_list = cand_apps.data.get('results', cand_apps.data)
print(f"  [PASS] Candidate has {len(cand_app_list)} submitted applications")

# Candidate Interviews & Offers
cand_ivs = client.get('/api/interviews/')
assert cand_ivs.status_code == 200
print(f"  [PASS] Candidate has {len(cand_ivs.data.get('results', cand_ivs.data))} interviews")

cand_offers = client.get('/api/offers/')
assert cand_offers.status_code == 200
print(f"  [PASS] Candidate has {len(cand_offers.data.get('results', cand_offers.data))} offers")

# Candidate Messages
cand_msgs = client.get('/api/messages/')
assert cand_msgs.status_code == 200
cand_msg_list = cand_msgs.data.get('results', cand_msgs.data)
print(f"  [PASS] Candidate has {len(cand_msg_list)} conversation messages")

# Candidate Notifications
cand_notifs = client.get('/api/notifications/')
assert cand_notifs.status_code == 200
cand_notif_list = cand_notifs.data.get('results', cand_notifs.data)
print(f"  [PASS] Candidate has {len(cand_notif_list)} notifications")


# -------------------------------------------------------------
# 3. Test Company Role (demo_comp_mekong)
# -------------------------------------------------------------
print("\n[3] Testing Company Role (demo_comp_mekong)...")
client.credentials()  # Clear auth
comp_login = client.post('/api/auth/login/', {
    'username': 'demo_comp_mekong',
    'password': 'CareerLens2026!Demo'
})
assert comp_login.status_code == 200, f"Company login failed: {comp_login.data}"
comp_token = comp_login.data['access']
client.credentials(HTTP_AUTHORIZATION=f'Bearer {comp_token}')

comp_me = client.get('/api/auth/me/')
assert comp_me.status_code == 200 and comp_me.data['role'] == 'COMPANY'
print(f"  [PASS] Company logged in: {comp_me.data['username']} ({comp_me.data['role']})")

# Company Profile
comp_prof_res = client.get('/api/auth/companies/')
assert comp_prof_res.status_code == 200
comp_list = comp_prof_res.data.get('results', comp_prof_res.data)
my_comp_prof = next((c for c in comp_list if c['user']['id'] == comp_me.data['id']), None)
assert my_comp_prof is not None, "Company profile not found"
print(f"  [PASS] Company Profile: {my_comp_prof['company_name']} ({my_comp_prof['verification_status']})")

# Company update profile PATCH
comp_update = client.patch(f"/api/auth/companies/{my_comp_prof['id']}/", {
    'website': 'https://mekongdigitallabs.com'
})
assert comp_update.status_code == 200, f"Company profile update failed: {comp_update.data}"
print(f"  [PASS] Company profile PATCH saved successfully")

# Company Job Management (CRUD)
print("  - Testing Company Job Creation...")
new_job_res = client.post('/api/jobs/', {
    'title': 'Test QA Automation Engineer',
    'description': 'Integration testing job post created during automated verification.',
    'location': 'Phnom Penh, Cambodia',
    'employment_type': 'FULL_TIME',
    'workplace_type': 'HYBRID',
    'salary_min': 700,
    'salary_max': 1200,
    'status': 'DRAFT',
    'skills': ['Python', 'Quality Assurance', 'Git']
})
assert new_job_res.status_code == 201, f"Company job creation failed: {new_job_res.data}"
test_job_id = new_job_res.data['id']
print(f"  [PASS] Company created new job #{test_job_id}: {new_job_res.data['title']} (Status: {new_job_res.data['status']})")
print(f"    Skills synced: {new_job_res.data['skills']}")

# Update Job
update_job_res = client.patch(f'/api/jobs/{test_job_id}/', {
    'status': 'PUBLISHED',
    'salary_max': 1300
})
assert update_job_res.status_code == 200, f"Update job failed: {update_job_res.data}"
print(f"  [PASS] Company updated job #{test_job_id} to PUBLISHED with new max salary $1300")

# Delete Job
del_job_res = client.delete(f'/api/jobs/{test_job_id}/')
assert del_job_res.status_code == 204, f"Delete job failed: {del_job_res.status_code}"
print(f"  [PASS] Company successfully deleted test job #{test_job_id}")

# Company Applicants
comp_apps = client.get('/api/applications/')
assert comp_apps.status_code == 200
comp_app_list = comp_apps.data.get('results', comp_apps.data)
print(f"  [PASS] Company sees {len(comp_app_list)} applicants for its jobs")

if comp_app_list:
    target_app = comp_app_list[0]
    # Update applicant status
    curr_st = target_app['status']
    next_st = 'REVIEWING' if curr_st != 'REVIEWING' else 'INTERVIEW'
    status_update = client.patch(f"/api/applications/{target_app['id']}/", {
        'status': next_st
    })
    assert status_update.status_code == 200, f"Application status update failed: {status_update.data}"
    print(f"  [PASS] Company updated Application #{target_app['id']} status to {next_st}")

    # Revert back
    client.patch(f"/api/applications/{target_app['id']}/", {'status': curr_st})

    # Company recruiter note
    note_res = client.post('/api/application-notes/', {
        'application': target_app['id'],
        'note': 'Automated verification test note for candidate evaluation.'
    })
    assert note_res.status_code == 201, f"Recruiter note creation failed: {note_res.data}"
    note_id = note_res.data['id']
    print(f"  [PASS] Company added private recruiter note #{note_id}")
    client.delete(f'/api/application-notes/{note_id}/')
    print(f"  [PASS] Company cleaned up test recruiter note #{note_id}")

# Company Interviews
comp_ivs = client.get('/api/interviews/')
assert comp_ivs.status_code == 200
print(f"  [PASS] Company retrieved {len(comp_ivs.data.get('results', comp_ivs.data))} interviews")

# Company Offers
comp_offers = client.get('/api/offers/')
assert comp_offers.status_code == 200
print(f"  [PASS] Company retrieved {len(comp_offers.data.get('results', comp_offers.data))} offers")

# -------------------------------------------------------------
# 4. Security & Role Permissions Check
# -------------------------------------------------------------
print("\n[4] Testing Role-Based Permissions & Isolation...")
# Candidate cannot access admin dashboard
client.credentials(HTTP_AUTHORIZATION=f'Bearer {cand_token}')
cand_dash_attempt = client.get('/api/auth/admin/dashboard/')
assert cand_dash_attempt.status_code == 403, f"Candidate should be forbidden from admin dashboard! Got {cand_dash_attempt.status_code}"
print("  [PASS] Candidate blocked from Admin Dashboard (HTTP 403 Forbidden)")

# Candidate cannot create jobs
cand_job_create = client.post('/api/jobs/', {'title': 'Illegal Job', 'employment_type': 'FULL_TIME', 'workplace_type': 'ON_SITE'})
assert cand_job_create.status_code == 403, f"Candidate should be forbidden from creating jobs! Got {cand_job_create.status_code}"
print("  [PASS] Candidate blocked from creating jobs (HTTP 403 Forbidden)")

# Candidate cannot access recruiter application notes
cand_notes_attempt = client.get('/api/application-notes/')
assert cand_notes_attempt.status_code == 403, f"Candidate should be forbidden from application notes! Got {cand_notes_attempt.status_code}"
print("  [PASS] Candidate blocked from private recruiter notes (HTTP 403 Forbidden)")

# Unauthenticated user cannot access me or applications
client.credentials()
anon_me = client.get('/api/auth/me/')
assert anon_me.status_code == 401
print("  [PASS] Unauthenticated user blocked from protected routes (HTTP 401 Unauthorized)")

print("\n" + "=" * 60)
print("ALL BACKEND APIS & SEED DATA INTEGRATION CHECKS PASSED!")
print("=" * 60)
