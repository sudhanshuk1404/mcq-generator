# 🎓 EduTranscribe – Lecture Video to Editable MCQs with AI

EduTranscribe is an AI-powered full-stack web application that allows users to upload lecture videos, transcribe them using Whisper, and automatically generate multiple-choice questions (MCQs) using a locally running LLM (Mistral via Ollama). Users can edit and export questions in CSV or PDF formats.

---

## ✨ Features

- ✅ Google Authentication via Firebase
- 🎬 Upload lecture videos (MP4)
- 📝 Transcribe using Whisper (Python backend)
- 🧠 Generate MCQs using a local LLM (Ollama + Mistral)
- 🛠️ Edit questions and answers in a user-friendly UI
- 📥 Export MCQs as CSV or PDF
- 💾 Stores user-specific videos and MCQs in MongoDB
- 🌈 TailwindCSS + ShadCN for beautiful UI
- 🔐 Secure upload + JWT protection

---

## 🧱 Tech Stack

| Layer        | Tech Used                     |
|--------------|-------------------------------|
| Frontend     | React + Vite + TypeScript     |
| Styling      | Tailwind CSS + ShadCN         |
| Auth         | Firebase (Google Login)       |
| Backend      | Express.js + MongoDB Atlas    |
| AI Services  | Python (FastAPI + Whisper + Mistral/Ollama) |
| Deployment   | Vercel (frontend), Render (backend) |

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone (https://github.com/sudhanshuk1404/mcq-generator.git)
cd edutranscribe
