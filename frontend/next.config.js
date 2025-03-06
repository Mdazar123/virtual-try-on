/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.(gltf|glb|bin)$/,
      type: 'asset/resource'
    })
    return config
  },
  // Add this to ensure proper static file serving
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ]
  },
  // Add this to resolve WASM loading issues
  experimental: {
    esmExternals: false
  }
}

module.exports = nextConfig 