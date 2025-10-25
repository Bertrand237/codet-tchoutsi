# CODET - Comité de Développement Tchoutsi

## Overview
CODET is a comprehensive web application for managing the Tchoutsi Development Committee. It aims to streamline administrative tasks, enhance communication, and provide robust tools for financial tracking, project management, and community engagement. The application is built entirely on Firebase for authentication, database, and storage, offering a scalable and secure solution for the committee's operational needs.

## User Preferences
I want iterative development. Ask before making major changes. I prefer detailed explanations for complex logic. Do not make changes to the `functions` folder without explicit instruction, as it contains critical Firebase Cloud Functions. Do not modify the core Firebase configuration files (`firebase.json`, `.firebaserc`) without prior approval.

## System Architecture
The application features a React + TypeScript frontend utilizing Wouter for routing. The UI is built with Shadcn UI and Tailwind CSS, following a custom green theme (`#0A7D33`) and supporting dark mode. State management and caching are handled by TanStack Query.

Key features include:
- **Authentication**: Firebase Auth with role-based access control (admin, president, treasurer, commissioner, member, visitor).
- **Dashboard**: Real-time statistics, interactive Recharts graphs (pie, line, bar), and quick access to core functionalities.
- **Data Management**:
    - **Payments**: Recording, proof uploads (Firebase Storage), validation workflow, PDF/CSV exports.
    - **Family Census**: Comprehensive family information and member management.
    - **Projects**: Creation, tracking (status, budget, progress), responsible assignment, PDF/CSV exports.
    - **Members**: User administration, role modification, detailed views, CSV export.
    - **Budget**: Transaction recording (revenues/expenses), automatic balance calculation, financial statistics, PDF/CSV exports.
    - **Events Calendar**: Event creation, multiple views (Month, Week, Day, Agenda) with `react-big-calendar`, French localization, CSV export.
    - **Voting/Polls**: Admin/president-created polls, multiple options, real-time results, secure voting via Cloud Functions.
- **Communication**: Real-time group chat using Firestore listeners.
- **Content Management**:
    - **Public Blog**: Article management (draft/published), image uploads, visible to all.
    - **Video Advertisements**: Upload and management of promotional videos.

**Firebase Cloud Functions**:
- `submitVote`: Atomic vote handling, uniqueness check.
- `onUserCreated`: Automatic user profile creation.
- `onEventCreated`: Event notification triggers.
- `onPaymentValidated`: Payment notification triggers.
- `cleanupExpiredPolls`: Automatic deactivation of expired polls.
- `getStatistics`: Global statistics retrieval.

**Security Rules**: Comprehensive Firestore and Storage rules are implemented, including role-based access and a non-deletion policy for critical data in Firebase Storage (e.g., payment proofs).

## External Dependencies
- **Firebase**:
    - Authentication (Firebase Auth)
    - Database (Firestore)
    - Storage (Firebase Storage)
    - Hosting (Firebase Hosting)
    - Cloud Functions (Firebase Cloud Functions)
- **React**: Frontend library
- **TypeScript**: Language
- **Wouter**: Routing library
- **Shadcn UI**: UI component library
- **Tailwind CSS**: Styling framework
- **TanStack Query**: Data fetching and caching
- **Recharts**: Charting library for data visualization
- **react-big-calendar**: Calendar component for event display
- **jspdf**, **jspdf-autotable**: Libraries for generating PDF reports