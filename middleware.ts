// import { clerkMiddleware } from '@clerk/nextjs/server';

// export default clerkMiddleware();

// export const config = {
//   matcher: [
//     // Skip Next.js internals and all static files, unless found in search params
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     // Always run for API routes
//     '/(api|trpc)(.*)',
//   ],
// };

// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// const isPublicRoute = createRouteMatcher(['/sign-in(.*))', '/sign-up(.*)']);

// export default clerkMiddleware((auth, req) => {
//   if (!isPublicRoute(req)) {
//     auth().protect(); // Redirect to sign-in if not authenticated
//   }
// });

// export const config = {
//   matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js|json|svg|png|jpg|ico)).*)', '/(api|trpc)(.*)'],
// };


// Option 1: force auth on all routes except /sign-in and /sign-up
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  // '/forgot-password(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // Redirect authenticated users away from auth pages
  if (userId && isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Redirect unauthenticated users away from dashboard
  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js|json|svg|png|jpg|ico)).*)',
    '/(api|trpc)(.*)',
  ],
};


// // Option 2: only protect /dashboard and its subroutes
// import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
// import { NextResponse } from 'next/server';
// // app/page.tsx
// import { auth } from '@clerk/nextjs/server';
// import { redirect } from 'next/navigation';

// export default async function RootPage() {
//   const { userId } = await auth();

//   if (userId) {
//     redirect('/dashboard');
//   } else {
//     redirect('/sign-in');
//   }
// }