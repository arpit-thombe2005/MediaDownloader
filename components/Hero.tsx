'use client';

import { motion } from 'framer-motion';
import { detectPlatform, type Platform } from '@/lib/utils';

interface HeroProps {
  url: string;
  onUrlChange: (url: string) => void;
  onFetch: () => void;
  platform: Platform;
  loading: boolean;
}

export default function Hero({ url, onUrlChange, onFetch, platform, loading }: HeroProps) {
  const getPlatformIcon = () => {
    switch (platform) {
      case 'youtube':
        return '📺';
      case 'instagram':
        return '📷';
      case 'spotify':
        return '🎵';
      default:
        return '🔗';
    }
  };

  const getPlatformColor = () => {
    switch (platform) {
      case 'youtube':
        return 'border-red-500 focus:border-red-600';
      case 'instagram':
        return 'border-pink-500 focus:border-pink-600';
      case 'spotify':
        return 'border-green-500 focus:border-green-600';
      default:
        return 'border-gray-300 dark:border-gray-600 focus:border-primary-500';
    }
  };

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto text-center"
      >
        <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight leading-[1.1] pb-2">
          Downify
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
          Download videos and audio from YouTube, Instagram, and Spotify in the highest quality
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl">
                {getPlatformIcon()}
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && onFetch()}
                placeholder="Paste YouTube, Instagram, or Spotify URL here..."
                className={`w-full pl-14 pr-4 py-4 rounded-xl border-2 ${getPlatformColor()} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all`}
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFetch}
              disabled={loading || !url.trim()}
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Fetching...
                </span>
              ) : (
                'Fetch'
              )}
            </motion.button>
          </div>
          {platform !== 'unknown' && url.trim() && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-gray-500 dark:text-gray-400"
            >
              Detected: <span className="font-semibold capitalize">{platform}</span>
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}



