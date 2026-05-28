/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com'
      }
    ]
  },
  env: {
    MONGODB_URI: process.env.MONGODB_URI,
    CLOUDINARY_URL: process.env.CLOUDINARY_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    WEATHER_API_KEY: process.env.WEATHER_API_KEY
  }
}

module.exports = nextConfig
