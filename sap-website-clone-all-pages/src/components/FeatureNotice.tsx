"use client";

import { useApi } from "@/lib/use-api";

export type FeatureNoticeContent = { title: string; body: string; linkLabel?: string; linkUrl?: string };

// Defaults for SAP ID features this clone can't provide. Admins can rewrite
// each one in the admin panel (Page content → key "feature:<name>").
export const FEATURE_NOTICES: Record<string, FeatureNoticeContent> = {
  mfa: {
    title: "Multi-factor authentication is managed by SAP Universal ID",
    body: "Two-factor, TOTP and web two-factor authentication are provided by SAP's identity service and are not available in this site. Your account is protected by your password and e-mail verification.",
    linkLabel: "Learn about SAP Universal ID",
    linkUrl: "https://account.sap.com/",
  },
  certificates: {
    title: "Certificates aren't available here",
    body: "Passwordless sign-on certificates are issued by SAP Universal ID and can't be generated on this site.",
  },
  tokens: {
    title: "No application access tokens",
    body: "Application access tokens are issued by SAP's identity service to SAP applications. This site doesn't issue them, so there's nothing to review or delete.",
  },
  social: {
    title: "Social sign-on isn't connected",
    body: "Signing in with Facebook, Google or Microsoft requires an identity provider set up by the site owner. Use your e-mail and password to sign in.",
  },
  "email-change": {
    title: "Changing your e-mail address",
    body: "Your e-mail address is your sign-in name. To change it, contact support.",
  },
};

export function useFeatureNotice(key: string): FeatureNoticeContent {
  const { data } = useApi<Partial<FeatureNoticeContent>>(`/content/feature:${key}`, false);
  return { ...FEATURE_NOTICES[key], ...(data && Object.keys(data).length ? data : {}) } as FeatureNoticeContent;
}

export default function FeatureNotice({ feature }: { feature: string }) {
  const notice = useFeatureNotice(feature);
  return (
    <div className="feature-notice" role="note">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 10.5v6M12 7.2v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <strong>{notice.title}</strong>
        <p>{notice.body}</p>
        {notice.linkUrl && (
          <a href={notice.linkUrl} target="_blank" rel="noopener noreferrer">
            {notice.linkLabel || notice.linkUrl}
          </a>
        )}
      </div>
    </div>
  );
}
