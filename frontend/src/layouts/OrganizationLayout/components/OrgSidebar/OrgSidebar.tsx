import { Link, useLocation, useParams } from "@tanstack/react-router";

import { InfinityMark } from "@app/components/branding/BrandLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger
} from "@app/components/v3";
import { useOrganization } from "@app/context";
import {
  hasIntermediateProjectsView,
  parseProjectSlugFromPath,
  urlSlugToProjectType
} from "@app/helpers/project";

import { OrgNav } from "./OrgNav";
import { ProjectNav } from "./ProjectNav";
import { ProjectTypeNav } from "./ProjectTypeNav";

// --- Main sidebar ---

export const OrgSidebar = () => {
  const { projectId, type: typeSlug } = useParams({
    strict: false,
    select: (el) => ({
      projectId: (el as { projectId?: string })?.projectId,
      type: (el as { type?: string })?.type
    })
  });
  const { pathname } = useLocation();
  const isInsideProject = Boolean(projectId);
  // The org-wide KMIP servers and Secret Sharing pages live at literal /projects/<slug>/<resource>
  // paths with no $type route param, so fall back to parsing the product slug from the pathname.
  const effectiveTypeSlug = typeSlug ?? parseProjectSlugFromPath(pathname);
  const projectType = effectiveTypeSlug ? urlSlugToProjectType(effectiveTypeSlug) : null;
  const isOnProjectTypeListing =
    !isInsideProject && Boolean(projectType) && hasIntermediateProjectsView(projectType!);
  const { isSubOrganization, currentOrg } = useOrganization();

  let scope: "project" | "sub-org" | "org" = "org";
  if (isInsideProject || isOnProjectTypeListing) scope = "project";
  else if (isSubOrganization) scope = "sub-org";

  let body: JSX.Element;
  if (isInsideProject) body = <ProjectNav />;
  else if (isOnProjectTypeListing) body = <ProjectTypeNav />;
  else body = <OrgNav />;

  return (
    <Sidebar scope={scope} collapsible="none" side="left">
      <SidebarHeader className="border-b border-border p-2">
        <Link
          to="/organizations/$orgId/projects"
          params={{ orgId: currentOrg.id }}
          className="flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-foreground/5"
        >
          <InfinityMark className="h-7 w-7 shrink-0" />
          <span className="truncate text-sm font-semibold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">
            APIHarbor
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>{body}</SidebarContent>
      <SidebarFooter className="border-t border-border p-2">
        <SidebarTrigger variant="ghost" className="w-full" />
      </SidebarFooter>
    </Sidebar>
  );
};
