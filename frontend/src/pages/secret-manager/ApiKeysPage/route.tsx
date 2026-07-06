import { createFileRoute } from "@tanstack/react-router";

import { ApiKeysPage } from "./ApiKeysPage";

export const Route = createFileRoute(
  "/_authenticate/_inject-org-details/_org-layout/organizations/$orgId/projects/secret-management/$projectId/_secret-manager-layout/api-keys"
)({
  component: ApiKeysPage
});
