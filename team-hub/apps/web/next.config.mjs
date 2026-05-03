/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Proxy all /api/* requests to the backend.
    // This makes cookies work cross-domain because the browser
    // sees all requests as same-origin.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // Remove trailing /api from base URL if present, then append
    const backendBase = apiUrl.replace(/\/api\/?$/, "");
    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
