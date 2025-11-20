# CODET - Comité de Développement Tchoutsi

## Overview
CODET is a web application designed for the Tchoutsi Development Committee. Its purpose is to centralize and streamline administrative, financial, project management, and communication tasks. The platform aims to enhance community engagement and operational efficiency through a robust, scalable, and secure system built on Appwrite. This project seeks to empower the committee with advanced tools for better governance and community development.

## User Preferences
I want iterative development. Ask before making major changes. I prefer detailed explanations for complex logic.

## System Architecture
The application features a React + TypeScript frontend using Wouter for routing. The UI is constructed with Shadcn UI and Tailwind CSS, adhering to a custom green theme (`#0A7D33`) and offering dark mode support. TanStack Query manages state and data caching.

**Backend**: Appwrite Cloud (https://fra.cloud.appwrite.io/v1) is used for authentication, database, and storage.
- Project ID: `68fceae4001cf61101d4`
- Database ID: `codet-db`

**Key Features**:
-   **Authentication**: Appwrite Auth with role-based access control (admin, président, secretaire, trésorier, commissaire, celcom, membre, visiteur). First registered user becomes 'admin'.
-   **Dashboard**: Provides real-time statistics and interactive graphs (Recharts).
-   **Data Management**:
    -   **Payments**: Recording, proof uploads (Appwrite Storage), validation, PDF/CSV exports. Includes a `paymentDate` distinct from `createdAt`.
    -   **Family Census**: Management of family information.
    -   **Projects**: Creation, tracking (status, budget, progress), responsible assignment, PDF/CSV exports. Projects can include `documentPDFUrl` and `preuveImages`.
    -   **Members**: User administration, role modification, detailed views, CSV export. New user fields include `gender`, `phoneNumber`, `sousComite`, `pays`, `ville`.
    -   **Budget**: Transaction recording (revenues/expenses), balance calculation, financial statistics, PDF/CSV exports.
    -   **Events Calendar**: Event creation, multiple views (`react-big-calendar`), French localization, CSV export.
    -   **Voting/Polls**: Admin/president-created polls with real-time results.
-   **Communication**: Real-time group chat via Appwrite subscriptions.
-   **Content Management**:
    -   **Public Blog**: Article management (draft/published) with image uploads.
    -   **Video Advertisements**: Upload and management of promotional videos with upload progress and download functionality.
-   **User Profile Page**: Allows users to view and edit `displayName` and `profile photo`, with role-based privilege descriptions.
-   **Registration**: Enhanced with optional `profession` field, and support for phone-only registration (`phoneNumber` is mandatory for new users, `email` is optional).

**Appwrite Collections** (11 total): `users`, `projects`, `payments`, `budget`, `events`, `polls`, `votes`, `families`, `messages`, `blog-posts`, `ads`.
**Appwrite Storage**: A single bucket `payment-proofs` with virtual folders for `payments/`, `blog/`, `ads/`, and `profiles/`.
**Security Rules**: Role-based access control implemented across database and storage.
**Technical Implementations**:
-   A Firebase compatibility layer (`client/src/lib/firebase-compat.ts`) provides a Firebase-like API wrapping Appwrite calls.
-   Phone number normalization utility (`phoneUtils.ts`) for consistent handling across registration and login.
-   Automated Appwrite project initialization script (`scripts/init-appwrite.ts`).

## External Dependencies
-   **Appwrite**: Authentication, Database, Storage, Real-time services.
-   **React**: Frontend library.
-   **TypeScript**: Programming language.
-   **Wouter**: Client-side routing.
-   **Shadcn UI**: UI component library.
-   **Tailwind CSS**: Utility-first CSS framework.
-   **TanStack Query**: Data fetching, caching, and state management.
-   **Recharts**: Charting library for data visualization.
-   **react-big-calendar**: Calendar component.
-   **jspdf**, **jspdf-autotable**: Libraries for generating PDF reports.