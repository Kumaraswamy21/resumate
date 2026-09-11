import type { NextConfig } from "next";

const pdfNativePackages = [
  "./node_modules/pdf-parse/**/*",
  "./node_modules/pdfjs-dist/**/*",
  "./node_modules/@napi-rs/canvas/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-gnu/**/*",
  "./node_modules/@napi-rs/canvas-linux-x64-musl/**/*",
  "./node_modules/tesseract.js/**/*",
  "./node_modules/tesseract.js-core/**/*",
  "./node_modules/@tesseract.js-data/eng/**/*",
];

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      "pdf-parse",
      "pdfjs-dist",
      "@napi-rs/canvas",
      "mammoth",
      "tesseract.js",
      "@tesseract.js-data/eng",
    ],
  },
  outputFileTracingIncludes: {
    "/": pdfNativePackages,
    "/api/analyze": pdfNativePackages,
  },
};

export default nextConfig;
