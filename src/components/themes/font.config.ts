import {
  Architects_Daughter,
  Fira_Code,
  Geist,
  Geist_Mono,
  Google_Sans_Flex,
  Inter,
  JetBrains_Mono,
  Merriweather,
  Playfair_Display,
  Outfit,
  Source_Code_Pro
} from 'next/font/google';

import { cn } from '@/lib/utils';

const fontSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans'
});

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono'
});

const fontGoogleSansFlex = Google_Sans_Flex({
  subsets: ['latin'],
  preload: false,
  variable: '--font-google-sans-flex'
});

const fontSourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  preload: false,
  variable: '--font-source-code-pro'
});

const fontInter = Inter({
  subsets: ['latin'],
  preload: false,
  variable: '--font-inter'
});

const fontArchitectsDaughter = Architects_Daughter({
  subsets: ['latin'],
  weight: '400',
  preload: false,
  variable: '--font-architects-daughter'
});

const fontFiraCode = Fira_Code({
  subsets: ['latin'],
  preload: false,
  variable: '--font-fira-code'
});

const fontOutfit = Outfit({
  subsets: ['latin'],
  preload: false,
  variable: '--font-outfit'
});

const fontJetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  preload: false,
  variable: '--font-jetbrains-mono'
});

const fontMerriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  preload: false,
  variable: '--font-merriweather'
});

const fontPlayfairDisplay = Playfair_Display({
  subsets: ['latin'],
  preload: false,
  variable: '--font-playfair-display'
});

export const fontVariables = cn(
  fontSans.variable,
  fontMono.variable,
  fontGoogleSansFlex.variable,
  fontSourceCodePro.variable,
  fontInter.variable,
  fontArchitectsDaughter.variable,
  fontFiraCode.variable,
  fontOutfit.variable,
  fontJetBrainsMono.variable,
  fontMerriweather.variable,
  fontPlayfairDisplay.variable
);
