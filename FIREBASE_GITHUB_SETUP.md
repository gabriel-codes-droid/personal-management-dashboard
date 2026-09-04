# Firebase GitHub Integration Setup

To set up automatic Firebase deployments from GitHub:

## Step 1: Connect GitHub Repository to Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `personal-management-dash-9b45a`
3. Navigate to: **Build** → **Hosting**
4. Click **"Connect to GitHub"** button
5. Authorize Firebase to access your GitHub account
6. Select the repository: `PersonaL-Management-Dashboard frontend`
7. Configure build settings:
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Node version**: `20`

## Step 2: Configure GitHub Secrets

Add these secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

- `FIREBASE_TOKEN`: Your Firebase CLI token (get with `firebase login:ci`)
- `RESEND_API_KEY`: Your Resend API key for email sending
- `EMAIL_FROM`: Your sender email address (e.g., `onboarding@resend.dev`)

## Step 3: Set Up Automatic Deployments

After connecting GitHub, Firebase will:
1. Automatically deploy when you push to `main` branch
2. Run the CI/CD workflow in `.github/workflows/ci.yml`
3. Deploy: Hosting, Firestore rules, Firestore indexes, and Cloud Functions

## Alternative: Manual Firebase CLI Deployment

If you prefer manual deployment instead of GitHub integration:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Current Deployment Architecture

The project is now fully Firebase-native:

- **Frontend**: React app deployed to Firebase Hosting
- **Backend**: Firebase Cloud Functions with Admin SDK
- **Database**: Firestore with security rules and indexes
- **Auth**: Firebase Authentication
- **Email**: Resend integration via Cloud Functions
- **CI/CD**: GitHub Actions workflow

## Environment Variables

For local development, create a `.env` file in the functions directory:

```
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=onboarding@resend.dev
```

## Cloud Functions Deployed

- `adminDeleteUser`: Delete users and all their data
- `adminSetRole`: Change user roles (admin/user)
- `adminBanUser`: Ban/unban users
- `adminGetStats`: Platform-wide statistics
- `adminGetUserActivity`: View user activity logs
- `sendDailyDigests`: Scheduled daily email digests (8 AM ET)
- `sendCustomEmail`: Send custom emails (password resets, etc.)
- `getAdvancedAnalytics`: Advanced analytics aggregation
