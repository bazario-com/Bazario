/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Placeholder pattern for the seed data's fake image filenames plus any
    // future S3/CloudFront-backed product images.
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
    ],
  },
};

module.exports = nextConfig;
