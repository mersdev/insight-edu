#!/bin/bash

echo "========================================="
echo "Testing Backend API with Seed Data"
echo "========================================="
echo ""

# Test 1: Login as HQ Admin
echo "1. Testing HQ Admin Login..."
TOKEN=$(curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edu.com","password":"Admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
  echo "✅ HQ Admin login successful"
  echo "Token: ${TOKEN:0:50}..."
else
  echo "❌ HQ Admin login failed"
  exit 1
fi
echo ""

# Test 2: Login as Teacher
echo "2. Testing Teacher Login..."
TEACHER_TOKEN=$(curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dehoulworker+sarahjenkins@gmail.com","password":"123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TEACHER_TOKEN" ]; then
  echo "✅ Teacher login successful"
else
  echo "❌ Teacher login failed"
fi
echo ""

# Test 3: Login as Parent
echo "3. Testing Parent Login..."
PARENT_TOKEN=$(curl -s -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dehoulworker+ali@gmail.com","password":"123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PARENT_TOKEN" ]; then
  echo "✅ Parent login successful"
else
  echo "❌ Parent login failed"
fi
echo ""

# Test 4: Get Students
echo "4. Testing GET /api/students..."
STUDENTS=$(curl -s -X GET http://localhost:8787/api/students \
  -H "Authorization: Bearer $TOKEN")
echo "$STUDENTS" | head -c 200
echo "..."
echo ""

# Test 5: Get Teachers
echo "5. Testing GET /api/teachers..."
TEACHERS=$(curl -s -X GET http://localhost:8787/api/teachers \
  -H "Authorization: Bearer $TOKEN")
echo "$TEACHERS" | head -c 200
echo "..."
echo ""

# Test 6: Get Classes
echo "6. Testing GET /api/classes..."
CLASSES=$(curl -s -X GET http://localhost:8787/api/classes \
  -H "Authorization: Bearer $TOKEN")
echo "$CLASSES" | head -c 200
echo "..."
echo ""

# Test 7: Get Locations
echo "7. Testing GET /api/locations..."
LOCATIONS=$(curl -s -X GET http://localhost:8787/api/locations \
  -H "Authorization: Bearer $TOKEN")
echo "$LOCATIONS" | head -c 200
echo "..."
echo ""

echo ""
echo "========================================="
echo "✅ All API tests completed!"
echo "========================================="
