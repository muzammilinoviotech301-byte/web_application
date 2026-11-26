export type SapAccount = {
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  country: string;
  company: string;
  department: string;
  relationship: string;
  phone: string;
};

const ACCOUNT_KEY = "sap-clone-account";
const LEGACY_EMAIL_KEY = "sapAccountEmail";

export const AUTH_STORAGE_KEYS = {
  account: ACCOUNT_KEY,
  legacyEmail: LEGACY_EMAIL_KEY,
} as const;

function nameFromEmail(email: string) {
  const local = email.split("@")[0] || "SAP user";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

export function makeAccount(
  values: Partial<SapAccount> & { email: string }
): SapAccount {
  const fromEmail = nameFromEmail(values.email);
  const firstName = values.firstName?.trim() || fromEmail.split(" ")[0] || "SAP";
  const lastName = values.lastName?.trim() || "User";

  return {
    email: values.email.trim(),
    firstName,
    lastName,
    displayName: values.displayName?.trim() || `${firstName} ${lastName}`,
    country: values.country || "Pakistan",
    company: values.company || "INOVIOTECH ( PRIVATE ) LIMITED",
    department: values.department || "Inform. Technology",
    relationship: values.relationship || "Consultant",
    phone: values.phone || "+92 xx xxxxxxxx",
  };
}

export function readAccount(): SapAccount | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SapAccount;
      if (parsed && typeof parsed.email === "string") {
        return { ...makeAccount({ email: parsed.email }), ...parsed };
      }
    }

    const legacyEmail = window.localStorage.getItem(LEGACY_EMAIL_KEY);
    if (legacyEmail) return makeAccount({ email: legacyEmail });
  } catch {
    // Storage can be blocked; the clone still works for this session.
  }

  return null;
}

export function saveAccount(account: SapAccount) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    window.localStorage.setItem(LEGACY_EMAIL_KEY, account.email);
  } catch {
    // Ignore storage failures.
  }
}

export function clearAccount() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ACCOUNT_KEY);
    window.localStorage.removeItem(LEGACY_EMAIL_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function accountInitials(account: SapAccount | null) {
  if (!account) return "";
  const parts = account.displayName.trim().split(/\s+/);
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}
