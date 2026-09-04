# Personal Management Dashboard (PMD)

A comprehensive personal management application built with React, TypeScript, and Firebase.

## 🚀 **Overview**

PMD is a full-featured personal management dashboard that helps users track:
- **Finance**: Transactions, budgets, and savings goals
- **Meals**: Calorie tracking and meal planning with barcode scanning
- **Activities**: Schedule and track daily activities
- **Notifications**: In-app notifications and alerts
- **Admin Panel**: User management (limited client-side functionality)

## 🛠️ **Tech Stack**

### **Frontend**
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 6** - Build tool
- **Tailwind CSS 4** - Styling
- **Lucide React** - Professional icons
- **Recharts** - Data visualization
- **React Router** - Navigation

### **Backend & Infrastructure**
- **Firebase Hosting** - Frontend deployment
- **Firestore Database** - NoSQL database
- **Firebase Authentication** - User auth
- **Firebase Storage** - File storage (profile images)

## 📦 **Installation**

### **Prerequisites**
- Node.js 20+
- npm or yarn
- Firebase account

### **Setup Steps**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PersonaL-Management-Dashboard\ frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🔥 **Firebase Configuration**

### **Required Firebase Services**

1. **Authentication**
   - Enable Email/Password sign-in method
   - Navigate to Firebase Console → Build → Authentication

2. **Firestore Database**
   - Create database in Test Mode
   - Navigate to Firebase Console → Build → Firestore Database
   - Apply security rules from `firestore.rules`

3. **Storage** (for profile images)
   - Enable Storage with public read rules
   - Navigate to Firebase Console → Build → Storage

### **Firebase Configuration**

The Firebase configuration is managed in:
- `firebase.ts` - Firebase initialization
- `firebaseAuth.ts` - Authentication operations
- `firebaseDb.ts` - Database operations
- `firebaseAnalytics.ts` - Analytics operations

## 🚀 **Deployment**

### **Automatic Deployment (GitHub Actions)**

The project uses GitHub Actions for automatic deployment to Firebase Hosting.

#### **Setup Required:**

1. **Add Firebase Token to GitHub Secrets**
   - Generate Firebase token: `npx firebase-tools login:ci`
   - Add to GitHub repository: Settings → Secrets and variables → Actions
   - Secret name: `FIREBASE_TOKEN`

2. **Push to main branch**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

#### **Deployment Process:**

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:
1. Builds the application
2. Deploys to Firebase Hosting
3. Deploys Firestore rules
4. Deploys Firestore indexes

### **Manual Deployment**

```bash
npm run build
npx firebase-tools deploy --project personal-management-dash-9b45a
```

### **Live Application**

- **Hosting URL**: https://personal-management-dash-9b45a.web.app
- **Firebase Console**: https://console.firebase.google.com/project/personal-management-dash-9b45a/overview

## ⚠️ **Admin Panel Limitations**

### **Current Implementation:**

The admin panel uses **client-side Firebase operations** and has the following limitations:

#### **✅ Available Features:**
- View all users
- Manage user roles (admin/user)
- Ban/unban users
- View basic user statistics

#### **❌ Requires Firebase Admin SDK:**
- User deletion (requires server-side Auth SDK)
- Complete user activity logs (requires data aggregation)
- System-wide analytics (requires server-side processing)
- Advanced user management

#### **🔧 Architecture Note:**

Current admin operations use client-side Firestore SDK:
```typescript
// Client-side implementation
const userRef = doc(db, 'users', id);
await updateDoc(userRef, { role: 'admin' });
```

For full admin functionality, Firebase Admin SDK (server-side) would be required via Cloud Functions.

## 📋 **Architecture**

### **Frontend Structure**
```
src/
├── App.tsx              # Main app component with routing
├── auth.tsx             # Authentication context
├── theme.tsx            # Theme management
├── firebase.ts          # Firebase initialization
├── firebaseAuth.ts      # Firebase Auth operations
├── firebaseDb.ts        # Firestore database operations
├── firebaseAnalytics.ts # Analytics operations
├── firebaseErrorHandler.ts # Error message handling
├── api.ts               # API layer (wraps Firebase operations)
├── Components/           # Feature components
│   ├── Home.tsx
│   ├── Finance.tsx
│   ├── Meals.tsx
│   ├── Activity.tsx
│   ├── Notifications.tsx
│   ├── Trash.tsx
│   ├── Admin.tsx
│   └── Settings.tsx
└── styles.css           # Global styles
```

### **Data Models**

#### **User**
```typescript
interface User {
  uid: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  banned: boolean;
  lastLogin: string;
  createdAt: string;
  profileImage?: string;
}
```

#### **Transaction**
```typescript
interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  userId: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### **Meal**
```typescript
interface Meal {
  id: string;
  title: string;
  calories: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  source: 'manual' | 'api' | 'dish';
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugars?: number;
  sodium?: number;
  barcode?: string;
  brand?: string;
  userId: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### **Activity**
```typescript
interface Activity {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  done?: boolean;
  userId: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### **SavingsGoal**
```typescript
interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  userId: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 🔧 **Key Features**

### **1. User-Friendly Error Messages**

All Firebase errors are converted to user-friendly messages using `firebaseErrorHandler.ts`:
- `auth/invalid-credential` → "Invalid credentials. Please check your email and password."
- `auth/email-already-in-use` → "Email already registered. Please use a different email or login."
- `auth/user-not-found` → "Email not registered. Please sign up first."
- `firestore/permission-denied` → "You do not have permission to access this data."

### **2. Client-Side Admin Panel**

Admin functionality is implemented using client-side Firestore operations:
- Role management (admin/user)
- User banning/unbanning
- User listing and filtering
- Basic statistics calculation

### **3. Trash & Recovery**

Soft delete system with trash management:
- Items marked as deleted (not permanently removed)
- Trash panel shows all deleted items
- Restore or permanently delete options
- Support for transactions, meals, and activities

### **4. Barcode Scanning**

Meal tracking with barcode scanning using html5-qrcode:
- Scan product barcodes
- Fetch nutritional data from API
- Automatic meal creation

## 🛡️ **Security**

### **Firebase Security Rules**

Firestore security rules are defined in `firestore.rules`:
- User data isolation by `userId`
- Authentication required for all operations
- Admin role verification for sensitive operations

### **Environment Variables**

Sensitive configuration is managed via environment variables:
- Firebase keys stored in `.env` (gitignored)
- No hardcoded credentials in source code
- Secure token management for CI/CD

## 📊 **Firestore Indexes**

Required indexes are defined in `firestore.indexes.json`:
- Composite indexes for efficient queries
- Proper ordering for time-based queries
- Support for filtering by `userId` and `deletedAt`

## 🎨 **Professional UI**

### **Modern Design**
- Dark/light theme support
- Professional Lucide React icons
- Responsive layout
- Smooth transitions and animations

### **Components**
- Clean, intuitive interface
- Real-time data updates
- Comprehensive error handling
- Loading states and empty states

## 🔍 **Troubleshooting**

### **Common Issues**

#### **"Failed to load" errors**
- Ensure Firebase services are enabled in Firebase Console
- Check that Firestore database is created
- Verify authentication is configured

#### **Admin panel errors**
- Admin panel has client-side limitations
- Some features require Firebase Admin SDK
- See "Admin Panel Limitations" section above

#### **Deployment issues**
- Verify `FIREBASE_TOKEN` is set in GitHub Secrets
- Check Firebase project is accessible
- Ensure build artifacts are generated correctly

### **Development**

#### **TypeScript errors**
```bash
npm run type-check
```

#### **Linting**
```bash
npm run lint
```

#### **Build issues**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 **Recent Improvements**

### **Code Cleanup**
- ✅ Removed duplicate `firebaseAuthContext.tsx`
- ✅ Removed dead `vercel.json` configuration
- ✅ Deleted unused `.bak` files
- ✅ Cleaned up dependencies (removed axios, moved firebase-tools to devDependencies)
- ✅ Updated Vite to stable version (6.0.0)

### **CI/CD Improvements**
- ✅ Added Firestore rules deployment to GitHub Actions
- ✅ Added Firestore indexes deployment to GitHub Actions
- ✅ Improved build artifact management

### **Feature Improvements**
- ✅ Fixed admin panel with client-side Firestore operations
- ✅ Added user-friendly error messages throughout
- ✅ Implemented professional Lucide React icons
- ✅ Added admin notice about current limitations

### **Index Optimization**
- ✅ Cleaned up duplicate Firestore indexes
- ✅ Optimized composite indexes for all collections
- ✅ Ensured indexes match actual query patterns

## 🚀 **Future Enhancements**

### **Potential Improvements**
- **Server-side admin panel** - Implement Firebase Admin SDK via Cloud Functions
- **Real-time notifications** - Firebase Cloud Messaging
- **Data export** - Export functionality for analytics
- **Advanced analytics** - More comprehensive reporting
- **Mobile app** - React Native implementation

## 📄 **License**

This project is private and proprietary.

## 🤝 **Support**

For issues or questions:
- Check Firebase Console for service status
- Review Firestore rules and indexes
- Verify authentication configuration
- Check GitHub Actions deployment logs

---

**Built with ❤️ using React, TypeScript, and Firebase**