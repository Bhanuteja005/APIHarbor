import { forwardRef, ReactNode, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

export const cn = (...classes: (string | false | null | undefined)[]) =>
  twMerge(classes.filter(Boolean).join(" "));

/* ------------------------------------------------------------------ */
/* Spotlight-on-hover card (linkify "MagicCard")                      */
/* ------------------------------------------------------------------ */
export const MagicCard = ({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -400, y: -400 });

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (rect) setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseLeave={() => setPos({ x: -400, y: -400 })}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(260px circle at ${pos.x}px ${pos.y}px, rgba(139,92,246,0.16), transparent 70%)`
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Scroll-reveal container (framer-motion)                            */
/* ------------------------------------------------------------------ */
type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  reverse?: boolean;
};

export const Reveal = ({ children, className, delay = 0, reverse = false }: RevealProps) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reverse ? -24 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/* Centered max-width section wrapper                                  */
/* ------------------------------------------------------------------ */
export const MaxWidth = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("mx-auto w-full max-w-6xl px-6 lg:px-8", className)}>{children}</div>
);

/* ------------------------------------------------------------------ */
/* Spinning-gradient pill badge (linkify "MagicBadge")                */
/* ------------------------------------------------------------------ */
export const MagicBadge = ({ children }: { children: ReactNode }) => (
  <div className="relative inline-flex h-8 select-none overflow-hidden rounded-full p-[1.5px]">
    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#8b5cf6_0%,#e879f9_50%,#8b5cf6_100%)]" />
    <span className="inline-flex h-full w-full items-center justify-center rounded-full bg-[#0a0a0f] px-4 text-xs font-medium tracking-wide text-zinc-200 backdrop-blur-3xl">
      {children}
    </span>
  </div>
);

/* ------------------------------------------------------------------ */
/* Animated conic border beam (linkify "BorderBeam")                  */
/* ------------------------------------------------------------------ */
export const BorderBeam = ({
  size = 220,
  duration = 12,
  delay = 0,
  colorFrom = "#a78bfa",
  colorTo = "#e879f9"
}: {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
}) => (
  <div
    style={
      {
        "--size": size,
        "--duration": duration,
        "--anchor": 90,
        "--border-width": 1.5,
        "--color-from": colorFrom,
        "--color-to": colorTo,
        "--delay": `-${delay}s`
      } as React.CSSProperties
    }
    className={cn(
      "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
      "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
      "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-[ah-border-beam_calc(var(--duration)*1s)_infinite_linear] after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]"
    )}
  />
);

/* ------------------------------------------------------------------ */
/* Lamp glow header (linkify "LampContainer")                         */
/* ------------------------------------------------------------------ */
export const LampHeader = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  ({ children, className }, ref) => {
    const reduce = useReducedMotion();
    return (
      <div
        ref={ref}
        className={cn(
          "relative isolate z-0 flex min-h-screen w-full flex-col items-center justify-center overflow-hidden rounded-md",
          className
        )}
      >
        <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center">
          <motion.div
            initial={{ opacity: 0.5, width: "15rem" }}
            whileInView={reduce ? undefined : { opacity: 1, width: "30rem" }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
            style={{ backgroundImage: "conic-gradient(var(--conic-position), var(--tw-gradient-stops))" }}
            className="absolute inset-auto right-1/2 h-56 w-[30rem] overflow-visible bg-gradient-to-tr from-violet-500 via-transparent to-transparent [--conic-position:from_70deg_at_center_top]"
          >
            <div className="absolute bottom-0 left-0 z-20 h-40 w-full bg-[#0a0a0f] [mask-image:linear-gradient(to_top,white,transparent)]" />
            <div className="absolute bottom-0 left-0 z-20 h-full w-40 bg-[#0a0a0f] [mask-image:linear-gradient(to_right,white,transparent)]" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0.5, width: "15rem" }}
            whileInView={reduce ? undefined : { opacity: 1, width: "30rem" }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
            style={{ backgroundImage: "conic-gradient(var(--conic-position), var(--tw-gradient-stops))" }}
            className="absolute inset-auto left-1/2 h-56 w-[30rem] bg-gradient-to-tr from-transparent via-transparent to-fuchsia-500 [--conic-position:from_290deg_at_center_top]"
          >
            <div className="absolute bottom-0 right-0 z-20 h-full w-40 bg-[#0a0a0f] [mask-image:linear-gradient(to_left,white,transparent)]" />
            <div className="absolute bottom-0 right-0 z-20 h-40 w-full bg-[#0a0a0f] [mask-image:linear-gradient(to_top,white,transparent)]" />
          </motion.div>
          <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-[#0a0a0f] blur-2xl" />
          <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md" />
          <div className="absolute inset-auto z-30 h-36 w-64 -translate-y-24 rounded-full bg-violet-500/60 blur-3xl" />
          <motion.div
            initial={{ width: "8rem" }}
            whileInView={reduce ? undefined : { width: "16rem" }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-auto z-30 h-36 w-64 -translate-y-24 rounded-full bg-violet-400/50 blur-2xl"
          />
          <motion.div
            initial={{ width: "15rem" }}
            whileInView={reduce ? undefined : { width: "30rem" }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-violet-400"
          />
          <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-[#0a0a0f]" />
        </div>
        <div className="relative z-50 flex -translate-y-80 flex-col items-center px-5 text-center">
          {children}
        </div>
      </div>
    );
  }
);
LampHeader.displayName = "LampHeader";

/* ------------------------------------------------------------------ */
/* Bento grid + card (linkify "BentoGrid" / "BentoCard")              */
/* ------------------------------------------------------------------ */
export const BentoGrid = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("grid w-full auto-rows-[20rem] grid-cols-3 gap-4", className)}>{children}</div>
);

export const BentoCard = ({
  Icon,
  name,
  description,
  className,
  background
}: {
  Icon: LucideIcon;
  name: string;
  description: string;
  className?: string;
  background?: ReactNode;
}) => (
  <div
    className={cn(
      "group relative col-span-3 flex flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e14] [box-shadow:0_-20px_80px_-20px_rgba(139,92,246,0.18)_inset] transition-colors duration-300 hover:border-violet-400/30",
      className
    )}
  >
    <div className="pointer-events-none absolute inset-0">{background}</div>
    <div className="relative z-10 flex flex-col gap-1 p-6 transition-transform duration-300 group-hover:-translate-y-1">
      <Icon
        className="h-10 w-10 origin-left text-violet-300 transition-transform duration-300 ease-out group-hover:scale-90"
        strokeWidth={1.5}
      />
      <h3 className="mt-3 text-lg font-semibold text-white">{name}</h3>
      <p className="max-w-md text-sm leading-relaxed text-zinc-400">{description}</p>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* SVG text hover reveal effect (linkify "TextHoverEffect")           */
/* ------------------------------------------------------------------ */
export const TextHoverEffect = ({ text, duration }: { text: string; duration?: number }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const cx = ((cursor.x - rect.left) / rect.width) * 100;
      const cy = ((cursor.y - rect.top) / rect.height) * 100;
      setMaskPosition({ cx: `${cx}%`, cy: `${cy}%` });
    }
  }, [cursor]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none"
    >
      <defs>
        <linearGradient id="ah-textGradient" gradientUnits="userSpaceOnUse" cx="50%" cy="50%" r="25%">
          {hovered && (
            <>
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="25%" stopColor="#8b5cf6" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="75%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#f43f5e" />
            </>
          )}
        </linearGradient>
        <motion.radialGradient
          id="ah-revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="ah-textMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#ah-revealMask)" />
        </mask>
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent stroke-neutral-700 text-7xl font-bold"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="fill-transparent stroke-neutral-700 text-7xl font-bold"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke="url(#ah-textGradient)"
        strokeWidth="0.3"
        mask="url(#ah-textMask)"
        className="fill-transparent text-7xl font-bold"
      >
        {text}
      </text>
    </svg>
  );
};

/* Keyframes + Aeonik Pro font (linkify's heading font), scoped to the landing page. */
export const LandingKeyframes = () => (
  <style>{`
    @font-face { font-family: 'Aeonik Pro'; src: url('/fonts/AeonikPro-Light.woff2') format('woff2'); font-weight: 300; font-display: swap; }
    @font-face { font-family: 'Aeonik Pro'; src: url('/fonts/AeonikPro-Regular.woff2') format('woff2'); font-weight: 400; font-display: swap; }
    @font-face { font-family: 'Aeonik Pro'; src: url('/fonts/AeonikPro-Medium.woff2') format('woff2'); font-weight: 500; font-display: swap; }
    @font-face { font-family: 'Aeonik Pro'; src: url('/fonts/AeonikPro-Bold.woff2') format('woff2'); font-weight: 700; font-display: swap; }
    @font-face { font-family: 'Aeonik Pro'; src: url('/fonts/AeonikPro-Black.woff2') format('woff2'); font-weight: 900; font-display: swap; }
    .ah-landing h1, .ah-landing h2 { font-family: 'Aeonik Pro', ui-sans-serif, system-ui, sans-serif; }
    @keyframes ah-border-beam { 100% { offset-distance: 100%; } }
    @keyframes ah-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  `}</style>
);
