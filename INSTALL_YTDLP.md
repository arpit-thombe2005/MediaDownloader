# Installing yt-dlp for MediaFetchr

MediaFetchr uses `yt-dlp` as a fallback when the main library fails due to YouTube's frequent changes. Here's how to install it:

## Option 1: Install via Python (Recommended)

1. **Install Python** (if not already installed):
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Install yt-dlp**:
   ```powershell
   pip install yt-dlp
   ```

3. **Verify installation**:
   ```powershell
   yt-dlp --version
   ```

## Option 2: Download Standalone Executable (Windows)

1. **Download yt-dlp.exe**:
   - Go to: https://github.com/yt-dlp/yt-dlp/releases
   - Download `yt-dlp.exe` from the latest release

2. **Add to PATH**:
   - Place `yt-dlp.exe` in a folder (e.g., `C:\yt-dlp\`)
   - Add that folder to your system PATH:
     - Right-click "This PC" → Properties → Advanced system settings
     - Click "Environment Variables"
     - Under "System variables", find "Path" and click "Edit"
     - Click "New" and add the folder path (e.g., `C:\yt-dlp\`)
     - Click OK on all dialogs

3. **Verify installation**:
   ```powershell
   yt-dlp --version
   ```

## Quick Install Script (PowerShell)

Run this in PowerShell as Administrator:

```powershell
# Install Python if not installed
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python not found. Please install Python first from https://www.python.org/downloads/"
} else {
    # Install yt-dlp
    pip install yt-dlp
    Write-Host "yt-dlp installed successfully!"
    yt-dlp --version
}
```

## After Installation

Once yt-dlp is installed, MediaFetchr will automatically use it when the main library fails. You don't need to restart the application - it will detect yt-dlp automatically.

## Troubleshooting

- **"yt-dlp is not recognized"**: Make sure it's in your PATH or use full path
- **Python errors**: Make sure Python is installed and in PATH
- **Permission errors**: Run PowerShell/Command Prompt as Administrator

