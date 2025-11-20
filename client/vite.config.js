import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Enable production optimizations
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
        passes: 3, // More aggressive compression
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_methods: true,
        toplevel: true,
      },
      mangle: {
        safari10: true,
        toplevel: true,
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Aggressive code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split node_modules into separate chunks
          if (id.includes("node_modules")) {
            // React core (keep together for better caching)
            if (
              id.includes("react") &&
              !id.includes("react-router") &&
              !id.includes("react-icons") &&
              !id.includes("react-toastify")
            ) {
              return "react-core";
            }
            // React Router (large, separate chunk)
            if (id.includes("react-router")) {
              return "react-router";
            }
            // Icons - split by icon family for better tree-shaking
            if (id.includes("react-icons/fa")) {
              return "icons-fa";
            }
            if (id.includes("react-icons/hi")) {
              return "icons-hi";
            }
            if (id.includes("react-icons/io")) {
              return "icons-io";
            }
            if (id.includes("react-icons/md")) {
              return "icons-md";
            }
            if (id.includes("react-icons/bi")) {
              return "icons-bi";
            }
            if (id.includes("react-icons")) {
              return "icons-base";
            }
            // Toastify (only used in one place)
            if (id.includes("react-toastify")) {
              return "toastify";
            }
            // Axios
            if (id.includes("axios")) {
              return "axios";
            }
            // JWT decode
            if (id.includes("jwt-decode")) {
              return "jwt";
            }
            // Other vendors
            return "vendor";
          }
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name;
          // Icons are likely to change less, use longer cache
          if (name.startsWith("icons-")) {
            return "assets/[name].[hash].js";
          }
          return "assets/[name]-[hash].js";
        },
        entryFileNames: "assets/entry-[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        // Inline small chunks to reduce HTTP requests
        inlineDynamicImports: false,
        compact: true,
      },
      // External dependencies that should not be bundled
      external: [],
    },
    // Reduce chunk size limit warnings
    chunkSizeWarningLimit: 300,
    // Disable source maps in production
    sourcemap: false,
    // Target modern browsers only (smaller bundle)
    target: "es2020",
    // CSS code splitting
    cssCodeSplit: true,
    // Report compressed size
    reportCompressedSize: true,
    // Enable minification of CSS
    cssMinify: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "axios"],
    exclude: ["react-icons"], // Don't pre-bundle icons
    esbuildOptions: {
      target: "es2020",
      supported: {
        "top-level-await": true,
      },
    },
  },
  // Esbuild options for faster builds
  esbuild: {
    logOverride: { "this-is-undefined-in-esm": "silent" },
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    target: "es2020",
    legalComments: "none",
  },
});
