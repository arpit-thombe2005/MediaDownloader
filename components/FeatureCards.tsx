'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const features = [
  {
    logo: '/logos/youtube.png',
    title: 'YouTube Downloads',
    description: 'Download videos in 1080p, 4K, or extract high-quality audio as MP3/M4A',
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
  },
  {
    logo: '/logos/instagram.png',
    title: 'Instagram Reels',
    description: 'Download Instagram reels and videos with a simple link paste',
    color: 'from-pink-500 to-purple-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
  },
  {
    logo: '/logos/spotify.png',
    title: 'Spotify Music',
    description: 'Download high-quality Spotify tracks with full metadata. Single track downloads only.',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
];

export default function FeatureCards() {
  return (
    <section className="container mx-auto px-4 py-16">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-3xl md:text-4xl font-bold text-center mb-12"
      >
        Supported Platforms
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`${feature.bgColor} rounded-2xl p-6 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all`}
          >
            <div className={`mb-4 w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg overflow-hidden`}>
              <Image
                src={feature.logo}
                alt={feature.title}
                width={64}
                height={64}
                className={`w-full h-full object-cover ${feature.title === 'Instagram Reels' ? 'scale-125' : ''}`}
              />
            </div>
            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}



