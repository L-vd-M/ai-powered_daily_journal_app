// Onboarding page — shown after sign-up (or on any login) when name, email,
// timezone, or country could not be obtained automatically. The user confirms
// or fills in the missing details so that journal reminders and notifications
// work correctly.
'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function OnboardingPage() {
  const router = useRouter();
  const user = useQuery(api.users.getUserDocuments);
  const updateProfile = useMutation(api.users.updateUserProfile);
  // Ref ensures we only apply user-doc defaults once and don't overwrite edits.
  const appliedRef = useRef(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Lazy initializers read browser APIs on the client without needing an effect.
  const [timezone, setTimezone] = useState(() => {
    if (typeof window === 'undefined') return '';
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  });
  const [country, setCountry] = useState(() => {
    if (typeof window === 'undefined') return '';
    const locale = navigator.languages?.[0] || navigator.language || '';
    return (locale.split('-')[1] ?? '').toUpperCase();
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill form once the Convex user document has loaded. Uses setTimeout to
  // avoid calling setState directly in the effect body (matches DashboardClient
  // pattern and satisfies the react-compiler lint rule).
  useEffect(() => {
    if (appliedRef.current || user === undefined || user === null) return;
    appliedRef.current = true;

    if (user.name && user.email && user.timezone && user.country) {
      router.replace('/home');
      return;
    }

    const timer = setTimeout(() => {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.timezone) setTimezone(user.timezone);
      if (user.country) setCountry(user.country);
    }, 0);
    return () => clearTimeout(timer);
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!timezone.trim()) { setError('Please enter your timezone.'); return; }

    setSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        timezone: timezone.trim(),
        country: country.trim(),
      });
      router.replace('/home');
    } catch {
      setError('Failed to save your profile. Please try again.');
      setSubmitting(false);
    }
  };

  // Show a spinner while the user document is being fetched or created by UserSync.
  if (user === undefined || user === null) {
    return (
      <div className="flex justify-center items-center min-h-100">
        <p className="text-gray-500 text-sm">Loading your profile…</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            We couldn&apos;t automatically obtain all the details needed to send you
            personalised journal reminders. Please confirm or fill in the fields below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="onboarding-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="onboarding-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="onboarding-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address <span className="text-red-500">*</span>
            </label>
            <input
              id="onboarding-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Timezone */}
          <div>
            <label
              htmlFor="onboarding-timezone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Timezone <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-1">
              Auto-detected from your browser — confirm or correct this.
            </p>
            <input
              id="onboarding-timezone"
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. Africa/Johannesburg"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Country */}
          <div>
            <label
              htmlFor="onboarding-country"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Country <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-gray-400 mb-1">
              Two-letter country code detected from your browser locale.
            </p>
            <input
              id="onboarding-country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value.toUpperCase())}
              placeholder="e.g. ZA, US, GB"
              maxLength={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Saving…' : 'Continue to Dashboard'}
            </button>
            <button
              type="button"
              onClick={() => router.replace('/home')}
              className="flex-1 sm:flex-none text-sm text-gray-500 hover:text-gray-700 underline py-2 text-center"
            >
              Skip for now
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Skipping means reminders may not reach you at the right time.
          </p>
        </form>
      </div>
    </div>
  );
}
