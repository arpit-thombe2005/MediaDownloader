import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform, extractYouTubeId, extractInstagramShortcode, extractSpotifyId } from '@/lib/utils';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, format, quality, platform } = body;

    if (!url || !format || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    switch (platform) {
      case 'youtube':
        return await downloadYouTube(url, format, quality);
      case 'instagram':
        return await downloadInstagram(url, format);
      case 'spotify':
        return await downloadSpotify(url, format);
      default:
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: error.message || 'Download failed' },
      { status: 500 }
    );
  }
}

async function downloadYouTube(url: string, format: string, quality: string) {
  // Extract video ID for validation
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    throw new Error('Could not extract video ID from URL');
  }

  // Normalize URL to standard YouTube watch format for better compatibility
  let normalizedUrl = url;
  if (url.includes('youtu.be/')) {
    normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
  } else if (url.includes('/shorts/')) {
    normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
  }

  // Use yt-dlp directly (ytdl-core always fails, so skip it to avoid debug files)
  return await downloadWithYtDlp(normalizedUrl, format, quality, videoId);
}

async function downloadWithYtDlp(url: string, format: string, quality: string, videoId: string): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir();
    const extension = format === 'audio' ? 'mp3' : 'mp4';
    const outputPath = path.join(tempDir, `${videoId}.${extension}`);
    
    // Build yt-dlp arguments
    const args: string[] = [
      url,
      '-o', outputPath,
      '--no-playlist',
    ];
    
    if (format === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      // Video quality mapping - merge video and audio streams
      // Prefer H.264 (avc1) video and AAC (mp4a) audio codecs for maximum compatibility
      // AV1 and Opus codecs are not widely supported by media players
      const qualityMap: Record<string, string> = {
        best: 'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo[vcodec^=avc1]+bestaudio/bestvideo+bestaudio',
        '1080p': 'bestvideo[vcodec^=avc1][height<=1080]+bestaudio[acodec^=mp4a]/bestvideo[vcodec^=avc1][height<=1080]+bestaudio/bestvideo[height<=1080]+bestaudio',
        '720p': 'bestvideo[vcodec^=avc1][height<=720]+bestaudio[acodec^=mp4a]/bestvideo[vcodec^=avc1][height<=720]+bestaudio/bestvideo[height<=720]+bestaudio',
        '480p': 'bestvideo[vcodec^=avc1][height<=480]+bestaudio[acodec^=mp4a]/bestvideo[vcodec^=avc1][height<=480]+bestaudio/bestvideo[height<=480]+bestaudio',
        '360p': 'bestvideo[vcodec^=avc1][height<=360]+bestaudio[acodec^=mp4a]/bestvideo[vcodec^=avc1][height<=360]+bestaudio/bestvideo[height<=360]+bestaudio',
      };
      args.push('-f', qualityMap[quality] || 'bestvideo[vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo+bestaudio');
      // Force mp4 output format when merging streams (requires ffmpeg)
      args.push('--merge-output-format', 'mp4');
    }
    
    // Try different methods to run yt-dlp
    // Update PATH to include system PATH (for ffmpeg support)
    const env = { ...process.env };
    if (process.platform === 'win32') {
      // On Windows, ensure PATH includes system and user paths for ffmpeg
      try {
        const { execSync } = require('child_process');
        const systemPath = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'Path\',\'Machine\')"', { encoding: 'utf-8' }).trim();
        const userPath = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'Path\',\'User\')"', { encoding: 'utf-8' }).trim();
        env.PATH = `${systemPath};${userPath};${process.env.PATH || ''}`;
      } catch (e) {
        // If we can't update PATH, use default
      }
    }
    
    // Method 1: Try yt-dlp directly (if in PATH)
    const ytdlpCommand = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const ytdlp = spawn(ytdlpCommand, args, { env });
    const chunks: Buffer[] = [];
    let errorOutput = '';
    
    ytdlp.stdout.on('data', (data: Buffer) => {
      chunks.push(data);
    });
    
    ytdlp.stderr.on('data', (data: Buffer) => {
      const output = data.toString();
      errorOutput += output;
    });
    
    ytdlp.on('close', async (code) => {
      if (code !== 0) {
        // Try with python -m yt_dlp as fallback
        // Error code -4058 on Windows means file not found
        if (code === -4058 || errorOutput.includes('not found') || errorOutput.includes('command not found') || errorOutput.includes('ENOENT')) {
          const pythonCommands = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
          
          function tryPythonCommand(index: number) {
            if (index >= pythonCommands.length) {
              reject(new Error(`yt-dlp is not installed. Please install it:\n1. Install Python: https://www.python.org/downloads/\n2. Run: pip install yt-dlp\n\nOr download yt-dlp.exe from: https://github.com/yt-dlp/yt-dlp/releases`));
              return;
            }
            
            const pythonCmd = pythonCommands[index];
            const pythonArgs = ['-m', 'yt_dlp', ...args];
            const pythonProcess = spawn(pythonCmd, pythonArgs, { env });
            const pythonChunks: Buffer[] = [];
            let pythonError = '';
            
            pythonProcess.stdout.on('data', (data: Buffer) => {
              pythonChunks.push(data);
            });
            
            pythonProcess.stderr.on('data', (data: Buffer) => {
              pythonError += data.toString();
            });
            
            pythonProcess.on('close', async (pythonCode) => {
              if (pythonCode === 0) {
                // Check for the downloaded file - search broadly
                let actualFilePath = outputPath;
                if (!fs.existsSync(outputPath)) {
                  // List all files in temp directory that start with videoId
                  let found = false;
                  try {
                    const files = fs.readdirSync(tempDir);
                    const matchingFiles = files.filter(file => file.startsWith(videoId));
                    
                    // Prefer files without format ID suffixes (merged files) or mp4 files (video files)
                    const sortedFiles = matchingFiles.sort((a, b) => {
                      const aHasFormatId = /\.f\d+\./.test(a);
                      const bHasFormatId = /\.f\d+\./.test(b);
                      const aIsMp4 = a.endsWith('.mp4');
                      const bIsMp4 = b.endsWith('.mp4');
                      
                      // Prefer files without format ID (merged files)
                      if (!aHasFormatId && bHasFormatId) return -1;
                      if (aHasFormatId && !bHasFormatId) return 1;
                      
                      // Among format ID files, prefer mp4 (video) over webm (audio)
                      if (aHasFormatId && bHasFormatId) {
                        if (aIsMp4 && !bIsMp4) return -1;
                        if (!aIsMp4 && bIsMp4) return 1;
                      }
                      
                      return 0;
                    });
                    
                    for (const file of sortedFiles) {
                      const candidatePath = path.join(tempDir, file);
                      try {
                        const stats = fs.statSync(candidatePath);
                        if (stats.isFile()) {
                          actualFilePath = candidatePath;
                          found = true;
                          break;
                        }
                      } catch (e) {
                        // Skip if file can't be accessed
                      }
                    }
                  } catch (dirError) {
                    console.error('Error reading temp directory:', dirError);
                  }
                  
                  // Also try common extensions as fallback
                  if (!found) {
                    const baseName = path.join(tempDir, videoId);
                    const possibleExtensions = format === 'audio' ? ['.mp3', '.m4a', '.webm', '.opus', '.ogg'] : ['.mp4', '.webm', '.mkv', '.m4v', '.flv', '.avi'];
                    for (const ext of possibleExtensions) {
                      const candidatePath = baseName + ext;
                      if (fs.existsSync(candidatePath)) {
                        actualFilePath = candidatePath;
                        found = true;
                        break;
                      }
                    }
                  }
                  
                  if (!found) {
                    console.error('yt-dlp stderr output:', pythonError);
                    reject(new Error(`yt-dlp failed: Output file not found. Searched for files starting with "${videoId}" in ${tempDir}. Error: ${pythonError.substring(0, 200)}`));
                    return;
                  }
                }
                
                try {
                  const fileBuffer = fs.readFileSync(actualFilePath);
                  fs.unlinkSync(actualFilePath); // Clean up
                  
                  const contentType = format === 'audio' ? 'audio/mpeg' : 'video/mp4';
                  resolve(new NextResponse(fileBuffer, {
                    headers: {
                      'Content-Type': contentType,
                      'Content-Disposition': `attachment; filename="media.${extension}"`,
                      'Content-Length': fileBuffer.length.toString(),
                    },
                  }));
                } catch (fileError: any) {
                  reject(new Error(`Failed to read downloaded file: ${fileError.message}`));
                }
              } else {
                // Try next Python command
                tryPythonCommand(index + 1);
              }
            });
            
            pythonProcess.on('error', () => {
              // Python command not found, try next one
              tryPythonCommand(index + 1);
            });
          }
          
          tryPythonCommand(0);
          return;
        }
        // If we get here, python fallback also failed or wasn't triggered
        reject(new Error(`yt-dlp failed with code ${code}: ${errorOutput || 'Unknown error'}`));
        return;
      }
      
      // Read the downloaded file - check for the expected file first
      let actualFilePath = outputPath;
      if (!fs.existsSync(outputPath)) {
        // If file not found with expected extension, search for any file starting with videoId
        // List all files in temp directory that start with videoId
        let found = false;
        try {
          const files = fs.readdirSync(tempDir);
          const matchingFiles = files.filter(file => file.startsWith(videoId));
          
          // Prefer mp4 files (video) over other formats
          // Sort files: mp4 files first (whether with or without format ID), then others
          const sortedFiles = matchingFiles.sort((a, b) => {
            const aIsMp4 = a.endsWith('.mp4');
            const bIsMp4 = b.endsWith('.mp4');
            
            // Always prefer mp4 files
            if (aIsMp4 && !bIsMp4) return -1;
            if (!aIsMp4 && bIsMp4) return 1;
            
            // If both are mp4 or both are not, prefer files without format ID (merged files)
            const aHasFormatId = /\.f\d+\./.test(a);
            const bHasFormatId = /\.f\d+\./.test(b);
            if (!aHasFormatId && bHasFormatId) return -1;
            if (aHasFormatId && !bHasFormatId) return 1;
            
            return 0;
          });
          
          for (const file of sortedFiles) {
            const candidatePath = path.join(tempDir, file);
            try {
              const stats = fs.statSync(candidatePath);
              if (stats.isFile()) {
                actualFilePath = candidatePath;
                found = true;
                break;
              }
            } catch (e) {
              // Skip if file can't be accessed
            }
          }
        } catch (dirError) {
          console.error('Error reading temp directory:', dirError);
        }
        
        // Also try common extensions as fallback
        if (!found) {
          const baseName = path.join(tempDir, videoId);
          const possibleExtensions = format === 'audio' ? ['.mp3', '.m4a', '.webm', '.opus', '.ogg'] : ['.mp4', '.webm', '.mkv', '.m4v', '.flv', '.avi'];
          for (const ext of possibleExtensions) {
            const candidatePath = baseName + ext;
            if (fs.existsSync(candidatePath)) {
              actualFilePath = candidatePath;
              found = true;
              break;
            }
          }
        }
        
        if (!found) {
          console.error('yt-dlp stderr output:', errorOutput);
          reject(new Error(`yt-dlp completed but output file not found. Searched for files starting with "${videoId}" in ${tempDir}. Error output: ${errorOutput.substring(0, 200)}`));
          return;
        }
      }
      
      try {
        const fileBuffer = fs.readFileSync(actualFilePath);
        fs.unlinkSync(actualFilePath); // Clean up temp file
        
        const contentType = format === 'audio' ? 'audio/mpeg' : 'video/mp4';
        resolve(new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="media.${extension}"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        }));
      } catch (fileError: any) {
        reject(new Error(`Failed to read downloaded file: ${fileError.message}`));
      }
    });
    
    ytdlp.on('error', (error: Error) => {
      // If yt-dlp command not found, try python -m yt_dlp
      if (error.message.includes('ENOENT') || error.code === 'ENOENT' || error.message.includes('spawn') || error.message.includes('not found')) {
        // Try python fallback - on Windows, try 'py' first, then 'python', then 'python3'
        const pythonCommands = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
        
        function tryPythonCommand(index: number) {
          if (index >= pythonCommands.length) {
            reject(new Error(`yt-dlp is not installed. Please install it:\n1. Install Python: https://www.python.org/downloads/\n2. Run: pip install yt-dlp\n\nOr download yt-dlp.exe from: https://github.com/yt-dlp/yt-dlp/releases`));
            return;
          }
          
          const pythonCmd = pythonCommands[index];
          const pythonArgs = ['-m', 'yt_dlp', ...args];
          const pythonProcess = spawn(pythonCmd, pythonArgs);
          const pythonChunks: Buffer[] = [];
          let pythonError = '';
          
          pythonProcess.stdout.on('data', (data: Buffer) => {
            pythonChunks.push(data);
          });
          
          pythonProcess.stderr.on('data', (data: Buffer) => {
            pythonError += data.toString();
          });
          
          pythonProcess.on('close', async (pythonCode) => {
            if (pythonCode === 0) {
              // Check for the downloaded file - search broadly
              let actualFilePath = outputPath;
              if (!fs.existsSync(outputPath)) {
                // List all files in temp directory that start with videoId
                let found = false;
                try {
                  const files = fs.readdirSync(tempDir);
                  const matchingFiles = files.filter(file => file.startsWith(videoId));
                  
                  // Prefer files without format ID suffixes (merged files) or mp4 files (video files)
                  const sortedFiles = matchingFiles.sort((a, b) => {
                    const aHasFormatId = /\.f\d+\./.test(a);
                    const bHasFormatId = /\.f\d+\./.test(b);
                    const aIsMp4 = a.endsWith('.mp4');
                    const bIsMp4 = b.endsWith('.mp4');
                    
                    // Prefer files without format ID (merged files)
                    if (!aHasFormatId && bHasFormatId) return -1;
                    if (aHasFormatId && !bHasFormatId) return 1;
                    
                    // Among format ID files, prefer mp4 (video) over webm (audio)
                    if (aHasFormatId && bHasFormatId) {
                      if (aIsMp4 && !bIsMp4) return -1;
                      if (!aIsMp4 && bIsMp4) return 1;
                    }
                    
                    return 0;
                  });
                  
                  for (const file of sortedFiles) {
                    const candidatePath = path.join(tempDir, file);
                    try {
                      const stats = fs.statSync(candidatePath);
                      if (stats.isFile()) {
                        actualFilePath = candidatePath;
                        found = true;
                        break;
                      }
                    } catch (e) {
                      // Skip if file can't be accessed
                    }
                  }
                } catch (dirError) {
                  console.error('Error reading temp directory:', dirError);
                }
                
                // Also try common extensions as fallback
                if (!found) {
                  const baseName = path.join(tempDir, videoId);
                  const possibleExtensions = format === 'audio' ? ['.mp3', '.m4a', '.webm', '.opus', '.ogg'] : ['.mp4', '.webm', '.mkv', '.m4v', '.flv', '.avi'];
                  for (const ext of possibleExtensions) {
                    const candidatePath = baseName + ext;
                    if (fs.existsSync(candidatePath)) {
                      actualFilePath = candidatePath;
                      found = true;
                      break;
                    }
                  }
                }
                
                if (!found) {
                  console.error('yt-dlp stderr output:', pythonError);
                  reject(new Error(`yt-dlp completed but output file not found. Searched for files starting with "${videoId}" in ${tempDir}. Error output: ${pythonError.substring(0, 200)}`));
                  return;
                }
              }
              
              try {
                const fileBuffer = fs.readFileSync(actualFilePath);
                fs.unlinkSync(actualFilePath);
                
                const contentType = format === 'audio' ? 'audio/mpeg' : 'video/mp4';
                resolve(new NextResponse(fileBuffer, {
                  headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': `attachment; filename="media.${extension}"`,
                    'Content-Length': fileBuffer.length.toString(),
                  },
                }));
              } catch (fileError: any) {
                reject(new Error(`Failed to read downloaded file: ${fileError.message}`));
              }
            } else {
              // Python process failed, try next command
              tryPythonCommand(index + 1);
            }
          });
          
          pythonProcess.on('error', () => {
            // Python command not found, try next one
            tryPythonCommand(index + 1);
          });
        }
        
        tryPythonCommand(0);
        return;
      }
      reject(new Error(`yt-dlp spawn error: ${error.message}`));
    });
  });
}

async function downloadInstagram(url: string, format: string) {
  // Use yt-dlp for Instagram downloads (similar to YouTube)
  const shortcode = extractInstagramShortcode(url);
  if (!shortcode) {
    throw new Error('Invalid Instagram URL');
  }
  
  // Use the same downloadWithYtDlp function we use for YouTube
  return await downloadWithYtDlp(url, format, 'best', shortcode);
}

async function downloadSpotify(url: string, format: string): Promise<NextResponse> {
  const { type, id } = extractSpotifyId(url);
  
  if (!type || !id) {
    throw new Error('Invalid Spotify URL');
  }
  
  // Only single tracks are supported - reject playlists and albums
  if (type === 'playlist' || type === 'album') {
    throw new Error('Only single track downloads are supported. Please use a Spotify track URL instead of a playlist or album URL.');
  }

  // Use spotdl to download Spotify tracks
  // spotdl handles: fetching metadata, searching YouTube, and downloading
  return new Promise<NextResponse>((resolve: (value: NextResponse) => void, reject: (reason?: any) => void) => {
    const pythonCommands = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
    const tempDir = os.tmpdir();
    
    function tryDownload(index: number) {
      if (index >= pythonCommands.length) {
        reject(new Error('Spotify: spotdl is not installed. Please install it: pip install spotdl'));
        return;
      }
      
      const pythonCmd = pythonCommands[index];
      
      // spotdl download command for single tracks
      // spotdl extracts metadata from Spotify URL and downloads from YouTube
      const args: string[] = [
        '-m', 'spotdl',
        url, // Spotify track URL - spotdl extracts metadata and downloads
        '--output', tempDir,
        '--output-format', 'mp3',
      ];
      
      // Update PATH for ffmpeg support (spotdl uses yt-dlp which needs ffmpeg)
      const env = { ...process.env };
      if (process.platform === 'win32') {
        try {
          const { execSync } = require('child_process');
          const systemPath = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'Path\',\'Machine\')"', { encoding: 'utf-8' }).trim();
          const userPath = execSync('powershell -Command "[System.Environment]::GetEnvironmentVariable(\'Path\',\'User\')"', { encoding: 'utf-8' }).trim();
          env.PATH = `${systemPath};${userPath};${process.env.PATH || ''}`;
        } catch (e) {
        }
      }
      
      // Record the start time to only include files created during this download
      const downloadStartTime = Date.now();
      
      // Get list of existing files before download starts
      let existingFiles: Set<string> = new Set();
      try {
        const filesBefore = fs.readdirSync(tempDir);
        existingFiles = new Set(filesBefore);
      } catch (e) {
        // Ignore if we can't read directory
      }
      
      const downloadProcess = spawn(pythonCmd, args, { env });
      let downloadOutput = '';
      let downloadError = '';
      let processKilled = false;
      
      // Set a timeout for the download process (3 minutes)
      const timeout = 180000; // 3 minutes
      const timeoutId = setTimeout(() => {
        if (!processKilled) {
          processKilled = true;
          console.error(`spotdl process timed out after ${timeout / 1000} seconds`);
          downloadProcess.kill('SIGTERM');
          // Force kill after 5 seconds if still running
          setTimeout(() => {
            try {
              downloadProcess.kill('SIGKILL');
            } catch (e) {
              // Process already dead
            }
          }, 5000);
          reject(new Error(`Spotify: Download timed out after ${timeout / 1000} seconds. spotdl may be stuck.`));
        }
      }, timeout);
      
      downloadProcess.stdout.on('data', (data: Buffer) => {
        downloadOutput += data.toString();
      });
      
      downloadProcess.stderr.on('data', (data: Buffer) => {
        downloadError += data.toString();
      });
      
      downloadProcess.on('close', async (code) => {
        clearTimeout(timeoutId);
        if (processKilled) {
          return; // Already handled by timeout
        }
        if (code === 0) {
          // spotdl downloads files with the track name as filename (e.g., "Artist - Title.mp3")
          // Wait a moment for the file to be written
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          try {
            const files = fs.readdirSync(tempDir);
            // Look for recently downloaded audio files
            
            const matchingFiles = files
              .map(file => {
                // Skip files that existed before download started
                if (existingFiles.has(file)) {
                  return null;
                }
                
                const filePath = path.join(tempDir, file);
                try {
                  const stats = fs.statSync(filePath);
                  if (!stats.isFile()) return null;
                  
                  const lowerFile = file.toLowerCase();
                  const isAudioFile = format === 'audio' && 
                    (lowerFile.endsWith('.mp3') || lowerFile.endsWith('.m4a') || lowerFile.endsWith('.flac') || lowerFile.endsWith('.opus'));
                  const isVideoFile = format === 'video' && 
                    (lowerFile.endsWith('.mp4') || lowerFile.endsWith('.webm'));
                  
                  if (isAudioFile || isVideoFile) {
                    // Only include files created after download started
                    const fileCreatedTime = stats.mtime.getTime();
                    const timeSinceStart = fileCreatedTime - downloadStartTime;
                    
                    // File must be created after download started (with 5 second buffer for clock differences)
                    if (timeSinceStart > -5000) {
                      const fileSize = stats.size;
                      // Exclude very large files (>50MB) as they might be corrupted
                      // Individual MP3 tracks are typically 3-8MB, max ~20MB for very long tracks
                      if (fileSize > 50 * 1024 * 1024) {
                        return null;
                      }
                      return { name: file, path: filePath, time: fileCreatedTime, size: fileSize };
                    }
                  }
                } catch (e) {
                  // Skip files we can't access
                }
                return null;
              })
              .filter(f => f !== null)
              .sort((a, b) => (a?.time || 0) - (b?.time || 0)); // Oldest first (first downloaded)
            
            
            if (matchingFiles.length === 0) {
              reject(new Error(`Spotify: No downloaded files found. spotdl output: ${downloadOutput.substring(0, 500)}`));
              return;
            }
            
            // Single track - return the file directly
            const file = matchingFiles[0];
            if (!file) {
              reject(new Error('Spotify: No file found'));
              return;
            }
            
            // spotdl names files as "Artist - Title.mp3" so the filename contains the correct info
            // Use the actual filename which spotdl creates from Spotify metadata
            const fileBuffer = fs.readFileSync(file.path);
            const fileName = file.name; // This should be "Artist - Title.mp3" from spotdl
            fs.unlinkSync(file.path); // Clean up
            
            const contentType = format === 'audio' ? 'audio/mpeg' : 'video/mp4';
            
            resolve(new NextResponse(fileBuffer, {
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': fileBuffer.length.toString(),
              },
            }));
          } catch (dirError: any) {
            reject(new Error(`Spotify: Error processing downloaded files: ${dirError.message}`));
          }
          } else {
            // Check if it's a "not installed" error or wrong command format
            if (downloadError.includes('No module named') || downloadError.includes('command not found')) {
              if (index < pythonCommands.length - 1) {
                tryDownload(index + 1);
              } else {
                reject(new Error('Spotify: spotdl is not installed. Please install it: pip install spotdl'));
              }
            } else if (downloadError.includes('unrecognized arguments') || downloadError.includes('invalid choice') || downloadError.includes('error: unrecognized arguments')) {
              // The version of spotdl doesn't support those arguments
              // Try without the unsupported arguments
              if (format === 'audio') {
                // Use basic command: spotdl <url> --output <dir> --output-format mp3
                const oldArgs = ['-m', 'spotdl', url, '--output', tempDir, '--output-format', 'mp3'];
                const oldProcess = spawn(pythonCmd, oldArgs, { env });
                let oldOutput = '';
                let oldError = '';
                
                oldProcess.stdout.on('data', (data: Buffer) => {
                  oldOutput += data.toString();
                });
                
                oldProcess.stderr.on('data', (data: Buffer) => {
                  oldError += data.toString();
                });
                
                oldProcess.on('close', async (oldCode) => {
                  if (oldCode === 0) {
                    // Find downloaded file (same logic as above)
                    let actualFilePath: string | null = null;
                    try {
                      const files = fs.readdirSync(tempDir);
                      const matchingFiles = files.filter(file => file.toLowerCase().endsWith('.mp3'));
                      const sortedFiles = matchingFiles
                        .map(file => ({
                          name: file,
                          path: path.join(tempDir, file),
                          time: fs.statSync(path.join(tempDir, file)).mtime.getTime()
                        }))
                        .sort((a, b) => b.time - a.time);
                      
                      if (sortedFiles.length > 0) {
                        actualFilePath = sortedFiles[0].path;
                      }
                    } catch (e) {
                      // Ignore
                    }
                    
                    if (actualFilePath && fs.existsSync(actualFilePath)) {
                      try {
                        const fileBuffer = fs.readFileSync(actualFilePath);
                        const fileName = path.basename(actualFilePath);
                        fs.unlinkSync(actualFilePath);
                        
                        resolve(new NextResponse(fileBuffer, {
                          headers: {
                            'Content-Type': 'audio/mpeg',
                            'Content-Disposition': `attachment; filename="${fileName}"`,
                            'Content-Length': fileBuffer.length.toString(),
                          },
                        }));
                      } catch (fileError: any) {
                        reject(new Error(`Spotify: Failed to read file: ${fileError.message}`));
                      }
                    } else {
                      reject(new Error(`Spotify: File not found after download`));
                    }
                  } else {
                    if (index < pythonCommands.length - 1) {
                      tryDownload(index + 1);
                    } else {
                      reject(new Error(`Spotify: Download failed: ${oldError || 'Unknown error'}`));
                    }
                  }
                });
              } else {
                // For video, spotdl doesn't support it, fall back to YouTube search
                reject(new Error('Spotify: Video format not supported by spotdl. Please use audio format.'));
              }
            } else {
              if (index < pythonCommands.length - 1) {
                tryDownload(index + 1);
              } else {
                reject(new Error(`Spotify: Download failed: ${downloadError || downloadOutput || 'Unknown error'}`));
              }
            }
          }
      });
      
      downloadProcess.on('error', (error: Error) => {
        if (index < pythonCommands.length - 1) {
          tryDownload(index + 1);
        } else {
          reject(new Error(`Spotify: Failed to start spotdl: ${error.message}. Please install it: pip install spotdl`));
        }
      });
    }
    
    tryDownload(0);
  });
}

