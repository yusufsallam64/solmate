import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardContent } from '@/lib/components/ui/card';
import SettingsLayout from '@/lib/layouts/SettingsLayout';
import { UserAvatar } from '@/lib/components/header';
import Modal from '@/lib/components/ui/Modal';
import { LoaderCircle, AlertTriangle } from 'lucide-react';
import VoiceSettings from '@/lib/components/voice/VoiceSettings';

interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
}

export default function ProfileSettings() {
  const { data: session } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (!response.ok) throw new Error('Failed to fetch profile');
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchProfile();
    }
  }, [session]);

  const handleDeleteAllData = async () => {
    try {
      setIsDeleting(true);
      setError('');

      const response = await fetch('/api/problemsets/delete-all', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete data');
      }

      setSuccess('All your problem sets and related data have been deleted successfully.');
      setShowConfirm(false);
    } catch (err) {
      setError('Failed to delete your data. Please try again.');
      console.error('Error deleting data:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-8">
        {/* Profile Card */}
        <div className="bg-background-900/40 backdrop-blur-xl border border-primary-200/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.1)]">
          <div className="px-6 py-4 border-b border-primary-200/30 bg-gradient-to-r from-background-900/50 to-background-950/50">
            <h1 className="text-2xl font-bold text-primary-100">Profile Settings</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoaderCircle className="animate-spin text-accent-400 w-8 h-8" />
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-accent-500/20 rounded-full blur opacity-50" />
                    <UserAvatar session={session} size={1.4} />
                  </div>

                  <div className="flex flex-col space-y-2">
                    {profile?.name && (
                      <div>
                        <h2 className="text-xl font-semibold text-primary-100">
                          {profile.name}
                        </h2>
                      </div>
                    )}
                    <div>
                      <p className="text-text-50">{profile?.email}</p>
                    </div>
                    {profile?.createdAt && (
                      <div className="text-sm text-text-50">
                        Member since {new Date(profile.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <VoiceSettings />

                {/* Danger Zone */}
                <div className="pt-8 mt-8 border-t border-primary-200/30">
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-primary-100">Danger Zone</h2>
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertTriangle size={20} />
                          <span className="font-medium">Delete Account Data</span>
                        </div>
                        <p className="text-sm text-text-50">
                          This action will permanently delete all your data.
                        </p>
                        <div>
                          <button
                            onClick={() => setShowConfirm(true)}
                            disabled={isDeleting}
                            className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Delete All Problem Sets
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400">
                    {success}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Modal */}
        <Modal
          isOpen={showConfirm}
          onClose={() => setShowConfirm(false)}
          title="Delete All Problem Sets"
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-primary-100 font-medium mb-2">
                    Are you sure you want to delete all data?
                  </p>
                  <p className="text-sm text-primary-100">
                    This will permanently delete all your data. This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-accent-500/10 text-primary-100 border border-primary-200/30 hover:bg-accent-500/20 hover:border-accent-500/30 transition-all duration-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-200 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="animate-spin w-4 h-4" />
                    Deleting...
                  </span>
                ) : (
                  'Yes, Delete Everything'
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </SettingsLayout>
  );
}