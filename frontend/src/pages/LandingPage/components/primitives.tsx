import { forwardRef, ReactNode, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
          "relative isolate z-0 flex min-h-[26rem] w-full flex-col items-center justify-center overflow-hidden",
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
        <div className="relative z-50 flex -translate-y-[16rem] flex-col items-center px-5 text-center">
          {children}
        </div>
      </div>
    );
  }
);
LampHeader.displayName = "LampHeader";

/* Keyframes not present in the app's Tailwind build, scoped to the landing page. */
export const LandingKeyframes = () => (
  <style>{`
    @keyframes ah-border-beam { 100% { offset-distance: 100%; } }
    @keyframes ah-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  `}</style>
);
