# KatBoom Backend

Backend service for Katboom.

## Setup

```bash
git clone https://github.com/UNIZAR-30226-2025-11/backend

# Or use ssh if configured, see
# https://docs.github.com/en/authentication/connecting-to-github-with-ssh
#
# git clone git@github.com:UNIZAR-30226-2025-11/backend

cd backend
npm install         # If you intend to run it locally
```

## Run

There are some steps required to start up the backend:

- You'll need to start a database, if you intend to use a local one. You can follow the steps in the README of https://github.com/UNIZAR-30226-2025-11/database
- You need to create an `.env` file with the config. Check `.env.example` for the necessary fields.

```bash
cp .env.example .env
# ...then fill it with the needed data
```

### Locally

```bash
# For developement
npm run dev         # Run project with tsx
npm run watch       # Live-reload on file change

# For production
npm run build       # Transpile to javascript
npm run start
npm run clean       # Clean build files
```

### Run in a container

A Docker Compose file is provided to easily run a containerized version of the app alongside a database:

```bash
npm run docker:build        # Build image
npm run compose:build
npm run compose:up          # Start image with compose

# You can also pass arguments to the compose command
npm run compose:up -- -d                        # Run as daemon
npm run compose:up -- backend database          # Don't run Adminer
npm run compose:up -- backend                   # Run backend server only
npm run compose:up -- database                  # Run DB only

npm run compose:down        # Stop the service
npm run compose:down -- -v  # Stop the service and DELETE the data in the database 
```

In order for the backend container to access the database container, the database's host must be `database` (which is the service's name). If the backend is run locally and the database is run in a container, use `localhost`.

If the `sql/init.db` file has been updated, the container WILL NOT be updated, since the init script is run once on volume creation. You can force the database to reload the init script by stopping and restarting the container (compose down, compose up) and running this command:

```bash
docker exec -i katboom_pg_db psql -U admin -d katboom -f /docker-entrypoint-initdb.d/init.sql
```

## Environment

The project environment is defined in `.env`. When the app is started, either locally or in a containter, you will need to provide a configuration, such the the location and credentials of the database, or the port where the server should be launched.

The variables used by the project are defined and explained in `.env.example`.

If starting a database container, you should create `.env.database` and configure the environment. Check `.env.database.example` for details.

## Test

This project uses **vitest** and **supertest** to run the test suite.

Since test runs may need a specific configuration, you need to create a `.env.test` file.

Once the database is running, you should be able to run the test suite:

```bash
npm run test
```
