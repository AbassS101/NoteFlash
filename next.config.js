/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    // Your webpack configuration changes here
    // For example:
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };
    
    return config;
  },
  // Add other configuration options as needed
};

module.exports = nextConfig;