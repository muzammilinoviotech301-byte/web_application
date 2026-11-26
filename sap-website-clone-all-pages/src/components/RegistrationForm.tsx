"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { api, EMAIL_PATTERN } from "@/lib/api";
import { COUNTRIES, DEPARTMENTS, RELATIONSHIPS, flagUrl } from "@/lib/countries";

const STEPS = ["Register", "Verify your e-mail", "Access all resources"];

export function RegisterSteps({ current, onClose }: { current: 1 | 2 | 3; onClose?: () => void }) {
  return (
    <div className="sapreg-head">
      <ol className="sapreg-steps" aria-label="Registration progress">
        {STEPS.map((label, index) => {
          const n = index + 1;
          return (
            <li
              key={label}
              className={`sapreg-step${n === current ? " is-active" : ""}${n < current ? " is-done" : ""}`}
              aria-current={n === current ? "step" : undefined}
            >
              <span className="sapreg-step-num">{n}</span>
              <span className="sapreg-step-label">{label}</span>
            </li>
          );
        })}
      </ol>
      {onClose && (
        <button type="button" className="sapreg-close" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

function Field({ label, required, children, wide }: { label: string; required?: boolean; children: ReactNode; wide?: boolean }) {
  return (
    <label className={`sapreg-field${wide ? " sapreg-field-wide" : ""}`}>
      {children}
      <span className="sapreg-float">
        {label}
        {required && " *"}
      </span>
    </label>
  );
}

const Chevron = () => (
  <svg className="sapreg-chevron" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
    <path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

function safeNext(next: string | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/** SAP's registration ("We see you're new to SAP"), steps 1–2. */
export default function RegistrationForm({
  initialEmail = "",
  next,
  onClose,
  onBack,
}: {
  initialEmail?: string;
  next?: string;
  /** In the person-icon dialog: close it. */
  onClose?: () => void;
  /** In the dialog: back to the e-mail step. */
  onBack?: () => void;
}) {
  const router = useRouter();
  const [country, setCountry] = useState("Pakistan");
  const [dialIso, setDialIso] = useState("PK");
  const [email, setEmail] = useState(initialEmail);
  const [stage, setStage] = useState<"form" | "sent">("form");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const dial = COUNTRIES.find(([iso]) => iso === dialIso) ?? COUNTRIES.find(([iso]) => iso === "PK")!;
  const close = onClose ?? (() => router.push("/"));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) || "").trim();

    const missing = ["firstName", "lastName", "company", "department", "relationship"].some((name) => !value(name));
    if (missing || !email.trim()) {
      setError("Please fill in all mandatory fields.");
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError("Please enter a valid business e-mail address.");
      return;
    }
    if (!data.get("terms")) {
      setError("Please confirm that you have read and understood the Terms and Conditions of SAP.com.");
      return;
    }

    const phone = value("phone");
    setBusy(true);
    setError("");
    try {
      await api("/auth/register", {
        body: {
          email: email.trim(),
          first_name: value("firstName"),
          last_name: value("lastName"),
          country,
          phone: phone ? `${dial[2]} ${phone}` : "",
          company: value("company"),
          department: value("department"),
          relationship: value("relationship"),
          contact_by_email: !!data.get("contactEmail"),
          contact_by_phone: !!data.get("contactPhone"),
          terms_accepted: true,
        },
      });
      try {
        window.sessionStorage.setItem("sap-clone-register-next", safeNext(next));
      } catch {}
      setStage("sent");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setNotice("");
    setError("");
    try {
      await api("/auth/resend", { body: { email: email.trim() } });
      setNotice("We sent the e-mail again. It can take a few minutes to arrive.");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (stage === "sent") {
    return (
      <div className="sapreg">
        <RegisterSteps current={2} onClose={close} />
        <div className="sapreg-body">
          <h1 className="sapreg-title">Verify your e-mail</h1>
          <p className="sapreg-text">
            We sent an e-mail to <strong>{email.trim()}</strong>. Click the link in the e-mail to
            verify your address and finish your registration.
          </p>
          <p className="sapreg-text">
            Didn&apos;t get the e-mail? Check your spam folder or{" "}
            <button type="button" className="sapreg-inline-link" onClick={resend}>
              send it again
            </button>
            .
          </p>
          {notice && <p className="sapreg-notice">{notice}</p>}
          {error && (
            <p className="sapreg-error" role="alert">
              {error}
            </p>
          )}
          <div className="sapreg-actions">
            <button type="button" className="sapreg-button sapreg-button-ghost" onClick={() => setStage("form")}>
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sapreg">
      <RegisterSteps current={1} onClose={close} />
      <form className="sapreg-body" onSubmit={onSubmit} noValidate>
        <h1 className="sapreg-title">We see you&apos;re new to SAP</h1>

        <div className="sapreg-grid">
          <Field label="First Name" required>
            <input name="firstName" placeholder=" " autoComplete="given-name" />
          </Field>
          <Field label="Last Name" required>
            <input name="lastName" placeholder=" " autoComplete="family-name" />
          </Field>

          <Field label="Country/Region" required>
            <select
              name="country"
              value={country}
              onChange={(event) => {
                setCountry(event.target.value);
                const match = COUNTRIES.find(([, name]) => name === event.target.value);
                if (match) setDialIso(match[0]);
              }}
            >
              {COUNTRIES.map(([iso, name]) => (
                <option key={iso} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <Chevron />
          </Field>
          <label className="sapreg-field sapreg-phone">
            <span className="sapreg-dial">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={flagUrl(dial[0])} alt="" width="24" height="16" />
              <Chevron />
              <select
                aria-label="Country calling code"
                value={dialIso}
                onChange={(event) => setDialIso(event.target.value)}
              >
                {COUNTRIES.map(([iso, name, code]) => (
                  <option key={iso} value={iso}>
                    {name} {code}
                  </option>
                ))}
              </select>
            </span>
            <input
              name="phone"
              type="tel"
              autoComplete="tel-national"
              placeholder={`${dial[2]} XX XXXXXXXX`}
            />
            <span className="sapreg-float sapreg-float-fixed">Phone</span>
          </label>

          <Field label="Business e-mail address" required>
            <input
              name="email"
              type="email"
              placeholder=" "
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </Field>
          <Field label="Company" required>
            <input name="company" placeholder=" " autoComplete="organization" />
          </Field>

          <Field label="Department" required>
            <select name="department" defaultValue="" data-empty="">
              <option value="" disabled hidden />
              {DEPARTMENTS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Chevron />
          </Field>
          <Field label="Relationship to SAP" required>
            <select name="relationship" defaultValue="">
              <option value="" disabled hidden />
              {RELATIONSHIPS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <Chevron />
          </Field>
        </div>

        <p className="sapreg-text sapreg-legal">
          SAP will use the data provided hereunder in accordance with the{" "}
          <a href="https://www.sap.com/about/legal/privacy.html" target="_blank" rel="noopener noreferrer">
            Privacy Statement
          </a>
          .
        </p>
        <p className="sapreg-text">
          By checking the respective channels below, I agree that my contact details can be used by SAP
          to send me news about SAP Products and Services.
        </p>
        <div className="sapreg-checks">
          <label className="sapreg-check">
            <input type="checkbox" name="contactEmail" />
            <span>Email</span>
          </label>
          <label className="sapreg-check">
            <input type="checkbox" name="contactPhone" />
            <span>Phone</span>
          </label>
        </div>
        <label className="sapreg-check sapreg-terms">
          <input type="checkbox" name="terms" />
          <span>
            I have read and understood the Terms and Conditions of{" "}
            <a href="https://www.sap.com/about/legal/terms-of-use.html" target="_blank" rel="noopener noreferrer">
              SAP.com
            </a>{" "}
            *
          </span>
        </label>

        {error && (
          <p className="sapreg-error" role="alert">
            {error}
          </p>
        )}

        <div className="sapreg-actions">
          <button type="submit" className="sapreg-button" disabled={busy}>
            {busy ? "Submitting…" : "Submit"}
          </button>
          {onBack ? (
            <button type="button" className="sapreg-button sapreg-button-ghost" onClick={onBack}>
              Back
            </button>
          ) : (
            <Link className="sapreg-button sapreg-button-ghost" href={`/login?next=${encodeURIComponent(safeNext(next))}`}>
              Back
            </Link>
          )}
        </div>

        <a className="sapreg-support" href="https://www.sap.com/about/contact-us.html" target="_blank" rel="noopener noreferrer">
          Get support
        </a>
        <p className="sapreg-recaptcha">
          This site is protected by reCAPTCHA and the Google{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>{" "}
          and{" "}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">
            Terms of Service
          </a>{" "}
          apply.
        </p>
      </form>
    </div>
  );
}
