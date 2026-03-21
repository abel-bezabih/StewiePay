# Step 1: Cloudinary Setup Instructions

## Prerequisites
1. A Cloudinary account (sign up at https://cloudinary.com/users/register/free)
2. Access to your Cloudinary dashboard to get credentials

## Installation Steps

### 1. Install Backend Dependencies

Run this command in the backend directory:

```bash
cd apps/backend
yarn add cloudinary
```

**Note:** You don't need `multer` or `@types/multer` as we're using base64 encoding instead of multipart/form-data for simplicity.

### 2. Install Mobile Dependencies

Run this command in the mobile directory:

```bash
cd apps/mobile
npx expo install expo-file-system
```

### 3. Get Cloudinary Credentials

1. Go to https://cloudinary.com/console
2. Sign in or create a free account
3. In the dashboard, you'll see your:
   - **Cloud Name** (e.g., `your-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### 4. Configure Environment Variables

Add these to your `apps/backend/.env` file:

```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz123456"
```

**Important:** Never commit your `.env` file to git! These are secret credentials.

### 5. Restart Backend Server

After adding the environment variables, restart your backend:

```bash
cd apps/backend
yarn start:dev
```

## How It Works

1. **User selects image** in the mobile app (from gallery)
2. **Mobile app** converts the image to base64 encoding
3. **Mobile app** sends base64 string to backend `/api/users/upload-avatar`
4. **Backend** uploads the image to Cloudinary
5. **Cloudinary** returns a secure URL
6. **Backend** saves the URL to the user's profile
7. **Mobile app** receives the URL and displays the image

## Testing

1. Open the mobile app
2. Navigate to Account/Profile settings
3. Tap on the profile photo
4. Select an image from your gallery
5. The image should upload and display correctly

## Troubleshooting

### Error: "Failed to upload image to Cloudinary"
- Check that your Cloudinary credentials are correct in `.env`
- Verify the environment variables are loaded (restart the backend)
- Check Cloudinary dashboard for API usage/quota limits

### Error: "Cannot find module 'expo-file-system'"
- Run: `cd apps/mobile && npx expo install expo-file-system`
- Restart Expo: `yarn start`

### Images not displaying
- Check that the `avatarUrl` is being saved correctly in the database
- Verify the Cloudinary URL is accessible (try opening it in a browser)
- Check network connectivity

## Cloudinary Free Tier Limits

- 25 GB storage
- 25 GB monthly bandwidth
- Unlimited transformations
- Perfect for development and small-scale production

For production at scale, consider upgrading to a paid plan.

## Next Steps

After Cloudinary is working:
- ✅ Step 1 Complete: Cloud Storage
- 📧 Step 2: Email Service Integration (SendGrid)
- 🔧 Step 3: Environment Configuration Management

