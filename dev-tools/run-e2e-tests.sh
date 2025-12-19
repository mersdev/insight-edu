#!/bin/bash

# Script to run E2E tests locally
# This script starts the backend, frontend, and runs Cypress tests

set -e

echo "🚀 Starting E2E Test Environment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if database is running
echo -e "${YELLOW}Checking database...${NC}"
if ! podman ps | grep -q insight-edu-postgres; then
    echo -e "${RED}Database is not running. Please start it first:${NC}"
    echo "cd backend && ./start-db.sh"
    exit 1
fi
echo -e "${GREEN}✓ Database is running${NC}"

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Start backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd backend
npm start > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Backend failed to start${NC}"
        cat /tmp/backend.log
        exit 1
    fi
    sleep 1
done

# Start frontend server
echo -e "${YELLOW}Starting frontend server...${NC}"
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo -e "${YELLOW}Waiting for frontend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Frontend failed to start${NC}"
        cat /tmp/frontend.log
        exit 1
    fi
    sleep 1
done

# Run Cypress tests
echo -e "${YELLOW}Running Cypress E2E tests...${NC}"
cd frontend

if [ "$1" == "--headed" ]; then
    echo -e "${YELLOW}Running tests in headed mode...${NC}"
    npm run test:e2e:headed
elif [ "$1" == "--open" ]; then
    echo -e "${YELLOW}Opening Cypress Test Runner...${NC}"
    npm run cypress:open
else
    echo -e "${YELLOW}Running tests in headless mode...${NC}"
    npm run test:e2e
fi

TEST_EXIT_CODE=$?

cd ..

# Report results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo -e "${RED}✗ Some tests failed${NC}"
fi

exit $TEST_EXIT_CODE

