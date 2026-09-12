# Mart Flow

## Overview

**mart-flow** is a full stack application built using **Next.js and React and TypeScript**.

## Features

- **Authentication & Session Management**: Detected auth dependencies / route handlers.
- **Database Integration & Persistence**: Integrated with Firebase.
- **Responsive Interface & Theming**: Modern utility CSS with responsive breakpoints.
- **Interactive Data Dashboard**: Dashboard views and data visualization.

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
git clone https://github.com/Sher-Bahadur-417/mart-flow.git

# Navigate into the project folder
cd mart-flow

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

## Screenshots

> *Add screenshots or a GIF demonstration here.*

<!-- ![App Screenshot](path/to/screenshot.png) -->

## License

This project is open source and available under standard GitHub terms.
