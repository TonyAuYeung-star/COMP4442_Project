# COMP4442 Frontend (React + Vite)

React frontend for your Spring Boot backend in `D:/compccProj`.

## Features

- **Health Dashboard**: Real-time health checks and application info
- **Service Registry Management**:
  - Create, list, update, delete services
  - Query services by name and status
  - Visual service cards with status indicators
- **Service Instance Management**:
  - Register new service instances
  - Query active instances and counts
  - Get detailed instance information
  - Update heartbeats and unregister instances
  - Health status monitoring based on heartbeat times

## Architecture

The frontend is built with modern React components:

- **Header**: Application header with refresh functionality
- **Notification**: User feedback messages with dismiss option
- **DashboardStats**: Overview cards showing health, services, and instances
- **ServiceCard**: Individual service display with actions
- **ServiceForm**: Form for creating/editing services
- **ServiceQuery**: Query interface for finding services
- **InstanceCard**: Individual instance display with actions
- **InstanceForm**: Form for registering instances
- **ConfirmationDialog**: Confirmation prompts for destructive actions

## Backend API

Expects Spring Boot backend running on `http://localhost:8080/api` with endpoints:

### Health & Info
- `GET /v1/health` - Application health status
- `GET /v1/info` - Application information

### Services
- `GET /v1/services` - List all services
- `POST /v1/services` - Create new service
- `GET /v1/services/{id}` - Get service by ID
- `PUT /v1/services/{id}` - Update service
- `DELETE /v1/services/{id}` - Delete service
- `POST /v1/services/query/by-name` - Query by name
- `POST /v1/services/query/by-status` - Query by status

### Service Instances
- `POST /v1/service-instances` - Register instance
- `POST /v1/service-instances/query/active` - Get active instances
- `POST /v1/service-instances/query/count` - Get instance count
- `GET /v1/service-instances/{id}` - Get instance by ID
- `PUT /v1/service-instances/{id}/heartbeat` - Update heartbeat
- `DELETE /v1/service-instances/{id}` - Unregister instance

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
