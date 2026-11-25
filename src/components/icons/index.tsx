import type { ReactNode } from "react";

// Line icons: path data copied from Lucide (lucide-react v1.33.0), ISC License,
// see ./LICENSE-lucide.txt. Google "G" and the two decor shapes come from Lux's
// design/assets. Icons are decorative by default: the control's words name it.

export type IconProps = { size?: number; className?: string };

function Svg({ size = 20, className, viewBox = "0 0 24 24", line = true, children }: IconProps & { viewBox?: string; line?: boolean; children: ReactNode }) {
  const paint = line
    ? { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
    : { fill: "currentColor" };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={viewBox} className={className} focusable="false" aria-hidden="true" {...paint}>
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => <Svg {...p}><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>;
export const SignOutIcon = (p: IconProps) => <Svg {...p}><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /></Svg>;
export const ParentIcon = (p: IconProps) => <Svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><path d="M16 3.128a4 4 0 0 1 0 7.744" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><circle cx="9" cy="7" r="4" /></Svg>;
export const StudentIcon = (p: IconProps) => <Svg {...p}><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></Svg>;
export const MailIcon = (p: IconProps) => <Svg {...p}><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" /></Svg>;
export const EyeIcon = (p: IconProps) => <Svg {...p}><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></Svg>;
export const EyeOffIcon = (p: IconProps) => <Svg {...p}><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" /></Svg>;
export const ArrowRightIcon = (p: IconProps) => <Svg {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>;
export const ArrowLeftIcon = (p: IconProps) => <Svg {...p}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></Svg>;
export const CheckIcon = (p: IconProps) => <Svg {...p}><path d="M20 6 9 17l-5-5" /></Svg>;
export const AlertIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></Svg>;
export const InfoIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></Svg>;
export const BookIcon = (p: IconProps) => <Svg {...p}><path d="M12 5v16" /><path d="M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z" /></Svg>;
export const SparkleIcon = (p: IconProps) => <Svg {...p}><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" /><path d="M20 2v4" /><path d="M22 4h-4" /><circle cx="4" cy="20" r="2" /></Svg>;
export const GeographyIcon = (p: IconProps) => <Svg {...p}><path d="M21.54 15H17a2 2 0 0 0-2 2v4.54" /><path d="M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17" /><path d="M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05" /><circle cx="12" cy="12" r="10" /></Svg>;
export const HistoryIcon = (p: IconProps) => <Svg {...p}><path d="M10 18v-7" /><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="M3 22h18" /><path d="M6 18v-7" /></Svg>;
export const LanguageIcon = (p: IconProps) => <Svg {...p}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /><path d="m8 13 4-7 4 7" /><path d="M9.1 11h5.7" /></Svg>;
export const MathematicsIcon = (p: IconProps) => <Svg {...p}><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></Svg>;

// Google's own mark in its official colours; never recoloured (brand rule).
export const GoogleIcon = (p: IconProps) => (
  <Svg {...p} viewBox="0 0 48 48" line={false}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </Svg>
);

// Decor (Lux, hand-written): coloured by CSS through currentColor.
export const CloudDecor = ({ className }: { className?: string }) => (
  <Svg viewBox="0 0 120 64" line={false} size={120} className={className}>
    <circle cx="36" cy="40" r="18" /><circle cx="61" cy="28" r="22" /><circle cx="87" cy="40" r="18" /><rect x="36" y="36" width="51" height="22" />
  </Svg>
);
export const SparkleDecor = ({ className }: { className?: string }) => (
  <Svg viewBox="0 0 24 24" line={false} size={24} className={className}>
    <path d="M12 1c.9 6.4 4.6 10.1 11 11-6.4.9-10.1 4.6-11 11-.9-6.4-4.6-10.1-11-11 6.4-.9 10.1-4.6 11-11z" />
    <path className="sparkle-glint" d="M11.2 5.6c.45 3.1 2.1 4.75 5.2 5.2-3.1.45-4.75 2.1-5.2 5.2-.45-3.1-2.1-4.75-5.2-5.2 3.1-.45 4.75-2.1 5.2-5.2z" />
  </Svg>
);
