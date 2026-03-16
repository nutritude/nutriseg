#!/bin/bash
pkill -f node || true
pkill -f mongod || true
pkill -f vite || true

cp -n backend/.env.example backend/.env || true

cd backend && (NODE_ENV=development node src/main/server.js > backend.log 2>&1 &)
echo "Backend iniciado"
cd ../frontend && (npm run dev -- --host 0.0.0.0 --port 5173 > frontend.log 2>&1 &)
echo "Frontend iniciado"
