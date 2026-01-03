# Deployment Guide for Downify

This guide covers deploying your Next.js application with all required dependencies.

## ⚠️ Important Considerations

Your application requires:
- **Node.js** (for Next.js)
- **Python** (for `spotdl`)
- **ffmpeg** (for audio/video processing)
- **yt-dlp** (for YouTube/Instagram downloads)
- **spotdl** (Python package for Spotify downloads)

These dependencies make deployment more complex than a standard Next.js app.

---

## Option 1: Vercel (Recommended for Simplicity)

Vercel is the easiest option but has limitations with system dependencies.

### Steps:

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: Next.js
     - Build Command: `npm run build`
     - Output Directory: `.next`
   - Click "Deploy"

### ⚠️ Vercel Limitations:
- **No Python support** - Spotify downloads won't work
- **No system binaries** - `yt-dlp` and `ffmpeg` may not work
- **Serverless functions** - Long-running downloads may timeout

**Vercel is best for frontend-only or if you can refactor to use external APIs.**

---

## Option 2: Railway (Recommended for Full Functionality)

Railway supports Node.js, Python, and system dependencies.

### Steps:

1. **Push code to GitHub** (same as above)

2. **Deploy to Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Configure Build Settings**
   - Railway auto-detects Next.js
   - Add build command: `npm run build`
   - Start command: `npm start`

4. **Add Python Service** (for spotdl)
   - In Railway dashboard, click "+ New" → "Empty Service"
   - Or use a `Procfile` or `railway.json` to configure multiple services

5. **Install System Dependencies**
   Create a `railway.json` or use environment variables:
   ```json
   {
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm install && npm run build"
     },
     "deploy": {
       "startCommand": "npm start",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

6. **Install Dependencies via Script**
   Create a `setup.sh` script:
   ```bash
   #!/bin/bash
   # Install ffmpeg
   apt-get update && apt-get install -y ffmpeg
   
   # Install yt-dlp
   pip install yt-dlp
   
   # Install spotdl
   pip install spotdl
   ```

### Railway Advantages:
- ✅ Supports Node.js and Python
- ✅ Can install system packages
- ✅ Good for long-running processes
- ✅ Free tier available

---

## Option 3: Render

Render is similar to Railway and supports full-stack apps.

### Steps:

1. **Push code to GitHub**

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Sign up/login
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure Service**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node

4. **Add Build Script**
   Create a `render.yaml`:
   ```yaml
   services:
     - type: web
       name: downify
       env: node
       buildCommand: npm install && npm run build
       startCommand: npm start
       envVars:
         - key: NODE_ENV
           value: production
   ```

5. **Install Dependencies**
   Add a build script in `package.json`:
   ```json
   "scripts": {
     "postinstall": "bash install-deps.sh"
   }
   ```

   Create `install-deps.sh`:
   ```bash
   #!/bin/bash
   sudo apt-get update
   sudo apt-get install -y ffmpeg python3 python3-pip
   pip3 install yt-dlp spotdl
   ```

---

## Option 4: DigitalOcean App Platform

### Steps:

1. **Push code to GitHub**

2. **Deploy to DigitalOcean**
   - Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
   - Create account/login
   - Go to "App Platform" → "Create App"
   - Connect GitHub repository

3. **Configure App**
   - Type: Web Service
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Environment Variables: Add any needed

4. **Add Buildpack for Dependencies**
   - Use a custom buildpack or add build scripts

---

## Option 5: Self-Hosting (VPS)

For full control, deploy on a VPS (DigitalOcean Droplet, AWS EC2, etc.).

### Steps:

1. **Set up VPS**
   - Ubuntu 22.04 recommended
   - Minimum: 2GB RAM, 1 CPU

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js (v18+)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install Python and pip
   sudo apt install -y python3 python3-pip
   
   # Install ffmpeg
   sudo apt install -y ffmpeg
   
   # Install yt-dlp
   pip3 install yt-dlp
   
   # Install spotdl
   pip3 install spotdl
   ```

3. **Clone and Build**
   ```bash
   # Clone repository
   git clone <your-repo-url>
   cd Downloader
   
   # Install dependencies
   npm install
   
   # Build
   npm run build
   ```

4. **Run with PM2** (process manager)
   ```bash
   # Install PM2
   sudo npm install -g pm2
   
   # Start application
   pm2 start npm --name "downify" -- start
   
   # Save PM2 configuration
   pm2 save
   pm2 startup
   ```

5. **Set up Nginx** (reverse proxy)
   ```bash
   sudo apt install -y nginx
   ```

   Create `/etc/nginx/sites-available/downify`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/downify /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Set up SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Option 6: Docker Deployment

Create a Dockerfile for containerized deployment.

### Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    git

# Install Python packages
RUN pip3 install yt-dlp spotdl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### Deploy with Docker:
```bash
# Build image
docker build -t downify .

# Run container
docker run -p 3000:3000 downify
```

Deploy to:
- **Docker Hub** → Any cloud provider
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Azure Container Instances**

---

## Environment Variables

If needed, create a `.env.production` file:
```env
NODE_ENV=production
# Add any other environment variables
```

---

## Recommended Approach

**For Quick Deployment (Limited Functionality):**
- Use **Vercel** (frontend only, no Spotify/backend features)

**For Full Functionality:**
- Use **Railway** or **Render** (supports all dependencies)

**For Production/Enterprise:**
- Use **VPS with Docker** (full control, scalable)

---

## Post-Deployment Checklist

- [ ] Test YouTube downloads
- [ ] Test Instagram downloads
- [ ] Test Spotify downloads
- [ ] Verify all logos/images load
- [ ] Check mobile responsiveness
- [ ] Test error handling
- [ ] Monitor logs for issues
- [ ] Set up domain name (if needed)
- [ ] Configure SSL certificate
- [ ] Set up monitoring/analytics

---

## Troubleshooting

### Build Fails
- Check Node.js version (18+ required)
- Verify all dependencies in `package.json`
- Check build logs for specific errors

### Downloads Don't Work
- Verify `yt-dlp` and `spotdl` are installed
- Check `ffmpeg` is available in PATH
- Review API route logs

### Timeout Issues
- Increase timeout limits in platform settings
- Consider using background jobs for long downloads

---

## Need Help?

Check platform-specific documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Render Docs](https://render.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

