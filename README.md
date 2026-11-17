# 🚀 BuildSpace

### Build. Share. Discover. Collaborate.

**BuildSpace** is a project-first discovery and hiring platform where developers, students, freelancers, and professionals can showcase their work, discover talented creators, connect with recruiters, and find career opportunities.

Unlike traditional job platforms that primarily focus on resumes, BuildSpace puts **real projects and practical skills at the center of talent discovery.**

---

## 🌟 Overview

BuildSpace brings creators and recruiters together through an interactive, vertical project discovery experience.

Creators can showcase their projects, demonstrate their technical skills, connect with other developers, and apply for jobs.

Recruiters can discover talent by exploring real projects, connect directly with creators, publish job opportunities, and manage applications.

### 💡 Our Vision

To make talent discovery more practical, transparent, and accessible by allowing people to demonstrate what they can actually build.

---

## ✨ Key Features

### 👨‍💻 For Creators

- Create and customize professional profiles.
- Upload and showcase development projects.
- Share project descriptions, technology stacks, and media.
- Add GitHub repositories and live demo links.
- Explore projects through a vertical scrolling feed.
- Like, comment, save, and share projects.
- Follow other creators.
- Connect and communicate with recruiters.
- Receive messages and notifications.
- Apply for job opportunities.
- Track job application status.

### 🏢 For Recruiters

- Create recruiter and company profiles.
- Discover developers through project-based feeds.
- Explore candidate profiles and technical skills.
- View GitHub repositories and live projects.
- Save interesting candidates.
- Message creators directly from their projects.
- Publish job opportunities.
- Receive and manage job applications.
- Shortlist candidates and manage the hiring process.

### 💬 Messaging & Collaboration

- Creator-to-creator communication.
- Recruiter-to-creator messaging.
- Project-context messaging.
- Real-time messaging support.
- Notifications for new messages.
- Future collaboration opportunities.

### 💼 Job & Hiring Management

BuildSpace provides a structured hiring workflow:

`New → Under Review → Shortlisted → Interview → Selected / Rejected`

Recruiters can manage applications while creators can track their progress.

### 🤖 AI Career Studio (Planned)

An AI-powered career assistance module designed to help creators prepare better job applications.

Planned capabilities:

- Upload existing resumes (PDF/DOCX).
- Extract resume information.
- Edit and manage resume content.
- Generate job-specific customized resumes.
- Compare resume skills against job requirements.
- Improve professional summaries and project descriptions.
- Generate ATS-friendly resume layouts.
- Download customized resumes as PDF.
- Apply for jobs using customized resumes.

**Important:** AI-generated content should preserve factual accuracy and never invent a candidate's qualifications or experience.

---

## 🛠️ Technology Stack

### Frontend

- Next.js
- React.js
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- React Hook Form
- Zod
- Socket.IO Client

### Backend

- Node.js
- Express.js
- TypeScript
- MongoDB
- Mongoose
- Socket.IO
- JWT Authentication

### Tools & Services

- Git & GitHub
- Postman
- VS Code
- Cloudinary / Object Storage for media
- Gemini API for planned AI features

---

## 🏗️ Project Architecture

The project follows a modular full-stack architecture.

```text
BuildSpace/
│
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── store/
│   │   └── types/
│   │
│   └── api/                  # Express backend
│       ├── src/
│       │   ├── config/
│       │   ├── modules/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── utils/
│       │   └── sockets/
│       └── tests/
│
├── packages/
│   └── shared/               # Shared types and schemas
│
├── docs/                     # Documentation
│
├── .github/
│   └── workflows/            # CI/CD workflows
│
├── .gitignore
├── package.json
└── README.md
```

*The directory structure may evolve as development progresses.*

---

## 🔄 How BuildSpace Works

### Creator Workflow

1. Register and create a profile.
2. Upload projects with descriptions and technology stacks.
3. Share GitHub repositories and live demos.
4. Discover and interact with other projects.
5. Connect with recruiters.
6. Explore job opportunities.
7. Customize a resume for a suitable job.
8. Apply and track application progress.

### Recruiter Workflow

1. Register as a recruiter.
2. Create or join a company profile.
3. Explore the project discovery feed.
4. Discover talented creators.
5. Review profiles and project portfolios.
6. Message creators directly.
7. Publish job opportunities.
8. Review applications and manage candidates.

---

## 🔐 Security & Authentication

Planned security practices include:

- Secure password hashing.
- JWT-based authentication.
- HTTP-only refresh-token cookies.
- Role-based authorization.
- Input validation using Zod.
- API rate limiting.
- Secure file uploads.
- Protected API endpoints.
- Environment-based configuration.

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB or MongoDB Atlas
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/BuildSpace.git

cd BuildSpace
```

### 2. Install Dependencies

```bash
npm install
```

If the project uses npm workspaces, install dependencies from the root directory.

### 3. Configure Environment Variables

Create `.env` files using the provided `.env.example` files.

Example backend configuration:

```env
PORT=4000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret

CLIENT_URL=http://localhost:3000
```

Never commit actual secrets or credentials to GitHub.

### 4. Run the Application

Use the scripts defined in the project root `package.json`.

Typical development commands:

```bash
npm run dev
```

If frontend and backend are started separately, use their respective workspace commands.

---

## 📌 Development Roadmap

- [ ] Project architecture and repository setup
- [ ] User authentication and authorization
- [ ] Creator and recruiter profiles
- [ ] Project creation and media uploads
- [ ] Vertical project discovery feed
- [ ] Likes, comments, saves and follows
- [ ] Search and discovery filters
- [ ] Real-time messaging
- [ ] Notifications
- [ ] Company and recruiter management
- [ ] Job posting and applications
- [ ] Hiring pipeline
- [ ] Resume upload and parsing
- [ ] AI-powered resume customization
- [ ] Job-specific resume generation
- [ ] Testing and quality assurance
- [ ] Production deployment

---

## 🎯 What Makes BuildSpace Different?

Traditional hiring platforms often begin with a resume.

BuildSpace begins with the work.

| Traditional Job Platforms   | BuildSpace                        |
| --------------------------- | --------------------------------- |
| Resume-first discovery      | Project-first discovery           |
| Static candidate profiles   | Interactive project portfolios    |
| Job-focused experience      | Project and opportunity discovery |
| Limited project context     | Direct project-context messaging  |
| Separate resume preparation | Planned AI Career Studio          |

Our goal is not simply to create another job portal. It is to build an ecosystem where skills, projects, people, and opportunities come together.

---

## 🚀 Future Possibilities

- AI-powered project recommendations.
- AI-assisted job matching.
- GitHub profile and repository integration.
- Advanced recruiter analytics.
- Developer collaboration spaces.
- Personalized career recommendations.
- Interview preparation tools.
- Resume performance insights.

---

## 🤝 Contributing

Contributions, ideas, and suggestions are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

## 👨‍💻 Author

**Aritra Das**

B.Tech Computer Science & Engineering

Interested in Full Stack Development, React.js, Next.js, Node.js, and AI-powered applications.

- GitHub: [Aritra1523](https://github.com/Aritra1523)
- LinkedIn: [Add your LinkedIn profile URL](https://www.linkedin.com/)

---

## 📄 License

This project is currently under development. Add a license file before distributing or reusing the project.

---

\<p align="center">
&#x20; \<b>BuildSpace — Build Something. Show Your Skills. Discover Opportunities.\</b>
\</p>
