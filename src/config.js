export const IS_BROWSER_DEMO = import.meta.env.VITE_BROWSER_DEMO === "true";
export const logoUrl = `${import.meta.env.BASE_URL}dagachi-logo.jpg`;
export function inviteUrl(code) {
  const root = new URL(import.meta.env.BASE_URL, location.href).href;
  return `${root}${IS_BROWSER_DEMO ? "#/" : ""}lab/join?code=${encodeURIComponent(code)}`;
}
