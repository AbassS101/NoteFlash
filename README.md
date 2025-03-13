NoteFlash: Smart Note-Taking & Learning App
NoteFlash is an advanced note-taking application with integrated flashcards and quizzes, designed to enhance your learning experience through spaced repetition and smart study tools.
🚀 Features

Rich Text Notes: Powerful note-taking with advanced formatting
Flashcard Generation: Automatically create flashcards from your notes
Spaced Repetition: Smart review system using the SM-2 algorithm
Quiz Creation: Generate quizzes from your notes and flashcards
Dark/Light Mode: Customizable UI theme
Responsive Design: Works seamlessly across devices

🛠 Tech Stack

Frontend: Next.js 13
State Management: Zustand
UI Components: Shadcn/UI, Tailwind CSS
Authentication: NextAuth.js
Database: Prisma with PostgreSQL
Rich Text Editing: Tiptap
Animations: Framer Motion

📦 Prerequisites

Node.js (v16 or later)
PostgreSQL
npm or yarn

🔧 Installation

Clone the repository

bashCopygit clone https://github.com/AbassS101/noteflash.git
cd noteflash

Install dependencies

bashCopynpm install
# or
yarn install

Set up environment variables
Create a .env file with the following:

CopyDATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

Set up the database

bashCopynpx prisma migrate dev
npx prisma generate

Run the development server

bashCopynpm run dev
# or
yarn dev
🚀 Deployment

Recommended platforms: Vercel, Netlify
Ensure to set environment variables in your deployment platform

🤝 Contributing

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

📄 License
Distributed under the MIT License. See LICENSE for more information.
📞 Contact
Your Name - abassShikur@gmail.com
Project Link: https://github.com/AbassS101/noteflash
