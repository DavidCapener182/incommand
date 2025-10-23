'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams?.get('code') || '';

  console.log('Invite page loaded with code:', code);
  console.log('Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    inviteCode: code
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    console.log('Invite page useEffect - checking for redirects');
    console.log('Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR');
    console.log('Current search:', typeof window !== 'undefined' ? window.location.search : 'SSR');
    
    // Fetch event name from the invite code
    const fetchEventName = async () => {
      try {
        const response = await fetch(`/api/events/invite-info?code=${code}`);
        if (response.ok) {
          const data = await response.json();
          setEventName(data.eventName || 'Event');
        }
      } catch (err) {
        console.error('Failed to fetch event name:', err);
        setEventName('Event');
      }
    };
    
    if (code) {
      fetchEventName();
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/invite/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          code: formData.inviteCode
        }),
      });

      const data = await response.json();

      console.log('Invite redemption response:', {
        status: response.status,
        ok: response.ok,
        data: data
      });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem invite');
      }

        if (data.session_token) {
          console.log('Session token received, authenticating user:', data.session_token);
          setSuccess(true);
          setIsNewUser(data.is_new_user);
          
          // Use the session token to authenticate the user
          setTimeout(() => {
            console.log('Redirecting to session token for authentication');
            window.location.href = data.session_token;
          }, 2000);
        } else if (data.magic_link) {
          console.log('Magic link received, redirecting to:', data.magic_link);
          setSuccess(true);
          setIsNewUser(data.is_new_user);
          
          // Redirect to magic link
          setTimeout(() => {
            window.location.href = data.magic_link;
          }, 2000);
        } else if (data.redirect_url) {
        console.log('Direct authentication successful, redirecting to:', data.redirect_url);
        setSuccess(true);
        setIsNewUser(data.is_new_user);
        
        // Redirect directly to incidents page
        setTimeout(() => {
          router.push(data.redirect_url);
        }, 2000);
      } else {
        console.log('No session token or redirect URL received');
        setSuccess(true);
        setIsNewUser(data.is_new_user);
        
        // Redirect to incidents page after a short delay
        setTimeout(() => {
          router.push('/incidents');
        }, 3000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col justify-center bg-[#23408e] px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-lg border border-blue-100 p-6 sm:p-8 backdrop-blur-md text-center"
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
            Welcome to the Event!
          </h1>

          <p className="text-gray-600 mb-6">
            {isNewUser ? (
              <>
                Welcome to InCommand! Your account has been created and you&apos;ve been added to this event.
                You are now logged in and ready to access the control room.
              </>
            ) : (
              <>
                You&apos;ve been added to this event and are now logged in.
                You can now access the control room.
              </>
            )}
          </p>


          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                You are now logged in and ready to access the control room
              </span>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            You&apos;ll be redirected to the incidents page shortly...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center bg-[#23408e] px-4 sm:px-6 lg:px-8">
      {/* Logo & Tagline */}
      <div className="flex flex-col items-center mb-10 sm:mb-14">
        <Image
          src="/inCommand.png"
          alt="inCommand Logo"
          width={400}
          height={300}
          className="drop-shadow-[0_6px_24px_rgba(0,0,0,0.45)] object-contain mb-6 sm:mb-8"
          priority
        />
        <p className="text-sm sm:text-base text-blue-100 font-medium text-center max-w-md leading-relaxed">
          Modern incident tracking and event command for every scale of operation.
        </p>
      </div>

      {/* Invite Card */}
      <div className="w-full max-w-md mx-auto bg-white/90 rounded-2xl shadow-lg border border-blue-100 p-6 sm:p-8 backdrop-blur-md">
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-blue-900 mb-6 sm:mb-8 tracking-tight">
          Enter the {eventName} Control Room
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 text-center bg-red-50 border border-red-200 rounded-lg py-2 px-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#2A3990] mb-2">
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
            <label htmlFor="email" className="block text-sm font-medium text-[#2A3990] mb-2">
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

          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-[#2A3990] mb-2">
              Invite Code
            </label>
            <input
              id="inviteCode"
              name="inviteCode"
              type="text"
              required
              value={formData.inviteCode}
              onChange={(e) => setFormData({ ...formData, inviteCode: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 text-center text-lg font-mono"
              placeholder="Enter 6-digit invite code"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code provided in your invitation
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2661F5] hover:bg-blue-700 text-white font-semibold text-lg py-3 rounded-xl shadow-md focus:ring-4 focus:ring-blue-300 transition-transform duration-150 active:scale-95 hover:scale-[1.02]"
          >
            {loading ? 'Redeeming...' : 'Redeem Invite'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By redeeming this invite, you agree to join the event with the assigned role.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-blue-100 space-y-2">
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => {}}
            className="hover:underline cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>|</span>
          <button 
            onClick={() => {}}
            className="hover:underline cursor-pointer"
          >
            Terms of Use
          </button>
        </div>
        <p>© {new Date().getFullYear()} inCommand. All rights reserved.</p>
      </footer>
    </div>
  );
}
