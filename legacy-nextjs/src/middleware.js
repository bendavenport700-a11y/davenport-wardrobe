import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const ADMIN_EMAILS = ["bendavenport700@gmail.com", "mileslasky@gmail.com"];
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware((auth, req) => {
  if (!isAdminRoute(req)) return;

  const authState = auth();
  const { userId, sessionClaims } = authState;

  console.log("[admin middleware] path=%s userId=%s email=%s",
    req.nextUrl.pathname,
    userId ?? "(none)",
    sessionClaims?.email ?? "(not in claims)"
  );

  // Not signed in — redirect to Clerk sign-in.
  if (!userId) {
    console.log("[admin middleware] unauthenticated, redirecting to sign-in");
    authState.protect();
    return;
  }

  // Email bypass via session claims (active only if email is added to the Clerk
  // JWT template under Dashboard → Sessions → Customize session token).
  if (sessionClaims?.email && ADMIN_EMAILS.includes(sessionClaims.email)) {
    console.log("[admin middleware] email claim matches, allowing");
    return;
  }

  // Signed in but email not in claims — let through to the page.
  // The page component enforces the email allowlist as the authoritative gate.
  console.log("[admin middleware] signed-in, deferring email check to page");
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
