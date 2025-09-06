# AuraCare - Mental Health & Wellness Platform

## Overview

AuraCare is a comprehensive mental health and wellness web application built with a modern tech stack. The platform focuses on providing personalized mental health support through AI-powered chatbot interactions, mood assessments, counselor booking systems, peer support forums, and gamified wellness activities. The application is designed with cultural sensitivity in mind, incorporating Indian context and peaceful aesthetics to create a calming, stress-free user experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript for type safety and modern development practices
- **Styling**: Tailwind CSS for utility-first styling with custom color schemes focused on calming aesthetics (blues, greens, purples)
- **UI Components**: Shadcn/ui component library providing consistent, accessible design patterns
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth transitions and engaging user interactions
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session management and JWT tokens
- **Real-time Features**: WebSocket support for live forum interactions and notifications

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon for scalable cloud database management
- **Schema Management**: Drizzle Kit for database migrations and schema versioning
- **Session Storage**: PostgreSQL-based session store for user authentication persistence

### Authentication & Authorization
- **Provider**: Replit OIDC authentication system
- **Session Management**: Express-session with PostgreSQL store
- **Security**: bcrypt for password hashing, secure HTTP-only cookies
- **Middleware**: Route protection middleware for authenticated endpoints

### Core Application Features
- **AI Chatbot**: OpenAI API integration for conversational mental health support with sentiment analysis
- **Mood Assessments**: PHQ-9 and GAD-7 standardized questionnaires for depression and anxiety screening
- **Booking System**: Calendar-based counselor appointment scheduling with location services
- **Forum Platform**: Anonymous peer support with real-time messaging capabilities
- **Gamification**: Daily wellness tasks, streak tracking, and virtual pet companion system
- **Resource Hub**: Curated mental health content with multimedia support
- **Interactive Games**: Stress-relief games including breathing exercises and memory challenges
- **Feel-Good Places**: Map-based feature for discovering calming locations

## External Dependencies

### AI & Communication Services
- **OpenAI API**: Powers the AI chatbot for providing coping strategies and mental health support
- **Nodemailer**: Email service for user notifications, welcome messages, and appointment reminders
- **Google Translate API**: Multi-language support for accessibility across different regions

### Maps & Location Services
- **Google Maps API**: Location-based counselor discovery and feel-good places mapping
- **Geolocation**: Browser-based location services for nearby resource recommendations

### Content & Media APIs
- **YouTube API**: Embedded motivational and educational video content
- **Spotify API**: Relaxation audio playlists and calming music integration
- **Quotable.io**: Daily inspirational quotes with cultural relevance

### Development & Deployment
- **Neon Database**: Serverless PostgreSQL hosting for production database
- **Replit Development Environment**: Integrated development and deployment platform
- **Canvas Confetti**: Celebration animations for user achievements and milestones

### UI & UX Libraries
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Lucide React**: Consistent icon library for visual elements
- **React Hook Form**: Form management with validation support
- **Zod**: Runtime type validation for data integrity

The application prioritizes user privacy with encrypted data storage, HTTPS enforcement, and comprehensive consent management. The architecture supports cultural customization, particularly for Indian users, with features like regional language support, culturally relevant content, and familiar design patterns.