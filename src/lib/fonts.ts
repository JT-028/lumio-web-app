import localFont from "next/font/local";

export const fraunces = localFont({
  src: [
    {
      path: "../fonts/fraunces-latin.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-fraunces",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  preload: true,
});

export const frauncesExt = localFont({
  src: [
    {
      path: "../fonts/fraunces-latin-ext.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-fraunces-ext",
  display: "swap",
  adjustFontFallback: false,
  preload: false,
});

export const atkinson = localFont({
  src: [
    {
      path: "../fonts/atkinson-latin-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/atkinson-latin-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-atkinson",
  display: "swap",
  adjustFontFallback: "Arial",
  preload: true,
});

export const atkinsonExt = localFont({
  src: [
    {
      path: "../fonts/atkinson-latin-ext-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/atkinson-latin-ext-700.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-atkinson-ext",
  display: "swap",
  adjustFontFallback: false,
  preload: false,
});
