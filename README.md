# KatBoom Backend

## Setup

```bash
git clone https://github.com/UNIZAR-30226-2025-11/backend
# Or use ssh:
# git clone git@github.com:UNIZAR-30226-2025-11/backend
cd backend
npm install
```

## Run

```bash
# For developement
npm run dev         # Run project with tsx
npm run watch       # Live-reload on file change

# For production
npm run build       # Transpile to javascript
npm run start
npm run clean       # Clean build files
```

## Test

This project uses **vitest** and **supertest** to run the test suite:

```bash
npm run test
```

## Docker

A Docker Compose file is provided to easily run a containerized version of the app:

```bash
npm run docker:build        # Build image
npm run compose:build
npm run compose:up          # Start image with compose
npm run compose:up -- -d    # Run as daemon
npm run compose:down        # Stop the service
```
