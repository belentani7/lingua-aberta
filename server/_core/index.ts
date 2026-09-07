import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { COOKIE_NAME, decodeOAuthState, OAUTH_STATE_COOKIE } from "@shared/const";
import { appRouter } from "../routers";
import { upsertUser } from "../db";
import { createSessionToken, createTrpcContext, parseCookie } from "./context";
import { getSessionCookieOptions } from "./cookies";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function oauthPortalUrl(): string {
  return (process.env.OAUTH_PORTAL_URL || process.env.VITE_OAUTH_PORTAL_URL || "").replace(/\/$/, "");
}

function appSecret(): string {
  return process.env.APP_SECRET || "";
}

async function handleOAuthCallback(req: express.Request, res: express.Response) {
  const { code, state } = req.query;
  const rawState = typeof state === "string" ? state : "";

  // CSRF: the `state` nonce must match the one planted at login start.
  const cookies = parseCookie(req.headers.cookie ?? "");
  const nonce = cookies[OAUTH_STATE_COOKIE];
  const decoded = decodeOAuthState(rawState);
  if (nonce && decoded.nonce && nonce !== decoded.nonce) {
    res.status(403).send("Invalid oauth state (403)");
    return;
  }

  const portalUrl = oauthPortalUrl();
  if (typeof code !== "string" || !code || !portalUrl) {
    res.redirect("/?oauth=error&reason=missing_config");
    return;
  }

  try {
    const tokenUrl = (process.env.OAUTH_TOKEN_ENDPOINT || `${portalUrl}/api/oauth/token`).replace(/\/$/, "");
    const tokenResp = await fetch(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        code,
        appId: process.env.APP_ID || process.env.VITE_APP_ID,
        appSecret: appSecret(),
        grantType: "authorization_code",
      }),
    });
    if (!tokenResp.ok) throw new Error(`OAuth token failed (${tokenResp.status})`);
    const tokenPayload = (await tokenResp.json()) as { access_token?: string; refresh_token?: string; cookie?: string };
    const accessToken = tokenPayload.access_token || tokenPayload.cookie || "";

    const userUrl = (process.env.OAUTH_USERINFO_ENDPOINT || `${portalUrl}/api/oauth/userinfo`).replace(/\/$/, "");
    const userResp = await fetch(userUrl, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!userResp.ok) throw new Error(`OAuth userinfo failed (${userResp.status})`);
    const profile = (await userResp.json()) as {
      openId?: string;
      userId?: string;
      id?: string | number;
      name?: string;
      nickname?: string;
      email?: string;
      avatar?: string;
    };

    const openId = String(profile.openId || profile.userId || profile.id || "");
    if (!openId) throw new Error("OAuth userinfo missing openId");

    await upsertUser({
      openId,
      name: profile.name || profile.nickname || null,
      email: profile.email || null,
      loginMethod: "manus",
      role: "user",
    });

    const sessionToken = await createSessionToken(openId);
    const options = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, options);
    res.cookie(OAUTH_STATE_COOKIE, "", { ...options, maxAge: -1 });

    const target = decoded.redirectUri || "/";
    res.redirect(target);
  } catch (error) {
    console.error("[OAuthCallback] Failed:", error instanceof Error ? error.message : error);
    res.redirect("/?oauth=error&reason=exchange_failed");
  }
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "25mb" }));

  app.get("/api/oauth/callback", handleOAuthCallback);
  app.post("/api/oauth/callback", handleOAuthCallback);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: ({ req, res }) => createTrpcContext(req as express.Request, res as express.Response),
    }),
  );

  const staticPath = path.resolve(__dirname, "..", "..", "dist", "public");

  app.use(express.static(staticPath, { index: false }));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  app.listen(PORT, () => {
    console.log(`Lingua Aberta server running on http://localhost:${PORT}/`);
  });
}

startServer().catch((error) => {
  console.error("[Server] Failed to start:", error);
  process.exit(1);
});