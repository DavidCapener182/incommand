"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useRole } from "@/hooks/useRole";
import { ROLES, roleUtils } from "@/types/auth";

function getInitials(nameOrEmail: string) {
  if (!nameOrEmail) return '?';
  // If it's a name with spaces, use first and last initial
  const parts = nameOrEmail.trim().split(' ');
  if (parts.length > 1) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  // If it's an email, use first two letters before @
  const emailPart = nameOrEmail.split('@')[0];
  if (emailPart.length >= 2) {
    return (emailPart[0] + emailPart[1]).toUpperCase();
  }
  if (emailPart.length === 1) {
    return (emailPart[0] + emailPart[0]).toUpperCase();
  }
  return '?';
}

export default function ProfilePage() {
  const { user } = useAuth();
  const role = useRole();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("profiles")
        .select("email, company, full_name, avatar_url, role")
        .eq("id", user.id)
        .single();
      if (error) setError(error.message);
      setProfile(data);
      setFullName((data as any)?.full_name || "");
      setAvatarUrl((data as any)?.avatar_url || null);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    const { error } = await (supabase as any)
      .from("profiles")
      .update({ full_name: fullName, avatar_url: avatarUrl })
      .eq("id", user.id);
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `avatars/${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    // Update profile in DB
    await (supabase as any).from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    // Re-fetch profile to update UI
    const { data: newProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('email, company, full_name, avatar_url')
      .eq('id', user.id)
      .single();
    if (!fetchError) {
      setProfile(newProfile);
      setFullName((newProfile as any)?.full_name || "");
      setAvatarUrl((newProfile as any)?.avatar_url || null);
    }
    setUploading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-[#101c36] transition-colors duration-300">
        <div className="card-time p-8 shadow-xl text-center text-gray-900 dark:text-gray-100">
          <p>You must be signed in to view your profile.</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-lg shadow transition-colors duration-200"
            onClick={() => router.push('/login')}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#101c36] flex flex-col items-center justify-center py-12 px-4 transition-colors duration-300">
      <div className="bg-white dark:bg-[#23408e] rounded-2xl shadow-xl border border-gray-200 dark:border-[#2d437a] p-8 w-full max-w-md text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Your Profile</h2>
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-300">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 dark:text-red-400">{error}</div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 mb-2"
                  unoptimized
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-200 dark:bg-[#23408e] flex items-center justify-center text-3xl font-bold text-blue-700 dark:text-blue-200 border-2 border-blue-500 mb-2 transition-colors duration-300">
                  {getInitials(fullName || profile?.email || "")}
                </div>
              )}
              <button
                className="text-xs text-blue-600 dark:text-blue-300 underline mb-2 transition-colors duration-200"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Change Photo"}
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 dark:border-[#2d437a] bg-white dark:bg-[#182447] text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-400 dark:focus:ring-blue-400 sm:text-sm transition-colors duration-200"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200">Email</label>
                <div className="mt-1">{profile?.email || user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200">Company</label>
                <div className="mt-1">{profile?.company || "-"}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200">Role</label>
                <div className="mt-1">
                  {roleUtils.getDisplayName(role)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-blue-200">Credits</label>
                <div className="mt-1">(coming soon)</div>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 text-white rounded-lg shadow transition-colors duration-200"
                disabled={loading}
              >
                Update Profile
              </button>
            </form>
            <button
              className="w-full mt-4 py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-[#2d437a] dark:hover:bg-[#23408e] text-gray-700 dark:text-gray-100 rounded-lg shadow transition-colors duration-200"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              Log out
            </button>
          </>
        )}
      </div>
    </div>
  );
} 
