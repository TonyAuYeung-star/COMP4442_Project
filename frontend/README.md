# COMP4442 React Frontend

React frontend for the Spring Boot hotel booking backend in this repository.

## Features

- Authentication: register/login using `/api/v1/auth/*`
- Public room browsing and room search filters
- Availability check + booking creation flow
- User booking history with cancellation and payment actions
- Admin dashboard for room CRUD and booking cancellation
- Health badge from `/api/v1/health`

## Backend API Base URL

The app uses:

- `VITE_API_BASE_URL` if set
- otherwise defaults to `http://localhost:8080/api`

Create a `.env` file in this folder if needed:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Run Locally

From this `frontend` folder:

```bash
npm install
npm run dev
```

Frontend runs on Vite default `http://localhost:5173`.

## Build and Lint

```bash
npm run lint
npm run build
```

## Seed Users (from backend DataLoader)

- `testuser / password123` (USER)
- `admin / admin123` (ADMIN)
