# COMP4442 Frontend (React + Vite)

React frontend for your Spring Boot backend

## Features

- **Health Dashboard**: Real-time health checks and application info
- **Service Registry Management**:
  - Create, list, update, delete services
  - Query services by name and status
  - Visual service cards with status indicators
  
## Architecture

The frontend is built with modern React components:

- **Header**: Application header with refresh functionality
- **Notification**: User feedback messages with dismiss option
- **ServiceCard**: Individual service display with actions
- **ServiceForm**: Form for creating/editing services
- **ServiceQuery**: Query interface for finding services

## Backend API

Expects Spring Boot backend running on `http://localhost:8080/api` with endpoints:


### Services
- `GET /v1/services` - List all services
- `POST /v1/services` - Create new service
- `GET /v1/services/{id}` - Get service by ID
- `PUT /v1/services/{id}` - Update service
- `DELETE /v1/services/{id}` - Delete service
- `POST /v1/services/query/by-name` - Query by name
- `POST /v1/services/query/by-status` - Query by status



## Getting Started

1. Ensure backend is running on `http://localhost:8080`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open `http://localhost:5173` in your browser

## Configuration

Create a `.env` file to configure the API base URL:

```
VITE_API_BASE_URL=http://localhost:8080/api
```

## Technologies

- React 18
- Vite
- Tailwind CSS
- Modern JavaScript (ES6+)

Your backend runs on:

- `http://localhost:8080/api` (from `server.servlet.context-path: /api`)

## Setup

1. Install dependencies:
   - `npm install`
2. Optional: create `.env` and set:
   - `VITE_API_BASE_URL=http://localhost:8080/api`
3. Start frontend:
   - `npm run dev`
4. Open:
   - `http://localhost:5173`

## Notes

- Backend responses are expected in the shape:
  - `{ code, message, data, timestamp }`
- CORS is enabled in your backend controllers with `@CrossOrigin(origins = "*")`.
