# CODET - Comité de Développement Tchoutsi

## Overview
CODET is a comprehensive web application for managing the Tchoutsi Development Committee. It aims to streamline administrative tasks, enhance communication, and provide robust tools for financial tracking, project management, and community engagement. The application is built on Appwrite (Backend-as-a-Service) for authentication, database, and storage, offering a scalable and secure solution for the committee's operational needs.

## User Preferences
I want iterative development. Ask before making major changes. I prefer detailed explanations for complex logic.

## System Architecture
The application features a React + TypeScript frontend utilizing Wouter for routing. The UI is built with Shadcn UI and Tailwind CSS, following a custom green theme (`#0A7D33`) and supporting dark mode. State management and caching are handled by TanStack Query.

**Backend**: Appwrite Cloud (https://fra.cloud.appwrite.io/v1)
- Project ID: `68fceae4001cf61101d4`
- Database ID: `codet-db`
- Free tier: No credit card required, 75,000 monthly active users, 2GB storage, 10GB bandwidth

Key features include:
- **Authentication**: Appwrite Auth with role-based access control (admin, président, trésorier, commissaire, membre, visiteur).
- **Dashboard**: Real-time statistics, interactive Recharts graphs (pie, line, bar), and quick access to core functionalities.
- **Data Management**:
    - **Payments**: Recording, proof uploads (Appwrite Storage), validation workflow, PDF/CSV exports.
    - **Family Census**: Comprehensive family information and member management.
    - **Projects**: Creation, tracking (status, budget, progress), responsible assignment, PDF/CSV exports.
    - **Members**: User administration, role modification, detailed views, CSV export.
    - **Budget**: Transaction recording (revenues/expenses), automatic balance calculation, financial statistics, PDF/CSV exports.
    - **Events Calendar**: Event creation, multiple views (Month, Week, Day, Agenda) with `react-big-calendar`, French localization, CSV export.
    - **Voting/Polls**: Admin/president-created polls, multiple options, real-time results, secure voting.
- **Communication**: Real-time group chat using Appwrite real-time subscriptions.
- **Content Management**:
    - **Public Blog**: Article management (draft/published), image uploads, visible to all.
    - **Video Advertisements**: Upload and management of promotional videos.

**Appwrite Collections** (11 total):
1. `users` - User profiles with roles
2. `projects` - Project management
3. `payments` - Payment records and validation
4. `budget` - Budget tracking (revenues/expenses)
5. `events` - Calendar events
6. `polls` - Voting polls
7. `votes` - Individual votes
8. `families` - Family census data
9. `messages` - Real-time chat messages
10. `blog-posts` - Blog articles
11. `ads` - Video advertisements

**Appwrite Storage**:
- Single bucket: `payment-proofs` (free tier limitation: 1 bucket)
- Virtual folders for organization:
  - `payments/` - Payment proof documents
  - `blog/` - Blog post images
  - `ads/` - Advertisement videos
  - `profiles/` - Profile pictures

**Security Rules**: Comprehensive database and storage permissions are implemented with role-based access control.

**First User Setup**: The first user to register automatically receives the "admin" role.

## External Dependencies
- **Appwrite**:
    - Authentication (Appwrite Auth)
    - Database (Appwrite Database)
    - Storage (Appwrite Storage)
    - Real-time (Appwrite Real-time)
- **React**: Frontend library
- **TypeScript**: Language
- **Wouter**: Routing library
- **Shadcn UI**: UI component library
- **Tailwind CSS**: Styling framework
- **TanStack Query**: Data fetching and caching
- **Recharts**: Charting library for data visualization
- **react-big-calendar**: Calendar component for event display
- **jspdf**, **jspdf-autotable**: Libraries for generating PDF reports

## Environment Variables
Required secrets in Replit:
- `VITE_APPWRITE_ENDPOINT` - Appwrite API endpoint
- `VITE_APPWRITE_PROJECT_ID` - Appwrite project ID
- `VITE_APPWRITE_DATABASE_ID` - Database ID
- `APPWRITE_API_KEY` - Server-side API key (for initialization script)

## Technical Implementation
**Firebase Compatibility Layer**: Created `client/src/lib/firebase-compat.ts` to provide a Firebase-like API wrapping Appwrite calls, allowing seamless migration of existing code with minimal refactoring.

**Key Files**:
- `client/src/lib/appwrite.ts` - Appwrite client configuration
- `client/src/lib/appwrite-helpers.ts` - Low-level Appwrite database helpers
- `client/src/lib/firebase-compat.ts` - Firebase compatibility wrapper for Appwrite
- `client/src/contexts/AuthContext.tsx` - Authentication context using Appwrite Auth
- `scripts/init-appwrite.ts` - Automated Appwrite project initialization
- `scripts/test-signup.ts` - Registration testing script

## Recent Changes
- **Date**: 2025-10-25
- **Complete Migration from Firebase to Appwrite**:
  - ✅ Removed all Firebase dependencies (firebase, firebase-admin, firebase-functions)
  - ✅ Deleted Firebase configuration files (firebase.json, .firebaserc, storage.rules, functions/)
  - ✅ Created Appwrite project with 11 collections and 1 storage bucket
  - ✅ Implemented Firebase compatibility layer for seamless migration
  - ✅ Migrated authentication system (AuthContext, login, register) to Appwrite
  - ✅ Migrated all 11 pages to use Appwrite via firebase-compat.ts:
    - DashboardPage, PaymentsPage, MembersPage, BudgetPage, ProjectsPage
    - VotesPage, CalendarPage, ChatPage (real-time), BlogPage, AdsPage, CensusPage
  - ✅ Replaced Firebase Storage with Appwrite Storage (single bucket with virtual folders)
  - ✅ Replaced Firestore Timestamps with Appwrite ISO date strings
  - ✅ Application successfully compiles and runs
