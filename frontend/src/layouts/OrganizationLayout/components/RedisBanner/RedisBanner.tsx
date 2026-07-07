import { OrgAlertBanner } from "../OrgAlertBanner";

export const RedisBanner = () => {
  return (
    <OrgAlertBanner
      text="Attention: Updated versions of APIHarbor now require Redis for full functionality."
      link="https://apiharbor.com/docs/self-hosting/configuration/requirements#redis"
    />
  );
};
