"use client";

import { useState, type FormEvent } from "react";
import { api, EMAIL_PATTERN } from "@/lib/api";

/** Step 1 of the person-icon dialog: which account is this? */
export default function AuthForm({
  onKnown,
  onNew,
}: {
  onKnown: (email: string) => void;
  onNew: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_PATTERN.test(value)) {
      setError("Please enter a valid business e-mail address.");
      return;
    }

    setError("");
    setBusy(true);
    try {
      const check = await api<{ registered: boolean }>("/auth/check-email", { body: { email: value } });
      if (check.registered) onKnown(value);
      else onNew(value);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sap-auth-body">
      <form onSubmit={onSubmit} noValidate>
        <div className="sap-auth-field">
          <label htmlFor="sap-auth-email">
            Business e-mail address <span aria-hidden="true">*</span>
          </label>
          <input
            id="sap-auth-email"
            className="sap-auth-input"
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />
        </div>

        {error && (
          <p className="sap-auth-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="sap-auth-button" disabled={busy}>
          {busy ? "Please wait…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
