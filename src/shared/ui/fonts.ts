import { Geist, Geist_Mono, Inter } from 'next/font/google';

export const fontSans = Inter({
  variable: '--font-inter-sans',
  subsets: ['latin'],
  display: 'swap',
});

export const fontMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const fontDisplay = Geist({
  variable: '--font-geist-display',
  subsets: ['latin'],
  display: 'swap',
});

export const fontVariables = `${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable}`;
