const key = (owner: string) => `forge:lock-screen:${owner}`;
export function savedActivity(owner: string): string | null {
  try {
    return localStorage.getItem(key(owner));
  } catch {
    return null;
  }
}
export function saveActivity(owner: string, session: string | null) {
  try {
    if (session) localStorage.setItem(key(owner), session);
    else localStorage.removeItem(key(owner));
  } catch {
    /* OS status can still work for this app session without storage. */
  }
}
