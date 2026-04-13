🍽️ Restaurant Admin Panel - Style Guide
1. Design Philosophy
The primary goal of this admin panel is efficiency and clarity. Restaurant managers and staff need to view data (orders, inventory, reservations) quickly. The interface should be clean, distraction-free, and utilize ample whitespace.

2. Color Palette
We use a neutral foundation with a single appetizing primary color to draw attention to primary actions.

Primary Action (Appetizing & Energetic): * --color-primary: #E65100; (Burnt Orange)

--color-primary-hover: #BF360C;

Backgrounds & Surfaces (Clean & Spacious):

--color-bg-main: #F4F6F8; (Light grayish-blue for the main app background)

--color-surface: #FFFFFF; (White for cards, tables, and sidebars)

Text & Typography (High Contrast):

--color-text-main: #1C2434; (Dark slate for primary text)

--color-text-muted: #64748B; (Gray for secondary text, placeholders)

Status Colors (For Orders/Tables):

--color-success: #10B981; (Green - Completed/Delivered)

--color-warning: #F59E0B; (Yellow - Pending/Cooking)

--color-danger: #EF4444; (Red - Canceled/Out of Stock)

3. Typography
We will use a modern, highly legible sans-serif font. (Recommend importing Inter or Roboto via Google Fonts).

Font Family: 'Inter', sans-serif

Base Size: 16px (1rem)

Headings:

H1 (Dashboard Titles): 24px, Font Weight: 600

H2 (Section Titles): 20px, Font Weight: 600

H3 (Card Titles): 16px, Font Weight: 600

Body Text: 14px, Font Weight: 400

Small Text (Labels/Dates): 12px, Font Weight: 400

4. Spacing & Layout Structure
We use an 8-point grid system. All margins and paddings should be multiples of 8.

--spacing-xs: 4px;

--spacing-sm: 8px;

--spacing-md: 16px; (Default padding for buttons/inputs)

--spacing-lg: 24px; (Default padding inside cards)

--spacing-xl: 32px; (Spacing between distinct dashboard sections)

Border Radius:

--border-radius-sm: 4px; (Inputs, Buttons)

--border-radius-md: 8px; (Cards, Modals, Images)

5. Component Guidelines
Buttons: Must have no border (border: none;), a slight border-radius, and a clear hover state transition (transition: background-color 0.2s ease;).

Cards/Containers: Use a white background (--color-surface) with a very subtle box-shadow (e.g., box-shadow: 0 1px 3px rgba(0,0,0,0.1);) to separate them from the gray background.

Inputs: Keep them simple with a light gray border. Change border color to --color-primary on :focus.

6. Angular & CSS Coding Conventions
Global vs. Scoped: Put global variables (like the ones above), resets, and typography in src/styles.css. Keep component-specific styling strictly inside the component's own .css/.scss file (e.g., sidebar.component.css).

Naming: Use semantic class names (e.g., .order-card, .status-badge-pending) rather than utility names unless you are using a framework like Tailwind.