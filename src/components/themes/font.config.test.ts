import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('theme font bundle', () => {
  it('only registers font variables referenced by a theme', () => {
    const fontConfig = readFileSync(new URL('./font.config.ts', import.meta.url), 'utf8');
    const themeDirectory = new URL('../../styles/themes/', import.meta.url);
    const themeStyles = readdirSync(themeDirectory)
      .filter((fileName) => fileName.endsWith('.css'))
      .map((fileName) => readFileSync(new URL(fileName, themeDirectory), 'utf8'))
      .join('\n');
    const registeredFonts = Array.from(
      fontConfig.matchAll(
        /const \w+ = ([A-Za-z_]+)\(\{[\s\S]*?variable: '(--font-[^']+)'[\s\S]*?\}\);/g
      ),
      (match) => ({ family: match[1].replaceAll('_', ' '), variable: match[2] })
    );

    expect(registeredFonts.length).toBeGreaterThan(0);
    expect(
      registeredFonts.filter(
        ({ family, variable }) => !themeStyles.includes(variable) && !themeStyles.includes(family)
      )
    ).toEqual([]);
  });
});
