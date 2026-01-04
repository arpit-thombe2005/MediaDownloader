import { NextRequest, NextResponse } from 'next/server';
import { detectPlatform, extractYouTubeId, extractInstagramShortcode, extractSpotifyId } from '@/lib/utils';
import { spawn } from 'child_process';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const platform = detectPlatform(url);

    switch (platform) {
      case 'youtube':
        return await fetchYouTubeInfo(url);
      case 'instagram':
        return await fetchInstagramInfo(url);
      case 'spotify':
        return await fetchSpotifyInfo(url);
      default:
        return NextResponse.json(
          { error: 'Unsupported platform. Please use YouTube, Instagram, or Spotify URLs.' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Error fetching media info:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch media information' },
      { status: 500 }
    );
  }
}

async function fetchYouTubeInfo(url: string): Promise<NextResponse> {
  try {
    // Extract video ID for validation
    const videoId = extractYouTubeId(url);
    
    if (!videoId) {
      // Check if it's a playlist
      if (url.includes('/playlist?list=') || url.includes('/shorts/') && /PL|UU|LL|FL|RD|OL|UL|PU/i.test(url)) {
        throw new Error('Playlists are not supported. Please use a single video URL.');
      }
      throw new Error('Could not extract video ID from URL. Please ensure you are using a valid YouTube video URL.');
    }

    // Normalize URL to standard YouTube watch format
    let normalizedUrl = url;
    if (url.includes('youtu.be/')) {
      normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url.includes('/shorts/')) {
      normalizedUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }

    // Use yt-dlp to fetch YouTube info (ytdl-core always fails, so skip it to avoid debug files)
    return new Promise<NextResponse>((resolve, reject) => {
      const pythonCommands = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
      
      // Detect if running on Render (shared IP = more aggressive rate limiting)
      const isRender = process.env.RENDER || process.env.RENDER_SERVICE_ID || false;
      
      // Add initial delay on Render to avoid immediate rate limiting
      if (isRender) {
        const initialDelay = Math.random() * 2000 + 1000; // 1-3 seconds random delay
        setTimeout(() => {
          startFetch();
        }, initialDelay);
      } else {
        startFetch();
      }
      
      function startFetch() {
        // Try with JS runtime first, then fallback without it
        // Track retry attempts for rate limiting
        const maxRetries = isRender ? 5 : 3; // More retries on Render
        
        function tryWithJsRuntime(pythonIndex: number, useJsRuntime: boolean = true, retryAttempt: number = 0) {
        if (pythonIndex >= pythonCommands.length) {
          reject(new Error('YouTube: yt-dlp is not installed. Please install it: pip install yt-dlp'));
          return;
        }
        
        const pythonCmd = pythonCommands[pythonIndex];
        // Add JavaScript runtime support and better headers for YouTube
        // Use player clients that don't require PO tokens (android requires GVS PO Token)
        // Rotate between ios and web to reduce rate limiting
        const playerClients = ['ios', 'web'];
        const clientIndex = Math.floor(Math.random() * playerClients.length);
        const selectedClient = playerClients[clientIndex];
        
        // Detect if running on Render (shared IP = more aggressive rate limiting)
        const isRender = process.env.RENDER || process.env.RENDER_SERVICE_ID || false;
        const baseDelay = isRender ? '3' : '1'; // Longer delays on Render
        const maxDelay = isRender ? '8' : '3'; // Much longer max delay on Render
        
        // Rotate user agents to appear more like different browsers
        const userAgents = [
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        ];
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        
        const ytdlpArgs = [
          '-m', 'yt_dlp',
          '--dump-json',
          '--user-agent', userAgent,
          '--extractor-args', `youtube:player_client=${selectedClient}`,
          '--sleep-interval', baseDelay, // Longer delay on Render
          '--max-sleep-interval', maxDelay, // Much longer max delay on Render
          '--sleep-subtitles', '1', // Delay for subtitles too
        ];
        
        // Add JS runtime if available and requested
        if (useJsRuntime) {
          // Use Node.js runtime - yt-dlp will find it in PATH
          // If Node.js is not in PATH, we can specify the path explicitly
          const nodePath = process.execPath;
          if (nodePath) {
            ytdlpArgs.push('--js-runtimes', `node:${nodePath}`);
          } else {
            ytdlpArgs.push('--js-runtimes', 'node');
          }
          // Add remote components for JS challenge solving (recommended by yt-dlp)
          ytdlpArgs.push('--remote-components', 'ejs:github');
        }
        
        ytdlpArgs.push(normalizedUrl);
        
        const pythonProcess = spawn(pythonCmd, ytdlpArgs);
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              // Extract the last valid JSON object from the output
              const lines = output.trim().split('\n').filter(line => line.trim());
              let info;
              for (let i = lines.length - 1; i >= 0; i--) {
                try {
                  info = JSON.parse(lines[i]);
                  break;
                } catch (e) {
                  // Continue to next line
                }
              }
              
              if (!info) {
                throw new Error('No valid JSON found in yt-dlp output');
              }
              
              const isVideo = info.vcodec && info.vcodec !== 'none';
              const isAudio = info.acodec && info.acodec !== 'none';
              
              // Extract thumbnail
              let thumbnail = info.thumbnail || 
                             info.thumbnails?.[0]?.url || 
                             (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[info.thumbnails.length - 1]?.url : null) ||
                             null;
              
              if (Array.isArray(thumbnail)) {
                thumbnail = thumbnail[thumbnail.length - 1]?.url || thumbnail[thumbnail.length - 1] || null;
              }
              
              return resolve(NextResponse.json({
                platform: 'youtube',
                title: info.title || info.fulltitle || 'YouTube Video',
                thumbnail: thumbnail,
                duration: info.duration || 0,
                description: info.description || '',
                formats: {
                  video: isVideo,
                  audio: isAudio,
                },
              }));
            } catch (parseError: any) {
              reject(new Error(`YouTube: Failed to parse yt-dlp output: ${parseError.message}`));
            }
          } else {
            // Check for rate limiting (429) or bot detection errors
            const errorLower = errorOutput.toLowerCase();
            if (errorLower.includes('429') || errorLower.includes('too many requests')) {
              // Implement exponential backoff for rate limiting (more aggressive on Render)
              if (retryAttempt < maxRetries) {
                const baseDelay = isRender ? 5000 : 1000; // Start with 5s on Render, 1s locally
                const maxDelay = isRender ? 30000 : 10000; // Max 30s on Render, 10s locally
                const delay = Math.min(baseDelay * Math.pow(2, retryAttempt), maxDelay);
                const jitter = Math.random() * 2000; // Add random jitter (0-2s)
                const totalDelay = delay + jitter;
                console.log(`YouTube rate limited, retrying after ${Math.round(totalDelay)}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
                setTimeout(() => {
                  tryWithJsRuntime(pythonIndex, useJsRuntime, retryAttempt + 1);
                }, totalDelay);
                return;
              }
              reject(new Error('YouTube: Rate limit exceeded. Please try again in a few minutes.'));
            } else if (errorLower.includes('sign in') || errorLower.includes('bot') || errorLower.includes('captcha')) {
              // For bot detection, wait longer before retry (even longer on Render)
              if (retryAttempt < maxRetries) {
                const baseDelay = isRender ? 10000 : 2000; // Start with 10s on Render, 2s locally
                const maxDelay = isRender ? 45000 : 15000; // Max 45s on Render, 15s locally
                const delay = Math.min(baseDelay * Math.pow(2, retryAttempt), maxDelay);
                const jitter = Math.random() * 3000; // Add random jitter (0-3s)
                const totalDelay = delay + jitter;
                console.log(`YouTube bot detection, retrying after ${Math.round(totalDelay)}ms (attempt ${retryAttempt + 1}/${maxRetries})`);
                setTimeout(() => {
                  tryWithJsRuntime(pythonIndex, useJsRuntime, retryAttempt + 1);
                }, totalDelay);
                return;
              }
              reject(new Error('YouTube: Bot detection triggered. This may resolve automatically. Please try again later.'));
            } else if (errorLower.includes('javascript runtime') || errorLower.includes('js-runtimes')) {
              // JS runtime error - try without it
              if (useJsRuntime) {
                tryWithJsRuntime(pythonIndex, false, retryAttempt);
              } else if (pythonIndex < pythonCommands.length - 1) {
                tryWithJsRuntime(pythonIndex + 1, true, retryAttempt);
              } else {
                reject(new Error(`YouTube: yt-dlp failed: ${errorOutput || 'Unknown error'}`));
              }
            } else if (pythonIndex < pythonCommands.length - 1) {
              tryWithJsRuntime(pythonIndex + 1, useJsRuntime, retryAttempt);
            } else {
              reject(new Error(`YouTube: yt-dlp failed: ${errorOutput || 'Unknown error'}`));
            }
          }
        });
        
        pythonProcess.on('error', () => {
          if (pythonIndex < pythonCommands.length - 1) {
            tryWithJsRuntime(pythonIndex + 1, useJsRuntime);
          } else {
            reject(new Error('YouTube: Python not found. Please install Python.'));
          }
        });
      }
      
        tryWithJsRuntime(0, true);
      }
    });
  } catch (error: any) {
    throw new Error(`YouTube: ${error.message}`);
  }
}

async function fetchInstagramInfo(url: string): Promise<NextResponse> {
  try {
    const shortcode = extractInstagramShortcode(url);
    if (!shortcode) {
      throw new Error('Invalid Instagram URL');
    }

    // Use yt-dlp to fetch Instagram info (it handles Instagram authentication)
    return new Promise<NextResponse>((resolve, reject) => {
      const pythonCommands = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
      
      function tryPythonCommand(index: number) {
        if (index >= pythonCommands.length) {
          reject(new Error('Instagram: yt-dlp is not installed. Please install it: pip install yt-dlp'));
          return;
        }
        
        const pythonCmd = pythonCommands[index];
        const pythonProcess = spawn(pythonCmd, ['-m', 'yt_dlp', '--dump-json', url]);
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              // yt-dlp outputs JSON on stdout, but might have multiple lines or warnings
              // Extract the last valid JSON object from the output
              const lines = output.trim().split('\n').filter(line => line.trim());
              let info;
              for (let i = lines.length - 1; i >= 0; i--) {
                try {
                  info = JSON.parse(lines[i]);
                  break;
                } catch (e) {
                  // Continue to next line
                }
              }
              
              if (!info) {
                throw new Error('No valid JSON found in yt-dlp output');
              }
              
              const isVideo = info.vcodec && info.vcodec !== 'none';
              
              // Extract thumbnail from various possible fields in yt-dlp output
              let thumbnail = info.thumbnail || 
                             info.thumbnails?.[0]?.url || 
                             (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[info.thumbnails.length - 1]?.url : null) ||
                             info.display_url ||
                             info.display_thumb ||
                             info.image ||
                             info.thumb ||
                             null;
              
              // If thumbnail is an array, get the last (highest quality) one
              if (Array.isArray(thumbnail)) {
                thumbnail = thumbnail[thumbnail.length - 1]?.url || thumbnail[thumbnail.length - 1] || null;
              }
              
              return resolve(NextResponse.json({
                platform: 'instagram',
                title: info.title || info.description || info.fulltitle || 'Instagram Media',
                thumbnail: thumbnail,
                duration: info.duration || null,
                formats: {
                  video: isVideo,
                  audio: info.acodec && info.acodec !== 'none',
                },
              }));
            } catch (parseError: any) {
              reject(new Error(`Instagram: Failed to parse yt-dlp output: ${parseError.message}`));
            }
          } else {
            // Try next Python command
            if (index < pythonCommands.length - 1) {
              tryPythonCommand(index + 1);
            } else {
              reject(new Error(`Instagram: yt-dlp failed: ${errorOutput || 'Unknown error'}`));
            }
          }
        });
        
        pythonProcess.on('error', () => {
          // Python command not found, try next one
          tryPythonCommand(index + 1);
        });
      }
      
      tryPythonCommand(0);
    });
  } catch (error: any) {
    throw new Error(`Instagram: ${error.message}`);
  }
}

async function fetchSpotifyInfo(url: string): Promise<NextResponse> {
  try {
    const { type, id } = extractSpotifyId(url);
    
    if (!type || !id) {
      throw new Error('Invalid Spotify URL. Please provide a valid track URL.');
    }
    
    // Only single tracks are supported - reject playlists and albums
    if (type === 'playlist' || type === 'album') {
    return NextResponse.json({
      platform: 'spotify',
        title: 'Playlist/Album Not Supported',
        thumbnail: null,
        duration: null,
        formats: {
          video: false,
          audio: true,
        },
        spotifyType: type,
        spotifyId: id,
        error: true,
        message: 'Only single track downloads are supported. Please use a Spotify track URL instead of a playlist or album URL.',
      });
    }

    // Use spotdl to fetch Spotify metadata
    // spotdl can extract metadata from Spotify URLs and search YouTube
    return new Promise<NextResponse>((resolve: (value: NextResponse) => void, reject: (reason?: any) => void) => {
      const pythonCommands = process.platform === 'win32' ? ['py', 'python', 'python3'] : ['python3', 'python'];
      
      function tryPythonCommand(index: number) {
        if (index >= pythonCommands.length) {
          reject(new Error('Spotify: spotdl is not installed. Please install it: pip install spotdl'));
          return;
        }
        
        const pythonCmd = pythonCommands[index];
        // Use spotdl to get track metadata
        // spotdl search gets metadata directly from Spotify URL, then finds best YouTube match
        const args = ['-m', 'spotdl', 'search', url, '--print-json'];
        const pythonProcess = spawn(pythonCmd, args);
        let output = '';
        let errorOutput = '';
        
        pythonProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data: Buffer) => {
          errorOutput += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
          if (code === 0) {
            try {
              // spotdl outputs JSON lines
              const lines = output.trim().split('\n').filter(line => line.trim());
              const tracks: any[] = [];
              
              for (const line of lines) {
                try {
                  const trackInfo = JSON.parse(line);
                  tracks.push(trackInfo);
                } catch (e) {
                  // Skip invalid JSON lines
                }
              }
              
              if (tracks.length === 0) {
                throw new Error('No valid JSON found in spotdl output');
              }
              
              // Use first result (single track)
              const info = tracks[0];
              
              // Extract thumbnail from YouTube result
              let thumbnail = info.thumbnail || 
                             info.thumbnails?.[0]?.url || 
                             (info.thumbnails && info.thumbnails.length > 0 ? info.thumbnails[info.thumbnails.length - 1]?.url : null) ||
                             null;
              
              if (Array.isArray(thumbnail)) {
                thumbnail = thumbnail[thumbnail.length - 1]?.url || thumbnail[thumbnail.length - 1] || null;
              }
              
              // Build title from artist and name - try multiple fields
              // spotdl returns: name, artists array, or title field
              const title = info.name || info.title || info.song || info.track_name || info.display_name || 'Unknown Track';
              const artist = info.artists?.[0]?.name || 
                           info.artist || 
                           (Array.isArray(info.artists) ? info.artists.map((a: any) => a.name || a).join(', ') : '') ||
                           '';
              const fullTitle = artist ? `${artist} - ${title}` : title;
              
              return resolve(NextResponse.json({
                platform: 'spotify',
                title: fullTitle,
                thumbnail: thumbnail,
                duration: info.duration || null,
                description: info.description || '',
                formats: {
                  video: false,
                  audio: true,
                },
                spotifyType: type,
                spotifyId: id,
              }));
            } catch (parseError: any) {
              // If spotdl output can't be parsed, try to get basic info from URL
              // or use a fallback approach
              console.error('Failed to parse spotdl output:', parseError);
              
              // Try to extract info from error output or use URL-based fallback
              // For now, return a message that will be updated during download
              resolve(NextResponse.json({
                platform: 'spotify',
                title: `Loading track info...`,
                thumbnail: null,
                duration: null,
                formats: {
                  video: false,
                  audio: true,
                },
                spotifyType: type,
                spotifyId: id,
                note: 'Fetching track information...',
              }));
            }
            } else {
            // spotdl might not be installed or failed
            if (errorOutput.includes('No module named') || errorOutput.includes('command not found')) {
              if (index < pythonCommands.length - 1) {
                tryPythonCommand(index + 1);
              } else {
                reject(new Error('Spotify: spotdl is not installed. Please install it: pip install spotdl'));
              }
              } else {
                console.error('spotdl search failed:', errorOutput);
                if (index < pythonCommands.length - 1) {
                  tryPythonCommand(index + 1);
                } else {
                  // Return a placeholder - the actual name will be extracted from downloaded file
                  resolve(NextResponse.json({
                    platform: 'spotify',
                    title: 'Spotify Track',
      thumbnail: null,
                    duration: null,
                    formats: {
                      video: false,
                      audio: true,
                    },
                    spotifyType: type,
                    spotifyId: id,
                    note: 'Track name will be shown after download',
                  }));
                }
              }
          }
        });
        
        pythonProcess.on('error', () => {
          tryPythonCommand(index + 1);
        });
      }
      
      tryPythonCommand(0);
    });
  } catch (error: any) {
    throw new Error(`Spotify: ${error.message}`);
  }
}


