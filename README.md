# GoRaz Weblog

GoRaz Weblog is a full-stack weblog application built with **Go, Echo, PostgreSQL, React, and Docker**.

Users can create accounts, publish public or private posts, share private posts with selected users, comment on posts, upload images, and browse posts using search, filtering, sorting, and pagination.

**Live site:** https://goraz-weblog.style.dev

---

## Features

- User signup, login, and logout
- Cookie-based authentication
- Public and private posts
- Private posts can be shared with specific registered users
- Users can view:
  - public posts
  - their own private posts
  - private posts shared with them
- Search posts by title or content
- Filter posts by privacy
- Sort posts by newest or oldest
- Pagination
- Comments on accessible posts
- Optional image uploads
- JPEG, PNG, and WebP image validation
- Maximum image size of 5 MB
- Owner-only post deletion
- Protected frontend routes
- Responsive React interface

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, React Router, Vite |
| Backend | Go, Echo v5 |
| Database | PostgreSQL |
| Authentication | Cookie-based sessions |
| Password hashing | bcrypt |
| Reverse proxy | Nginx |
| Local development | Docker, Docker Compose |
| Deployment | Freestyle VM |
| HTTPS | Freestyle TLS |

---

## Architecture

For local development, the application runs using three Docker containers:

```text
Browser
   |
   v
Frontend
React + Nginx
   |
   | /api/*
   v
Backend
Go + Echo
   |
   v
PostgreSQL
```

Nginx also proxies `/uploads/*` requests to the backend so uploaded images can be served through the frontend origin.

The backend follows a layered structure:

```text
Handler
   |
   v
Service
   |
   v
Repository
   |
   v
PostgreSQL
```

- **Handlers** manage HTTP requests and responses.
- **Services** contain application and validation logic.
- **Repositories** handle database access.

---

## Running Locally

### Prerequisites

You need:

- Docker
- Docker Compose

### 1. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Then update the values in `.env`.

Example:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change_me
POSTGRES_DB=weblog
POSTGRES_PORT=5432

SESSION_SECRET=change_me
SESSION_SECURE=false

FRONTEND_URL=http://localhost:5173
PORT=8080
```

You can generate a session secret with:

```bash
openssl rand -hex 32
```

For local Docker development, `POSTGRES_HOST` is supplied by Docker Compose.

Never commit the real `.env` file.

### 2. Start the application

```bash
docker compose up --build -d
```

Open the application at:

```text
http://localhost:5173
```

On the first database startup, `database/schema.sql` creates the required tables.

### 3. Stop the application

```bash
docker compose down
```

PostgreSQL data and uploaded files are stored in Docker volumes, so they remain available after a normal shutdown or container recreation.

To remove the containers and their volumes:

```bash
docker compose down -v
```

> This also deletes the local database data and uploaded files.

---

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_PORT` | PostgreSQL port |
| `POSTGRES_HOST` | PostgreSQL host |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `SESSION_SECURE` | Enables secure cookies when using HTTPS |
| `FRONTEND_URL` | Allowed frontend origin for CORS |
| `PORT` | Backend HTTP port |

---

## Project Structure

```text
.
├── database/
│   └── schema.sql
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── pages/
│   ├── Dockerfile
│   └── nginx.conf
├── handler/
├── middleware/
├── model/
├── repo/
├── service/
├── Dockerfile
├── docker-compose.yml
├── go.mod
└── main.go
```

---

## Security

- Passwords are hashed with bcrypt
- Authentication uses `HttpOnly` session cookies
- Production cookies use the `Secure` flag
- CORS is restricted to the configured frontend origin
- Private-post access is enforced by the backend
- Only post owners can delete their posts
- Private-post sharing permissions are checked by the backend
- SQL queries use parameterized values
- Uploaded images are validated using their detected MIME type
- Image uploads are limited to 5 MB
- PostgreSQL and the backend are not exposed directly to the public Internet
- Production secrets are stored in environment variables and are not committed to the repository

---

## Database

The application uses four main tables:

```text
users
posts
comments
post_shares
```

Foreign keys are used to maintain relationships between users, posts, comments, and shared posts.

PostgreSQL data is stored in a Docker volume so it persists across container recreation.

---

## Deployment

The production application is deployed on a Freestyle Ubuntu VM using Docker Compose.

```text
Internet
   |
   | HTTPS
   v
Freestyle TLS
goraz-weblog.style.dev
   |
   v
Freestyle VM
   |
   v
Frontend Container
React + Nginx
   |
   | /api/*
   v
Backend Container
Go + Echo
   |
   v
PostgreSQL Container
```

The Freestyle TLS layer provides the public HTTPS endpoint and forwards requests to the frontend container running on the VM.

Nginx serves the React application and proxies API and upload requests to the Go backend.

The backend and PostgreSQL services are bound locally and are not directly exposed to the public Internet.

Production uses:

```env
SESSION_SECURE=true
FRONTEND_URL=https://goraz-weblog.style.dev
```

Production secrets and database credentials are stored only in the server environment and are not committed to GitHub.

---

## Persistent Storage

The production Docker setup uses two named volumes:

```text
postgres_data
uploads_data
```

`postgres_data` stores PostgreSQL data, including users, posts, comments, and sharing records.

`uploads_data` stores uploaded images.

Because these files are stored in Docker volumes on the Freestyle VM, they remain available when application containers are rebuilt or recreated.

Persistence has also been verified after pausing and restarting the VM.

> Do not use `docker compose down -v` unless you intentionally want to remove the application volumes and their stored data.

---

## Live Site

https://goraz-weblog.style.dev
