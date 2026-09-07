import type { Request } from "express";
import type { SerializeOptions } from "cookie";
import { ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the base cookie options for the session cookie. The session is bound
 * to the requesting host (Secure + SameSite=None so the OAuth portal and app
 * can both read it, HttpOnly + Path=/ for server-only access). Logout overrides
 * maxAge with -1 to expire it immediately.
 */
export function getSessionCookieOptions(_req: Request): SerializeOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: ONE_YEAR_MS / 1000,
  };
}
