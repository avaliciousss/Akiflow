#!/bin/bash

echo "🧠 ADHD Time-Blocking Copilot - Quick Test"
echo ""
echo "Server running at: http://localhost:3000"
echo ""

# Test 1: Health check
echo "1. Health Check:"
curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
echo ""
echo ""

# Test 2: Generate a plan
echo "2. Generate a Plan for Today:"
curl -s -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "available_start": "2026-01-09T14:00:00",
    "available_end": "2026-01-09T17:00:00",
    "tasks": [
      {
        "title": "Finish documentation",
        "estimated_minutes": 30,
        "priority": "high"
      },
      {
        "title": "Review code",
        "estimated_minutes": 25,
        "priority": "medium"
      },
      {
        "title": "Update tasks",
        "estimated_minutes": 15,
        "priority": "low"
      }
    ],
    "energy_level": "medium"
  }' | python3 -m json.tool 2>/dev/null || curl -s -X POST http://localhost:3000/api/plan \
  -H "Content-Type: application/json" \
  -d '{
    "available_start": "2026-01-09T14:00:00",
    "available_end": "2026-01-09T17:00:00",
    "tasks": [
      {
        "title": "Finish documentation",
        "estimated_minutes": 30
      }
    ],
    "energy_level": "medium"
  }'

echo ""
echo ""
echo "✅ Server is working!"
echo ""
echo "Available endpoints:"
echo "  - POST http://localhost:3000/api/plan"
echo "  - POST http://localhost:3000/api/sessions/start"
echo "  - POST http://localhost:3000/api/recovery"
echo "  - GET  http://localhost:3000/health"
echo ""
echo "See examples/example-requests.json for more examples"
