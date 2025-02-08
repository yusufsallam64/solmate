import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardContent } from '@/lib/components/ui/card';
import SettingsLayout from '@/lib/layouts/SettingsLayout';
import { UserAvatar } from '@/lib/components/header';
import Modal from '@/lib/components/ui/Modal';
import { LoaderCircle } from 'lucide-react';

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
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-primary-100">Profile Settings</h1>
        </CardHeader>
        {isLoading ? (
          <div className="flex justify-center p-6">
            <LoaderCircle className="animate-spin text-accent-400 w-6 h-6" />
          </div>
        ) : (
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-start space-x-6">
                <UserAvatar session={session} size={1.4} />

                <div className="flex flex-col space-y-4">
                  <div>
                    {profile?.name && (
                      <div>
                        <p className="text-xl font-semibold text-primary-100">
                          {profile.name}
                        </p>
                      </div>
                    )}
                    <div className="mt-1">
                      <p className="text-sm text-primary-300">{profile?.email}</p>
                    </div>
                  </div>

                  {profile?.createdAt && (
                    <div className="text-sm text-primary-300">
                      Member since {new Date(profile.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="pt-6 mt-6 border-t border-accent/10">
                <div className="flex flex-col justify-between ">
                  <div className="pb-4">
                    <h2 className="text-lg font-semibold text-primary-100">Danger Zone</h2>
                  </div>
                  <div>
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={isDeleting}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-sm disabled:opacity-50"
                    >
                      Delete All Problem Sets
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 text-red-500 p-4 rounded-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-500/10 text-green-500 p-4 rounded-sm">
                  {success}
                </div>
              )}
            </div>
          </CardContent>
        )}

      </Card>

      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="Delete All Problem Sets"
      >
        <div className="space-y-4">
          <p className="text-primary-200">
            Are you sure? This will permanently delete all your problem sets, problems, and messages.
          </p>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="bg-accent/10 text-primary-200 hover:bg-accent/20 px-4 py-2 rounded-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAllData}
              disabled={isDeleting}
              className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-sm disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Everything'}
            </button>
          </div>
        </div>
      </Modal>
    </SettingsLayout>
  );
}