// This is the root page of the application. It checks if the user is authenticated and redirects them to the appropriate page.
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function RootPage() {
  const { userId } = await auth();
  if (userId) {
    redirect('/home');
  } else {
    redirect('/sign-in');
  }
}
