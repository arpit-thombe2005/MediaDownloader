# MediaFetchr - yt-dlp Installation Script
# Run this script in PowerShell (as Administrator for best results)

Write-Host "MediaFetchr - Installing yt-dlp..." -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
$pythonInstalled = $false
try {
    $null = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pythonVersion = python --version
        Write-Host "Python found: $pythonVersion" -ForegroundColor Green
        $pythonInstalled = $true
    }
} catch {
    Write-Host "Python not found" -ForegroundColor Yellow
}

# Check if yt-dlp is already installed
$ytdlpInstalled = $false
try {
    $null = yt-dlp --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $ytdlpVersion = yt-dlp --version
        Write-Host "yt-dlp already installed: $ytdlpVersion" -ForegroundColor Green
        $ytdlpInstalled = $true
    }
} catch {
    Write-Host "yt-dlp not found" -ForegroundColor Yellow
}

if ($ytdlpInstalled) {
    Write-Host ""
    Write-Host "yt-dlp is already installed! You are all set." -ForegroundColor Green
    exit 0
}

# Try to install via pip if Python is available
if ($pythonInstalled) {
    Write-Host ""
    Write-Host "Installing yt-dlp via pip..." -ForegroundColor Cyan
    pip install yt-dlp
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "yt-dlp installed successfully!" -ForegroundColor Green
        Write-Host ""
        yt-dlp --version
        exit 0
    } else {
        Write-Host "pip install failed" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Python is not installed. Here are your options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install Python first" -ForegroundColor Cyan
    Write-Host "  1. Download Python from https://www.python.org/downloads/"
    Write-Host "  2. During installation, check Add Python to PATH"
    Write-Host "  3. Run this script again"
    Write-Host ""
    Write-Host "Option 2: Download yt-dlp.exe manually" -ForegroundColor Cyan
    Write-Host "  1. Go to https://github.com/yt-dlp/yt-dlp/releases"
    Write-Host "  2. Download yt-dlp.exe"
    Write-Host "  3. Place it in a folder and add to PATH"
    Write-Host ""
    Write-Host "For detailed instructions, see INSTALL_YTDLP.md" -ForegroundColor Yellow
    exit 1
}
