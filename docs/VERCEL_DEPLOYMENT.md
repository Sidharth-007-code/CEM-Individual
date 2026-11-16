# Vercel Deployment Guide - Campus Marketplace

This project is built with **Next.js 14 (App Router)** and is fully optimized for **Vercel** with zero extra configuration.

---

## ⚡ Pre-Flight Verification (Already Verified)

- **Production Build**: Verified locally with `next build` (21 static & dynamic routes compiled successfully).
- **TypeScript**: 0 errors (`npx tsc --noEmit`).
- **ESLint**: 0 warnings, 0 errors.
- **Git Repository**: Synced and pushed to GitHub (`main` branch).

---

## 🚀 Option 1: One-Click Deploy via Vercel Dashboard (Recommended)

This is the easiest method and enables automatic CI/CD deployments whenever you push to GitHub.

### Step 1: Import Project on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in (preferably with your GitHub account).
2. On your Vercel Dashboard, click **"Add New..."** &rarr; **"Project"**.
3. Under **"Import Git Repository"**, find:
   ```
   shreyasadiga82/campus_e_marketplace
   ```
4. Click **"Import"**.

### Step 2: Configure Project Settings
- **Project Name**: `campus-marketplace` (or your choice).
- **Framework Preset**: `Next.js` (automatically detected).
- **Root Directory**: `./` (leave default).
- **Build Command**: `next build` (leave default).
- **Output Directory**: `.next` (leave default).

---

### Step 3: Add Environment Variables
Expand the **"Environment Variables"** section and add the following keys from your `.env.local`:

| Variable Name | Required | Example / Recommended Value | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | `AIzaSy...` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | `campus-marketplace-46e4d.firebaseapp.com` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | `campus-marketplace-46e4d` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | `campus-marketplace-46e4d.appspot.com` | Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | `123456789012` | Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | `1:123456789012:web:...` | Web App ID |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | ✅ | `false` | **MUST BE `false`** in production |
| `ALLOWED_EMAIL_DOMAIN` | ✅ | `msruas.ac.in` | University Email Domain |
| `OTP_HMAC_SECRET` | ✅ | *(A secure 64-char string)* | Salt secret for hashing OTP codes |
| `OTP_DEV_ECHO` | ✅ | `false` | Disable console OTP printing in prod |
| `SMTP_HOST` | ✅ | `smtp.gmail.com` | SMTP Server (Gmail) |
| `SMTP_PORT` | ✅ | `465` | SMTP Port |
| `SMTP_USER` | ✅ | `your-university-bot@gmail.com` | Gmail address sending OTPs |
| `SMTP_PASS` | ✅ | `xxxx xxxx xxxx xxxx` | 16-character Google App Password |
| `MAIL_FROM_NAME` | ✅ | `MSRUAS Campus Marketplace` | Sender display name |
| `FIREBASE_PROJECT_ID` | ✅ | `campus-marketplace-46e4d` | Firebase Admin Project ID |
| `FIREBASE_CLIENT_EMAIL` | ✅ | `firebase-adminsdk-...@...iam.gserviceaccount.com` | Service Account Email |
| `FIREBASE_PRIVATE_KEY` | ✅ | `-----BEGIN PRIVATE KEY-----\n...` | Service Account Private Key |

> [!IMPORTANT]
> **Firebase Private Key Formatting**:  
> In Vercel, you can paste the entire private key including the quotes and `\n` characters. The code in `lib/firebaseAdmin.ts` automatically executes `.replace(/\\n/g, '\n')` to ensure proper RSA parsing.

### Step 4: Click "Deploy"
Click **"Deploy"**. Vercel will install dependencies, build the Next.js production bundle, and provide a live production URL (e.g., `https://campus-marketplace-xxx.vercel.app`).

---

## 💻 Option 2: Deploy from Terminal (Vercel CLI)

If you prefer deploying directly from your computer terminal:

```bash
# 1. Login to Vercel
npx vercel login

# 2. Link & Deploy (Preview)
npx vercel

# 3. Add environment variables
npx vercel env add NEXT_PUBLIC_USE_FIREBASE_EMULATOR production
# (Enter value: false)

# 4. Deploy directly to Production
npx vercel --prod
```

---

## 🔒 Crucial Post-Deployment Step: Authorize Vercel Domain in Firebase

After Vercel assigns your live domain (e.g. `campus-marketplace.vercel.app`):

1. Go to the [Firebase Console](https://console.firebase.google.com).
2. Select your project &rarr; **Authentication** &rarr; **Settings** tab.
3. Scroll down to **"Authorized domains"**.
4. Click **"Add domain"** and enter your Vercel URL:
   - Example: `campus-marketplace-xxx.vercel.app`
5. Click **Done**.

Without this step, Firebase Authentication will reject login and sign-up requests from your Vercel URL!
