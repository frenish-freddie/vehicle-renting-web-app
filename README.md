# 🚗 FlexiRide — Vehicle Renting Web App

A full-stack vehicle rental platform built with **FastAPI** (Python) and **Next.js** (TypeScript/React).

## 🏗️ Project Structure

```
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   └── routers/  # API route handlers (vehicles, payments, etc.)
│   └── requirements.txt
└── frontend/         # Next.js frontend
    ├── src/
    │   ├── app/      # Next.js App Router pages
    │   └── components/
    └── public/
```

## 🚀 Getting Started

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python, SQLite
- **Maps**: Dynamic map integration
- **Payments**: Integrated payment router

## 📄 License

MIT
