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
