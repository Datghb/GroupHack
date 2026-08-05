import { describe, expect, it } from 'vitest';
import { BrandLogo } from './brand-logo';

describe('BrandLogo', () => {
  it('requests an image close to its rendered size', () => {
    const logo = BrandLogo({});

    expect(logo.props).toMatchObject({
      width: 48,
      height: 48,
      sizes: '48px'
    });
  });
});
