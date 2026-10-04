# CareerLens API Documentation

## Authentication & Accounts

### Authentication endpoints
- **POST** `/api/auth/login/`
  - Body: `{"username": "...", "password": "..."}`
  - Response: `{"access": "...", "refresh": "..."}`
  - Description: Obtains JWT access and refresh tokens.

- **POST** `/api/auth/login/refresh/`
  - Body: `{"refresh": "..."}`
  - Response: `{"access": "..."}`
  - Description: Refreshes an expired access token.

- **POST** `/api/auth/register/`
  - Body: `{"username": "...", "email": "...", "password": "...", "first_name": "...", "last_name": "...", "role": "CANDIDATE|COMPANY"}`
  - Response: 201 Created
  - Description: Registers a new user. Automatically creates a `CandidateProfile` or `CompanyProfile` based on the specified role.

### Profiles & Current User
*(Requires `Authorization: Bearer <access_token>` header)*

- **GET, PATCH** `/api/auth/me/`
  - Description: Retrieves or updates the currently authenticated user's core information (`username`, `email`, `first_name`, `last_name`, `role`). 

- **GET** `/api/auth/candidates/`
  - Description: Lists all candidate profiles.

- **GET, PATCH** `/api/auth/candidates/{id}/`
  - Description: Retrieves a specific candidate profile. `PATCH` is only allowed if the authenticated user owns the profile (`IsOwnerOrReadOnly`).
  - Fields updatable via PATCH: `university`, `major`, `graduation_year`, `bio`, `resume_file`

- **GET** `/api/auth/companies/`
  - Description: Lists all company profiles.

- **GET, PATCH** `/api/auth/companies/{id}/`
  - Description: Retrieves a specific company profile. `PATCH` is only allowed if the authenticated user owns the profile (`IsOwnerOrReadOnly`).
  - Fields updatable via PATCH: `company_name`, `industry`, `size`, `location`, `website`

### Administrative
- **GET** `/api/auth/audit-logs/`
  - Description: Lists audit logs. Regular users only see their own actions; administrators see all actions in the system.
- **GET** `/api/auth/audit-logs/{id}/`
  - Description: Retrieves a specific audit log record.

## Jobs

### Skills
- **GET** `/api/skills/`
  - Description: Lists all skills. (Globally readable).

### Jobs
- **GET** `/api/jobs/`
  - Description: Lists jobs. Unauthenticated users and candidates only see `PUBLISHED` jobs. Companies see their own jobs (any status) plus `PUBLISHED` jobs from other companies.

- **GET** `/api/jobs/{id}/`
  - Description: Retrieves details for a specific job.

- **POST** `/api/jobs/`
  - Description: Creates a new job. (Requires `IsCompanyUser`). Automatically assigns the authenticated user's company as the owner.

- **PATCH, DELETE** `/api/jobs/{id}/`
  - Description: Updates or deletes a job. (Requires `IsJobOwnerOrReadOnly`). Only the company that created the job can modify it.

### Saved Jobs
- **GET** `/api/saved-jobs/`
  - Description: Lists jobs saved by the currently authenticated candidate. (Requires `IsCandidateUser`).

- **POST** `/api/saved-jobs/`
  - Body: `{"job_id": 123}`
  - Description: Saves a job for the currently authenticated candidate. Automatically infers the candidate from the authenticated user.

## Applications & Recruitment Workflow

### Applications
- **GET** `/api/applications/`
  - Description: Candidates see only their own applications. Companies see applications submitted to their jobs.
- **POST** `/api/applications/`
  - Body: `{"job_id": 123, "cover_letter": "..."}`
  - Description: Candidates submit an application. (Requires `IsCandidateUser`).
- **GET** `/api/applications/{id}/`
  - Description: Retrieves a specific application. 
- **PATCH** `/api/applications/{id}/`
  - Body: `{"status": "REVIEWING"}`
  - Description: Updates the application status. (Requires `IsCompanyUser` and ownership of the associated job). Automatically triggers a new `ApplicationStatusHistory` record.
- **DELETE** `/api/applications/{id}/`
  - Description: Candidates can withdraw their own applications.

### Application Status History
- **GET** `/api/application-history/`
  - Description: Read-only endpoint listing status history records for applications the user has access to.

### Interviews
- **GET** `/api/interviews/`
  - Description: Candidates see their interviews. Companies see interviews for their jobs.
- **POST** `/api/interviews/`
  - Body: `{"application": 1, "scheduled_at": "...", "location": "..."}`
  - Description: Schedule a new interview. Only the company that owns the application can do this.
- **PATCH, DELETE** `/api/interviews/{id}/`
  - Description: Update or cancel an interview.

### Offers
- **GET** `/api/offers/`
  - Description: Candidates see their offers. Companies see offers they sent.
- **POST** `/api/offers/`
  - Body: `{"application": 1, "salary": "50000.00", "currency": "USD", "message": "..."}`
  - Description: Send an offer. Only the company that owns the application can do this. An application can have at most one offer.
- **PATCH** `/api/offers/{id}/`
  - Description: Update offer details or response status (e.g. `ACCEPTED`, `REJECTED`).

### Application Notes (Recruiter Only)
- **GET** `/api/application-notes/`
  - Description: Lists private recruiter notes. Candidates cannot access this endpoint.
- **POST** `/api/application-notes/`
  - Body: `{"application": 1, "note": "..."}`
  - Description: Add a private note to an application. Only authorized company users can do this.

## Messaging & Notifications

### Messages
- **GET** `/api/messages/`
  - Description: Lists all messages where the authenticated user is either the sender or the recipient.
- **POST** `/api/messages/`
  - Body: `{"recipient": 2, "text": "..."}`
  - Description: Sends a new message.
- **POST** `/api/messages/{id}/mark_as_read/`
  - Description: Marks a specific message as read. Only the recipient can perform this action.

### Notifications
- **GET** `/api/notifications/`
  - Description: Lists notifications for the authenticated user.
- **POST** `/api/notifications/{id}/mark_as_read/`
  - Description: Marks a specific notification as read. Only the notification owner can perform this action.
