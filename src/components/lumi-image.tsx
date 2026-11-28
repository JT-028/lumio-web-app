import Image from "next/image";

// Lux's crops of the owner's art (design/assets/MANIFEST.md). Never redrawn.
// Each entry: the file URL and its intrinsic width and height in pixels.
const POSES = {
  "lumi-hero": [new URL("../assets/lumi/lumi-hero.webp", import.meta.url).href, 900, 797],
  "lumi-wave": [new URL("../assets/lumi/lumi-wave.webp", import.meta.url).href, 314, 305],
  "lumi-wand": [new URL("../assets/lumi/lumi-wand.webp", import.meta.url).href, 296, 305],
  "lumi-think": [new URL("../assets/lumi/lumi-think.webp", import.meta.url).href, 260, 298],
  "lumi-cheer": [new URL("../assets/lumi/lumi-cheer.webp", import.meta.url).href, 348, 306],
  "lumi-thumbs-up": [new URL("../assets/lumi/lumi-thumbs-up.webp", import.meta.url).href, 310, 301],
  "lumi-question": [new URL("../assets/lumi/lumi-question.webp", import.meta.url).href, 276, 289],
  "lumi-welcome": [new URL("../assets/lumi/lumi-welcome.webp", import.meta.url).href, 287, 297],
  "lumi-calm": [new URL("../assets/lumi/lumi-calm.webp", import.meta.url).href, 262, 293],
  "lumi-star": [new URL("../assets/lumi/lumi-star.webp", import.meta.url).href, 286, 295],
  "lumi-idea": [new URL("../assets/lumi/lumi-idea.webp", import.meta.url).href, 335, 300],
  "lumi-sleep": [new URL("../assets/lumi/lumi-sleep.webp", import.meta.url).href, 299, 271],
  "lumi-hello": [new URL("../assets/lumi/lumi-hello.webp", import.meta.url).href, 289, 298],
} as const;

export type Pose = keyof typeof POSES;

/** Iris §12 alt text for each pose where the image carries meaning. */
export const LUMI_ALT = {
  "lumi-hero": "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books.",
  "lumi-wave": "Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello.",
  "lumi-think": "Lumi the owl thinking, with a wing on his chin.",
  "lumi-cheer": "Lumi the owl cheering.",
  "lumi-thumbs-up": "Lumi the owl giving a thumbs up.",
  "lumi-question": "Lumi the owl looking puzzled, with a question mark.",
  "lumi-welcome": "Lumi the owl with wings open in welcome.",
  "lumi-calm": "Lumi the owl standing calmly.",
  "lumi-idea": "Lumi the owl with a bright idea.",
  "lumi-sleep": "Lumi the owl taking a nap.",
  "lumi-hello": "Lumi the owl with wings open, saying hello.",
} as const;

export type MeaningfulPose = keyof typeof LUMI_ALT;

const HEIGHTS = { peek: 96, sm: 112, md: 160, lg: 220 } as const;

export function LumiImage({ pose, alt, size = "md", priority = false, className }: {
  pose: Pose;
  alt: string;
  size?: keyof typeof HEIGHTS;
  priority?: boolean;
  className?: string;
}) {
  const [src, width, height] = POSES[pose];
  const tall = HEIGHTS[size];
  return (
    <Image
      src={src}
      alt={alt}
      width={Math.round((tall * width) / height)}
      height={tall}
      className={className ? `lumi lumi-${size} ${className}` : `lumi lumi-${size}`}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      // Next 15 `priority` only preloads; the LCP hint must be on the <img> too.
      fetchPriority={priority ? "high" : undefined}
      // Next optimises root-relative asset URLs; any other URL is served as is.
      unoptimized={!src.startsWith("/")}
    />
  );
}
