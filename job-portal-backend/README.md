# Job Portal Backend API

A secure, role-based REST API for a Job Portal built with **Node.js, Express.js, MongoDB (Mongoose), JWT, bcrypt and httpOnly cookies**.
Backend only - no frontend, payments or email (as per the project scope).

| Layer | Tool |
|---|---|
| Runtime / Framework | Node.js, Express.js |
| Database / ODM | MongoDB, Mongoose |
| Authentication | JWT stored in an **httpOnly cookie** |
| Password security | bcrypt (`bcryptjs`, 12 salt rounds) |
| Validation | express-validator |
| Extra security | helmet, body-size limit, field whitelisting |
| API testing | Postman (collection included) |
| Configuration | Environment variables (`.env`) |

---

## 1. Setup

**Prerequisites:** Node.js 18+ and a running MongoDB (local or Atlas).

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
# open .env and set MONGO_URI and JWT_SECRET
npm run seed:admin          # creates the first Admin account
npm run dev                 # or: npm start
```

The API runs on `http://localhost:5000`. Check it: `GET /api/health`.

> Admins **cannot** self-register through the API (that would be a security hole). The first admin is created with `npm run seed:admin` using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`.

## 2. Roles

| Role | What they can do |
|---|---|
| **Job Seeker** | Register, log in, manage own profile, browse jobs, apply (once per job), view own applications and their status, log out |
| **Employer** | Register, log in, create / view / update / delete **own** jobs, view applications for **own** jobs, update application status |
| **Admin** | View / suspend / delete users, view / remove any job, view platform stats |

## 3. Application flow

1. User registers (`jobseeker` or `employer`) -> 2. logs in, JWT is set in an httpOnly cookie ->
3. `protect` middleware verifies the JWT -> 4. `authorize(role)` middleware checks the role ->
5. Employers manage jobs -> 6. Job Seekers browse and apply -> 7. Employers review applications for their own jobs -> 8. Admins manage users and jobs.

## 4. API overview

All responses look like `{ "success": true/false, "message": "...", "data": {...} }`.

### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Public (clears cookie) |
| GET | `/api/auth/me` | Logged in |

### Profile
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/users/profile` | Logged in |
| PUT | `/api/users/profile` | Logged in (skills / experience / education: Job Seekers) |

### Jobs (public browsing) and applying
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/jobs?search=&location=&employmentType=&skill=&page=&limit=` | Public (open jobs only) |
| GET | `/api/jobs/:id` | Public |
| POST | `/api/jobs/:id/apply` | Job Seeker |
| GET | `/api/applications/my` | Job Seeker |
| GET | `/api/applications/my/:id` | Job Seeker (own only) |

### Employer
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/employer/jobs` | Create job |
| GET | `/api/employer/jobs` | My jobs |
| GET | `/api/employer/jobs/:id` | One of my jobs |
| PUT | `/api/employer/jobs/:id` | Update my job |
| DELETE | `/api/employer/jobs/:id` | Delete my job (and its applications) |
| GET | `/api/employer/jobs/:id/applications` | Applications for my job |
| GET | `/api/employer/applications?status=` | All applications across my jobs |
| PATCH | `/api/employer/applications/:id/status` | `pending / reviewed / shortlisted / rejected / accepted` |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | All users (filter: `role`, `status`, `search`) |
| GET | `/api/admin/users/:id` | One user |
| PATCH | `/api/admin/users/:id/status` | `active` / `suspended` |
| DELETE | `/api/admin/users/:id` | Delete user + related data |
| GET | `/api/admin/jobs` | All jobs |
| GET | `/api/admin/jobs/:id` | One job |
| DELETE | `/api/admin/jobs/:id` | Remove a job |
| GET | `/api/admin/stats` | Platform counts |

## 5. Database design

Three collections: **User**, **Job**, **Application**.

```
User  <----(employer)---- Job <----(job)---- Application ----(applicant)----> User
```

**Referenced** (separate documents, linked by ObjectId):
- `Job.employer` -> User
- `Application.job` -> Job
- `Application.applicant` -> User

**Embedded** (stored inside the parent):
- `User.skills`, `User.experience[]`, `User.education[]`
- `Job.salary {min, max, currency}`, `Job.requiredSkills[]`
- `Application.statusHistory[]` (small audit trail)

**Why (design decision):**
- *Embedded* where the data belongs to exactly one parent, is read/updated together with it, and has no life of its own. A user's education is always shown with the user's profile; a job's salary is always shown with the job.
- *Referenced* where the data has its own identity or lifecycle or is shared. Employers and Job Seekers are real users; a Job is viewed by many seekers; an Application connects two independent entities and employers update its status independently.
- A **unique compound index** `(job, applicant)` makes duplicate applications impossible even under race conditions.

## 6. Security checklist

- Passwords hashed with bcrypt in a Mongoose `pre('save')` hook; never stored in plain text.
- `password` field has `select: false` **and** is removed in `toJSON` - hashes can't leak in responses.
- JWT is signed with `JWT_SECRET` and stored only in an **httpOnly**, `sameSite=strict` cookie (`secure` in production). The token is never returned in the JSON body.
- `protect` (authentication) and `authorize(...roles)` (role verification) middleware.
- Ownership checks: employers can only modify their own jobs / see their own applications (403 otherwise); job seekers only see their own applications.
- Input validated with express-validator + Mongoose validators; request fields whitelisted (no mass assignment - nobody can set `role`/`status` through profile updates).
- Query-string values are coerced to strings and regex input is escaped (NoSQL injection / ReDoS protection).
- Secrets live in `.env` (git-ignored); `helmet` headers; 10 kb JSON body limit; generic login error message.
- Suspended users are blocked at login **and** on every request.

## 7. Postman testing

Files are in the `postman/` folder:
- `JobPortal.postman_collection.json` - 71 requests with automatic test scripts
- `JobPortal.postman_environment.json` - `baseUrl`, `adminEmail`, `adminPassword`

**Run it:**
1. Start the API and run `npm run seed:admin`.
2. In Postman: **Import** both files, select the *Job Portal - Local* environment.
3. Right-click the collection -> **Run collection** (Collection Runner) and run **all folders in order**.

The folders are ordered on purpose - each one logs in as a different user (Postman keeps the httpOnly cookie automatically):

| # | Folder | Covers |
|---|---|---|
| 1 | Public & Auth | registration, login errors, duplicate email, validation errors, **no token**, **invalid token** |
| 2 | Employer A | login, job CRUD, validation, role blocked from admin routes |
| 3 | Job Seeker | profile, browse, apply, duplicate apply, own applications, blocked from employer/admin routes |
| 4 | Employer B | cannot update / delete / read another employer's data |
| 5 | Employer A | review applications, update status |
| 6 | Job Seeker | sees updated status |
| 7 | Employer A | delete own job |
| 8-9 | Admin | users, jobs, stats, suspend, suspended login blocked, delete |
| 10 | Logout | cookie cleared, protected routes blocked afterwards |

*Expired-token test:* set `JWT_EXPIRES_IN=5s` in `.env`, restart, log in, wait 6 seconds, call `GET /api/auth/me` -> `401 Your session has expired`.

## 8. Project structure

```
job-portal-backend/
├── server.js                 # entry point
├── .env.example              # copy to .env (never commit .env)
├── scripts/seedAdmin.js      # creates first admin
├── postman/                  # collection + environment
└── src/
    ├── app.js                # express app, middleware, routes
    ├── config/db.js
    ├── models/               # User, Job, Application
    ├── middleware/           # auth (JWT), role, validate, error
    ├── validators/           # express-validator rules
    ├── controllers/          # auth, user, job, application, employer, admin
    ├── routes/
    └── utils/
```

## 9. Next stage

The project is structured so the "AI Integration to Backend" stage can plug in as a new route + controller (for example, matching a seeker's `skills` against a job's `requiredSkills`).
