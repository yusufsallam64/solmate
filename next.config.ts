/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['katex'],
  webpack: (config: { module: { rules: { test: RegExp; type: string; }[]; }; }) => {
    config.module.rules.push({
      test: /\.woff2?$/,
      type: 'asset/resource',
    });
    return config;
  },
}

module.exports = nextConfig