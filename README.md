# IP Lookup

A web application that translates IP addresses into geographic locations, displaying the country and real-time local time for each IP.

## Features

- Look up multiple IP addresses simultaneously
- Client-side IP validation
- Real-time clock display showing local time for each location
- In-memory caching to reduce API calls
- Loading states and error handling

## Tech Stack

**Frontend:**
- Vue.js 3 with Composition API
- TypeScript
- Vite

**Backend:**
- Go 1.21+
- Standard library HTTP server
- [hashicorp/golang-lru](https://github.com/hashicorp/golang-lru) for LRU caching with TTL

**External API:**
- [iplocate.io](https://www.iplocate.io) for geolocation data

## Project Structure

```
src/
├── backend/
│   ├── main.go           # Server entry point
│   ├── handlers/         # HTTP handlers
│   ├── services/         # Geolocation service
│   └── models/           # Data structures
└── frontend/
    └── src/
        ├── components/   # Vue components
        ├── composables/  # Vue composables
        ├── services/     # API client
        └── types/        # TypeScript types
```

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+
- npm

### Development

**Frontend:**
```bash
cd src/frontend
npm install
npm run dev
```

**Backend:**
```bash
cd src/backend
go run .
```

The backend serves the API at `http://localhost:8080` and the frontend dev server runs at `http://localhost:5173`.

### Production Build

```bash
# Build frontend
cd src/frontend
npm run build

# Run backend (serves static files from frontend/dist)
cd ../backend
go run .
```

## API

### GET /api/lookup/:ip

Returns geolocation data for the specified IP address.

**Response:**
```json
{
  "ip": "8.8.8.8",
  "country": "United States",
  "countryCode": "US",
  "timezone": "America/Chicago"
}
```
