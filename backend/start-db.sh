#!/bin/bash

# Start PostgreSQL container using Podman
echo "Starting PostgreSQL container with Podman..."

# Stop and remove existing container if it exists
podman stop insight-edu-db 2>/dev/null
podman rm insight-edu-db 2>/dev/null

# Run PostgreSQL container
podman run -d \
  --name insight-edu-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=insight_edu \
  -p 5432:5432 \
  postgres:15-alpine

echo "Waiting for PostgreSQL to be ready..."
sleep 5

# Initialize database schema
echo "Initializing database schema..."
podman exec -i insight-edu-db psql -U postgres -d insight_edu < init.sql

# Run migrations
echo "Running database migrations..."
for migration in migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "  Applying migration: $migration"
    podman exec -i insight-edu-db psql -U postgres -d insight_edu < "$migration"
  fi
done

# Seed database with initial data
echo "Seeding database with initial data..."
podman exec -i insight-edu-db psql -U postgres -d insight_edu < seed.sql

echo "Database setup complete!"
echo "PostgreSQL is running on localhost:5432"
echo "Database: insight_edu"
echo "User: postgres"
echo "Password: postgres"

