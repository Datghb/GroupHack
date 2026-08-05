import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('Sentry instrumentation architecture', () => {
  it('keeps the documented synchronous router-transition hook', () => {
    const source = readProjectFile('src/instrumentation-client.ts');

    expect(source).toContain("import * as Sentry from '@sentry/nextjs';");
    expect(source).not.toContain("import('@sentry/nextjs')");
    expect(source).toContain(
      'export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;'
    );
  });

  it('removes only unused Sentry code paths and preserves tracing', () => {
    const source = readProjectFile('next.config.ts');

    expect(source).toContain('bundleSizeOptimizations');
    expect(source).toContain('excludeDebugStatements: true');
    expect(source).toContain('excludeReplayShadowDom: true');
    expect(source).toContain('excludeReplayIframe: true');
    expect(source).not.toContain('excludeTracing: true');
    expect(source).not.toContain('excludeReplayWorker: true');
    expect(source).not.toContain('reactComponentAnnotation');
    expect(source).toContain('sentryOrg && sentryProject && sentryAuthToken');
    expect(source).not.toContain('process.env.CI && sentryOrg');
  });
});
