import { getSession } from "@/lib/auth";
import { SessionUser } from "@/types";
import { NextResponse } from "next/server";

export async function getCurrentUser(): Promise<SessionUser | null> {
  return await getSession();
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (user.status !== "ACTIVE") {
    throw new Error("ACCOUNT_SUSPENDED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { success: false, message: "Authentication required. Please log in." },
        { status: 401 }
      );
    }
    if (error.message === "ACCOUNT_SUSPENDED") {
      return NextResponse.json(
        { success: false, message: "Your account is deactivated. Contact system administrator." },
        { status: 403 }
      );
    }
    if (error.message === "FORBIDDEN") {
      return NextResponse.json(
        { success: false, message: "Access forbidden. Administrator privileges required." },
        { status: 403 }
      );
    }
  }
  return NextResponse.json(
    { success: false, message: "An unexpected authorization error occurred." },
    { status: 500 }
  );
}
