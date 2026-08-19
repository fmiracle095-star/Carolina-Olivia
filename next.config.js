/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'ais-dev-gbp4x223oivhgldmhx252c-462222078915.europe-west2.run.app',
    'ais-pre-gbp4x223oivhgldmhx252c-462222078915.europe-west2.run.app',
    '*.run.app'
  ],
};

export default nextConfig;
