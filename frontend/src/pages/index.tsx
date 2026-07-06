import { createFileRoute, redirect } from "@tanstack/react-router";

import { fetchAuthToken } from "@app/hooks/api/auth/queries";
import { setAuthToken } from "@app/hooks/api/reactQuery";

import { LandingPage } from "./LandingPage/LandingPage";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Unauthenticated visitors see the marketing landing page.
    // Authenticated users are sent straight to their dashboard.
    let data: Awaited<ReturnType<typeof fetchAuthToken>> | null = null;
    try {
      data = await fetchAuthToken();
    } catch {
      data = null; // no valid session → render the landing page
    }

    if (!data?.token) return;

    setAuthToken(data.token);

    const orgId = data.subOrganizationId || data.organizationId;
    if (!orgId) {
      throw redirect({ to: "/login/select-organization", search: {} });
    }

    throw redirect({ to: "/organizations/$orgId/projects", params: { orgId } });
  },
  component: LandingPage
});
