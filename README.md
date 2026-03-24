# GKIN RWDH Dienst Dashboard

Hi there!
A church service coordination platform for managing roles, assignments, and communication across weekly services.

## History
More details of the tech of GKIN history can be found here https://docs.google.com/document/d/1E_4IeMiA1qNvAZeK6LwB64CKaPWtaV6NT67uOc_bs4U/edit?usp=sharing

## Overview

The dashboard provides a centralized workspace for six service roles — liturgy, pastor, translation, beamer, music, and treasurer — along with an admin role for oversight. Each user authenticates using a role-specific passcode rather than a personal account.

## Features

- **Role-based access** — Separate passcode authentication per role; admin role has full system access
- **Service assignments** — Assign people to specific roles for upcoming Sunday services
- **Workflow tasks** — Track per-service tasks with statuses: pending, in-progress, completed, or skipped
- **Real-time updates** — Live notifications via Socket.IO when assignments or tasks change
- **Team chat** — In-app messaging between roles
- **Email coordination** — Send and track role-specific emails with full history
- **Sermon & lyrics management** — Store sermon translations and song lyrics for the translation team
- **Music links** — Centralized repository of music references for the music team
- **Activity log** — Audit trail of actions taken across the platform
- **Admin panel** — Manage passcodes, assignable people, role emails, and email settings

## Tech Stack

- **Frontend** — React 19, Vite, Tailwind CSS 4
- **Backend** — Express 5, Socket.IO, PostgreSQL
- **Deployment** — Frontend on Render, backend and database on Railway

## Development

```bash
# Start frontend (port 5173)
npm run dev

# Start backend (port 5000)
cd server && npm run dev
```

Both processes must run simultaneously during development.
