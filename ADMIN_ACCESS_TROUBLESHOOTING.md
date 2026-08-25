# Admin Access Troubleshooting Guide

## Problem: Admin routes redirect to home page

This usually happens because:
1. You're not authenticated
2. You don't have an admin token
3. Your user is not marked as admin in MongoDB
4. Backend API is not reachable

---

## Quick Diagnostic Steps

### Step 1: Check if you're signed in

1. Open your app: `http://localhost:5173`
2. Look at top-right corner - are you signed in?
3. If not, click "Sign In" and sign in with your account

### Step 2: Check browser console

1. Open browser console (Press F12)
2. Try to access: `http://localhost:5173/admin/dashboard`
3. Look for logs starting with `[ADMIN ROUTE DEBUG]`

You should see logs like:
```
[ADMIN ROUTE DEBUG] adminToken: None (or Present)
[ADMIN ROUTE DEBUG] isLoaded: true
[ADMIN ROUTE DEBUG] user: Present (or None)
```

### Step 3: Check if backend is running

Open a new browser tab and go to:
```
http://localhost:5000/health
```

You should see:
```json
{
  "success": true,
  "message": "Server is running"
}
```

If you get an error, your backend is not running!

**Fix**: Start backend:
```bash
cd quickshow/server
npm run dev
```

### Step 4: Check if you're admin in MongoDB

Run this command:
```bash
cd quickshow/server
node scripts/list-users.js
```

Look for your account. It should show:
```
[ADMIN] Your Name | your@email.com | clerkId: user_xxx
```

If it shows `[USER ]` instead of `[ADMIN]`, you need to make yourself admin!

**Fix**: Make yourself admin:
```bash
cd quickshow/server
node scripts/set-admin.js <YOUR_CLERK_ID>
```

### Step 5: Test admin check endpoint directly

Open browser console and run:
```javascript
fetch('http://localhost:5000/api/user/check-admin', {
  headers: {
    'Authorization': 'Bearer ' + await window.Clerk.session.getToken()
  }
}).then(r => r.json()).then(console.log)
```

You should see:
```json
{
  "isAdmin": true,
  "userId": "user_xxx"
}
```

If `isAdmin` is `false`, you need to run `set-admin.js`

---

## Common Issues & Solutions

### Issue 1: "Cannot read property 'getToken' of null"
**Cause**: Not signed in via Clerk
**Solution**: Go to home page, sign in, then try `/admin` again

### Issue 2: Infinite redirect loop
**Cause**: Admin token exists but is invalid
**Solution**: Clear localStorage:
```javascript
// In browser console
localStorage.removeItem('adminToken')
location.reload()
```

### Issue 3: "Admin access required" toast keeps appearing
**Cause**: Your user is not marked as admin in MongoDB
**Solution**:
```bash
cd quickshow/server
# First, find your Clerk ID
node scripts/list-users.js
# Then make yourself admin
node scripts/set-admin.js <YOUR_CLERK_ID>
```

### Issue 4: Backend not reachable
**Cause**: Backend server not running or wrong URL
**Solution**:
1. Check `quickshow/client/.env` has:
   ```
   VITE_BACKEND_URL=http://localhost:5000
   ```
2. Start backend:
   ```bash
   cd quickshow/server
   npm run dev
   ```

### Issue 5: 404 on admin routes
**Cause**: React Router not handling routes properly
**Solution**: Refresh the page with Ctrl+F5 (hard refresh)

---

## Step-by-Step Fix (Start from Scratch)

1. **Stop all servers** (Ctrl+C in terminals)

2. **Clear browser data**:
   ```javascript
   // In browser console (F12)
   localStorage.clear()
   sessionStorage.clear()
   ```

3. **Start backend**:
   ```bash
   cd quickshow/server
   npm run dev
   ```
   Wait for: "✅ QuickShow server running on port 5000"

4. **Start frontend**:
   ```bash
   cd quickshow/client
   npm run dev
   ```
   Wait for: "Local: http://localhost:5173"

5. **Sign in as regular user**:
   - Go to `http://localhost:5173`
   - Click "Sign In" (top-right)
   - Sign in with your email/password

6. **Get your Clerk ID**:
   ```bash
   cd quickshow/server
   node scripts/list-users.js
   ```
   Copy your `clerkId` (looks like `user_2abc123...`)

7. **Make yourself admin**:
   ```bash
   node scripts/set-admin.js user_YOUR_CLERK_ID_HERE
   ```
   You should see: "✅ isAdmin set to true"

8. **Go to admin login**:
   - Go to `http://localhost:5173/admin`
   - Sign in with the SAME account
   - You should be redirected to `/admin/dashboard`

---

## Debug Mode

I've added debug logs to help you. When you try to access admin routes:

1. Open browser console (F12)
2. Try to access: `http://localhost:5173/admin/dashboard`
3. Watch the console for debug messages

### What the logs mean:

```
[ADMIN ROUTE DEBUG] adminToken: None
```
→ No admin token in localStorage (you need to sign in via /admin)

```
[ADMIN ROUTE DEBUG] user: None
```
→ Not signed in via Clerk at all

```
[ADMIN ROUTE DEBUG] Response status: 403
```
→ You're signed in but not marked as admin in MongoDB

```
[ADMIN ROUTE DEBUG] Admin verified ✅
```
→ Success! You should see the dashboard

---

## Still Not Working?

Try this diagnostic URL in your browser:
```
http://localhost:5000/api/user/check-admin
```

What do you see?

- **"Unauthorized"**: You're not signed in
- **"isAdmin: false"**: Run `set-admin.js`
- **"isAdmin: true"**: Admin is working, issue is in frontend
- **Cannot connect**: Backend not running

---

## Quick Test Script

Run this in browser console (F12) after signing in:

```javascript
// Test 1: Check if signed in
console.log('Signed in:', window.Clerk?.session ? 'YES' : 'NO');

// Test 2: Check admin token
console.log('Admin token:', localStorage.getItem('adminToken') ? 'YES' : 'NO');

// Test 3: Test backend
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(d => console.log('Backend:', d))
  .catch(e => console.error('Backend OFFLINE'));

// Test 4: Test admin check (if signed in)
if (window.Clerk?.session) {
  window.Clerk.session.getToken().then(token => {
    fetch('http://localhost:5000/api/user/check-admin', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(r => r.json())
    .then(d => console.log('Admin check:', d))
    .catch(e => console.error('Admin check failed:', e));
  });
}
```

Copy all console output and share it if you need more help!
