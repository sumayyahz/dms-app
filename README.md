# Document Management System (DMS)

Aplikasi web untuk mengelola dokumen dengan fitur OCR, text extraction, dan metadata extraction otomatis menggunakan AI.

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Queue**: BullMQ + Redis
- **Storage**: MinIO / Local Storage
- **OCR**: Tesseract.js
- **Text Extraction**: pdf-parse, mammoth, xlsx
- **AI Extraction**: OpenAI API / Ollama

### Frontend
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios
- **UI Framework**: Tailwind CSS + shadcn/ui

## Fitur Utama

### Document Management
- ✅ Upload single & multiple file (PDF, DOCX, XLSX, JPG, PNG)
- ✅ Drag & Drop upload
- ✅ Preview dokumen
- ✅ Download dokumen
- ✅ Edit metadata
- ✅ Kategori dan Tag
- ✅ Versioning dokumen
- ✅ Delete dengan soft delete

### Processing
- ✅ Text extraction dari PDF & DOCX
- ✅ OCR untuk gambar & scan
- ✅ Metadata extraction otomatis (nomor, judul, tanggal, dll)
- ✅ Full-text search indexing

### Admin Features
- ✅ Login & Register
- ✅ Role-based Access Control (Admin, Editor, Viewer)
- ✅ Audit Log
- ✅ Dashboard statistik
- ✅ User management

## Prerequisites

Pastikan sudah terinstall:
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/))
- Redis ([Download](https://redis.io/))
- Git

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/sumayyahz/dms-app.git
cd dms-app
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env dengan konfigurasi lokal Anda

npm install
npm run db:migrate
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/dms_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

STORAGE_TYPE=local
STORAGE_PATH=./uploads

# MinIO (optional)
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=dms-documents

# OpenAI (optional for AI metadata extraction)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

LOG_LEVEL=debug
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Document Management System
```

## Local Development Setup

### Create PostgreSQL Database
```bash
psql -U postgres
CREATE DATABASE dms_db;
CREATE USER dms_user WITH PASSWORD 'dms_password';
ALTER ROLE dms_user SET client_encoding TO 'utf8';
ALTER ROLE dms_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE dms_user SET default_transaction_deferrable TO on;
ALTER ROLE dms_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE dms_db TO dms_user;
\q
```

### Start Redis
```bash
redis-server
```

### Start Backend
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

### Start Frontend
```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Documents
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document detail
- `POST /api/documents/upload` - Upload document
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/download` - Download document
- `GET /api/documents/:id/versions` - Get document versions

### Search
- `POST /api/search` - Full-text search documents
- `GET /api/search/suggestions` - Search suggestions

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Tags
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/recent-documents` - Recent documents

### Audit Logs
- `GET /api/audit-logs` - List audit logs

## Project Structure

```
dms-app/
├── backend/
│   ├── src/
│   │   ├── config/              # Configuration
│   │   ├── domain/              # Business entities & interfaces
│   │   ├── application/         # Use cases & services
│   │   ├── infrastructure/      # DB, queue, storage, external services
│   │   ├── presentation/        # Controllers, routes, middleware
│   │   ├── shared/              # Utils, constants, decorators
│   │   └── main.ts
│   ├── migrations/              # Database migrations
│   ├── tests/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom hooks
│   │   ├── services/            # API services
│   │   ├── store/               # Redux store
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utilities
│   │   ├── config/              # Configuration
│   │   └── App.tsx
│   ├── public/
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Development Commands

### Backend
```bash
cd backend

# Development
npm run dev              # Start dev server with hot reload
npm run build           # Build for production

# Database
npm run db:migrate      # Run pending migrations
npm run db:seed         # Seed sample data
npm run db:rollback     # Rollback last migration

# Queue
npm run queue:start     # Start background job processor

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
```

### Frontend
```bash
cd frontend

npm run dev             # Start dev server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
```

## Architecture

**Clean Architecture** dengan pemisahan layer:

```
Presentation Layer (Controllers, Routes, Middleware)
        ↓
Application Layer (Use Cases, Services, DTOs)
        ↓
Domain Layer (Entities, Interfaces, Business Rules)
        ↓
Infrastructure Layer (Repositories, External Services)
```

## Default Credentials

Setelah seed data:
- **Admin**: admin@example.com / admin123
- **Editor**: editor@example.com / editor123
- **Viewer**: viewer@example.com / viewer123

## Database Schema

### Core Tables
- `users` - User accounts with roles
- `documents` - Document records
- `document_versions` - Version history
- `document_metadata` - Extracted metadata
- `document_content` - Full-text searchable content
- `categories` - Document categories
- `document_tags` - Document-tag relationships
- `audit_logs` - Activity audit trail
- `tags` - Tag master data

## Document Processing Flow

```
User Upload
    ↓
File Validation & Storage
    ↓
Document Record Created
    ↓
Background Job Queued
    ↓
├─→ Text Extraction (PDF, DOCX, XLSX)
├─→ OCR Processing (Images, Scans)
├─→ Content Indexing
└─→ Metadata Extraction (AI)
    ↓
Metadata Saved to DB
    ↓
Document Ready for Search
```

## License

MIT

## Support

Untuk pertanyaan atau issues, buat GitHub Issues di repository ini.

---

**Happy coding! 🚀**
