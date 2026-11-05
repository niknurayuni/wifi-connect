# WiFi Connect 🌸

**WiFi Connect** is an elegant, privacy-first Wi-Fi QR Code Generator and Printable Guest Card web application. It allows hosts, cafes, and offices to generate a modern printable guest card so visitors can connect to Wi-Fi instantly with their smartphone camera.

---

## ✨ Features & Design Highlights

- **Soft Pink & White Glassmorphism Aesthetic:** Translucent frosted panels, subtle pink ambient glow, crisp typography, and responsive design for mobile, tablet, and desktop.
- **Strict Privacy & Security:**
  - **Zero Disk / Database Persistence:** QR codes are generated dynamically in-memory and transferred directly as Base64 data URLs.
  - **Zero Password Logging:** Passwords and sensitive payloads are strictly excluded from server logs and error traces.
- **Native TypeScript Execution:** Built with Node.js native type stripping (`--experimental-strip-types`) — no separate `tsc` build step, bundler, or transpilation required.
- **Printable Guest Card Interface:**
  - Dedicated print media styling (`@media print`) isolates and formats only the guest card cleanly for paper printing.
  - Form controls, background elements, navigation, and buttons are automatically hidden when printing.
  - Includes quick copy buttons for SSID and password, as well as a direct QR code PNG download button.
- **Robust Validation:** Real-time client-side validation and backend API validation ensuring network name (SSID) is never empty.
- **Cloud Run & Container Ready:** Configured to bind to `0.0.0.0` and `process.env.PORT || 8080`, with a production-ready multi-stage Dockerfile based on Node.js 22 LTS.

---

## 🛠️ Tech Stack

- **Backend:** Node.js (v22+ LTS), Express, TypeScript (native type stripping), `qrcode` library.
- **Frontend:** Single `index.html` served from `/public`, styled with Tailwind CSS via CDN.
- **Testing:** Node.js built-in test runner (`node:test`, `node:assert`) and `supertest`.

---

## 🚀 Running Locally

### Prerequisites
- Node.js 22.6+ (or Node 23/24/26 LTS)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
*(Uses `node --watch --experimental-strip-types src/index.ts` for instant auto-reload on code changes.)*

Alternatively, start the standard production server:
```bash
npm start
```

### 3. Open the Application
Navigate to [http://localhost:8080](http://localhost:8080) in your web browser.

---

## 🧪 Running Automated Tests

Run the test suite verifying SSID validation, QR code generation, health checks, and security constraints:

```bash
npm test
```

Expected output:
```
▶ WiFi Connect API Tests
  ✔ should serve index.html with WiFi Connect title
  ✔ should return health check status successfully
  ▶ Empty SSID Validation
    ✔ should return 400 when SSID is missing
    ✔ should return 400 when SSID is an empty string
    ✔ should return 400 when SSID contains only whitespace
  ▶ Successful QR Code Generation
    ✔ should successfully generate a Wi-Fi QR code for WPA network
    ✔ should successfully generate a QR code for an Open / No Password network
    ✔ should successfully generate a QR code with special characters escaped
    ✔ should support hidden network flag
✔ WiFi Connect API Tests (9 pass, 0 fail)
```

---

## 🐳 Docker & Google Cloud Run

### Build Docker Image
```bash
docker build -t wifi-connect .
```

### Run Container Locally
```bash
docker run -p 8080:8080 -e PORT=8080 wifi-connect
```

### Deploy to Google Cloud Run
```bash
gcloud run deploy wifi-connect \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 📁 Project Structure

```
wifi-connect/
├── public/
│   └── index.html             # Glassmorphism frontend (soft pink & white)
├── src/
│   ├── app.ts                 # Express application & endpoints
│   ├── index.ts               # Server entry point (binds 0.0.0.0:8080)
│   └── services/
│       └── qrService.ts       # In-memory QR generation & Wi-Fi string encoding
├── test/
│   └── api.test.ts            # Automated tests
├── .dockerignore              # Docker ignore rules
├── Dockerfile                 # Cloud Run ready Dockerfile (node:22-alpine)
├── package.json               # Scripts & dependencies
└── README.md                  # Project documentation
```

