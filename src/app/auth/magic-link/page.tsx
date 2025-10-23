'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function MagicLinkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteIdParam = searchParams?.get('inviteId');
  const roleParam = searchParams?.get('role');
  const eventIdParam = searchParams?.get('eventId');
  const isTemporaryParam = searchParams?.get('isTemporary') === 'true';
  const incidentsPath = eventIdParam ? `/incidents?event=${eventIdParam}` : '/incidents';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const handleMagicLink = async () => {
      try {
        if (!inviteIdParam || !roleParam || !eventIdParam) {
          console.error('Magic link missing required parameters', {
            inviteId: inviteIdParam,
            role: roleParam,
            eventId: eventIdParam
          });
          setError('This invite link is missing required information. Please request a new link.');
          setLoading(false);
          return;
        }

        console.log('Magic link page - full URL:', window.location.href);
        console.log('Magic link page - hash:', window.location.hash);

        // Import Supabase client
        const { createClientComponentClient } = await import('@supabase/auth-helpers-nextjs');
        const supabase = createClientComponentClient();
        
        // Check if we have access token in the URL hash
        const hash = window.location.hash;
        console.log('Magic link page - Full hash:', hash);
        
        if (hash.includes('access_token=')) {
          console.log('Access token found in URL hash, processing...');
          
          // Extract the access token from the hash
          const urlParams = new URLSearchParams(hash.substring(1));
          const accessToken = urlParams.get('access_token');
          const refreshToken = urlParams.get('refresh_token');
          const tokenType = urlParams.get('token_type');
          
          console.log('Magic link page - Extracted tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            tokenType
          });
          
          if (accessToken) {
            // Set the session manually using the tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            console.log('Magic link page - Manual session set:', {
              hasSession: !!sessionData.session,
              sessionError: sessionError?.message,
              userId: sessionData.session?.user?.id,
              email: sessionData.session?.user?.email
            });
            
            if (sessionData.session) {
            console.log('User session established, redirecting to incidents');
            setSuccess(true);
            setTimeout(() => {
                router.push(incidentsPath);
            }, 1000);
            return;
          }
          }
          
          // Wait for Supabase to process the magic link automatically
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check session after processing
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          console.log('Magic link page - Session check after processing:', {
            hasSession: !!sessionData.session,
            sessionError: sessionError?.message,
            userId: sessionData.session?.user?.id,
            email: sessionData.session?.user?.email
          });
          
          if (sessionData.session) {
            console.log('User has a session, redirecting to incidents');
            setSuccess(true);
            setTimeout(() => {
              router.push(incidentsPath);
            }, 1000);
            return;
          }
        }

        // If no access token or session, check for existing session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionData.session) {
          console.log('User already has a session, redirecting to incidents');
          setSuccess(true);
          setTimeout(() => {
            router.push(incidentsPath);
          }, 1000);
          return;
        }

        console.log('No authentication found, showing manual verification form');
        setError('We could not verify the invite automatically. Please confirm your details below.');
        setShowForm(true);
        setLoading(false);

      } catch (err) {
        console.error('Magic link authentication error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed. Please complete the form below.');
        setShowForm(true);
        setLoading(false);
      }
    };

    handleMagicLink();
  }, [searchParams, router, inviteIdParam, roleParam, eventIdParam, incidentsPath]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      console.log('Form submission - parameters:', {
        inviteId: inviteIdParam,
        role: roleParam,
        eventId: eventIdParam,
        isTemporary: isTemporaryParam,
        name: formData.name,
        email: formData.email
      });

      if (!inviteIdParam || !roleParam || !eventIdParam) {
        throw new Error('Missing invite parameters');
      }

      // Verify the email matches the invite and set up the user
      console.log('Submitting form to /api/auth/magic-link');
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteId: inviteIdParam,
          role: roleParam,
          eventId: eventIdParam,
          isTemporary: isTemporaryParam,
          name: formData.name,
          email: formData.email
        }),
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify invite');
      }

      // Success - redirect to incidents
      console.log('Form submission successful, redirecting to incidents');
      setFormError('');
      setError('');
      setShowForm(false);
      setSuccess(true);
      setTimeout(() => {
        router.push(incidentsPath);
      }, 2000);

    } catch (err) {
      console.error('Form submission error:', err);
      setFormError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Verifying Magic Link...
          </h1>
          <p className="text-gray-600">
            Please wait while we verify your magic link.
          </p>
        </motion.div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8"
        >
          <div className="text-center mb-8">
            <Image
              src="/inCommand.png"
              alt="inCommand Logo"
              width={180}
              height={50}
              className="mx-auto mb-6"
              priority
            />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Registration
            </h1>
            <p className="text-gray-600">
              Please enter your details to complete the invite verification
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl relative mb-6"
            >
              <strong className="font-bold">Notice:</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </motion.div>
          )}

          {formError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl relative mb-6"
            >
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline ml-2">{formError}</span>
            </motion.div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
                placeholder="Enter your email address"
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold text-base hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {formLoading ? 'Verifying...' : 'Complete Registration'}
            </button>
          </form>
          
          <p className="mt-6 text-sm text-gray-500 text-center">
            Your email must match the invited email address to complete registration.
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6"
          >
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Failed
          </h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
          >
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </motion.div>

          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            You have been successfully authenticated. Redirecting to the incidents page...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </motion.div>
      </div>
    );
  }

  return null;
}
