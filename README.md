# MediaFetchr 🎬🎵

A modern, full-stack web application for downloading media from YouTube, Instagram, and Spotify in the highest quality available.

## ✨ Features

- **YouTube Downloads**: Download videos in 1080p, 4K, or extract high-quality audio (MP3/M4A)
- **Instagram Reels**: Download Instagram reels and videos with a simple link
- **Spotify Music**: Download Spotify tracks and playlists (requires API setup)
- **Modern UI**: Beautiful, responsive design with light/dark theme toggle
- **Auto-Detection**: Automatically detects the platform from the URL
- **Format Options**: Choose between video (MP4) or audio (MP3) formats
- **Quality Selection**: Select video quality (4K, 1080p, 720p, etc.)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- FFmpeg (for audio conversion) - [Download FFmpeg](https://ffmpeg.org/download.html)

### Installation

1. **Clone or download the project**
   ```bash
   cd Downloader
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Project Structure

```
MediaFetchr/
├── app/
│   ├── api/
│   │   ├── fetch-info/    # API route for fetching media info
│   │   └── download/      # API route for downloading media
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/
│   ├── Navbar.tsx         # Navigation bar with theme toggle
│   ├── Hero.tsx           # Hero section with URL input
│   ├── FeatureCards.tsx   # Platform feature cards
│   ├── MediaPreview.tsx   # Media preview and download options
│   ├── Footer.tsx         # Footer with legal disclaimers
│   └── ThemeProvider.tsx  # Theme context provider
├── lib/
│   ├── utils.ts           # Utility functions (URL detection, etc.)
│   └── theme.ts           # Theme management utilities
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory for API keys (if needed):

```env
# Spotify API (optional - for Spotify downloads)
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Instagram API (optional - if using Instagram Basic Display API)
INSTAGRAM_ACCESS_TOKEN=your_access_token
```

### FFmpeg Setup

FFmpeg is required for audio conversion. After installing FFmpeg:

- **Windows**: Add FFmpeg to your system PATH
- **macOS**: `brew install ffmpeg`
- **Linux**: `sudo apt-get install ffmpeg`

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color palette:

```js
colors: {
  primary: { ... },    // Main brand color
  secondary: { ... },  // Secondary accent
  accent: { ... },     // Accent color
}
```

### Animations

Animations are powered by Framer Motion. Customize animations in component files or add new ones in `tailwind.config.js`.

## ⚠️ Known Limitations

### YouTube Downloads

This application uses `play-dl`, a modern library that's actively maintained and handles YouTube changes well. However, YouTube occasionally updates their platform which can temporarily affect downloads.

**What to expect:**
- Most videos should work reliably
- Shorts and regular videos are both supported
- The library is updated regularly to handle YouTube changes

**If issues occur:**
- Update `play-dl`: `npm update play-dl`
- Check [play-dl GitHub](https://github.com/play-dl/play-dl) for known issues
- Try different videos if one fails

## ⚠️ Legal Disclaimer

**Important**: MediaFetchr is provided for educational and personal use only. Users are responsible for ensuring they have the right to download content. Downloading copyrighted material without permission may violate copyright laws in your jurisdiction.

- We do not host or store any content on our servers
- All downloads are processed on-demand
- Users are solely responsible for their use of this application

## 🔐 API Setup (Optional)

### Spotify API

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your Client ID and Client Secret
4. Add them to `.env.local`

**Note**: Direct Spotify downloads are restricted. You may need to use alternative services or libraries that handle Spotify's API limitations.

### Instagram API

Instagram downloads may require:
- Instagram Basic Display API (requires app approval)
- Third-party services that handle Instagram authentication

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Netlify

1. Push your code to GitHub
2. Import the project in [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables
6. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Node.js:
- Railway
- Render
- DigitalOcean App Platform
- AWS Amplify

## 🐛 Troubleshooting

### YouTube Downloads Not Working

This application uses `play-dl`, a modern and actively maintained library that handles YouTube's frequent changes better than older alternatives.

**If downloads fail:**

1. **Update the library:**
   ```bash
   npm update play-dl
   ```

2. **Check for the latest version:**
   ```bash
   npm install play-dl@latest
   ```

3. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

**Other common issues:**

- **403 Forbidden errors**: YouTube may be rate-limiting your requests. Wait a few minutes and try again.
- **Age-restricted videos**: Some videos require authentication and may not work.
- **Region-locked content**: Videos restricted to certain regions may fail.
- **Private/Deleted videos**: These will always fail.

### Instagram Downloads Not Working

- Instagram requires authentication for most endpoints
- Consider using third-party services or libraries
- Some Instagram content may be protected

### Spotify Downloads Not Working

- Spotify API has strict limitations
- Direct downloads are not officially supported
- Consider using alternative services or libraries

### FFmpeg Errors

- Ensure FFmpeg is installed and in your PATH
- Restart your terminal/IDE after installing FFmpeg
- Check FFmpeg installation: `ffmpeg -version`

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Platforms

1. Add platform detection in `lib/utils.ts`
2. Create API route handler in `app/api/fetch-info/route.ts`
3. Create download handler in `app/api/download/route.ts`
4. Update UI components to support the new platform

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is for educational purposes only. Use responsibly and in accordance with applicable laws and terms of service.

## 🙏 Acknowledgments

- [play-dl](https://github.com/play-dl/play-dl) - Modern YouTube download library
- [Next.js](https://nextjs.org) - React framework
- [TailwindCSS](https://tailwindcss.com) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

Built with ❤️ using Next.js, TypeScript, and TailwindCSS


