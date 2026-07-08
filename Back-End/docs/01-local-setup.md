# Local Setup Guide

Use this guide to run the IntelliSales backend on a developer laptop for local web and mobile testing.

## Requirements

- Node.js 20+
- npm
- MongoDB running locally, or a configured MongoDB URI
- Postman for manual API testing

## Install

```bash
npm install
```

For a clean install from the lockfile:

```bash
npm ci
```

## Environment Variables

Create `.env` from `.env.example`.

```powershell
copy .env.example .env
```

Minimum local values:

```env
NODE_ENV=development
PORT=5000
HOST=0.0.0.0
MONGO_URI=mongodb://127.0.0.1:27017/intellisales
JWT_ACCESS_SECRET=change_this_access_secret
JWT_REFRESH_SECRET=change_this_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

Use `HOST=0.0.0.0` when another laptop or a physical phone must reach the backend.

## Start MongoDB

Start MongoDB locally using your installed MongoDB service or MongoDB Compass. The default local URI is:

```text
mongodb://127.0.0.1:27017/intellisales
```

## Seed Demo Data

Run the seed scripts after MongoDB is running:

```bash
npm run seed:users
npm run seed:products
npm run seed:price-lists
```

The seed scripts are intended to be idempotent for local demo use.

## Run The Backend

```bash
npm run dev
```

Production-style local start:

```bash
npm start
```

After code changes, stop the backend with `Ctrl+C` and restart `npm run dev` before retesting in Postman.

## Run Tests

```bash
npm test
```

The current project test command is `jest --runInBand`.

## Health Checks

```http
GET http://localhost:5000/api/v1/health
GET http://localhost:5000/api/v1/health/db
```

Expected:

- `/health` returns `200` if the Express app is running.
- `/health/db` returns `200` when MongoDB is connected.
- `/health/db` returns `503` when MongoDB is disconnected.

## Local Connection URLs

| Client | Base URL |
| --- | --- |
| Web frontend on same laptop | `http://localhost:5000/api/v1` |
| Web frontend from another laptop on same Wi-Fi | `http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1` |
| Flutter Android emulator | `http://10.0.2.2:5000/api/v1` |
| Flutter iOS simulator on same Mac | `http://localhost:5000/api/v1` |
| Physical Android/iPhone on same Wi-Fi | `http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1` |

Generated invoice PDFs are stored under `uploads/invoices/`. Do not commit generated PDF files.
