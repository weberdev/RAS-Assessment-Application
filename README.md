# RAS Safety Assessment Application

**GitHub Repository:**  
https://github.com/weberdev/RAS-Assessment-Application

**Live Application:**  
https://ras-assessment-application.onrender.com/

**Entity Relationship Diagram:**  
[View ERD](https://github.com/weberdev/RAS-Assessment-Application/blob/master/Ras-safety-ERD.png)

## Overview

The RAS-Safety app is a safety reporting tool developed as a technical assessment. It has two user roles: **Framers** and **Administrators**.

### Framers

Framers can log in and:

- Enter Yes/No responses to five safety checklist items.
  - If all five responses are Yes, the report receives a **Pass** status.
  - Otherwise, the report is marked **Needs Attention**.
- Select a worksite from a dropdown menu.
- Add notes.
- Upload relevant photographs.
- Submit safety assessments.
- Access their previous submissions.

### Administrators

Administrators can log in and:

- Track submissions across workers.
- Filter reports.
- Inspect photographs.
- Review completed checklists.
- View submissions by site.

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | ASP.NET Core 9, C# |
| Database | SQLite, Entity Framework Core |
| Authentication | JWT, ASP.NET Core Identity password hashing |
| Photo Storage | Server filesystem |
| Deployment | Docker, Render |

## Technical Notes

I chose C# and ASP.NET because I was comfortable enough with them and didn't want to overengineer this for a demo. I tend to reach for a tool I'm comfortable with more often than not.

Likewise, I went with SQLite because it's lightweight and efficient for a project like this, and didn't demand another server. Furthermore, I'd used it on a recent hobby project and felt, again, comfortable enough with it.

For the frontend, I went with React per the assessment requirements, supported by TypeScript and Vite for ease of use.

Docker was the most immediately apparent tool to bundle the frontend and backend together.

Render was, and this is quite important: **free**.

## Design Choices

- Submissions are associated with authenticated users, not frontend user IDs.
- Submissions and photographs are restricted to their respective Framers, but viewable by all Administrators.
- **Pass / Needs Attention** statuses are calculated from checklist answers. A report passes only when all five values are true. Otherwise, it is automatically marked **Needs Attention**.

## Future Work

- Authentication currently uses JWTs without refresh tokens or server-side token revocation. Session management is relatively basic, as the project is primarily a test system.
- Safety submissions cannot be edited after submission.
- The application is hosted on Render's free tier, which uses ephemeral filesystem storage. Database records and uploaded photographs may be lost when the service restarts or is redeployed. Persistent storage would be necessary for full production use.

## Login Credentials

| Role | Email | Password |
|---|---|---|
| Framer | `framer@example.com` | `FramerDemo2026!` |
| Administrator | `admin@example.com` | `AdminDemo2026!` |

These accounts are provided for demonstration purposes.

## Local Setup

### Prerequisites

- Node.js and npm
- .NET 9 SDK
- PowerShell (for the commands below)

### 1. Clone the Repository

```powershell
git clone https://github.com/weberdev/RAS-Assessment-Application.git
cd RAS-Assessment-Application
```

### 2. Install Frontend Dependencies

From the repository root:

```powershell
npm install
```

### 3. Configure the JWT Signing Key

Navigate to the backend directory:

```powershell
cd server
```

Generate a random JWT signing key and store it using .NET User Secrets:

```powershell
$bytes = New-Object byte[] 48
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$key = [Convert]::ToBase64String($bytes)
$rng.Dispose()

dotnet user-secrets set "Jwt:Key" $key
```

These are PowerShell commands. I used Visual Studio Code's integrated terminal during development.

### 4. Start the Backend

While in the `server` directory:

```powershell
dotnet run
```

The backend runs at:

http://localhost:5118

### 5. Start the Frontend

Open a second terminal and navigate to the repository root.

```powershell
npm run dev
```

The frontend runs at:

http://localhost:5173

### 6. Test the Application

Open the frontend URL in your browser and log in using either demonstration account listed above.

The SQLite database and demonstration accounts are created automatically on first startup.

## Database Design

The application uses three database entities:

- **SafetyUser:** Stores user accounts, credentials, and roles.
- **SafetySubmission:** Stores safety checklist responses, worksite information, dates, and notes.
- **SafetyPhoto:** Stores references to photographs associated with submissions.

Each user can have multiple submissions, and each submission can have multiple photographs.

[View Entity Relationship Diagram](./Ras-safety-ERD.png)