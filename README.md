# MediQueue Backend

This backend powers the MediQueue tutoring platform and serves the API for the client application.

**Live site:** https://b13-a9-medi-queue-frotend.vercel.app/

## About

MediQueue Backend is an Express.js API for handling user authentication, tutor listings, and booking workflows. It is built to support a modern React/Next.js client and connects to MongoDB for data storage.

## Key Features

- Secure user authentication and session handling
- Tutor profile and booking data management
- API endpoints for scheduling and cancelling sessions
- CORS support for frontend integration
- Production-ready development workflow with Nodemon

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env` file with your MongoDB connection and any secret keys.

3. Start the backend server in development mode:

```bash
pnpm dev
```

4. The API will be available on the configured port, typically `http://localhost:3000`.

## Notes

Use this backend together with the MediQueue frontend to provide a complete tutoring booking experience.
