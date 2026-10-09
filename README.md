# StudyMate — AI-Powered Learning Companion 🎓

StudyMate is an AI-powered learning companion designed to help students understand complex concepts, ask questions, and learn more effectively through personalized AI assistance.

The project combines a modern learning dashboard with an AI tutor powered by the Groq API, creating the foundation for a smarter and more interactive learning experience.

## ✨ Features

- **Learning Dashboard:** A centralized interface for accessing your learning experience.
- **AI Study Tutor:** Ask questions and receive AI-generated explanations.
- **Lesson Selection:** Choose a subject or lesson to provide context for your questions.
- **Interactive Chat:** Communicate with the AI tutor through a simple chat interface.
- **Loading Feedback:** See when the AI is processing your question.
- **Modern UI:** A dark-themed interface built with a clean, responsive design.
- **API Integration:** Secure server-side communication with the Groq language model API.

## 🎯 Project Goal

The goal of StudyMate is to make learning more accessible, personalized, and interactive.

Instead of searching through multiple resources for every doubt, students can ask questions in natural language and receive clear explanations with practical examples.

StudyMate is currently a prototype, with additional learning features planned for future development.

## 🛠️ Tech Stack

| Technology   | Purpose                              |
| ------------ | ------------------------------------ |
| Next.js      | Full-stack web application framework |
| React        | User interface                       |
| TypeScript   | Type-safe application development    |
| Tailwind CSS | Styling and responsive layouts       |
| Groq API     | AI-powered text generation           |
| Groq SDK     | Communication with the AI model      |
| Node.js      | JavaScript runtime                   |
| npm          | Package management                   |

## 🏗️ Architecture

StudyMate uses a simple client-server architecture.

1. **Frontend:** The Next.js interface displays the dashboard and AI tutor chat.
2. **API Layer:** A Next.js Route Handler receives questions from the frontend.
3. **AI Service:** The API sends the lesson context and question to the Groq API.
4. **Response Handling:** The generated answer is returned to the frontend and displayed in the chat.

```text
Student
   |
   v
StudyMate Frontend
(Next.js + React)
   |
   v
/api/chat
(Next.js Route Handler)
   |
   v
Groq API
   |
   v
AI-Generated Answer
   |
   v
Chat Interface
```

## 🚀 Getting Started

Follow these instructions to run StudyMate on your local machine.

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/) — preferably the current LTS version.
- npm — included with Node.js.
- [Git](https://git-scm.com/).
- A [GroqCloud account](https://console.groq.com/) with an API key.

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

Navigate into the project folder:

```bash
cd studymate
```

Replace the repository URL with your actual GitHub repository URL.

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a file named `.env.local` in the project root, in the same directory as `package.json`.

Add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Replace the placeholder with your own API key from [GroqCloud Console](https://console.groq.com/keys).

**Important:** Never commit `.env.local` or expose your API key in frontend code.

### 4. Start the Development Server

```bash
npm run dev
```

Open your browser and visit:

[http://localhost:3000](http://localhost:3000)

To access the AI tutor, visit:

[http://localhost:3000/ai-tutor](http://localhost:3000/ai-tutor)

### 5. Build for Production

To check the production build:

```bash
npm run build
```

To start the production server after a successful build:

```bash
npm start
```

## 📁 Project Structure

The main application files are organized as follows:

```text
studymate/
├── public/                  # Static assets
├── src/
│   └── app/
│       ├── api/
│       │   └── chat/
│       │       └── route.ts # AI chat API endpoint
│       ├── ai-tutor/
│       │   └── page.tsx     # AI tutor interface
│       ├── globals.css      # Global styles
│       ├── layout.tsx       # Root application layout
│       └── page.tsx         # Main dashboard
├── .env.local               # Local secrets (not committed)
├── .gitignore               # Git exclusions
├── package.json             # Dependencies and scripts
├── package-lock.json        # Dependency lockfile
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── README.md                 # Project documentation
```

Your actual project may contain additional files depending on your Next.js setup.

## 🔐 Security

- Keep all API keys in environment variables.
- Never expose API keys in client-side components.
- Do not commit `.env.local` to GitHub.
- Each developer should configure their own API key.
- Apply suitable rate limits and request validation before deploying publicly.

## 🗺️ Future Roadmap

The following are planned improvements, not necessarily implemented yet.

- [ ] Streaming AI responses.
- [ ] Conversation memory and contextual follow-up questions.
- [ ] PDF and study-note uploads.
- [ ] Answers grounded in uploaded course materials.
- [ ] AI-generated quizzes and assessments.
- [ ] Learning progress tracking.
- [ ] Personalized learning recommendations.
- [ ] Improved error handling and API usage controls.
- [ ] Public deployment.

## 🤝 Contributing

Contributions, suggestions, and ideas are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement your changes.
4. Test your changes.
5. Submit a pull request.

## ⚠️ Current Limitations

StudyMate is an ongoing prototype. AI responses may contain mistakes, and the current tutor is not yet a replacement for verified academic materials. Features listed in the roadmap are planned enhancements.

## 📄 License

No license has been selected yet. Add a license file before explicitly granting others permission to reuse, modify, or distribute this project.

## 👨‍💻 Author

**Bharath Aachar**

Computer Science Engineering Student | AI & Backend Development Enthusiast

GitHub: [Bharath-Aachar](https://github.com/Bharath-Aachar)

---

*Built with curiosity and a vision to make learning smarter with AI.* 🚀
