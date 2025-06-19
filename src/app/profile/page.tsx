"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";

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
      setFullName(data?.full_name || "");
      setAvatarUrl(data?.avatar_url || null);
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase
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
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    // Re-fetch profile to update UI
    const { data: newProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('email, company, full_name, avatar_url')
      .eq('id', user.id)
      .single();
    if (!fetchError) {
      setProfile(newProfile);
      setFullName(newProfile?.full_name || "");
      setAvatarUrl(newProfile?.avatar_url || null);
    }
    setUploading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow text-center">
          <p>You must be signed in to view your profile.</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
            onClick={() => router.push("/login")}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Your Profile</h2>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-blue-500 mb-2"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center text-3xl font-bold text-blue-700 border-2 border-blue-500 mb-2">
                  {getInitials(fullName || profile?.email || "")}
                </div>
              )}
              <button
                className="text-xs text-blue-600 underline mb-2"
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
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1">{profile?.email || user.email}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Company</label>
                <div className="mt-1">{profile?.company || "-"}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <div className="mt-1">
                  {profile?.role
                    ? profile.role.toLowerCase() === 'admin'
                      ? 'Admin'
                      : profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                    : '-'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Credits</label>
                <div className="mt-1">(coming soon)</div>
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                Update Profile
              </button>
            </form>
            <button
              className="w-full mt-4 py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
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