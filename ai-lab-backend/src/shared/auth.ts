import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import jwt from "jsonwebtoken";

const allowedAudience = process.env.ALLOWED_AUDIENCE;

export interface AuthContext {
  userId: string;
  tenantId: string;
  email?: string;
  name?: string;
  roles: string[];
}

export function unauthorized(message = "Unauthorized"): HttpResponseInit {
  return { status: 401, jsonBody: { error: message } };
}

export function forbidden(message = "Forbidden"): HttpResponseInit {
  return { status: 403, jsonBody: { error: message } };
}

// POC-level token “validation”: decode + simple audience check.
// In production, validate signature using Azure AD JWKS.
export function getAuthContext(req: HttpRequest, context: InvocationContext): AuthContext | null {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

  if (!token) {
    context.warn("No Authorization header");
    return null;
  }

  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded) {
      context.warn("Could not decode token");
      return null;
    }

    if (allowedAudience && decoded.aud !== allowedAudience) {
      context.warn(`Invalid audience: ${decoded.aud}`);
      return null;
    }

    const userId = decoded.oid || decoded.sub;
    const tenantId = decoded.tid;
    const roles: string[] = decoded.roles || decoded.appRoles || [];

    if (!userId || !tenantId) {
      context.warn("Missing user/tenant in token");
      return null;
    }

    return {
      userId,
      tenantId,
      email: decoded.preferred_username,
      name: decoded.name,
      roles
    };
  } catch (err) {
    context.error("Token decode error", err);
    return null;
  }
}

export function requireRole(auth: AuthContext, requiredRoles: string[]): boolean {
  return auth.roles.some(r => requiredRoles.includes(r));
}
