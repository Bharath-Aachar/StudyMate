# StudyMate AI 📚

**Your AI-powered personal study companion.**

StudyMate helps students learn from their own study materials using AI. Upload course PDFs, generate structured lessons, ask questions, practise concepts, and track your learning progress — all in one place.

## ✨ Features

- **AI Tutor:** Get explanations, ask follow-up questions, and learn interactively with AI-powered responses.
- **PDF-Based Learning:** Upload study materials and receive answers grounded in your uploaded content.
- **AI Course Generation:** Turn uploaded PDFs into structured courses with organized lessons.
- **Practice:** Reinforce your understanding through practice activities.
- **Learning Map:** Explore course lessons and monitor your learning progress.
- **Course Workspace:** Study individual lessons, mark them as completed, and continue learning.
- **Dashboard:** View your courses, study progress, and learning activity.
- **Library:** Browse and search your created courses.
- **Settings:** Manage available preferences and study data.
- **Streaming Responses:** See AI responses as they are generated.
- **Contextual Conversations:** Ask follow-up questions while maintaining relevant conversation context.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Full-stack application framework |
| React | User interface |
| TypeScript | Type-safe development |
| Tailwind CSS | Styling and responsive UI |
| Groq API | AI-powered generation and responses |
| Google Gemini API | Additional AI capabilities |
| pdf-parse | Extract text from uploaded PDFs |
| Browser localStorage | Store courses, preferences, and progress locally |

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- A Groq API key
- A Google Gemini API key

### 1. Clone the repository

```bash
git clone https://github.com/Bharath-Aachar/StudyMate.git
cd StudyMate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root.

Add your API keys:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Get your API keys from:

- **Groq:** https://console.groq.com/keys
- **Google Gemini:** https://aistudio.google.com/apikey

Replace the placeholder values with your own keys. Keep `.env.local` private and never commit real API keys to GitHub.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```text
StudyMate/
├── public/
├── src/
│   └── app/
│       ├── api/
│       │   ├── chat/
│       │   ├── upload/
│       │   └── courses/
│       │       └── generate/
│       ├── ai-tutor/
│       ├── courses/
│       ├── learning-map/
│       ├── library/
│       ├── practice/
│       ├── games/
│       ├── settings/
│       ├── layout.tsx
│       └── page.tsx
├── .env.local
├── .gitignore
├── package.json
└── README.md
```

*The structure above highlights the main application areas; individual files may vary by version.*

## 🔐 Security and Data

- API keys should remain in server-side environment variables.
- Never commit `.env.local` or expose secrets in client-side code.
- Course data and study progress stored in browser localStorage are device- and browser-specific.
- Uploaded study materials may be processed by configured AI services. Do not upload sensitive documents unless you understand the services' data-handling policies.

## 🎯 Project Goal

StudyMate aims to make studying more interactive and personalized by combining course materials, AI assistance, structured learning, and progress tracking in one platform.

## 🔮 Future Improvements

- Spaced repetition and personalized revision schedules.
- More detailed learning analytics.
- Improved quiz generation and assessment.
- Cloud synchronization across devices.
- Support for additional study-material formats.

## 👨‍💻 Author

**Bharath Aachar**

GitHub: [@Bharath-Aachar](https://github.com/Bharath-Aachar)

---

*Built to make learning smarter, more interactive, and more accessible.*