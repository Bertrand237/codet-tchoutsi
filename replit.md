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

Key features include:
- **Authentication**: Appwrite Auth with role-based access control (admin, président, secretaire, trésorier, commissaire, celcom, membre, visiteur).
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
    - **Long-form Blog Videos**: YouTube-style video space with administrator upload, publication, editing and deletion.
    - **Video Advertisements**: Upload and management of promotional videos.
    - **Advertisement Playback**: Active advertisements play in order and advance only after the current video ends.

**Appwrite Collections** (12 total):
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
12. `blog-videos` - Long-form blog videos

**Appwrite Storage**:
- Single bucket: `payment-proofs` (free tier limitation: 1 bucket)
- Virtual folders for organization:
  - `payments/` - Payment proof documents
  - `blog/` - Blog post images
  - `ads/` - Advertisement videos
  - `blog-videos/` - Long-form blog videos
  - `profiles/` - Profile pictures

**Security Rules**: Comprehensive database and storage permissions are implemented with role-based access control.

**Registration**: The registration form uses the Tchoutsi directory autocomplete. A selected directory member receives a generated account with the temporary password `123456`, is required to choose a personal password on first connection, and can subsequently sign in with their full name or email.

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
- `scripts/ensure-directory-and-blog-videos.ts` - Non-destructive upgrade for directory account fields and long-form video collection
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
  - ✅ **Bug Fixes & Schema Corrections** (2025-10-25):
    - Fixed infinite render loop in AppSidebar using useMemo and null checks
    - Fixed authentication flow to create session BEFORE profile creation
    - Corrected all Appwrite attribute naming (status vs statut, videoUrl vs videoURL, isActive vs active)
    - Fixed all updateDoc/deleteDoc calls to use proper {collectionId, id} format across 8 pages
    - Added missing Appwrite attributes via migration scripts:
      * payments: added `status` (optional)
      * projects: added `status`, `priority`, `budget`, `progress` (all optional)
      * blog-posts: added `isPublished`, `excerpt`, `authorId`, `authorName`, `publishedAt`, `updatedAt` (all optional)
      * ads: added `isActive` (optional)
    - Fixed query field mismatches:
      * PaymentsPage: corrected queries to use `createdAt` and `userId` instead of `date` and `membreId`
      * BlogPage: updated to use `isPublished` instead of `published`, `imageUrl` instead of `imageURL`
    - Created diagnostic/migration scripts: `check-attributes.ts`, `add-missing-attributes.ts`, `add-boolean-attributes.ts`, `fix-blog-schema.ts`
  - ✅ Application successfully compiles and runs without errors
  - ✅ All schema-code mismatches resolved and verified by architect review
  - ✅ **Additional Fixes** (2025-10-25):
    - Fixed ChatPage: added missing `orderBy` import
    - Fixed PaymentsPage: re-added `userName` attribute to schema and persist user name with payments
    - Fixed CalendarPage: 
      * Added missing attributes to events schema (type, organisateurNom, participantsIds)
      * Corrected all field names (dateDebut/dateFin → startDate/endDate, titre → title, lieu → location, organisateurId → createdBy)
      * Properly persist and hydrate all event fields including type with JSON serialization for arrays
    - Fixed CensusPage: 
      * Fixed query filter to use `createdBy` instead of `membreId`
      * Corrected all field names (membreId/membreNom/adresse/telephone/membres → familyName/headOfFamily/address/phone/members)
      * Implemented JSON serialization for members array
    - Created migration scripts: `fix-events-schema.ts`, `add-username-to-payments.ts`
  - ✅ **Final Schema Alignment & Compatibility** (2025-10-25):
    - Updated TypeScript schemas in `shared/schema.ts` to match Appwrite collections exactly:
      * Message: userId, userName, text (aligned with Appwrite collection)
      * BlogPost: isPublished, imageUrl (instead of published, imageURL)
      * Advertisement: isActive, videoUrl (instead of active, videoURL)
    - Added comprehensive compatibility fallbacks in all pages:
      * ChatPage: `userId || senderId`, `userName || senderName`, `text || content`
      * BlogPage: `imageUrl || imageURL`, `isPublished || published`
      * AdsPage: `videoUrl || videoURL`, `isActive || active`
    - All new data writes use canonical Appwrite field names (userId, userName, text, isPublished, imageUrl, isActive, videoUrl)
    - Fallbacks ensure backward compatibility with any legacy data that might exist with old field names
    - ✅ Application fully functional with zero LSP errors and no console errors
    - ✅ Architect confirmed all schemas and compatibility fallbacks are correct
  - ✅ **New Features** (2025-10-25):
    - **Video Upload Progress Bar in AdsPage**:
      * Implemented `uploadBytesResumable` in firebase-compat.ts with simulated real-time progress tracking
      * Added visual Progress component showing upload percentage (0-100%)
      * Progress displayed in both progress bar and button text ("Téléchargement... X%")
      * Proper error handling with progress interval cleanup to prevent memory leaks
      * Try/catch in completion callback ensures UI recovery from downstream errors
    - **User Profile Page**:
      * Created `/profile` route accessible to all authenticated users
      * View mode displays: displayName, email, role, account creation date, profile photo
      * Edit mode allows updating: displayName and profile photo (photoURL)
      * Profile photo upload with real-time progress bar
      * Role-based privilege descriptions for all 6 user roles
      * Integrated in sidebar footer with clickable avatar/name link
      * Uses Appwrite Storage for profile picture uploads
      * Auto-reload after successful profile update to reflect changes

- **Date**: 2025-10-27
- **New Features & Role Expansion**:
  - ✅ **Video Download Functionality (AdsPage)**:
    - Added download button for all video advertisements
    - Accessible to all authenticated users (not just admins)
    - Downloads use Appwrite Storage download URL
  - ✅ **Payment Date Field (PaymentsPage)**:
    - Added separate "paymentDate" field to specify actual payment date
    - Distinct from "createdAt" (submission timestamp)
    - Users can now record when payment was actually made vs when it was submitted
    - Updated schema and UI with date picker
  - ✅ **Profession Field in Registration**:
    - Added optional "profession" field to user registration form
    - Captured during signup and stored in user profile
    - Updated schema, RegisterPage form, and AuthContext signUp function
  - ✅ **Role System Expansion (6→8 roles)**:
    - Added "secretaire" (secrétaire général) role:
      * Identical privileges to président across all pages
      * Can validate/delete payments
      * Can manage blog and advertisements
      * Can create polls and manage projects
      * Updated PaymentsPage, BlogPage, AdsPage, VotesPage, MembersPage, BudgetPage, ProjectsPage, CalendarPage
    - Added "celcom" (chargé de communication) role:
      * Specialized for communication management
      * Full access to blog creation/editing/deletion
      * Full access to video advertisement management
      * Can publish and manage content
    - Updated ProfilePage to display role colors and privileges for both new roles
    - All role permission checks updated consistently across 9 pages
  - ✅ **Bug Fix**: Fixed missing président/secretaire in payment validation/deletion permissions
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
