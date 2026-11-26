"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthForm from "@/components/AuthForm";
import RegistrationForm from "@/components/RegistrationForm";

// The person-icon dialog on sap.com: e-mail first; a known e-mail goes to
// SAP ID sign-in, a new one turns the dialog into the registration form.
export default function LoginDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [newEmail, setNewEmail] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const next = pathname && pathname !== "/login" && pathname !== "/register" ? pathname : "/dashboard";

  return (
    <div
      className="sap-auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={newEmail ? undefined : "sap-auth-heading"}
      aria-label={newEmail ? "Register" : undefined}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {newEmail !== null ? (
        <div className="sap-auth-modal sap-auth-modal-wide">
          <RegistrationForm
            initialEmail={newEmail}
            next={next}
            onClose={onClose}
            onBack={() => setNewEmail(null)}
          />
        </div>
      ) : (
        <div className="sap-auth-modal">
          <div className="sap-auth-header">
            <h2 id="sap-auth-heading">Login or create an SAP account</h2>
            <button
              type="button"
              className="sap-auth-close"
              aria-label="Close login"
              onClick={onClose}
            >
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M12.2 13a.8.8 0 0 1-.57-.23L8 9.14l-3.63 3.63a.8.8 0 1 1-1.13-1.13L6.87 8 3.24 4.37A.8.8 0 1 1 4.37 3.24L8 6.87l3.63-3.63A.8.8 0 1 1 12.76 4.37L9.13 8l3.63 3.63c.31.31.31.82 0 1.13A.8.8 0 0 1 12.2 13Z" />
              </svg>
            </button>
          </div>
          <AuthForm
            onKnown={(email) => {
              onClose();
              router.push(`/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`);
            }}
            onNew={(email) => setNewEmail(email)}
          />
        </div>
      )}
    </div>
  );
}
