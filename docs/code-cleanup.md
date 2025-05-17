# Code Cleanup Best Practices

This document outlines strategies for maintaining clean code in the Roll2Bowl application.

## Identifying Unused Code

### Unused Variables and Imports

Run the following command to identify unused variables and imports:

```
npm run find-unused
```

This will scan the entire codebase and generate a report of all unused variables.

### Common Patterns to Look For

1. **Unused imports**:
   ```jsx
   // REMOVE these if not used in the component
   import Button from '@mui/material/Button';
   import { useAuth } from '../context/AuthContext';
   ```

2. **Unused state variables**:
   ```jsx
   // REMOVE these if they're declared but never used
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);
   ```

3. **Imported components that no longer exist**:
   ```jsx
   // REMOVE if the component has been deleted
   import DeletedComponent from '../components/DeletedComponent';
   ```

## React-Specific Cleanup

### Unused State Variables

State variables that aren't used in the component or its effects should be removed:

```jsx
// BAD: Unused state
const [unused, setUnused] = useState(null);

// GOOD: Only declare state you need
const [activeItem, setActiveItem] = useState(null);
```

### Cleaning Up Context Destructuring

Only destructure the context values you actually use:

```jsx
// BAD: Destructuring values you don't use
const { user, isAuthenticated, token, refreshToken, login, logout } = useAuth();

// GOOD: Only destructure what you need
const { user, isAuthenticated, logout } = useAuth();
```

### Properly Managing Error States

Ensure error states are properly displayed to users or removed if not needed:

```jsx
// BAD: Error state with no UI representation
const [error, setError] = useState(null);

// GOOD: Error state that's actually displayed
const [error, setError] = useState(null);
// ...later in the component
{error && <Alert severity="error">{error}</Alert>}
```

## Automated ESLint Rules

The project uses ESLint with the following important rules:

- `no-unused-vars`: Warns about variables that are declared but not used
- `react-hooks/rules-of-hooks`: Enforces Rules of Hooks
- `react-hooks/exhaustive-deps`: Warns about missing dependencies in useEffect

To run a full lint check:

```
npm run lint
```

## When Deleting Components

When you remove a component, make sure to:

1. Remove all imports of that component from other files
2. Update any components that might render the deleted component
3. Clean up references in context providers or other global state

## Performance Benefits

Removing unused code:
- Reduces bundle size
- Improves initial load time
- Makes the codebase easier to understand
- Reduces potential for bugs
- Simplifies maintenance 