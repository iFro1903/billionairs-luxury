# Chat File Upload Setup

## Cloudinary Setup Required

1. Go to https://cloudinary.com and create a free account
2. Get your Cloud Name from the dashboard
3. Create an upload preset:
   - Go to Settings → Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Preset name: `billionairs_chat`
   - Signing Mode: **Unsigned**
   - Folder: `billionairs/chat`
   - Save

4. Update in `assets/js/chat.js` line ~245:
   ```javascript
   'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/auto/upload'
   ```
   Replace `YOUR_CLOUD_NAME` with your actual Cloudinary cloud name

## Supported File Types
- Images: jpg, png, gif, webp (max 10MB)
- Documents: pdf, doc, docx, txt (max 10MB)

## Database Migration
Run this SQL in Neon Console:
```sql
ALTER TABLE chat_messages
ADD COLUMN file_url TEXT,
ADD COLUMN file_name TEXT,
ADD COLUMN file_type VARCHAR(20);
```

## Features
- ✅ Image preview in chat
- ✅ File download links
- ✅ Upload progress indicator
- ✅ Automatic file type detection
- ✅ Mobile friendly
