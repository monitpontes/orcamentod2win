

## Problem

The login is working at the backend level (auth logs confirm successful logins), but the Auth page doesn't redirect the user to the main page after authentication. The `/auth` route renders the Auth component unconditionally — it never checks if the user is already logged in.

## Solution

Two small changes:

### 1. Auth page: redirect authenticated users (src/pages/Auth.tsx)

Add `useAuth()` hook and `Navigate` from react-router-dom. If user exists and auth is not loading, redirect to `/`:

```tsx
const { user, loading } = useAuth();
if (loading) return <loading spinner>;
if (user) return <Navigate to="/" replace />;
```

### 2. Auth context: fix potential race condition (src/contexts/AuthContext.tsx)

Ensure `onAuthStateChange` is set up BEFORE `getSession()` is called (already correct in current code), and that loading state is only set to false after the initial session check completes. The current implementation sets loading=false in both the listener and getSession — this is fine but could cause a brief flicker. No change needed here.

## Files to modify

- **src/pages/Auth.tsx** — Import `useAuth` and `Navigate`, add redirect logic at the top of the component

This is a one-file, ~5-line fix.

