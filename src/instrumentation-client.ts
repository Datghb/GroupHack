import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const SENTRY_ENABLED = process.env.NEXT_PUBLIC_SENTRY_DISABLED !== 'true' && Boolean(SENTRY_DSN);

if (SENTRY_ENABLED) {
  Sentry.init({
    dsn: SENTRY_DSN,
    sendDefaultPii: true,
    tracesSampleRate: 1,
    debug: false
  });
}

// oxlint-disable-next-line import/namespace
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
