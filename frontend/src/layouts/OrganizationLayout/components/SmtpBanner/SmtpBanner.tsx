import { OrgAlertBanner } from "../OrgAlertBanner";

export const SmtpBanner = () => {
  return (
    <OrgAlertBanner
      text="Attention: SMTP has not been configured for this instance."
      link="https://apiharbor.com/docs/self-hosting/configuration/envars#email-service"
    />
  );
};
