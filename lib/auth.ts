import {logEvent} from "@/utils/sentry";
import {jwtVerify, SignJWT} from "jose";
import {cookies} from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const cookieName = "auth-token";

export const signAuthToken = async (payload: any) => {
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({alg: "HS256"})
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    return token;
  } catch (error) {
    logEvent("Error signing JWT", "auth", {payload}, "error", error);
    throw new Error("Failed to sign JWT");
  }
};

export const verifyAccessToken = async <T>(token: string): Promise<T> => {
  try {
    const {payload} = await jwtVerify(token, secret);

    return payload as T;
  } catch (error) {
    const err = error instanceof Error ? error.message : "Unknown error";

    logEvent(
      "AUTH_TOKEN_VERIFICATION_FAILED",
      "auth",
      {
        tokenSnippet: token.slice(0, 10),
      },
      "error",
      error
    );

    throw new Error(`Token verification failed: ${err}`, {
      cause: error instanceof Error ? error : undefined,
    });
  }
};

export const setAuthCookie = async (token: string) => {
  try {
    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (err) {
    logEvent("Error setting auth cookie", "auth", {token}, "error", err);
  }
};

export const getAuthCookie = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(cookieName);
    return token?.value;
  } catch (err) {
    logEvent("Error getting auth cookie", "auth", {}, "error", err);
    return null;
  }
};

export const deleteAuthCookie = async () => {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(cookieName);
  } catch (err) {
    logEvent("Error deleting auth cookie", "auth", {}, "error", err);
  }
};
