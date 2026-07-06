import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

import { BrandLogo } from "@app/components/branding/BrandLogo";

type Props = { children?: ReactNode };

export const AuthPageHeader = ({ children }: Props) => (
  <header className="relative z-10 flex h-16 w-full items-center justify-between">
    <Link to="/">
      <BrandLogo iconClassName="h-7 w-7" />
    </Link>
    {children && <div className="flex items-center gap-2">{children}</div>}
  </header>
);
