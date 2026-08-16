# Webhook Configuration - Quick Reference

## 🎯 What You Need to Do

1. Install ngrok
2. Start ngrok tunnel to port 5000
3. Configure webhook in Clerk Dashboard
4. Add webhook secret to .env
5. Restart backend
6. Test

---

## 📋 EXACT VALUES

### Webhook Route
```
POST /api/user/webhooks
```

### Environment Variable Name
```
CLERK_WEBHOOK_SECRET
```

### Events to Subscribe
```
✅ user.created
✅ user.updated
✅ user.deleted
```

---

## 📥 Installation

### ngrok Download
https://ngrok.com/download

### Extract & Run
```bash
# Windows PowerShell/CMD
ngrok.exe http 5000
```

### Output to Expect
```
Forwarding  https://xxxx-xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:5000
```

**Copy the HTTPS URL**

---

## ⚙️ Clerk Dashboard Configuration

### Navigate To
```
Clerk Dashboard → API & Keys → Webhooks → Add Endpoint
```

### Endpoint URL
```
https://[YOUR-NGROK-URL]/api/user/webhooks
```

### Example
```
https://1a2b-3c4d-5e6f-7g8h.ngrok-free.app/api/user/webhooks
```

### Events
```
☑️ user.created
☑️ user.updated  
☑️ user.deleted
```

### Click "Create"

---

## 🔑 Get Webhook Secret

After creating endpoint, Clerk shows:
```
Signing Secret: whsec_xxxxxxxxxxxx...
```

**Copy this exactly**

---

## 🔧 Update Backend

### Edit: server/.env

Find this line:
```env
CLERK_WEBHOOK_SECRET=whsec_YOUR_CLERK_WEBHOOK_SECRET_HERE
```

Replace with:
```env
CLERK_WEBHOOK_SECRET=whsec_[paste_your_secret]
```

**Example**:
```env
CLERK_WEBHOOK_SECRET=whsec_1234567890abcdefgh_very_long_secret_string
```

---

## 🚀 Restart Backend

Stop the running backend:
```bash
Ctrl+C
```

Restart:
```bash
node server.js
```

Expected output:
```
✅ QuickShow server running on port 5000
🚀 Environment: development
✅ MongoDB Connected: localhost
```

---

## 🧪 Test Webhook

### Create Test User
1. Open http://localhost:5173/sign-up
2. Sign up with any email/password

### Check Backend Logs
Look for:
```
✅ User created: user_xxxxxxxxxxxxx
```

### Verify MongoDB
MongoDB Compass → quickshow → users

Should see new user:
```json
{
  "clerkId": "user_xxxxxxxxxxxxx",
  "name": "test@example.com",
  "email": "test@example.com",
  "image": null,
  "favorites": [],
  "createdAt": "2024-08-16...",
  "updatedAt": "2024-08-16..."
}
```

---

## ✅ Success Indicators

- ✅ ngrok running with HTTPS URL
- ✅ Webhook endpoint created in Clerk
- ✅ Backend restarted
- ✅ Backend logs show "✅ User created"
- ✅ User appears in MongoDB

---

## ❌ If Something Goes Wrong

### "Webhook verification failed"
→ Check `CLERK_WEBHOOK_SECRET` matches Clerk dashboard
→ Restart backend after updating .env

### "Port 5000 already in use"
→ Kill existing process: `taskkill /PID xxxx /F`
→ Check with: `netstat -ano | findstr :5000`

### "User not in MongoDB"
→ Check backend logs for errors
→ Verify ngrok URL matches in Clerk
→ Verify webhook events subscribed

### "ngrok connection refused"
→ Make sure backend is running on port 5000
→ Restart both ngrok and backend

---

## 📱 Status URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:5000 |
| Health | http://localhost:5000/health |
| Webhook (via ngrok) | https://[ngrok-url]/api/user/webhooks |
| Clerk Dashboard | https://dashboard.clerk.com |
| MongoDB (local) | localhost:27017 |

---

## 📚 Documentation Files

- `WEBHOOK_SETUP_GUIDE.md` - Detailed setup steps
- `WEBHOOK_VERIFICATION_REPORT.md` - Technical verification
- `WEBHOOK_QUICK_REFERENCE.md` - This file

---

## 🔄 Webhook Flow

```
1. User signs up at http://localhost:5173/sign-up
        ↓
2. Clerk receives signup
        ↓
3. Clerk sends webhook to https://[ngrok-url]/api/user/webhooks
        ↓
4. ngrok forwards to http://localhost:5000/api/user/webhooks
        ↓
5. Backend receives and verifies signature
        ↓
6. Backend creates user in MongoDB
        ↓
7. User appears in quickshow.users collection
```

---

## ⏱️ Timing

- ngrok startup: 2-3 seconds
- Webhook delivery: Usually <1 second
- MongoDB sync: Automatic
- Total time to verify: ~10 seconds

---

**Ready?** Start with: https://ngrok.com/download

Then follow: WEBHOOK_SETUP_GUIDE.md
