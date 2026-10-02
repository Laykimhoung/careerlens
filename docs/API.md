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
