// ProfileGuard — invisible component that redirects authenticated users to the
// onboarding page whenever their timezone is missing. Runs inside the dashboard
// layout so it is active on every protected route. It skips the redirect when
// the user is already on /onboarding to avoid an infinite loop.
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function ProfileGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useQuery(api.users.getUserDocuments);

  useEffect(() => {
    // Don't redirect if we're already on the onboarding page.
    if (pathname === '/onboarding') return;
    // Still loading — wait.
    if (user === undefined || user === null) return;

    // Redirect if the minimum fields needed for notifications are missing.
    if (!user.timezone || !user.country) {
      router.push('/onboarding');
    }
  }, [user, pathname, router]);

  return null;
}
