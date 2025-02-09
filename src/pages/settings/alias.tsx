import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardContent } from '@/lib/components/ui/card';
import SettingsLayout from '@/lib/layouts/SettingsLayout';
import { LoaderCircle, Plus, X, AlertTriangle } from 'lucide-react';

interface WalletAlias {
  alias: string;
  address: string;
  id: string;
}

const isValidSolanaAddress = (address: string): boolean => {
  // Basic Solana address validation (checks if it's 32-44 characters and contains only base58 characters)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
};

export default function AliasSettings() {
  const { data: session } = useSession();
  const [aliases, setAliases] = useState<WalletAlias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newAlias, setNewAlias] = useState({ alias: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAliases = async () => {
      try {
        const response = await fetch('/api/user/aliases');
        if (!response.ok) throw new Error('Failed to fetch aliases');
        const data = await response.json();
        setAliases(data);
      } catch (err) {
        console.error('Error fetching aliases:', err);
        setError('Failed to load aliases');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchAliases();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    // Validation
    if (!newAlias.alias.trim() || !newAlias.address.trim()) {
      setError('Both alias and address are required');
      setIsSubmitting(false);
      return;
    }

    if (!isValidSolanaAddress(newAlias.address)) {
      setError('Invalid Solana address format');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/user/aliases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAlias),
      });

      if (!response.ok) throw new Error('Failed to add alias');

      const addedAlias = await response.json();
      setAliases([...aliases, addedAlias]);
      setNewAlias({ alias: '', address: '' });
      setSuccess('Alias added successfully');
    } catch (err) {
      console.error('Error adding alias:', err);
      setError('Failed to add alias');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/user/aliases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete alias');

      setAliases(aliases.filter(alias => alias.id !== id));
      setSuccess('Alias deleted successfully');
    } catch (err) {
      console.error('Error deleting alias:', err);
      setError('Failed to delete alias');
    }
  };

  return (
    <SettingsLayout>
      <div className="space-y-8">
        <div className="bg-background-900/40 backdrop-blur-xl border border-primary-200/30 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.1)]">
          <div className="px-6 py-4 border-b border-primary-200/30 bg-gradient-to-r from-background-900/50 to-background-950/50">
            <h1 className="text-2xl font-bold text-primary-100">Wallet Aliases</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <LoaderCircle className="animate-spin text-accent-400 w-8 h-8" />
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-8">
                {/* Add New Alias Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Alias (e.g., 'main wallet')"
                      value={newAlias.alias}
                      onChange={(e) => setNewAlias({ ...newAlias, alias: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg bg-background-900/40 border border-primary-200/30 focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/50 text-text-50 placeholder:text-text-400"
                    />
                    <input
                      type="text"
                      placeholder="Solana Address"
                      value={newAlias.address}
                      onChange={(e) => setNewAlias({ ...newAlias, address: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg bg-background-900/40 border border-primary-200/30 focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/50 text-text-50 placeholder:text-text-400"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-lg bg-accent-500/10 text-accent-400 border border-accent-500/20 hover:bg-accent-500/20 hover:border-accent-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="animate-spin w-4 h-4" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Add Alias</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Aliases List */}
                <div className="space-y-4">
                  {aliases.length === 0 ? (
                    <p className="text-text-50 text-center py-4">No aliases added yet</p>
                  ) : (
                    aliases.map((alias) => (
                      <div
                        key={alias.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-background-900/40 border border-primary-200/30"
                      >
                        <div className="space-y-1">
                          <h3 className="font-medium text-primary-100">{alias.alias}</h3>
                          <p className="text-sm text-text-50 font-mono">{alias.address}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(alias.id)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Error/Success Messages */}
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
      </div>
    </SettingsLayout>
  );
}