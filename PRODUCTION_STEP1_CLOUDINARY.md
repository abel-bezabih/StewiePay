# Step 1: Cloudinary Integration for Profile Photos

## Overview
Implement Cloudinary to handle profile photo uploads. This replaces the current placeholder that just stores local URIs.

## Implementation Steps

### 1. Backend Setup
- Install Cloudinary SDK
- Create storage service
- Add upload endpoint
- Update environment variables

### 2. Frontend Updates
- Update upload flow to send base64 image data
- Handle upload progress
- Error handling

### 3. Configuration
- Add Cloudinary credentials to .env
- Update env.example
- Document setup

## Files to Modify
- `apps/backend/package.json` - Add cloudinary dependency
- `apps/backend/src/users/user.controller.ts` - Add upload endpoint
- `apps/backend/src/users/user.service.ts` - Add upload logic
- `apps/backend/src/users/user.module.ts` - Add CloudinaryModule
- `apps/backend/env.example` - Add Cloudinary config
- `apps/mobile/src/api/client.ts` - Update uploadAvatar method
- `apps/mobile/src/components/account/EditProfileModal.tsx` - Update image upload flow






