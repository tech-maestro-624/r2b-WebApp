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
