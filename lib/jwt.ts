export function isAccessTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded)) as { exp?: number };
    if (typeof decoded.exp !== 'number') {
      return false;
    }
    return decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
