import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Only history requires auth — homepage is public, generate is gated in-component
const isProtectedRoute = createRouteMatcher([
  "/history(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);

    await auth.protect({
      unauthenticatedUrl: signInUrl.toString(),
    });
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
