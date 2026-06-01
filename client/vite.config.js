import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            includeAssets: ["icon.svg", "icon-192.png", "icon-512.png", "apple-touch-icon.png"],
            manifest: {
                name: "StrongerThings — D&D Manager",
                short_name: "StrongerThings",
                description: "Gestiona tus personajes, hechizos y monstruos de D&D 5e",
                theme_color: "#3d1c02",
                background_color: "#f4e9d0",
                display: "standalone",
                orientation: "any",
                scope: "/",
                start_url: "/",
                lang: "es",
                icons: [
                    {
                        src: "/icon-192.png",
                        sizes: "192x192",
                        type: "image/png"
                    },
                    {
                        src: "/icon-512.png",
                        sizes: "512x512",
                        type: "image/png"
                    },
                    {
                        src: "/icon-maskable.png",
                        sizes: "512x512",
                        type: "image/png",
                        purpose: "maskable"
                    }
                ]
            },
            workbox: {
                // Cachea el shell de la app y los assets estáticos
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
                // Nunca interceptar peticiones de Google OAuth ni de accounts.google.com
                navigateFallbackDenylist: [/^\/api\//],
                runtimeCaching: [
                    {
                        // Google OAuth y servicios de identidad — NUNCA cachear
                        urlPattern: /^https:\/\/(accounts\.google\.com|oauth2\.googleapis\.com|apis\.google\.com)\/.*/i,
                        handler: "NetworkOnly"
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "google-fonts-cache",
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: "CacheFirst",
                        options: {
                            cacheName: "gstatic-fonts-cache",
                            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
                        }
                    },
                    {
                        urlPattern: /\/api\/.*/i,
                        handler: "NetworkFirst",
                        options: {
                            cacheName: "api-cache",
                            networkTimeoutSeconds: 10,
                            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }
                        }
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173
    }
});
