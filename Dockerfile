# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM golang:1.21-alpine AS backend-builder
WORKDIR /app
COPY src/backend/ ./
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

# Stage 3: Production image
FROM alpine:3.19
RUN apk --no-cache add ca-certificates
WORKDIR /app

# Copy backend binary
COPY --from=backend-builder /app/server .

# Copy frontend dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8080
ENV PORT=8080

CMD ["./server"]
