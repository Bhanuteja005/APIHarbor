import { useId } from "react";
import { twMerge } from "tailwind-merge";

/**
 * APIHarbor infinity mark, stroked with the site's violet -> fuchsia gradient.
 * Uses a per-instance gradient id so multiple marks on one page don't collide.
 */
export const InfinityMark = ({ className }: { className?: string }) => {
  const id = useId();
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={twMerge("h-7 w-7", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="2" y1="6" x2="22" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
      </defs>
      <path
        d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"
        stroke={`url(#${id})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  withText?: boolean;
};

export const BrandLogo = ({
  className,
  iconClassName,
  textClassName,
  withText = true
}: BrandLogoProps) => (
  <span className={twMerge("flex items-center gap-2", className)}>
    <InfinityMark className={iconClassName} />
    {withText && (
      <span className={twMerge("text-lg font-semibold tracking-tight text-white", textClassName)}>
        APIHarbor
      </span>
    )}
  </span>
);
