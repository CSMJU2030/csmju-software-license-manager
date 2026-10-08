export function redirectToLogin() {
  const next = `${window.location.pathname}${window.location.search}`;
  const target = new URL("/auth/login", window.location.origin);
  target.searchParams.set("next", next || "/");
  window.location.assign(target.toString());
}
