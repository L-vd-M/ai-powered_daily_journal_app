// Option 1: force auth on all routes except /sign-in and /sign-up
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  // '/forgot-password(.*)',
]);

export default clerkMiddleware(
  async (auth, req) => {
    const { userId } = await auth();
    // const { pathname } = req.nextUrl;

    // Redirect authenticated users away from auth pages
    if (userId && isPublicRoute(req)) {
      return NextResponse.redirect(new URL('/home', req.url));
    }

    // Redirect unauthenticated users away from dashboard
    if (!userId && !isPublicRoute(req)) {
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }
  },
  {
    authorizedParties: [
      'https://ai-powered-daily-journal-app-five.vercel.app', // for production deployment
      'http://localhost:3000',          // for local development
    ],
  }
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js|json|svg|png|jpg|ico)).*)',
    '/(api|trpc)(.*)',
  ],
};