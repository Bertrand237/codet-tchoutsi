# CODET Design Guidelines

## Design Approach

**Selected Framework:** Hybrid Approach - Material Design System foundation with inspiration from Linear and Notion for organizational aesthetics

**Justification:** CODET is a professional organizational tool requiring clear information hierarchy, efficient workflows, and trustworthy visual treatment. Material Design provides robust patterns for data-heavy interfaces, while Linear's refined minimalism and Notion's approachable structure inform our creative direction.

**Key Design Principles:**
- Professional yet approachable for community engagement
- Clear visual hierarchy for quick information scanning
- Trustworthy and stable interface for organizational use
- Efficient workflows with minimal friction
- Community-focused warmth balanced with administrative clarity

---

## Typography System

**Primary Font:** Inter (Google Fonts) - excellent readability, professional appearance
**Secondary Font:** Source Sans Pro (Google Fonts) - complementary for body text

**Hierarchy:**
- H1 (Page Titles): Inter, 2.5rem (40px), font-semibold (600), tracking-tight
- H2 (Section Headers): Inter, 2rem (32px), font-semibold (600)
- H3 (Card Titles): Inter, 1.5rem (24px), font-medium (500)
- H4 (Subsections): Inter, 1.25rem (20px), font-medium (500)
- Body Large: Source Sans Pro, 1.125rem (18px), font-normal (400), line-height relaxed
- Body Regular: Source Sans Pro, 1rem (16px), font-normal (400), line-height normal
- Body Small: Source Sans Pro, 0.875rem (14px), font-normal (400)
- Caption/Labels: Inter, 0.75rem (12px), font-medium (500), uppercase tracking-wide
- Button Text: Inter, 1rem (16px), font-medium (500)

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (elements within components): 2, 4
- Component internal padding: 4, 6, 8
- Component margins and gaps: 8, 12, 16
- Section spacing: 16, 20, 24
- Major layout divisions: 24

**Container Strategy:**
- Full-width app shell: w-full
- Content containers: max-w-7xl mx-auto
- Dashboard cards: max-w-6xl
- Forms and detail views: max-w-2xl
- Reading content: max-w-prose

**Grid Patterns:**
- Project cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Dashboard stats: grid-cols-2 md:grid-cols-4 gap-4
- Member list: grid-cols-1 lg:grid-cols-2 gap-6
- Settings panels: single column max-w-2xl

---

## Component Library

### Navigation
**Top Navigation Bar:**
- Height: h-16
- Padding: px-6
- Logo/Title on left (Inter, text-xl, font-semibold)
- Primary navigation links in center (hidden on mobile, visible md:flex)
- User profile dropdown on right with avatar, name, and role badge
- Mobile hamburger menu (visible on mobile only)

**Sidebar Navigation (Dashboard):**
- Width: w-64 (collapsed: w-16)
- Padding: p-4
- Section headers (uppercase, tracking-wide, text-xs)
- Navigation items with icons from Heroicons, text-sm, padding p-3, rounded-lg
- Active state indicator (left border accent)
- Collapsible on tablet/mobile

### Cards & Containers
**Project Card:**
- Rounded: rounded-xl
- Shadow: shadow-md with subtle border
- Padding: p-6
- Header with project title (H3), status badge, and action menu
- Description text (body regular, 3 lines max)
- Metadata row (date, members count, progress indicator)
- Footer with assigned members avatars (overlapping, max 5 visible)

**Statistics Card:**
- Rounded: rounded-lg
- Padding: p-6
- Icon container (48x48, rounded-lg) with Heroicon
- Large number display (text-3xl, font-bold)
- Label (text-sm)
- Trend indicator (percentage change with arrow)

**Member Card:**
- Rounded: rounded-lg
- Padding: p-4
- Avatar (64x64, rounded-full) with online indicator dot
- Name (font-medium), role badge, join date
- Contact actions (email, message icons)

### Forms & Inputs
**Text Input:**
- Height: h-12
- Padding: px-4
- Rounded: rounded-lg
- Border: border-2
- Label above (text-sm, font-medium, mb-2)
- Placeholder text (subtle)
- Focus state with ring

**Select/Dropdown:**
- Height: h-12
- Padding: px-4
- Chevron icon on right
- Same styling as text input

**File Upload (Firebase Storage):**
- Dashed border container
- Drag-and-drop zone with upload icon
- File list below with progress bars
- Thumbnail previews for images

**Button Hierarchy:**
- Primary: h-12, px-6, rounded-lg, font-medium, with Heroicon (optional)
- Secondary: h-12, px-6, rounded-lg, border-2, font-medium
- Tertiary/Ghost: h-10, px-4, font-medium, no background
- Icon-only: 40x40, rounded-lg, icon centered

### Data Display
**Table (Members, Projects List):**
- Header row: sticky top, padding py-4 px-6, border-b-2
- Data rows: padding py-4 px-6, border-b, hover state
- Column headers (text-xs, uppercase, tracking-wide, font-semibold)
- Sortable columns with chevron icons
- Action column on right with menu dots

**Timeline (Project Activity):**
- Vertical line connector on left
- Activity items with icon circles connected to line
- Timestamp (text-sm)
- Activity description with user mention
- Padding between items: 6

**Status Badges:**
- Height: h-6
- Padding: px-3
- Rounded: rounded-full
- Font: text-xs, font-medium, uppercase
- Different treatments per status (not color-specific)

### Modals & Overlays
**Modal Dialog:**
- Max width: max-w-2xl
- Rounded: rounded-xl
- Padding: p-6
- Header with title (H3) and close button
- Content area with appropriate spacing
- Footer with action buttons (right-aligned)
- Backdrop with blur effect

**Toast Notifications:**
- Position: fixed top-4 right-4
- Width: w-96
- Padding: p-4
- Rounded: rounded-lg
- Icon on left, message, close button on right
- Auto-dismiss after 5 seconds
- Stack vertically with gap-2

---

## Images

**Hero Image (Landing/Login Page):**
- Full-width hero section (h-screen or min-h-[600px])
- Large background image showing community/development work (people collaborating, community projects, African village development scenes)
- Overlay gradient for text readability
- Centered content with:
  - CODET logo/title (text-5xl, font-bold)
  - Tagline (text-xl)
  - Primary CTA button (with blurred background backdrop-blur-sm)
  - Secondary button
- Image should convey: community, development, collaboration, progress, African context

**Dashboard Placeholder Images:**
- Empty state illustrations (no projects, no members yet)
- Welcome banner image (community gathering, celebration)
- Profile avatars (use Heroicons user-circle for defaults)

**Project/Activity Images:**
- Project thumbnail images in cards (aspect-ratio-video, rounded-lg)
- Gallery view for project documentation (grid layout)
- Member profile photos (rounded-full, various sizes: 32, 48, 64px)

**General Image Treatment:**
- Rounded corners: rounded-lg for rectangles, rounded-xl for larger images
- Aspect ratios: 16:9 for project images, 1:1 for avatars
- Lazy loading for performance
- Fallback icons when images unavailable

---

## Special Components

**Activity Feed:**
- Chronological list with infinite scroll
- Each item: avatar, action text, timestamp, preview
- Grouped by date (sticky date headers)
- Real-time updates indicator

**Progress Indicators:**
- Linear progress bars (h-2, rounded-full) for project completion
- Circular progress for statistics
- Step indicators for multi-step forms

**Empty States:**
- Centered content (max-w-md mx-auto)
- Illustration or icon (96x96)
- Heading (text-xl, font-medium)
- Description (text-sm)
- Primary action button