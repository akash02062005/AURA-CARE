
<div align="center">

# 🍀 Aura Care

**Your journey to mental wellness begins here.**

A comprehensive full-stack platform dedicated to mental health support, self-care routines, and community engagement.

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-technology-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-contributing">Contributing</a>
</p>

</div>

---

## 🌟 Overview

**Aura Care** is an interactive, modern web application designed to help users navigate their mental health journey. It provides a safe and supportive environment for users to track their well-being, seek professional help, and connect with a community of like-minded individuals.

With a beautiful UI powered by React and Tailwind CSS, and a robust Node.js/Express backend, Aura Care delivers a seamless experience for mindfulness, self-improvement, and therapy scheduling.

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| 🤖 **AI-Powered Chatbot** | Get 24/7 mental health guidance and supportive interactions anytime you need. |
| 📅 **Booking System** | Seamlessly schedule sessions with licensed therapists, psychologists, and counselors. |
| 💬 **Community Forum** | Engage with others, share personal experiences, and find powerful peer support. |
| 🎮 **Wellness Games** | Enjoy interactive activities designed to relieve stress and educate on mental health. |
| 🗺️ **Interactive Map** | Easily locate nearby mental health professionals, clinics, and support groups. |
| ✅ **Task Management** | Track daily mental wellness goals, self-care routines, and habit-building milestones. |
| 📚 **Resource Center** | Access curated articles, informative videos, and guides on various mental health topics. |
| 🔒 **Secure Authentication**| Safe and private user accounts with industry-standard encryption capabilities. |

## 🛠️ Technology Stack

### 🎨 Frontend
- **Framework**: [React.js](https://reactjs.org/) powered by [Vite](https://vitejs.dev/) for lightning-fast builds.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Radix UI](https://www.radix-ui.com/) for beautiful, accessible components.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid, engaging interactions.
- **Data Fetching**: [TanStack Query](https://tanstack.com/query/v3/) for powerful asynchronous state management.
- **Visualizations**: [Recharts](https://recharts.org/) for dynamic health tracking charts.

### ⚙️ Backend
- **Server**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/) for robust API endpoints.
- **Database**: [PostgreSQL](https://www.postgresql.org/) for reliable, relational data storage.
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) for type-safe database interactions.
- **Authentication**: [Passport.js](https://www.passportjs.org/) for secure session management.
- **Real-time**: [Socket.io](https://socket.io/) for live chat and notifications.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

Ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/en/download/) (v20 or higher recommended)
- A running PostgreSQL database instance (or a serverless Postgres provider like Neon)
- [Git](https://git-scm.com/downloads)

### Installation

**1. Clone the repository:**
```bash
git clone https://github.com/akash02062005/AURA-CARE.git
cd AURA-CARE
```

**2. Install dependencies:**
```bash
npm install
```

**3. Configure Environment Variables:**
Create a `.env` file in the root directory by copying `.env.example`:
```bash
cp .env.example .env
```
Update the `.env` file with your specific configurations:
```env
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secret_key
```

**4. Initialize the Database:**
Push the defined schema to your configured database:
```bash
npm run db:push
```

**5. Start the Development Server:**
```bash
npm run dev
```
> The application will be running locally. Open `http://localhost:5000` (or your configured port) in your browser.

## 🤝 Contributing

Contributions make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ for better mental well-being.</p>
</div>
