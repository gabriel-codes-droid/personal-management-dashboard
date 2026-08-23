# Firebase Migration & Vercel Deployment Guide

## 🚀 Firebase Setup Instructions

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics (optional but recommended)

### 2. Enable Firebase Services
#### Authentication
1. Go to **Build → Authentication**
2. Click "Get Started"
3. Enable **Email/Password** sign-in method
4. Configure email templates (optional)

#### Firestore Database
1. Go to **Build → Firestore Database**
2. Click "Create database"
3. Choose **Start in Test Mode** (for development)
4. Select a location (choose closest to your users)

#### Storage (for profile images)
1. Go to **Build → Storage**
2. Click "Get Started"
3. Configure security rules

### 3. Get Firebase Configuration
1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register the app (name it "PMD Frontend")
5. Copy the firebaseConfig object

### 4. Update Environment Variables
Replace the values in `.env` with your Firebase config:

```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 5. Firestore Security Rules
Go to **Firestore Database → Rules** and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Meals collection
    match /meals/{mealId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Activities collection
    match /activities/{activityId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Savings Goals collection
    match /savingsGoals/{goalId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Analytics collection
    match /analytics/{eventId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 🌐 Vercel Deployment

### 1. Connect to Vercel
1. Go to [Vercel](https://vercel.com)
2. Sign up/login with GitHub
3. Click "Add New Project"

### 2. Import Project
1. Select your GitHub repository
2. Import the frontend folder
3. Configure settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `./PersonaL-Management-Dashboard frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3. Add Environment Variables
In Vercel project settings, add these environment variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

### 4. Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be live at `https://your-project.vercel.app`

## 🔧 Additional Firebase Functions (Optional)

For advanced features like email services, you can add Firebase Functions:

### Install Firebase Functions
```bash
npm install firebase-functions
```

### Create `functions/index.js`
```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Send password reset email
exports.sendPasswordResetEmail = functions.https.onCall(async (data) => {
  const { email } = data;
  // Implement email sending logic
  return { success: true };
});
```

## 📱 Testing Checklist

Before deploying to production:
- [ ] Test user signup with email/password
- [ ] Test user login
- [ ] Test profile image upload
- [ ] Test creating meals/activities/transactions
- [ ] Test trash/restore functionality
- [ ] Test analytics tracking
- [ ] Test mobile responsiveness
- [ ] Test dark/light theme switching

## 🎯 Migration Notes

### What Changed:
- **Backend**: MongoDB → Firestore (NoSQL)
- **Auth**: Custom JWT → Firebase Auth
- **API**: REST API → Firebase SDK
- **Hosting**: Express server → Vercel static hosting

### What Stayed the Same:
- **Frontend**: React + TypeScript + Vite
- **UI Components**: All React components unchanged
- **Styling**: Same CSS/design system
- **Data Models**: Same structure, just Firestore compatible

### Admin Functionality:
Admin features (user management, banning, etc.) now require Firebase Admin SDK. This needs to be implemented in Firebase Functions or a separate admin panel.

## 🚨 Important Notes

1. **Firestore Costs**: Firestore has free tier limits (50K reads, 20K writes/day)
2. **Authentication**: Firebase Auth has generous free tier
3. **Security**: Always test security rules before production
4. **Email**: Firebase Auth handles password reset emails automatically
5. **Real-time**: Consider using Firestore real-time listeners for live updates

## 📞 Support

- Firebase Documentation: https://firebase.google.com/docs
- Vercel Documentation: https://vercel.com/docs
- React + Firebase: https://firebase.google.com/docs/web/setup