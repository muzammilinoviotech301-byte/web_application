"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { api, EMAIL_PATTERN, type Session } from "@/lib/api";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

// SAP ID (accounts.sap.com) sign-in: e-mail step, then password step with
// the e-mail locked, "Keep me signed in" and "Forgot password?".
export default function SignInForm({
  initialEmail = "",
  next,
}: {
  initialEmail?: string;
  next?: string;
}) {
  const router = useRouter();
  const { startSession } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<"email" | "password">(
    EMAIL_PATTERN.test(initialEmail) ? "password" : "email"
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keep, setKeep] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (step === "password" ? passwordRef : emailRef).current?.focus();
  }, [step]);

  const target = safeNext(next);
  const registerHref = `/register?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(target)}`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const value = email.trim();

    if (step === "email") {
      if (!EMAIL_PATTERN.test(value)) {
        setError("Enter a valid e-mail address.");
        return;
      }
      setBusy(true);
      try {
        const check = await api<{ registered: boolean }>("/auth/check-email", { body: { email: value } });
        if (check.registered) setStep("password");
        else router.push(registerHref);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    try {
      const session = await api<Session>("/auth/signin", { body: { email: value, password } });
      await startSession(session, keep);
      router.push(target);
    } catch (err) {
      const message = (err as Error).message;
      setError(
        /invalid login credentials/i.test(message)
          ? "Your e-mail or password is incorrect. Please try again."
          : /not confirmed/i.test(message)
            ? "Please verify your e-mail address first. Check your inbox for the e-mail from SAP."
            : message
      );
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sapid-page">
      <form className="sapid-card" onSubmit={onSubmit} noValidate>
        <div className="sapid-body">
          <div className="sapid-logo">
            SAP<sup>®</sup> ID
          </div>
          <h1 className="sapid-title">Sign In</h1>
          <p className="sapid-app">SAP.com</p>

          <div className="sapid-fields">
            <label className="sapid-label" htmlFor="sapid-email">
              Email, User ID or Login Name
            </label>
            {step === "email" ? (
              <input
                ref={emailRef}
                id="sapid-email"
                className="sapid-input"
                type="text"
                name="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            ) : (
              <>
                <input
                  id="sapid-email"
                  className="sapid-input sapid-input-locked"
                  type="text"
                  name="email"
                  autoComplete="username"
                  value={email}
                  readOnly
                />
                <div className="sapid-row sapid-row-end">
                  <button
                    type="button"
                    className="sapid-link"
                    onClick={() => {
                      setStep("email");
                      setPassword("");
                      setError("");
                    }}
                  >
                    Change
                  </button>
                </div>

                <label className="sapid-label" htmlFor="sapid-password">
                  Password
                </label>
                <div className="sapid-password">
                  <input
                    ref={passwordRef}
                    id="sapid-password"
                    className="sapid-input"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="sapid-eye"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"
                      />
                      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      {showPassword && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" />}
                    </svg>
                  </button>
                </div>
                <div className="sapid-row">
                  <label className="sapid-check">
                    <input
                      type="checkbox"
                      checked={keep}
                      onChange={(event) => setKeep(event.target.checked)}
                    />
                    <span>Keep me signed in</span>
                  </label>
                  <a
                    className="sapid-link"
                    href={`/forgot-password?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(target)}`}
                  >
                    Forgot password?
                  </a>
                </div>
              </>
            )}

            {error && (
              <p className="sapid-error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="sapid-footer">
          <div>
            <p>Don&apos;t have a SAP ID?</p>
            <a className="sapid-button sapid-button-ghost" href={registerHref}>
              Register
            </a>
          </div>
          <button type="submit" className="sapid-button" disabled={busy}>
            {busy ? "Please wait…" : "Continue"}
          </button>
        </div>
      </form>

      <nav className="sapid-legal" aria-label="Legal">
        <a href="https://www.sap.com/about/legal/privacy.html" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
        <a href="https://www.sap.com/about/legal/impressum.html" target="_blank" rel="noopener noreferrer">
          Legal Disclosure
        </a>
        <a href="https://www.sap.com/about/legal/cookie-statement.html" target="_blank" rel="noopener noreferrer">
          Cookie Statement
        </a>
      </nav>
    </div>
  );
}
