"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import FeatureNotice from "@/components/FeatureNotice";
import type { AccountFormVariant } from "@/data/account-pages";
import { api, readSession, type Session } from "@/lib/api";
import { COUNTRIES as ALL_COUNTRIES } from "@/lib/countries";

const COUNTRIES = ALL_COUNTRIES.map(([, name]) => name);
const LANGUAGES = ["English", "Arabic", "German", "French", "Urdu"];
const TIME_ZONES = ["Asia/Karachi", "Asia/Riyadh", "Asia/Dubai", "Europe/Berlin", "UTC"];

const INTEREST_GROUPS = [
  { title: "Artificial Intelligence", items: ["Products", "Business AI Platform"] },
  { title: "CX and CRM", items: ["Customer experience"] },
  { title: "Data and Analytics", items: ["SAP Analytics Cloud", "SAP Datasphere"] },
  { title: "Enterprise Resource Planning", items: ["SAP S/4HANA Cloud", "SAP Business One"] },
  { title: "Financial Management", items: ["Financial planning", "Treasury"] },
  { title: "Human Capital Management", items: ["SAP SuccessFactors"] },
  { title: "Spend Management", items: ["SAP Ariba", "SAP Concur", "SAP Fieldglass"] },
  { title: "Supply Chain Management", items: ["Supply chain planning", "Manufacturing"] },
  {
    title: "Industries",
    items: [
      "Aerospace and Defense",
      "Automotive",
      "Banking",
      "Chemicals",
      "Consumer Products",
      "Education and Research",
      "Healthcare",
      "High Tech",
      "Retail",
      "Travel and Transportation",
    ],
  },
  { title: "Company size", items: ["Small Businesses", "Midsize Companies", "Large Enterprise"] },
];

type ExtraFields = Partial<Record<"loginName" | "language" | "timeZone" | "validFrom" | "validTo" | "companyCity", string>>;

function FormField({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return (
    <label className="account-form-field">
      <span className="account-form-label">
        {label} {required && <span aria-hidden="true">*</span>}
      </span>
      {children}
    </label>
  );
}

function Status({ message, error }: { message: string; error?: boolean }) {
  if (!message) return null;
  return (
    <p className={error ? "account-form-status account-form-error" : "account-form-status"} role={error ? "alert" : "status"}>
      {message}
    </p>
  );
}

function browserName() {
  const agent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  const browser = /Edg\//.test(agent) ? "Edge" : /Chrome\//.test(agent) ? "Chrome" : /Firefox\//.test(agent) ? "Firefox" : /Safari\//.test(agent) ? "Safari" : "Browser";
  const os = /Windows/.test(agent) ? "Windows" : /Mac OS/.test(agent) ? "macOS" : /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iOS" : "Linux";
  return `${browser} on ${os}`;
}

export default function AccountForm({ variant }: { variant: AccountFormVariant }) {
  const { account, profile, signIn, signOut } = useAuth();
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const [firstName, setFirstName] = useState(account?.firstName ?? "");
  const [lastName, setLastName] = useState(account?.lastName ?? "");
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [phone, setPhone] = useState(account?.phone ?? "");
  const [loginName, setLoginName] = useState("");
  const [language, setLanguage] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const [companyCountry, setCompanyCountry] = useState(account?.country ?? "Pakistan");
  const [companyCity, setCompanyCity] = useState("");
  const [byEmail, setByEmail] = useState(false);
  const [byTelephone, setByTelephone] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  const [interestQuery, setInterestQuery] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [exported, setExported] = useState<Record<string, unknown> | null>(null);

  const userId = profile ? `P${profile.id.replace(/-/g, "").slice(0, 10).toUpperCase()}` : "";

  // Keep the form in step with the profile once it has loaded.
  useEffect(() => {
    if (!profile || !account) return;
    setFirstName(account.firstName);
    setLastName(account.lastName);
    setDisplayName(account.displayName);
    setPhone(account.phone);
    setCompanyCountry(account.country || "Pakistan");
    setByEmail(profile.contact_by_email);
    setByTelephone(profile.contact_by_phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // Load the values each form needs from the backend.
  useEffect(() => {
    if (!readSession()) return;
    if (variant === "interests") {
      api<{ products: string[] }>("/profile/interests", { auth: true })
        .then((result) => setSelectedInterests(result.products))
        .catch(() => {});
    }
    if (variant === "personal" || variant === "company") {
      api<{ profileExtra?: ExtraFields }>("/me/state", { auth: true })
        .then((state) => {
          const extra = state.profileExtra || {};
          setLoginName(extra.loginName || "");
          setLanguage(extra.language || "");
          setTimeZone(extra.timeZone || "");
          setValidFrom(extra.validFrom || "");
          setValidTo(extra.validTo || "");
          setCompanyCity(extra.companyCity || "");
        })
        .catch(() => {});
    }
    if (variant === "data") {
      api<Record<string, unknown>>("/me/export", { auth: true }).then(setExported).catch(() => {});
    }
  }, [variant]);

  function showMessage(message: string, isError = false) {
    setError(isError);
    setStatus(message);
  }

  async function attempt(work: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await work();
      showMessage(success);
    } catch (err) {
      showMessage((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }

  // Fields with no profile column live in the user's dashboard state.
  async function saveExtra(values: ExtraFields) {
    const state = await api<{ profileExtra?: ExtraFields }>("/me/state", { auth: true });
    await api("/me/state", {
      method: "PATCH",
      auth: true,
      body: { data: { profileExtra: { ...(state.profileExtra || {}), ...values } } },
    });
  }

  function savePersonal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !displayName.trim()) {
      showMessage("Please complete all required fields.", true);
      return;
    }
    if (!account) return;
    attempt(async () => {
      await signIn({ ...account, firstName: firstName.trim(), lastName: lastName.trim(), displayName: displayName.trim(), phone: phone.trim() });
      await saveExtra({ loginName, language, timeZone, validFrom, validTo });
    }, "Your personal information has been saved.");
  }

  function saveCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;
    attempt(async () => {
      await signIn({ ...account, country: companyCountry });
      await saveExtra({ companyCity });
    }, "Your company information has been saved.");
  }

  function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    attempt(async () => {
      await api("/profile", { method: "PATCH", auth: true, body: { contact_by_email: byEmail, contact_by_phone: byTelephone } });
    }, "Your contact preferences have been saved.");
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentPassword || !newPassword || !retypePassword) {
      showMessage("Please complete all password fields.", true);
      return;
    }
    if (newPassword !== retypePassword) {
      showMessage("The new passwords do not match.", true);
      return;
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      showMessage("Use at least 8 characters with upper-case and lower-case letters and a number.", true);
      return;
    }
    if (!account) return;
    attempt(async () => {
      // Confirm the current password first, as SAP ID does.
      try {
        await api<Session>("/auth/signin", { body: { email: account.email, password: currentPassword } });
      } catch {
        throw new Error("Your current password is incorrect.");
      }
      await api("/auth/password", { body: { password: newPassword }, auth: true });
      setCurrentPassword("");
      setNewPassword("");
      setRetypePassword("");
    }, "Your password has been changed.");
  }

  function toggleInterest(item: string) {
    setSelectedInterests((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
  }

  if (variant === "interests") {
    const query = interestQuery.trim().toLowerCase();
    return (
      <form
        className="account-form"
        onSubmit={(event) => {
          event.preventDefault();
          attempt(async () => {
            await api("/profile/interests", { method: "PUT", auth: true, body: { products: selectedInterests } });
          }, "Your interests have been saved.");
        }}
      >
        <div className="account-interest-search-row">
          <input
            className="account-form-input"
            type="search"
            placeholder="Search interests"
            aria-label="Search interests"
            value={interestQuery}
            onChange={(event) => setInterestQuery(event.target.value)}
          />
          <span className="account-interest-count">{query ? "Search results" : `${selectedInterests.length} selected`}</span>
        </div>

        <div className="account-interest-groups">
          {INTEREST_GROUPS.map((group) => {
            const items = group.items.filter((item) => `${group.title} ${item}`.toLowerCase().includes(query));
            if (!items.length) return null;
            return (
              <fieldset className="account-interest-group" key={group.title}>
                <legend>{group.title}</legend>
                {items.map((item) => (
                  <label className="account-interest-option" key={item}>
                    <input type="checkbox" checked={selectedInterests.includes(item)} onChange={() => toggleInterest(item)} />
                    <span>{item}</span>
                    <small>{group.title === "Industries" || group.title === "Company size" ? group.title : "Portfolio subcategory"}</small>
                  </label>
                ))}
              </fieldset>
            );
          })}
        </div>

        <div className="account-interest-selected">
          <strong>Review your selections:</strong>
          <div className="account-interest-chips">
            {selectedInterests.map((item) => (
              <button type="button" className="account-interest-chip" key={item} onClick={() => toggleInterest(item)}>
                {item} <span aria-hidden="true">×</span>
              </button>
            ))}
          </div>
        </div>

        <div className="account-form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Save and Continue
          </button>
        </div>
        <Status message={status} error={error} />
      </form>
    );
  }

  if (!account) return null;

  if (variant === "personal") {
    const dial = ALL_COUNTRIES.find(([, name]) => name === account.country)?.[2] ?? "+92";
    return (
      <form className="account-form" onSubmit={savePersonal}>
        <div className="account-form-grid">
          <FormField label="First Name" required>
            <input className="account-form-input" value={firstName} onChange={(event) => setFirstName(event.target.value)} />
          </FormField>
          <FormField label="Last Name" required>
            <input className="account-form-input" value={lastName} onChange={(event) => setLastName(event.target.value)} />
          </FormField>
        </div>
        <div className="account-form-grid">
          <FormField label="Email" required>
            <input className="account-form-input" type="email" value={account.email} readOnly title="Your e-mail address is your sign-in name" />
          </FormField>
          <FormField label="Login Name">
            <input className="account-form-input" value={loginName} placeholder="--" onChange={(event) => setLoginName(event.target.value)} />
          </FormField>
        </div>
        <div className="account-form-grid">
          <FormField label="Display Name" required>
            <input className="account-form-input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </FormField>
          <FormField label="User ID">
            <input className="account-form-input" value={userId} readOnly />
          </FormField>
        </div>
        <FormField label="Phone">
          <div className="account-phone-row">
            <span className="account-phone-prefix">{dial}</span>
            <input
              className="account-form-input"
              type="tel"
              placeholder="XXX-XXX-XXXX"
              value={phone.startsWith(dial) ? phone.slice(dial.length).trim() : phone}
              onChange={(event) => setPhone(event.target.value ? `${dial} ${event.target.value}` : "")}
            />
          </div>
        </FormField>
        <div className="account-form-grid">
          <FormField label="Language">
            <select className="account-form-input" value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="">Select...</option>
              {LANGUAGES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Time Zone">
            <select className="account-form-input" value={timeZone} onChange={(event) => setTimeZone(event.target.value)}>
              <option value="">Select...</option>
              {TIME_ZONES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="account-form-grid">
          <FormField label="Valid From">
            <input className="account-form-input" type="date" value={validFrom} onChange={(event) => setValidFrom(event.target.value)} />
          </FormField>
          <FormField label="Valid To">
            <input className="account-form-input" type="date" value={validTo} onChange={(event) => setValidTo(event.target.value)} />
          </FormField>
        </div>
        <div className="account-form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Save
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => showMessage("")}>
            Cancel
          </button>
        </div>
        <Status message={status} error={error} />
      </form>
    );
  }

  if (variant === "company") {
    return (
      <form className="account-form" onSubmit={saveCompany}>
        <div className="account-form-grid">
          <FormField label="Company Country/Region">
            <select className="account-form-input" value={companyCountry} onChange={(event) => setCompanyCountry(event.target.value)}>
              {COUNTRIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Company City">
            <input className="account-form-input" value={companyCity} onChange={(event) => setCompanyCity(event.target.value)} />
          </FormField>
        </div>
        <div className="account-form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Save
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => showMessage("")}>
            Cancel
          </button>
        </div>
        <Status message={status} error={error} />
      </form>
    );
  }

  if (variant === "contact") {
    return (
      <form className="account-form" onSubmit={saveContact}>
        <label className="account-form-check">
          <input type="checkbox" checked={byEmail} onChange={(event) => setByEmail(event.target.checked)} />
          <span>By email</span>
        </label>
        <label className="account-form-check">
          <input type="checkbox" checked={byTelephone} onChange={(event) => setByTelephone(event.target.checked)} />
          <span>By telephone</span>
        </label>
        <div className="account-form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Save
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => showMessage("")}>
            Cancel
          </button>
        </div>
        <Status message={status} error={error} />
      </form>
    );
  }

  if (variant === "password") {
    return (
      <form className="account-form" onSubmit={changePassword}>
        <FormField label="Current Password" required>
          <input className="account-form-input" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </FormField>
        <FormField label="New Password" required>
          <input className="account-form-input" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </FormField>
        <FormField label="Re-enter New Password" required>
          <input className="account-form-input" type="password" autoComplete="new-password" value={retypePassword} onChange={(event) => setRetypePassword(event.target.value)} />
        </FormField>
        <div className="account-form-actions">
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Save
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => showMessage("")}>
            Cancel
          </button>
        </div>
        <Status message={status} error={error} />
      </form>
    );
  }

  if (variant === "sessions") {
    const session = readSession();
    const expires = session?.expires_at
      ? `${Math.max(0, Math.round((session.expires_at * 1000 - Date.now()) / 60000))} minutes`
      : "--";
    return (
      <div className="account-form">
        <div className="account-table-wrap">
          <table className="account-table account-session-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Sign in with</th>
                <th>Expires</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {browserName()}
                  <span className="account-current-label">Current</span>
                </td>
                <td>User name and password</td>
                <td>{expires}</td>
                <td>
                  <button
                    type="button"
                    className="account-inline-button"
                    onClick={async () => {
                      await signOut();
                      window.location.href = "/";
                    }}
                  >
                    Sign Out
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="account-form-note">Signed in somewhere else too? Sign out of every browser and device at once.</p>
        <div className="account-form-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() =>
              attempt(async () => {
                await api("/me/signout-everywhere", { method: "POST", auth: true });
                await signOut();
                window.location.href = "/";
              }, "Signed out everywhere.")
            }
          >
            Sign Out of All Sessions
          </button>
        </div>
        <Status message={status} error={error} />
      </div>
    );
  }

  if (variant === "data") {
    const data: Record<string, unknown> = {
      userID: userId,
      globalUserID: profile?.id ?? "",
      email: account.email,
      mailVerified: true,
      firstName: account.firstName,
      lastName: account.lastName,
      displayName: account.displayName,
      country: account.country,
      company: account.company,
      department: account.department,
      relationship: account.relationship,
      phone: account.phone || "--",
      contactByEmail: profile?.contact_by_email ?? false,
      contactByPhone: profile?.contact_by_phone ?? false,
      termsAccepted: profile?.terms_accepted_at ?? "--",
      status: "active",
    };

    function download() {
      const url = URL.createObjectURL(new Blob([JSON.stringify(exported ?? data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "sap-id-my-data.json";
      link.click();
      URL.revokeObjectURL(url);
    }

    return (
      <div className="account-form">
        <div className="account-panel account-rows account-data-rows">
          {Object.entries(data).map(([key, value]) => (
            <div className="account-row" key={key}>
              <dt>{key}</dt>
              <dd>{String(value)}</dd>
            </div>
          ))}
        </div>
        <p className="account-form-note">
          The download contains everything stored for your account: profile, interests, preferences, trials, learning,
          events, saved items, cart, orders and messages.
        </p>
        <div className="account-form-actions">
          <button type="button" className="btn btn-primary" onClick={download} disabled={!exported}>
            Download
          </button>
        </div>
        <Status message={status} error={error} />
      </div>
    );
  }

  // mfa, certificates, tokens, social: provided only by SAP Universal ID.
  return (
    <div className="account-form">
      <FeatureNotice feature={variant} />
    </div>
  );
}
