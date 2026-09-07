/** Typed access to server environment variables. */

function read(name: string, fallback = ""): string {
  const value = process.env[name];
  return value === undefined || value === "" ? fallback : value;
}

export const ENV = {
  get ownerOpenId(): string {
    return read("OWNER_OPEN_ID");
  },
  get forgeApiUrl(): string {
    return read("BUILT_IN_FORGE_API_URL");
  },
  get forgeApiKey(): string {
    return read("BUILT_IN_FORGE_API_KEY");
  },
  get sessionSecret(): string {
    return read("SESSION_SECRET", "lingua-aberta-dev-secret-change-me");
  },
};
