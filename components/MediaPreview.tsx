'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { formatDuration } from '@/lib/utils';

interface MediaPreviewProps {
  mediaInfo: any;
  url: string;
  onClose: () => void;
}

export default function MediaPreview({ mediaInfo, url, onClose }: MediaPreviewProps) {
  // Default to audio for Spotify, video for others
  const [format, setFormat] = useState<'video' | 'audio'>(mediaInfo.platform === 'spotify' ? 'audio' : 'video');
  const [quality, setQuality] = useState<string>('best');
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          format,
          quality,
          platform: mediaInfo.platform,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${mediaInfo.title || 'media'}.${format === 'video' ? 'mp4' : 'mp3'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setDownloadProgress(100);
    } catch (error: any) {
      alert(`Download failed: ${error.message}`);
    } finally {
      setDownloading(false);
      setTimeout(() => setDownloadProgress(0), 2000);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="container mx-auto px-4 py-8"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="relative">
            {mediaInfo.thumbnail && (
              <img
                src={mediaInfo.thumbnail}
                alt={mediaInfo.title}
                className="w-full h-64 md:h-96 object-cover"
              />
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{mediaInfo.title}</h2>
            {mediaInfo.duration && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Duration: {typeof mediaInfo.duration === 'number' ? formatDuration(mediaInfo.duration) : mediaInfo.duration}
              </p>
            )}

            {mediaInfo.platform === 'spotify' && (
              <div className={`mb-4 p-3 border rounded-lg text-sm ${
                mediaInfo.error 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
              }`}>
                <p className="font-semibold mb-1">{mediaInfo.error ? '⚠️' : 'ℹ️'} {mediaInfo.error ? 'Not Supported' : 'Note'}:</p>
                <p>
                  {mediaInfo.error 
                    ? mediaInfo.message || 'Only single track downloads are supported. Please use a Spotify track URL instead of a playlist or album URL.'
                    : 'Downloading high-quality audio with full metadata including artist, album, and cover art.'}
                </p>
              </div>
            )}

            {!mediaInfo.error && (
              <>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Format</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setFormat('video')}
                        disabled={mediaInfo.platform === 'spotify' && !mediaInfo.formats?.video}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      format === 'video'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        } ${mediaInfo.platform === 'spotify' && !mediaInfo.formats?.video ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Video (MP4)
                  </button>
                  <button
                    onClick={() => setFormat('audio')}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      format === 'audio'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Audio (MP3)
                  </button>
                </div>
              </div>

              {format === 'video' && (
                <div>
                  <label className="block text-sm font-semibold mb-2">Quality</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="best">Best Available (4K/1080p)</option>
                    <option value="1080p">1080p</option>
                    <option value="720p">720p</option>
                    <option value="480p">480p</option>
                    <option value="360p">360p</option>
                  </select>
                </div>
              )}
            </div>

            {downloadProgress > 0 && (
              <div className="mb-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${downloadProgress}%` }}
                    className="bg-primary-500 h-2 rounded-full"
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {downloadProgress}% downloaded
                </p>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {downloading ? 'Downloading...' : `Download ${format === 'video' ? 'Video' : 'Audio'}`}
            </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

