# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Roll2Bowl Web App

This is a food delivery web application built with React, Material UI, and other modern web technologies.

## Auth Context Update

The authentication system has been optimized by merging `AuthContext` and `AuthModalContext` into a single context for better performance and maintainability.

### Required Changes

Files that import `useAuthModal` from `AuthModalContext` need to be updated as follows:

1. Change import statement:
```javascript
// Old import
import { useAuthModal } from '../context/AuthModalContext';

// New import
import { useAuth } from '../context/AuthContext';
```

2. Update hook usage:
```javascript
// Old usage
const { isAuthenticated, openLoginModal } = useAuthModal();

// New usage
const { isAuthenticated, openLoginModal } = useAuth();
```

All functionality remains the same, but with a simplified API and improved state management.

### Files requiring updates:
- src/pages/RestaurantPage.jsx
- src/pages/TicketManager.jsx
- src/pages/OrdersPage.jsx
- src/components/CartStatusModal.jsx
- src/context/CartContext.jsx
- src/components/SideMenu.jsx
- src/components/Navbar.jsx
- src/components/GlobalAuthModals.jsx

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` to see the application running.

## Setup and Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```

## Development Guidelines

### Code Quality

To identify unused variables and other linting issues, run:
```
npm run lint
```

To specifically find unused variables and imports in the codebase:
```
npm run find-unused
```

This will scan your code and generate a report of all unused variables, organized by file.

This will check your code against the ESLint rules configured in `.eslintrc.json`.

### Removing Unused Code

To keep the codebase clean and efficient:

1. Regularly run the linter to identify unused imports and variables
2. Remove unused state variables from components
3. Update import statements when components are deleted
4. Make sure error states are properly handled or removed if unnecessary

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Page components
- `/src/context` - React context providers
- `/src/services` - API services
- `/src/utils` - Utility functions
