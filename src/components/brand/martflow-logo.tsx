import { cn } from "@/lib/utils";

export const MARTFLOW_NAVY = "#00235B";
export const MARTFLOW_TEAL = "#00B68D";
export const MARTFLOW_NAVY_ON_DARK = "#F4F7FC";

export const MARTFLOW_ICON_VIEWBOX = "0 0 80 64";

export type MartFlowSurface = "light" | "dark" | "brand" | "adaptive";
export type MartFlowLogoSize = "sm" | "md" | "lg" | "xl";

export function martFlowColors(surface: MartFlowSurface = "adaptive") {
  if (surface === "dark") {
    return { navy: MARTFLOW_NAVY_ON_DARK, teal: MARTFLOW_TEAL };
  }
  if (surface === "adaptive") {
    return { navy: "var(--martflow-navy)", teal: "var(--martflow-teal)" };
  }
  return { navy: MARTFLOW_NAVY, teal: MARTFLOW_TEAL };
}

export function MartFlowMark({ navy, teal }: { navy: string; teal: string }) {
  return (
    <g>
      <rect x="1" y="18" width="17" height="3.4" fill={navy} />
      <rect x="4" y="27.2" width="14" height="3.4" fill={navy} />
      <rect x="8" y="36.4" width="10" height="3.4" fill={navy} />
      <path fill={navy} d="M20 60V19.5L34.5 5.5 41 17.5v7.5L34 32.5V60H20Z" />
      <path fill={teal} d="M45.5 60V32.5L38.5 25V17.5L45 5.5 60 19.5V60H45.5Z" />
      <path
        d="M34 33.5c5.5-10 11-10 16.5 0"
        fill="none"
        stroke={teal}
        strokeWidth="6.2"
        strokeLinecap="round"
      />
    </g>
  );
}

type IconProps = {
  className?: string;
  surface?: MartFlowSurface;
  title?: string;
  decorative?: boolean;
};

export function MartFlowIcon({
  className,
  surface = "adaptive",
  title = "MartFlow",
  decorative = false,
}: IconProps) {
  const { navy, teal } = martFlowColors(surface);
  return (
    <svg
      viewBox={MARTFLOW_ICON_VIEWBOX}
      className={cn("h-[1.05em] w-auto shrink-0 overflow-visible", className)}
      role={decorative ? "presentation" : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      {decorative ? null : <title>{title}</title>}
      <MartFlowMark navy={navy} teal={teal} />
    </svg>
  );
}

type WordmarkProps = {
  className?: string;
  surface?: MartFlowSurface;
  decorative?: boolean;
};

export function MartFlowWordmark({ className, surface = "adaptive", decorative = false }: WordmarkProps) {
  const { navy, teal } = martFlowColors(surface);
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-semibold tracking-[-0.03em] leading-none",
        className,
      )}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "MartFlow"}
    >
      <span style={{ color: navy }}>Mart</span>
      <span style={{ color: teal }}>Flow</span>
    </span>
  );
}

type LogoProps = {
  className?: string;
  surface?: MartFlowSurface;
  size?: MartFlowLogoSize;
  iconOnly?: boolean;
  wordmarkOnly?: boolean;
};

const SIZE_CLASS: Record<MartFlowLogoSize, string> = {
  sm: "text-[20px] md:text-[22px]",
  md: "text-[24px] md:text-[26px]",
  lg: "text-[32px] sm:text-[36px]",
  xl: "text-[40px] sm:text-[44px]",
};

export function MartFlowLogo({
  className,
  surface = "adaptive",
  size = "md",
  iconOnly = false,
  wordmarkOnly = false,
}: LogoProps) {
  if (iconOnly) {
    return <MartFlowIcon className={cn(SIZE_CLASS[size], className)} surface={surface} />;
  }
  if (wordmarkOnly) {
    return <MartFlowWordmark className={cn(SIZE_CLASS[size], className)} surface={surface} />;
  }
  return (
    <span
      className={cn("inline-flex items-center gap-[0.55em]", SIZE_CLASS[size], className)}
      role="img"
      aria-label="MartFlow"
    >
      <MartFlowIcon surface={surface} className="h-[1.05em]" decorative />
      <MartFlowWordmark surface={surface} decorative />
    </span>
  );
}
