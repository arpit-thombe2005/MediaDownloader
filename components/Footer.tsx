'use client';

import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-3xl mx-auto">
          <h3 className="text-xl font-bold mb-4">Legal Disclaimer</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Downify is provided for educational and personal use only. Users are responsible for ensuring
            they have the right to download content. Downloading copyrighted material without permission may
            violate copyright laws in your jurisdiction. We do not host or store any content on our servers.
            All downloads are processed on-demand and are the sole responsibility of the user.
          </p>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} Downify. Built with Next.js and TailwindCSS.</p>
        </div>
      </div>
    </footer>
  );
}



