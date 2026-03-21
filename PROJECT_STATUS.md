# StewiePay - Project Status & Overview

**Last Updated:** December 2024  
**Status:** Development Phase - Core Features Complete

---

## 🎯 What is StewiePay?

**StewiePay** is a modern fintech mobile application that empowers users with granular control over their spending. It's designed as a premium financial management platform with a focus on:

- **Complete Transaction Control** - Users can set detailed spending rules on their cards
- **Smart Card Management** - Multiple card types with advanced features
- **Financial Intelligence** - Budget tracking, subscription detection, and spending analytics
- **Beautiful UX** - Premium design with modern UI/UX patterns
- **Security First** - Biometric authentication, secure token management, and robust backend architecture

---

## 🏗️ Architecture Overview

### **Monorepo Structure**
```
StewiePay/
├── apps/
│   ├── mobile/          # React Native (Expo) mobile app
│   ├── backend/         # NestJS REST API
│   └── admin/           # Next.js admin panel (placeholder)
├── packages/
│   ├── config/          # Shared ESLint/Prettier configs
│   └── tsconfig/        # Shared TypeScript configs
└── README.md
```

### **Tech Stack**

#### Mobile App (`apps/mobile`)
- **Framework:** React Native with Expo (~54.0.0)
- **Navigation:** React Navigation (Stack + Bottom Tabs)
- **State Management:** React Context API
- **Styling:** React Native StyleSheet + Custom Design System
- **API Client:** Axios with interceptors
- **Authentication:** JWT tokens + Refresh tokens
- **Biometrics:** expo-local-authentication (Face ID/Touch ID)
- **Image Upload:** expo-image-picker
- **Notifications:** expo-notifications
- **Animations:** react-native-reanimated, react-native-animatable

#### Backend (`apps/backend`)
- **Framework:** NestJS (Node.js)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT + Passport.js
- **Password Hashing:** bcrypt
- **Validation:** class-validator, class-transformer
- **Architecture:** Modular (Services, Controllers, DTOs)

---

## ✨ Features Implemented

### **1. Authentication & User Management** ✅

#### Mobile:
- ✅ Email/password login
- ✅ User registration/signup
- ✅ Forgot password flow (email-based reset)
- ✅ Biometric authentication (Face ID/Touch ID)
- ✅ Secure token management with refresh tokens
- ✅ Profile photo upload (gallery picker)
- ✅ Change password functionality
- ✅ Onboarding flow for new users

#### Backend:
- ✅ JWT-based authentication with refresh tokens
- ✅ Password reset flow (forgot/reset password)
- ✅ User profile management (name, email, avatarUrl)
- ✅ Password change with current password verification
- ✅ Rate limiting on signup/login endpoints
- ✅ Secure password hashing (bcrypt)

### **2. Card Management** ✅

#### Card Types:
- ✅ **Permanent Cards** - Standard long-term cards
- ✅ **Burner Cards** - Single-use or limited-use cards
- ✅ **Merchant-Locked Cards** - Restricted to specific merchants
- ✅ **Subscription-Only Cards** - Only for recurring payments
- ✅ **Ads-Only Cards** - Restricted to advertising expenses

#### Card Features:
- ✅ Card creation with custom limits (daily, monthly, per-transaction)
- ✅ Card status management (Active, Frozen, Closed)
- ✅ Merchant locks (block/allow specific merchants or categories)
- ✅ Time window controls (restrict usage to specific days/times)
- ✅ Card detail views with full settings
- ✅ Multiple cards per user/organization

### **3. Spending Controls** ✅

#### Merchant Controls:
- ✅ Block specific merchants by name/ID
- ✅ Allow only specific merchants (whitelist mode)
- ✅ Block/allow by MCC (Merchant Category Code) categories
- ✅ Flexible merchant lock modes (BLOCK/ALLOW)

#### Time Restrictions:
- ✅ Day-of-week restrictions (e.g., Monday-Friday only)
- ✅ Time-of-day restrictions (e.g., 9 AM - 5 PM)
- ✅ Timezone-aware time windows
- ✅ JSON-configurable time window settings

#### Spending Limits:
- ✅ Daily spending limits
- ✅ Monthly spending limits
- ✅ Per-transaction limits
- ✅ Currency support (default: ETB - Ethiopian Birr)

### **4. Transaction Management** ✅

- ✅ Transaction listing and history
- ✅ Transaction details (amount, merchant, category, timestamp)
- ✅ Transaction status tracking (Authorized, Settled, Declined)
- ✅ Automatic transaction categorization
- ✅ Search and filter capabilities
- ✅ Real-time transaction updates

### **5. Budgets & Financial Planning** ✅

- ✅ Create budgets by category
- ✅ Monthly and weekly budget periods
- ✅ Budget tracking and progress visualization
- ✅ Multiple budgets per user
- ✅ Budget updates and management
- ✅ Category-based budget allocation

### **6. Subscription Management** ✅

- ✅ Automatic subscription detection from transactions
- ✅ Subscription listing and tracking
- ✅ Subscription details (merchant, amount, next charge date)
- ✅ Link subscriptions to specific cards
- ✅ Subscription management interface

### **7. Top-Up Management** ✅

- ✅ Top-up initiation
- ✅ Top-up verification
- ✅ Top-up history tracking
- ✅ Support for multiple top-up providers
- ✅ Status tracking (Pending, Completed, Failed)

### **8. Activities Screen** ✅

Consolidated view combining:
- ✅ **Transactions Tab** - All transaction history
- ✅ **Spending Tab** - Spending analytics and insights
- ✅ **History Tab** - Historical transaction data

### **9. Analytics & Insights** ✅

- ✅ Spending analytics
- ✅ Category-based spending breakdown
- ✅ Transaction trends
- ✅ Financial insights and visualizations

### **10. Organizations** ✅

- ✅ Multi-user organization support
- ✅ Organization roles (Owner, Admin, Member)
- ✅ Organization-owned cards
- ✅ Team financial management

### **11. Notifications** ✅

- ✅ Push notification support
- ✅ Notification preferences management
- ✅ Transaction notifications
- ✅ Card status change notifications
- ✅ Limit breach notifications
- ✅ Subscription reminders

### **12. UI/UX Design System** ✅

#### Brand Identity:
- ✅ **Primary Color:** Deep Purple (#5B21B6) - Trust, Premium, Calm
- ✅ **Gradient Backgrounds:** Elegant white-to-purple gradients
- ✅ **Typography System:** Comprehensive font scale and weights
- ✅ **Spacing System:** Consistent spacing scale
- ✅ **Component Library:** Reusable branded components

#### Design Components:
- ✅ Custom tab bar with pill-shaped design
- ✅ Elevated FAB (Floating Action Button) for Top-Up
- ✅ Glassmorphism effects
- ✅ Skeleton loaders for better perceived performance
- ✅ Bottom sheets and modals
- ✅ Consistent card designs
- ✅ Brand buttons and input fields

#### Screens:
- ✅ Onboarding flow
- ✅ Login/Signup screens
- ✅ Home dashboard
- ✅ Cards management
- ✅ Activities (Transactions/Spending/History)
- ✅ Budgets
- ✅ Subscriptions
- ✅ Account/Profile settings
- ✅ More/Settings screen

---

## 🎨 Design Philosophy

### **Brand Values:**
1. **Control & Empowerment** - Users have complete control over their finances
2. **Innovation & Cutting-Edge** - Modern technology and features
3. **Trust & Security** - Secure, transparent, and reliable
4. **Premium Experience** - Beautiful, intuitive, and delightful
5. **Clarity & Transparency** - Clear information and easy-to-understand interfaces

### **Visual Design:**
- **Color Scheme:** Deep purple primary, clean white-to-purple gradients
- **Typography:** System fonts (SF Pro on iOS, Roboto on Android)
- **Layout:** Clean, spacious, modern
- **Navigation:** Bottom tab bar with custom pill-shaped design
- **Interactions:** Smooth animations, haptic feedback, responsive touch

---

## 📊 Database Schema

### **Core Models:**
- `User` - User accounts with authentication, profile, preferences
- `Organization` - Multi-user organizations
- `Card` - Physical/virtual cards with limits and controls
- `Transaction` - All financial transactions
- `Budget` - User-defined spending budgets
- `Subscription` - Detected and tracked subscriptions
- `TopUp` - Account top-up records
- `RefreshToken` - Secure token management
- `OrganizationMember` - User-organization relationships

### **Key Relationships:**
- Users can own multiple cards
- Organizations can have multiple cards
- Cards have multiple transactions
- Users have multiple budgets
- Cards can have multiple subscriptions
- Transactions are linked to cards

---

## 🔐 Security Features

- ✅ JWT authentication with short-lived access tokens
- ✅ Refresh token rotation
- ✅ Password hashing with bcrypt (10 rounds)
- ✅ Rate limiting on sensitive endpoints
- ✅ Biometric authentication (Face ID/Touch ID)
- ✅ Secure token storage
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Error handling without sensitive data leakage

---

## 🔧 Development Setup

### **Prerequisites:**
- Node.js (v20+)
- Yarn (v1.22+)
- PostgreSQL database
- Expo CLI (for mobile development)

### **Getting Started:**

1. **Install Dependencies:**
   ```bash
   yarn install
   ```

2. **Backend Setup:**
   ```bash
   cd apps/backend
   # Setup .env file (see env.example)
   npx prisma migrate dev
   npx prisma generate
   yarn start:dev
   ```

3. **Mobile Setup:**
   ```bash
   cd apps/mobile
   yarn start
   # Scan QR code with Expo Go app or use iOS/Android simulator
   ```

### **Environment Variables:**
See `apps/backend/env.example` for required environment variables:
- Database connection string
- JWT secrets
- Bcrypt salt rounds
- Issuer/PSP API keys (for production integrations)

---

## 🚀 Current Status

### **✅ Completed:**
- Core authentication system
- User management (profile, password, photos)
- Card management (all card types and features)
- Transaction system
- Budget tracking
- Subscription detection
- Top-up management
- Activities/Analytics screens
- Organization support
- Notification infrastructure
- Complete UI/UX redesign
- Custom navigation and tab bar
- Brand identity system
- Biometric authentication
- Forgot/Reset password flow

### **🔄 In Progress / Needs Work:**
- Image upload cloud storage integration (currently uses local URIs)
- Real issuer/PSP integrations (currently using dummy adapters)
- Email service for password reset (placeholder implemented)
- Push notification server setup
- Admin panel implementation
- Production deployments
- Comprehensive testing suite

### **📋 Next Priorities:**

1. **Production Readiness:**
   - Cloud storage for images (S3/Cloudinary)
   - Email service integration (SendGrid/SES)
   - Real issuer/PSP API integrations
   - Environment-specific configurations
   - Production database setup
   - SSL/TLS certificates
   - API rate limiting improvements

2. **Feature Enhancements:**
   - Advanced analytics and reporting
   - Export functionality (CSV/PDF)
   - Recurring transaction predictions
   - Spending alerts and notifications
   - Multi-currency support
   - Card sharing features
   - Transaction notes and tags

3. **Testing & Quality:**
   - Unit tests (backend services)
   - Integration tests (API endpoints)
   - E2E tests (mobile app flows)
   - Load testing
   - Security auditing

4. **DevOps:**
   - CI/CD pipeline
   - Automated deployments
   - Monitoring and logging
   - Error tracking (Sentry)
   - Analytics integration

---

## 📱 Mobile App Structure

### **Navigation:**
- **Auth Stack:** Login, Signup, Forgot Password, Onboarding
- **Main Stack:** Home, Cards, Activities, Budgets, Subscriptions, Account
- **Tab Navigator:** Home | Cards | [TopUp FAB] | Activities | More

### **Key Screens:**
1. **HomeScreenStewie** - Dashboard with cards overview and quick actions
2. **CardsScreenStewie** - List of all user cards
3. **CardDetailScreen** - Individual card details and settings
4. **CreateCardScreenStewie** - Card creation wizard
5. **ActivitiesScreenStewie** - Transactions, Spending, History tabs
6. **BudgetsScreenStewie** - Budget management
7. **SubscriptionsScreenStewie** - Subscription tracking
8. **TopUpScreenStewie** - Account top-up
9. **MoreScreen** - Settings and additional features
10. **AccountScreen** - User profile and settings

### **Components:**
- `FintechBackground` - Global gradient background
- `StewieText` - Branded text component
- `GlassCard` - Glassmorphism card component
- `BrandButton` - Primary/secondary buttons
- `BottomSheet` - Modal bottom sheets
- `SkeletonLoader` - Loading state skeletons
- `CustomTabBar` - Custom pill-shaped tab bar

---

## 🗄️ Backend API Structure

### **Modules:**
1. **Auth** - Authentication, login, signup, password reset
2. **Users** - User management, profiles, password changes
3. **Cards** - Card CRUD, merchant locks, time windows
4. **Transactions** - Transaction listing, categorization
5. **Budgets** - Budget CRUD and tracking
6. **Subscriptions** - Subscription detection and management
7. **TopUps** - Top-up initiation and verification
8. **Organizations** - Organization management
9. **Analytics** - Spending analytics and insights
10. **Notifications** - Push notification management
11. **Webhooks** - External webhook handling

### **API Patterns:**
- RESTful endpoints
- DTO validation
- JWT authentication guards
- Role-based access control
- Error handling with HTTP exceptions
- Request logging middleware

---

## 🎯 Development Roadmap

### **Phase 1: MVP Core Features** ✅ **COMPLETE**
- Authentication
- Card management
- Basic transactions
- User profiles

### **Phase 2: Advanced Features** ✅ **COMPLETE**
- Merchant locks
- Time windows
- Budgets
- Subscriptions
- Analytics

### **Phase 3: Production Preparation** 🔄 **IN PROGRESS**
- Cloud integrations
- Email services
- Real issuer/PSP APIs
- Testing
- Documentation

### **Phase 4: Launch & Scale** 📋 **PLANNED**
- Production deployment
- Monitoring
- Performance optimization
- Feature enhancements
- User feedback integration

---

## 🤝 Contributing

This is currently a private project. For development:
1. Work on feature branches
2. Follow the established code style
3. Test thoroughly before committing
4. Update documentation as needed

---

## 📝 Notes

- The app uses a **monorepo** structure with Yarn workspaces
- Mobile app uses **Expo** for easier development and deployment
- Backend uses **NestJS** for scalable, modular architecture
- Database uses **Prisma** for type-safe database access
- Design system is centralized in `StewiePayBrand.ts`
- API client includes automatic IP detection for local development
- Network detection handles WiFi and Personal Hotspot switching

---

## 🔗 Key Files Reference

### **Mobile:**
- `apps/mobile/src/navigation/index.tsx` - Navigation structure
- `apps/mobile/src/brand/StewiePayBrand.ts` - Brand system
- `apps/mobile/src/api/client.ts` - API client configuration
- `apps/mobile/src/components/FintechBackground.tsx` - Global background

### **Backend:**
- `apps/backend/prisma/schema.prisma` - Database schema
- `apps/backend/src/app.module.ts` - Main application module
- `apps/backend/src/main.ts` - Application bootstrap

---

**Last Major Update:** User Management Features (Photo Upload, Biometric Auth, Password Management)  
**Status:** Ready for Production Integration Phase






