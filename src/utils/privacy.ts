export const maskDocument = (doc: string | undefined): string => {
  if (!doc) return '••••••••';
  const clean = doc.trim();
  if (clean.length <= 4) return '••••';
  return `${clean.slice(0, 3)}••••${clean.slice(-3)}`;
};

export const maskEmail = (email: string | undefined): string => {
  if (!email || !email.includes('@')) return '••••@••••';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `••@${domain}`;
  return `${user.slice(0, 2)}••••${user.slice(-1)}@${domain}`;
};

// In-memory privacy mode state (no local storage persistence)
let inMemoryPrivacyMode = true;

export const isPrivacyModeEnabled = (): boolean => inMemoryPrivacyMode;

export const setPrivacyModeEnabled = (enabled: boolean): void => {
  inMemoryPrivacyMode = enabled;
};
