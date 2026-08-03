---
title: Meet Ai
emoji: 🚀
colorFrom: blue
colorTo: pink
sdk: gradio
app_file: run.py
pinned: false
---
# Meet AI

Meet AI is an intelligent, AI-powered meeting platform designed to elevate remote communication and interviews. Built with Python (FastAPI), React, and Jitsi, it integrates advanced language models to provide real-time voice interaction, automatic transcriptions, semantic search, and AI-driven meeting summaries.

## ✨ Features

- **AI Interviewer & Voice Mode:** Engage in natural, continuous voice conversations with an AI assistant that can ask questions, listen, and dynamically respond in real-time.
- **Real-Time Transcription:** Automatically captures and saves live meeting transcripts during the call, with both browser and server-side fallback support.
- **Smart Meeting Summaries:** Generates comprehensive post-meeting summaries automatically using OpenAI.
- **Semantic Memory & Search:** Ask questions about past meetings and instantly retrieve context through embedding-based semantic search.
- **Robust Authentication:** Secure email/password verification, OAuth support, and user management powered by Supabase.
- **Integrated Billing:** Subscription and payment scaffolding built directly into the platform using Razorpay.

## 🚀 Quick Start / Local Setup

Follow these steps to get the project running locally.

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (or SQLite for local dev)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/meet-ai.git
cd meet-ai
```

### 2. Backend Setup
Set up your Python virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

**Environment Variables:**
Copy `.env.example` to `.env` and fill in your keys (Supabase, OpenAI, Razorpay):
```bash
cp .env.example .env
```
*(Note: If `OPENAI_API_KEY` is not provided, the app will run in a local fallback mode.)*

**Database Migrations & Start Server:**
Run Alembic migrations to set up your database, then start the FastAPI server:
```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
The backend API will be available at `http://localhost:8000`.

### 3. Frontend Setup
In a new terminal window, navigate to the frontend directory and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The application will be available at `http://localhost:5173`.

## 🛠️ Tech Stack
- **Backend:** FastAPI, SQLAlchemy, Python
- **Frontend:** React (Vite), React Router
- **Video Conferencing:** Jitsi (`meet.jit.si`)
- **AI & Agentic Workflows:** LangGraph, LangChain, LangSmith, OpenAI
- **Database & Auth:** PostgreSQL, Supabase Auth

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📄 License
This project is licensed under the terms of the LICENSE file included in this repository.
