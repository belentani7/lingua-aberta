import type { Request, Response } from "express";
import { jwtVerify, SignJWT } from "jose";
import { COOKIE_NAME } from "@shared/const";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  user: User | null;
  req: Request;
  res: Response;
};

export function parseCookie(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key) result[key] = decodeURIComponent(value);
  }
  return result;
}

function secretKey(): Uint8Array {
  return new TextEncoder().encode(ENV.sessionSecret);
}

export async function createSessionToken(openId: string): Promise<string> {
  return new SignJWT({ openId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function resolveUser(req: Request): Promise<User | null> {
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const cookie = parseCookie(req.headers.cookie ?? "")[COOKIE_NAME];
  const token = bearer || cookie;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const openId = payload.openId;
    if (typeof openId !== "string" || !openId) return null;
    return (await getUserByOpenId(openId)) ?? null;
  } catch {
    return null;
  }
}

export async function createTrpcContext(req: Request, res: Response): Promise<TrpcContext> {
  const user = await resolveUser(req);
  return { user, req, res };
}
