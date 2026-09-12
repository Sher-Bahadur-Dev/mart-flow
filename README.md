# mart flow

## Overview

mart flow is a dashboard application with pages for (app) cash management, (app) categories, (app) customers, (app) dashboard, (app) employees using AppLayout, CashPage, CategoriesPage, CustomersPage.

mart flow is a dashboard application with pages for (app) cash management, (app) categories, (app) customers, (app) dashboard, (app) employees using AppLayou...

## What the code does

- **Routes found in source:** /(app)/cash-management, /(app)/categories, /(app)/customers, /(app)/dashboard, /(app)/employees, /(app)/expenses, /(app)/grocery, /(app)/inventory, /(app)/notifications, /(app)/pos
- **Components / views:** AppLayout, CashPage, CategoriesPage, CustomersPage, DashboardPage, EmployeesPage, ExpensesPage, GroceryPage, InventoryPage, NotificationsPage
- **Source files inspected:** README.md, src/app/(app)/layout.tsx, src/app/(app)/cash-management/page.tsx, src/app/(app)/categories/page.tsx, src/app/(app)/customers/page.tsx, src/app/(app)/dashboard/page.tsx, src/app/(app)/employees/page.tsx, src/app/(app)/expenses/page.tsx

## Features

- **Dashboard / admin views**: Found dashboard or admin views in source files
- **Multi-page navigation**: Routes found in code: /(app)/cash-management, /(app)/categories, /(app)/customers, /(app)/dashboard, /(app)/employees, /(app)/expenses
- **Authentication & Session Management**: Detected auth dependencies / route handlers
- **Database Integration & Persistence**: Integrated with Firebase
- **Responsive Interface & Theming**: Modern utility CSS with responsive breakpoints
- **Interactive Data Dashboard**: Dashboard views and data visualization

## Tech Stack

- **Frameworks & Core**: Next.js, React
- **Languages**: TypeScript
- **Styling**: Tailwind CSS
- **Database / Storage**: Firebase

## Project Structure

```text
src/                 # Main source code containing core business logic and modules.
app/                 # Next.js App Router or primary application layout.
public/              # Static assets including images, icons, and fonts.
package.json         # Node.js dependency manifest and run scripts.
README.md            # Project documentation and getting started guide.
```

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm, yarn, or pnpm package manager

### Installation

```bash
# Clone the repository
git clone https://github.com/Sher-Bahadur-Dev/mart-flow-appcash-management.git

# Navigate into the project folder
cd mart-flow-appcash-management

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_next_public_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_next_public_firebase_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_next_public_firebase_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_next_public_firebase_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_next_public_firebase_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_next_public_firebase_app_id_here
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_next_public_firebase_measurement_id_here
```

### Running the Project

```bash
npm run dev
```

## License

This project is open source and available under standard GitHub terms.
