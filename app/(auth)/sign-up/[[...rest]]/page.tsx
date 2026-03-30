// This is the sign-up page for the application, using Clerk's SignUp component for authentication.
// After signing up, users will be redirected to the home page.
'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-800 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2">Start your journaling journey</p>
        </div>
        <SignUp forceRedirectUrl="/home" />
      </div>
    </div>
  );
}
