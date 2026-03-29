'use client';

import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-white mb-2">AI Journal</h1>
      <p className="text-gray-400 mb-8">Reflect, Analyze, Grow</p>
      <SignIn forceRedirectUrl="/home" />
    </div>
  );
}
