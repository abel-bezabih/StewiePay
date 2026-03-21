# Step 1 Troubleshooting: 500 Error on Avatar Upload

## Issue
Getting a 500 error when trying to upload avatar images to Cloudinary.

## Common Causes & Solutions

### 1. Backend Server Not Restarted
**Problem:** Environment variables are only loaded when the server starts.

**Solution:**
```bash
# Stop the backend server (Ctrl+C)
# Then restart it:
cd apps/backend
yarn start:dev
```

### 2. Environment Variables Not Set Correctly

**Check your `.env` file in `apps/backend/.env`:**

```env
CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
CLOUDINARY_API_KEY=your-actual-api-key
CLOUDINARY_API_SECRET=your-actual-api-secret
```

**Common mistakes:**
- Missing quotes (use quotes or no quotes consistently)
- Extra spaces around `=`
- Typos in variable names
- Values don't match Cloudinary dashboard exactly

**Verify in Cloudinary Dashboard:**
1. Go to https://cloudinary.com/console
2. Check your credentials match exactly

### 3. Check Backend Console Logs

Look at your backend terminal for error messages. You should see:
- Cloudinary configuration warnings (if credentials missing)
- Detailed error messages from Cloudinary API

### 4. Test Cloudinary Connection

You can test if Cloudinary is configured correctly by checking the backend logs when it starts. If you see warnings about missing credentials, the env vars aren't being read.

### 5. Verify Package Installation

Make sure cloudinary package is installed:
```bash
cd apps/backend
yarn list cloudinary
```

If not installed:
```bash
cd apps/backend
yarn add cloudinary
```

### 6. Network/Firewall Issues

Cloudinary needs internet access. Make sure your backend can reach:
- `api.cloudinary.com`
- `res.cloudinary.com`

### 7. Invalid Base64 Format

The image should be valid base64. The error handling should catch this, but verify the frontend is sending proper base64 strings.

## Debugging Steps

1. **Check Backend Logs**
   - Look for Cloudinary-related errors
   - Check for configuration warnings

2. **Verify Environment Variables**
   ```bash
   cd apps/backend
   # On Mac/Linux, you can check (but don't commit .env):
   cat .env | grep CLOUDINARY
   ```

3. **Restart Backend**
   - Always restart after changing .env file
   - Check startup logs for warnings

4. **Test with Simple Request**
   - Try uploading a small image first
   - Check Cloudinary dashboard for uploads

## Next Steps

If the issue persists, share:
1. Backend console error logs
2. The exact error message from the mobile app
3. Confirmation that .env file is in `apps/backend/.env` (not root)
4. That you've restarted the backend server






