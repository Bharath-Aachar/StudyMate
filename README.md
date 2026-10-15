# StudyMate — AI Study Companion

StudyMate is an AI-powered learning companion that helps students turn their study materials into personalized courses, understand difficult concepts, and track their learning progress.

Upload a PDF, generate structured lessons, study at your own pace, and ask the AI Tutor questions about your course material.

## ✨ Features

- **AI Tutor:** Ask questions and receive AI-generated explanations with streaming responses and contextual follow-up conversations.
- **PDF-Based Learning:** Upload PDF study materials and extract their text for learning.
- **AI Course Generation:** Transform uploaded PDFs into personalized courses with lesson summaries and key concepts.
- **Course Workspace:** Read lesson content, review key points, navigate lessons, and mark lessons as completed.
- **Learning Map:** Explore your courses, see lesson completion states, and track overall progress.
- **Study Library:** Browse and search your saved courses and study materials.
- **Personalized Dashboard:** View your courses, progress statistics, continue-learning section, quick links, and AI companion.
- **Settings:** Configure study preferences, choose a daily study goal, and manage locally saved study data.
- **Practice and Games:** Access the available practice and learning game pages.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js App Router | Application framework and routing |
| React | User interface |
| TypeScript | Type-safe application code |
| Tailwind CSS | Styling and responsive layouts |
| Groq API | AI-powered chat and course generation |
| `pdf-parse` | Extract text from uploaded PDFs |
| Browser `localStorage` | Store courses, settings, and lesson progress |
| Browser `sessionStorage` | Pass the active course material to the AI Tutor |

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- A Groq API key

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

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Replace the placeholder with your own API key. Keep `.env.local` private and never commit your API key to GitHub.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 How to Use StudyMate

1. Open **My Courses**.
2. Upload a text-readable PDF.
3. Let StudyMate extract the content and generate a personalized course.
4. Open the course workspace and study the generated lessons.
5. Mark lessons as completed to update your progress.
6. Select **Ask AI Tutor** to discuss the uploaded study material.
7. Use the Learning Map and Library to revisit your courses and monitor your learning.

## 📁 Project Structure

```text
studymate/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   ├── upload/
│   │   │   └── courses/
│   │   ├── ai-tutor/
│   │   ├── courses/
│   │   │   └── [courseId]/
│   │   ├── games/
│   │   ├── learning-map/
│   │   ├── library/
│   │   ├── practice/
│   │   ├── settings/
│   │   └── page.tsx
│   └── components/
├── public/
├── .env.local
├── package.json
└── README.md
```

*This is a simplified overview of the application structure.*

## 🔐 Privacy and Storage

- The Groq API key belongs in the server-side environment configuration.
- Course records and lesson completion data are stored in the browser's local storage.
- The active course can be passed to the AI Tutor through session storage.
- Local browser data is not automatically synchronized across devices.
- Clearing browser storage can remove locally saved courses and progress.

## ⚠️ Current Limitations

- StudyMate currently uses browser-based storage rather than a persistent database and user-account system.
- PDF uploads are limited by the application's configured file-size and text-extraction limits.
- Scanned PDFs without extractable text may not work without OCR.
- Settings for theme and study reminders are preferences; automatic theme switching and reminder notifications are not implemented yet.
- AI-generated content may contain mistakes. Verify important information against your original study materials.

## 🗺️ Future Improvements

- User authentication and cloud-based course storage.
- Persistent document storage and PDF downloads.
- Better source citations and page-level references in AI answers.
- Interactive quizzes and personalized practice recommendations.
- Functional theme switching and study reminders.
- Deployment and production monitoring.

## 👨‍💻 Author

**Bharath Aachar**

GitHub: [@Bharath-Aachar](https://github.com/Bharath-Aachar)

## 📄 License

Add a license file if you intend to distribute StudyMate as an open-source project. Until then, no specific open-source license is declared by this README.