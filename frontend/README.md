# FactStack Protocol - Frontend

A modern React-based frontend for the FactStack decentralized fact verification platform built on Stacks blockchain.

## Overview

This frontend application will provide an intuitive interface for users to interact with the FactStack Protocol smart contracts, enabling claim submission, community verification, and truth exploration.

## Planned Features

### Core User Interface
- **Modern React Application**: Built with Vite for optimal development experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Stacks Integration**: Direct blockchain interaction through Stacks.js
- **Wallet Connection**: Seamless integration with Stacks wallets

### User Journeys

#### Claim Submission
- Interactive form for factual claim submission
- Multi-source URL validation and management
- IPFS hash integration for evidence storage
- Real-time fee calculation and STX payment

## Technology Stack

### Frontend Framework
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development for better code quality
- **Vite**: Lightning-fast build tool and development server

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Lucide React**: Beautiful, customizable icon library
- **Responsive Design**: Mobile-first approach with desktop optimization

### Blockchain Integration
- **@stacks/connect**: Wallet connection and user authentication
- **@stacks/transactions**: Transaction construction and signing
- **@stacks/network**: Network configuration and API interactions

## Project Structure

```
frontend/
├── public/
│   └── vite.svg
├── src/
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles with Tailwind
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## Development Phases

### Phase 1: Foundation
- Basic React application structure
- Navigation system and routing
- Stacks-themed UI design system
- Wallet connection framework

### Phase 2: Core Features
- Claim submission form with validation
- Basic claim display and listing
- Status management and indicators

### Phase 3: Interactive Features
- Verification interface with staking
- Real-time updates and feedback
- User statistics and dashboards

## Getting Started

### Prerequisites
- Node.js 16 or higher
- npm or yarn package manager
- Stacks wallet (Hiro Wallet recommended)

### Installation

```bash
# Create Vite React TypeScript project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install dependencies
npm install

# Add Stacks blockchain integration
npm install @stacks/connect @stacks/transactions @stacks/network

# Add UI and styling dependencies
npm install lucide-react
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
npx tailwindcss init -p
```

### Development Setup

```bash
# Start development server
npm run dev

# Open browser to http://localhost:5173
```

## Design System

### Color Palette
- **Primary**: Orange to Purple gradient (Stacks brand colors)
- **Status Colors**: 
  - Green (verified)
  - Yellow (pending)
  - Red (disputed)
  - Gray (rejected)

## Contributing

### Code Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Conventional commit messages
- Component-based architecture

### Development Workflow
1. Create feature branch
2. Implement functionality with TypeScript
3. Add appropriate styling with Tailwind
4. Test locally with Vite dev server
5. Submit pull request with clear description

---

*Building the user interface for decentralized truth verification.*
