#!/bin/bash

# Apply database migrations
npx prisma migrate deploy

# Build the application
npm run build

# Start the application
npm start
