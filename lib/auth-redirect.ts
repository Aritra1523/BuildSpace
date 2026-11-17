export type UserRole = "creator" | "recruiter" | "admin";

interface RedirectOptions {
  role?: UserRole | string | null;
  isNewUser?: boolean;
  callbackUrl?: string | null;
}

export function getPostAuthRedirect(options?: RedirectOptions): string {
  const role = (options?.role || "creator") as UserRole;
  const isNewUser = Boolean(options?.isNewUser);
  const callbackUrl = options?.callbackUrl;

  if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
    return callbackUrl;
  }

  if (isNewUser) {
    if (role === "recruiter") {
      return "/explore?mode=recruiter&onboarding=recruiter";
    }
    return "/explore?onboarding=creator";
  }

  switch (role) {
    case "admin":
      return "/explore?mode=admin";
    case "recruiter":
      return "/explore?mode=recruiter";
    case "creator":
    default:
      return "/explore";
  }
}

/**
 * Normalizes any backend auth response shape:
 * Works whether the API returns { user: { role } }, { data: { user: { role } } }, or flat { _id, email, role, token }
 */
export function normalizeAuthPayload(
  data: Record<string, unknown> | null | undefined,
  fallbackEmail = "",
  fallbackRole: UserRole = "creator"
) {
  const payload = (data ?? {}) as Record<string, unknown>;
  const rawUser =
    (payload.user as Record<string, unknown> | undefined) ||
    (payload.data as Record<string, unknown> | undefined)?.user ||
    (payload.data as Record<string, unknown> | undefined) ||
    payload;

  const inferredRole: UserRole =
    (rawUser?.role as UserRole | undefined) ||
    (payload.role as UserRole | undefined) ||
    (fallbackEmail.includes("recruiter")
      ? "recruiter"
      : fallbackEmail.includes("admin")
      ? "admin"
      : fallbackRole);

  const user = {
    _id:
      (rawUser?._id as string | undefined) ||
      (rawUser?.id as string | undefined) ||
      (payload._id as string | undefined) ||
      (payload.id as string | undefined) ||
      `user_${Date.now()}`,
    email: (rawUser?.email as string | undefined) || (payload.email as string | undefined) || fallbackEmail,
    role: inferredRole,
    isVerified: (rawUser?.isVerified as boolean | undefined) ?? true,
  };

  const profile =
    (payload.profile as Record<string, unknown> | undefined) ||
    ((payload.data as Record<string, unknown> | undefined)?.profile as Record<string, unknown> | undefined) || {
      userId: user._id,
      name:
        (rawUser?.name as string | undefined) ||
        (payload.name as string | undefined) ||
        (inferredRole === "recruiter" ? "Sarah Jenkins" : "Aritra Das"),
      username:
        (rawUser?.username as string | undefined) ||
        (payload.username as string | undefined) ||
        (fallbackEmail ? fallbackEmail.split("@")[0] : "builder"),
      headline:
        (rawUser?.headline as string | undefined) ||
        (payload.headline as string | undefined) ||
        (inferredRole === "recruiter"
          ? "Lead Technical Recruiter"
          : "Full-Stack Developer • React, Next.js & Node.js"),
      skills:
        ((rawUser?.skills as string[] | undefined) ||
          (payload.skills as string[] | undefined) || [
            "React",
            "Next.js",
            "TypeScript",
            "Node.js",
            "MongoDB",
          ]) as string[],
      openToWork: inferredRole === "creator",
    };

  const token =
    (payload.accessToken as string | undefined) ||
    (payload.token as string | undefined) ||
    ((payload.data as Record<string, unknown> | undefined)?.accessToken as string | undefined) ||
    "";

  return { user, profile, token };
}