# Setup Guide

## Quick Setup Steps

1. **Install Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org)

2. **Install FFmpeg** (required for audio conversion)
   - **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt-get install ffmpeg` or `sudo yum install ffmpeg`

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Navigate to `http://localhost:3000`

## Platform-Specific Notes

### YouTube
- Works out of the box, no API keys needed
- Supports video downloads (up to 4K) and audio extraction
- May occasionally fail due to YouTube's rate limiting

### Instagram
- Currently requires manual setup or third-party services
- Instagram's API requires app approval
- Consider using services like:
  - Instagram Basic Display API (requires Facebook Developer account)
  - Third-party libraries that handle authentication

### Spotify
- Direct downloads are restricted by Spotify's API
- Would require:
  - Spotify API credentials
  - Alternative services (like SpotifyDL) or libraries
  - Note: Downloading Spotify content may violate their Terms of Service

## Troubleshooting

### "ytdl-core" errors
- Update the package: `npm update ytdl-core`
- YouTube may block requests - try again later
- Some videos may be age-restricted or region-locked

### FFmpeg not found
- Ensure FFmpeg is installed and in your system PATH
- Restart terminal/IDE after installation
- Verify: `ffmpeg -version` in terminal

### Port 3000 already in use
- Change port: `npm run dev -- -p 3001`
- Or kill the process using port 3000

### Build errors
- Clear `.next` folder: `rm -rf .next` (or delete on Windows)
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Production Deployment

### Environment Variables
Create `.env.local` with:
```env
# Optional - for future Spotify/Instagram API integration
SPOTIFY_CLIENT_ID=your_key
SPOTIFY_CLIENT_SECRET=your_secret
```

### Build for Production
```bash
npm run build
npm start
```

### Recommended Hosting
- **Vercel**: Best for Next.js (automatic deployments)
- **Netlify**: Good alternative with similar features
- **Railway/Render**: Good for full-stack apps

## Security Notes

- Never commit `.env.local` to version control
- API keys should be kept secret
- The app processes downloads server-side - ensure your hosting provider allows this
- Some platforms may have rate limits or restrictions



