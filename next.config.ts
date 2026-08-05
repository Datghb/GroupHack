import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const isSentryEnabled = process.env.NEXT_PUBLIC_SENTRY_DISABLED !== 'true' && Boolean(sentryDsn);
const sentryOrg = process.env.NEXT_PUBLIC_SENTRY_ORG;
const sentryProject = process.env.NEXT_PUBLIC_SENTRY_PROJECT;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const canUploadSentrySourceMaps = Boolean(sentryOrg && sentryProject && sentryAuthToken);

// Define the base Next.js configuration
const baseConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'clerk.com',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

let configWithPlugins = baseConfig;

// Conditionally enable Sentry configuration
if (isSentryEnabled) {
  configWithPlugins = withSentryConfig(configWithPlugins, {
    org: sentryOrg,
    project: sentryProject,
    authToken: sentryAuthToken,
    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: canUploadSentrySourceMaps,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    tunnelRoute: '/monitoring',

    // Disable Sentry telemetry
    telemetry: false,

    webpack: {
      treeshake: {
        removeDebugLogging: true,
        excludeReplayIframe: true,
        excludeReplayShadowDOM: true
      }
    },

    bundleSizeOptimizations: {
      excludeDebugStatements: true,
      excludeReplayIframe: true,
      excludeReplayShadowDom: true
    },

    // Disable source map upload outside CI or when upload credentials are not configured.
    sourcemaps: {
      disable: !canUploadSentrySourceMaps
    }
  });
}

const nextConfig = configWithPlugins;
export default nextConfig;
