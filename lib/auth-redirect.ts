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
export function normalizeAuthPayload(data: any, fallbackEmail = "", fallbackRole: UserRole = "creator") {
  const rawUser = data?.user || data?.data?.user || data?.data || data || {};

  const inferredRole: UserRole =
    rawUser?.role ||
    data?.role ||
    (fallbackEmail.includes("recruiter")
      ? "recruiter"
      : fallbackEmail.includes("admin")
      ? "admin"
      : fallbackRole);

  const user = {
    _id: rawUser?._id || rawUser?.id || data?._id || data?.id || `user_${Date.now()}`,
    email: rawUser?.email || data?.email || fallbackEmail,
    role: inferredRole,
    isVerified: rawUser?.isVerified ?? true,
  };

  const profile = data?.profile || data?.data?.profile || {
    userId: user._id,
    name:
      rawUser?.name ||
      data?.name ||
      (inferredRole === "recruiter" ? "Sarah Jenkins" : "Aritra Das"),
    username:
      rawUser?.username ||
      data?.username ||
      (fallbackEmail ? fallbackEmail.split("@")[0] : "builder"),
    headline:
      rawUser?.headline ||
      data?.headline ||
      (inferredRole === "recruiter"
        ? "Lead Technical Recruiter"
        : "Full-Stack Developer • React, Next.js & Node.js"),
    skills: rawUser?.skills || data?.skills || ["React", "Next.js", "TypeScript", "Node.js", "MongoDB"],
    openToWork: inferredRole === "creator",
  };

  const token = data?.accessToken || data?.token || data?.data?.accessToken || "";

  return { user, profile, token };
}