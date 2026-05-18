# ⚡ PDFforge — Full-Stack PDF Converter

Convert Images, DOCX, XLSX, PPTX, HTML, TXT, and CSV files to PDF right in the browser.

---

## 🗂️ Project Structure

```
pdf-converter/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express entry point
│   │   ├── config/config.js        # App configuration & allowed types
│   │   ├── controllers/
│   │   │   └── pdfController.js    # Route handlers
│   │   ├── middlewares/
│   │   │   ├── uploadMiddleware.js # Multer config + validation
│   │   │   └── errorHandler.js     # Global error handler
│   │   ├── routes/
│   │   │   └── pdfRoutes.js        # /api/pdf/* routes
│   │   ├── services/
│   │   │   └── conversionService.js # Core conversion logic
│   │   ├── utils/
│   │   │   └── fileUtils.js        # File helpers + cleanup
│   │   ├── uploads/                # Temporary uploaded files
│   │   └── generated/              # Temporary generated PDFs
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js                  # Main UI component
│   │   ├── App.css                 # Complete styles
│   │   ├── index.js
│   │   ├── api/converterApi.js     # Axios API calls
│   │   └── hooks/useConverter.js  # State management hook
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

```
Git Repositories

- Backend :- https://github.com/meet-ghodasara-26/pdf-maker-backend.git
- Frontend :- https://github.com/meet-ghodasara-26/pdf-maker-frontend.git
```

### Prerequisites

- Node.js 18+
- npm 9+

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
MAX_FILE_SIZE=52428800   # 50MB in bytes
UPLOAD_DIR=src/uploads
GENERATED_DIR=src/generated
ALLOWED_ORIGINS=http://localhost:3000
```

### 3. Run Development Servers

**Backend** (Terminal 1):

```bash
cd backend
npm run dev        # nodemon hot-reload
# OR
npm start          # plain node
```

**Frontend** (Terminal 2):

```bash
cd frontend
npm start
```

Open **http://localhost:3000** in your browser.

---

## 🐳 Docker

```bash
# From project root
docker-compose up --build
```

Services:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 📡 API Reference

### `GET /health`

Health check.

**Response:**

```json
{
  "success": true,
  "message": "PDF Converter API is running",
  "timestamp": "..."
}
```

---

### `POST /api/pdf/convert`

Convert a single file to PDF.

**Request:** `multipart/form-data`

- `file` — the file to convert

**Response:**

- `200 OK` — `application/pdf` binary download
- `400` — validation error JSON
- `413` — file too large JSON
- `500` — conversion error JSON

---

### `POST /api/pdf/convert-multiple`

Convert up to 10 files. Returns single PDF or ZIP archive.

**Request:** `multipart/form-data`

- `files[]` — array of files (max 10)

**Response:**

- `200 OK` — `application/pdf` or `application/zip`

---

### `GET /api/pdf/supported-formats`

List all supported input formats.

---

## ✅ Supported Input Formats

| Format     | Extensions                        |
| ---------- | --------------------------------- |
| Images     | `.jpg .jpeg .png .webp .gif .bmp` |
| Word       | `.docx .doc`                      |
| Excel      | `.xlsx .xls`                      |
| PowerPoint | `.pptx .ppt`                      |
| Text / CSV | `.txt .csv`                       |
| HTML       | `.html .htm`                      |

---

## 🔒 Security Features

- MIME type validation (server-side)
- File extension whitelist
- Filename sanitization via `sanitize-filename`
- UUID-based unique filenames (prevents path traversal)
- File size limit enforced by Multer
- Auto-cleanup of temporary files after conversion

---

## 🧹 Auto-Cleanup Logic

After every conversion (success or error), the backend:

```js
try {
  // convert file
  // stream PDF to client
} catch (error) {
  // return error JSON
} finally {
  await safeDeleteFile(uploadedFile.path); // original upload
  await safeDeleteFile(generatedPdfPath); // converted PDF
}
```

A 5-second delay is used so `res.sendFile()` can complete streaming before the file is deleted.

---

## 🎨 Frontend Features

- Drag & drop upload zone
- Multi-file support
- Per-file progress tracking
- File type & size validation (client-side pre-check)
- Dark / Light theme toggle
- Conversion history (session-scoped)
- Download individual or all converted PDFs
- Animated UI with toast notifications

---

## 📦 Key Dependencies

### Backend

| Package             | Purpose                     |
| ------------------- | --------------------------- |
| `express`           | HTTP server                 |
| `multer`            | File upload handling        |
| `pdfkit`            | PDF generation              |
| `sharp`             | Image processing            |
| `mammoth`           | DOCX text extraction        |
| `xlsx`              | Excel/PPTX parsing          |
| `adm-zip`           | PPTX ZIP extraction         |
| `archiver`          | ZIP creation for multi-file |
| `uuid`              | Unique filenames            |
| `sanitize-filename` | Filename security           |
| `dotenv`            | Environment config          |

### Frontend

| Package | Purpose                   |
| ------- | ------------------------- |
| `react` | UI framework              |
| `axios` | HTTP client with progress |

---

## 🐛 Troubleshooting

**DOCX/PPTX not converting well?**  
For complex documents with rich formatting, consider integrating LibreOffice headless (`libreoffice --convert-to pdf`). The current implementation uses JS-native libraries that extract text content.

**Port already in use?**  
Change `PORT` in `backend/.env` and update the `proxy` field in `frontend/package.json`.

**File not downloading?**  
Ensure the backend CORS `ALLOWED_ORIGINS` matches your frontend URL exactly.
