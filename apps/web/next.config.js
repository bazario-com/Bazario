/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxies API calls through this same domain so the refresh-token cookie
  // is first-party (set by www.shopina.pk, not api.shopina.pk) — required
  // because browsers increasingly block third-party cookies by default,
  // which broke sessions on reload regardless of correct SameSite/Secure
  // cookie attributes on the API side.
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://api.shopina.pk/api/v1/:path*',
      },
    ];
  },
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
