export function nativeApiUrl(path: string, configured?: string): string {
  if (!path.startsWith("/api/") || path.includes("\\") || path.includes(".."))
    throw new Error("Invalid API path.");
  if (!configured)
    throw new Error("This native build has no configured API server.");
  const server = new URL(configured);
  if (
    server.protocol !== "https:" ||
    server.username ||
    server.password ||
    server.pathname !== "/" ||
    server.search ||
    server.hash
  )
    throw new Error("The native API server must be an HTTPS origin.");
  return `${server.origin}${path}`;
}
