"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { RegisterSteps } from "@/components/RegistrationForm";
import { api, readSession } from "@/lib/api";

type Variant = "forgot-password" | "reset-password" | "verify-email";

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function passwordProblem(password: string, retype: string) {
  if (password.length < 8) return "Your password must contain at least 8 characters.";
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return "Use upper-case and lower-case letters and at least one number.";
  }
  if (password !== retype) return "The passwords don't match.";
  return "";
}

function PasswordFields({
  password,
  retype,
  onPassword,
  onRetype,
  className,
}: {
  password: string;
  retype: string;
  onPassword: (value: string) => void;
  onRetype: (value: string) => void;
  className: "sapid" | "sapreg";
}) {
  if (className === "sapreg") {
    return (
      <div className="sapreg-grid">
        <label className="sapreg-field">
          <input type="password" placeholder=" " autoComplete="new-password" value={password} onChange={(e) => onPassword(e.target.value)} />
          <span className="sapreg-float">Password *</span>
        </label>
        <label className="sapreg-field">
          <input type="password" placeholder=" " autoComplete="new-password" value={retype} onChange={(e) => onRetype(e.target.value)} />
          <span className="sapreg-float">Confirm Password *</span>
        </label>
      </div>
    );
  }
  return (
    <>
      <label className="sapid-label" htmlFor="sapid-new">New Password</label>
      <input id="sapid-new" className="sapid-input" type="password" autoComplete="new-password" value={password} onChange={(e) => onPassword(e.target.value)} />
      <label className="sapid-label" htmlFor="sapid-retype">Retype New Password</label>
      <input id="sapid-retype" className="sapid-input" type="password" autoComplete="new-password" value={retype} onChange={(e) => onRetype(e.target.value)} />
    </>
  );
}

export default function AuthUtilityForm({
  variant,
  initialEmail = "",
  next,
}: {
  variant: Variant;
  initialEmail?: string;
  next?: string;
}) {
  const router = useRouter();
  const { profile, ready, reloadProfile } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [retype, setRetype] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(!!readSession());
  }, [ready, profile]);

  const target = (() => {
    if (next) return safeNext(next);
    try {
      return safeNext(window.sessionStorage.getItem("sap-clone-register-next") || undefined);
    } catch {
      return "/dashboard";
    }
  })();

  async function setNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = passwordProblem(password, retype);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/auth/password", { body: { password }, auth: true });
      await reloadProfile();
      setDone(true);
      if (variant === "reset-password") router.push(target);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // ---- Forgot password (SAP ID card) ----------------------------------------
  if (variant === "forgot-password") {
    const send = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!email.trim()) {
        setError("Enter your e-mail address.");
        return;
      }
      setBusy(true);
      setError("");
      try {
        const result = await api<{ message: string }>("/auth/recover", { body: { email: email.trim() } });
        setMessage(result.message);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setBusy(false);
      }
    };
    return (
      <div className="sapid-page">
        <form className="sapid-card" onSubmit={send} noValidate>
          <div className="sapid-body">
            <div className="sapid-logo">SAP<sup>®</sup> ID</div>
            <h1 className="sapid-title">Reset Password</h1>
            <p className="sapid-app">SAP.com</p>
            <div className="sapid-fields">
              {message ? (
                <p className="sapid-info">{message} Follow the link in the e-mail to choose a new password.</p>
              ) : (
                <>
                  <p className="sapid-help">Enter your e-mail address and we&apos;ll send you a link to reset your password.</p>
                  <label className="sapid-label" htmlFor="sapid-forgot">Email, User ID or Login Name</label>
                  <input id="sapid-forgot" className="sapid-input" type="text" autoComplete="username" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
                </>
              )}
              {error && <p className="sapid-error" role="alert">{error}</p>}
            </div>
          </div>
          <div className="sapid-footer">
            <div />
            <div className="sapid-footer-buttons">
              <Link className="sapid-button sapid-button-ghost" href={`/login?email=${encodeURIComponent(email.trim())}&next=${encodeURIComponent(target)}`}>
                {message ? "Back to Sign In" : "Cancel"}
              </Link>
              {!message && (
                <button type="submit" className="sapid-button" disabled={busy}>
                  {busy ? "Sending…" : "Send"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ---- New password after the reset e-mail (SAP ID card) --------------------
  if (variant === "reset-password") {
    return (
      <div className="sapid-page">
        <form className="sapid-card" onSubmit={setNewPassword} noValidate>
          <div className="sapid-body">
            <div className="sapid-logo">SAP<sup>®</sup> ID</div>
            <h1 className="sapid-title">Set New Password</h1>
            <p className="sapid-app">SAP.com</p>
            <div className="sapid-fields">
              {ready && !hasSession ? (
                <p className="sapid-info">
                  This page opens from the link in your password reset e-mail. The link may have
                  expired — <Link className="sapid-link" href="/forgot-password">request a new one</Link>.
                </p>
              ) : (
                <PasswordFields className="sapid" password={password} retype={retype} onPassword={setPassword} onRetype={setRetype} />
              )}
              {error && <p className="sapid-error" role="alert">{error}</p>}
            </div>
          </div>
          <div className="sapid-footer">
            <div />
            <button type="submit" className="sapid-button" disabled={busy || !hasSession}>
              {busy ? "Saving…" : "Continue"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---- Registration steps 2–3 -----------------------------------------------
  const close = () => router.push("/");

  if (!hasSession) {
    // Opened without the e-mail link: still waiting for verification.
    const resend = async () => {
      setError("");
      setMessage("");
      try {
        await api("/auth/resend", { body: { email: email.trim() } });
        setMessage("We sent the e-mail again. It can take a few minutes to arrive.");
      } catch (err) {
        setError((err as Error).message);
      }
    };
    return (
      <div className="sapreg">
        <RegisterSteps current={2} onClose={close} />
        <div className="sapreg-body">
          <h1 className="sapreg-title">Verify your e-mail</h1>
          <p className="sapreg-text">
            {email
              ? <>We sent an e-mail to <strong>{email}</strong>. </>
              : "We sent you an e-mail. "}
            Click the link in the e-mail to verify your address and finish your registration.
          </p>
          {email && (
            <p className="sapreg-text">
              Didn&apos;t get the e-mail? Check your spam folder or{" "}
              <button type="button" className="sapreg-inline-link" onClick={resend}>send it again</button>.
            </p>
          )}
          {message && <p className="sapreg-notice">{message}</p>}
          {error && <p className="sapreg-error" role="alert">{error}</p>}
          {!email && (
            <label className="sapreg-field sapreg-field-single">
              <input type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} />
              <span className="sapreg-float">Business e-mail address</span>
            </label>
          )}
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="sapreg">
        <RegisterSteps current={3} onClose={close} />
        <div className="sapreg-body">
          <h1 className="sapreg-title">Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}!</h1>
          <p className="sapreg-text">
            Your SAP ID is ready. You now have access to all resources on SAP.com — trials, learning,
            events, your dashboard and more.
          </p>
          <div className="sapreg-actions">
            <button type="button" className="sapreg-button" onClick={() => router.push(target)}>
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sapreg">
      <RegisterSteps current={3} onClose={close} />
      <form className="sapreg-body" onSubmit={setNewPassword} noValidate>
        <h1 className="sapreg-title">Your e-mail is verified</h1>
        <p className="sapreg-text">
          {profile?.email ? <><strong>{profile.email}</strong> is verified. </> : null}
          Choose a password for your SAP ID to access all resources.
        </p>
        <PasswordFields className="sapreg" password={password} retype={retype} onPassword={setPassword} onRetype={setRetype} />
        <p className="sapreg-hint">At least 8 characters, with upper-case and lower-case letters and a number.</p>
        {error && <p className="sapreg-error" role="alert">{error}</p>}
        <div className="sapreg-actions">
          <button type="submit" className="sapreg-button" disabled={busy}>
            {busy ? "Saving…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
