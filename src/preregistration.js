// This is a public form destination, never an email password or API credential.
export const PREREGISTRATION_ACTION =
  "https://formsubmit.co/jinyoungrang0502@gmail.com";

export function preregistrationReturnUrl() {
  const root = new URL(import.meta.env.BASE_URL, window.location.href);
  root.search = "";
  root.hash = "/preregister/thanks";
  return root.href;
}
