import { getConfig } from "@app/lib/config/env";
import { CronJobName, TCronJobFactory } from "@app/lib/cron/cron-job";
import { logger } from "@app/lib/logger";

import { TApiKeyServiceFactory } from "./api-key-service";

type TApiKeyQueueFactoryDep = {
  cronJob: TCronJobFactory;
  apiKeyService: Pick<TApiKeyServiceFactory, "runHealthChecks">;
};

export type TApiKeyQueueFactory = ReturnType<typeof apiKeyQueueFactory>;

export const apiKeyQueueFactory = ({ cronJob, apiKeyService }: TApiKeyQueueFactoryDep) => {
  const appCfg = getConfig();

  // Real-time health monitoring: re-validate every monitored API key on a schedule.
  const init = () => {
    cronJob.register({
      name: CronJobName.ApiHarborKeyHealthCheck,
      pattern: "*/15 * * * *", // every 15 minutes (UTC)
      runHashTtlS: 60 * 60,
      enabled: !appCfg.isSecondaryInstance,
      handler: async () => {
        logger.info("cron[apiharbor-key-health-check]: started");
        await apiKeyService.runHealthChecks();
      }
    });
  };

  return { init };
};
