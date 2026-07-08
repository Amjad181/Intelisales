# IntelliSales

This repository contains the IntelliSales web frontend, Flutter mobile app, and the completed Node.js backend handoff for Modules 1-12.

## Project Areas

- `Back-End/` - Node.js 20, Express.js, MongoDB, Mongoose REST API.
- `Front-End-Web/` - Web frontend project.
- `Front-End-MobileApplication/` - Flutter mobile application.

## Backend Handoff

The backend is ready for frontend integration testing from:

- [Back-End/README.md](Back-End/README.md)
- [Back-End/docs/FRONTEND_INTEGRATION_GUIDE.md](Back-End/docs/FRONTEND_INTEGRATION_GUIDE.md)
- [Back-End/docs/INTEGRATION_TEST_CHECKLIST.md](Back-End/docs/INTEGRATION_TEST_CHECKLIST.md)
- [Back-End/postman/IntelliSales_Final_API_Postman_Collection.json](Back-End/postman/IntelliSales_Final_API_Postman_Collection.json)
- [Back-End/postman/IntelliSales_Local_Environment.json](Back-End/postman/IntelliSales_Local_Environment.json)

Local backend base URLs:

- Web on the backend computer: `http://localhost:5000/api/v1`
- Android emulator: `http://10.0.2.2:5000/api/v1`
- Physical phone on the same Wi-Fi: `http://<BACKEND_LAPTOP_LAN_IP>:5000/api/v1`

Module 13 final integration cleanup should start only after web and mobile teams test against this backend baseline.
