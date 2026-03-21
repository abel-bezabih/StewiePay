# Step 1 Verification Checklist

## ✅ Completed
- [x] Signed up for Cloudinary account
- [x] Added credentials to `.env` file

## ⏳ Still Needed

### 1. Install Backend Package
```bash
cd apps/backend
yarn add cloudinary
```

### 2. Install Mobile Package
```bash
cd apps/mobile
npx expo install expo-file-system
```

### 3. Verify .env Configuration

Your `apps/backend/.env` should have these three lines:
```env
CLOUDINARY_CLOUD_NAME="your-actual-cloud-name"
CLOUDINARY_API_KEY="your-actual-api-key"
CLOUDINARY_API_SECRET="your-actual-api-secret"
```

**Important:**
- No quotes needed around the values (or use quotes consistently)
- No spaces around the `=` sign
- Make sure there are no typos in variable names
- Values should match exactly what's in your Cloudinary dashboard

### 4. Restart Backend Server
After installing packages and adding env variables:
```bash
cd apps/backend
yarn start:dev
```

Check the console for any errors. If you see Cloudinary-related errors, double-check your credentials.

### 5. Test the Feature
1. Start mobile app: `cd apps/mobile && yarn start`
2. Login to the app
3. Navigate to Account/Profile settings
4. Tap on profile photo
5. Select an image
6. Image should upload and display

## Common Issues

### "Cannot find module 'cloudinary'"
→ Run: `cd apps/backend && yarn add cloudinary`

### "CLOUDINARY_CLOUD_NAME is not defined"
→ Check .env file exists in `apps/backend/` directory
→ Restart backend server after adding env variables

### "Invalid API Key" error
→ Verify credentials in Cloudinary dashboard
→ Make sure no extra spaces or quotes in .env file

### Mobile app error: "Cannot find module 'expo-file-system'"
→ Run: `cd apps/mobile && npx expo install expo-file-system`
→ Restart Expo






