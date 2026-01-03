'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import FeatureCards from '@/components/FeatureCards';
import Footer from '@/components/Footer';
import MediaPreview from '@/components/MediaPreview';
import { detectPlatform, isValidUrl, type Platform } from '@/lib/utils';

export default function Home() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [mediaInfo, setMediaInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    setError(null);
    setMediaInfo(null);
    
    if (newUrl.trim()) {
      if (isValidUrl(newUrl)) {
        const detected = detectPlatform(newUrl);
        setPlatform(detected);
      } else {
        setPlatform('unknown');
      }
    } else {
      setPlatform('unknown');
    }
  };

  const handleFetch = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    const detected = detectPlatform(url);
    if (detected === 'unknown') {
      setError('Unsupported platform. Please use YouTube, Instagram, or Spotify URLs.');
      return;
    }

    setLoading(true);
    setError(null);
    setMediaInfo(null);

    try {
      const response = await fetch(`/api/fetch-info?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch media information');
      }

      // Check if it's an error response (for playlists/albums)
      if (data.error || data.message) {
        // Still set mediaInfo so the error message can be displayed in MediaPreview
        setMediaInfo(data);
      } else {
        setMediaInfo(data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching media information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Hero
        url={url}
        onUrlChange={handleUrlChange}
        onFetch={handleFetch}
        platform={platform}
        loading={loading}
      />
      {error && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            {error}
          </div>
        </div>
      )}
      {mediaInfo && (
        <MediaPreview
          mediaInfo={mediaInfo}
          url={url}
          onClose={() => {
            setMediaInfo(null);
            setUrl('');
            setPlatform('unknown');
          }}
        />
      )}
      <FeatureCards />
      <Footer />
    </main>
  );
}




