'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
const SENTRY_ENABLED = process.env.NEXT_PUBLIC_SENTRY_DISABLED !== 'true' && Boolean(SENTRY_DSN);

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    if (!SENTRY_ENABLED) return;

    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang='en'>
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
