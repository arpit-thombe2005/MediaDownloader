# Downify 🎬🎵

A modern, full-stack web application for downloading media from YouTube, Instagram, and Spotify in the highest quality available.

## ✨ Features

- **YouTube Downloads**: Download videos in 4K, 1080p, 720p, 480p, 360p, or extract high-quality audio (MP3)
- **Instagram Reels & Posts**: Download Instagram reels, videos, and images with a simple link
- **Spotify Music**: Download Spotify tracks (converts to MP3 via YouTube)
- **Modern UI**: Beautiful, responsive design with light/dark theme toggle
- **Auto-Detection**: Automatically detects the platform from the URL
- **Format Options**: Choose between video (MP4) or audio (MP3) formats
- **Quality Selection**: Select video quality (Best, 1080p, 720p, 480p, 360p)

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm/yarn
- **Python 3.8+** (for yt-dlp and spotdl)
- **FFmpeg** (for audio/video processing) - [Download FFmpeg](https://ffmpeg.org/download.html)

### Installation

1. **Clone or download the project**
   ```bash
   cd Downloader
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   
   **Windows:**
   ```powershell
   .\install-ytdlp.ps1
   ```
   
   **Linux/macOS:**
   ```bash
   bash install-deps.sh
   ```
   
   **Or manually:**
   ```bash
   pip install yt-dlp spotdl
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📦 Project Structure

```
Downify/
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
│   └── ThemeProvider.tsx   # Theme context provider
├── lib/
│   ├── utils.ts           # Utility functions (URL detection, etc.)
│   └── theme.ts           # Theme management utilities
├── install-deps.sh        # Linux/macOS dependency installer
├── install-ytdlp.ps1      # Windows dependency installer
└── package.json
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS, Framer Motion
- **Backend**: Next.js API Routes
- **YouTube/Instagram**: yt-dlp (Python)
- **Spotify**: spotdl (Python)
- **Audio/Video Processing**: FFmpeg

## ⚠️ Known Limitations

### YouTube Downloads

**What works:**
- ✅ Regular videos
- ✅ YouTube Shorts
- ✅ Multiple quality options
- ✅ Audio extraction (MP3)

**What may not work:**
- ❌ Age-restricted videos (may require cookies)
- ❌ Private/Deleted videos
- ❌ Region-locked content
- ❌ Live streams (not supported)

**Rate Limiting:**
- YouTube may rate limit requests, especially on shared IP addresses
- For better reliability, you can add a `cookies.txt` file in the project root (exported from your browser)

### Instagram Downloads

**What works:**
- ✅ Public reels
- ✅ Public posts
- ✅ Images and videos

**Limitations:**
- Some content may require authentication
- Private accounts not supported

### Spotify Downloads

**How it works:**
- Uses `spotdl` to find tracks on YouTube
- Downloads audio from YouTube
- Converts to MP3

**Limitations:**
- Only single tracks (playlists/albums not supported)
- Requires YouTube to have the track
- Quality depends on YouTube availability

## 🐛 Troubleshooting

### YouTube Downloads Not Working

1. **Update yt-dlp:**
   ```bash
   pip install --upgrade yt-dlp
   ```

2. **Check Python installation:**
   ```bash
   python --version  # Should be 3.8+
   ```

3. **Check FFmpeg:**
   ```bash
   ffmpeg -version
   ```

4. **Try different video** - Some videos may be restricted

### Instagram Downloads Not Working

- Ensure the post/reel is public
- Try a different Instagram URL
- Update yt-dlp: `pip install --upgrade yt-dlp`

### Spotify Downloads Not Working

1. **Update spotdl:**
   ```bash
   pip install --upgrade spotdl
   ```

2. **Check if track exists on YouTube:**
   - spotdl searches YouTube for the track
   - If not found on YouTube, download will fail

3. **Use single track URLs only:**
   - Playlists and albums are not supported

### FFmpeg Errors

- Ensure FFmpeg is installed and in your PATH
- Restart your terminal/IDE after installing FFmpeg
- Check FFmpeg installation: `ffmpeg -version`
- On Windows, ensure FFmpeg is in system PATH

### Python/yt-dlp Not Found

**Windows:**
- Ensure Python is installed and in PATH
- Try `py` instead of `python`
- Run: `py -m pip install yt-dlp spotdl`

**Linux/macOS:**
- Use `python3` instead of `python`
- Run: `python3 -m pip install yt-dlp spotdl`

## 📝 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## ⚠️ Legal Disclaimer

**Important**: Downify is provided for educational and personal use only. Users are responsible for ensuring they have the right to download content. Downloading copyrighted material without permission may violate copyright laws in your jurisdiction.

- We do not host or store any content on our servers
- All downloads are processed on-demand
- Users are solely responsible for their use of this application
- Respect content creators' rights and terms of service

## 📄 License

This project is for educational purposes only. Use responsibly and in accordance with applicable laws and terms of service.

## 🙏 Acknowledgments

- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube/Instagram downloader
- [spotdl](https://github.com/spotDL/spotify-downloader) - Spotify downloader
- [Next.js](https://nextjs.org) - React framework
- [TailwindCSS](https://tailwindcss.com) - Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) - Animation library

---

Built with ❤️ using Next.js, TypeScript, Python, and TailwindCSS
