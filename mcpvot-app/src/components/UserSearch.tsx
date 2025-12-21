'use client';

import Image from 'next/image';
import { useState } from 'react';

interface User {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/farcaster/search-users?q=${query}`);
      if (!response.ok) {
        throw new Error('Failed to search for users');
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for users..."
          className="flex-1 px-3 py-2 bg-black/60 border border-cyan-500/30 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-100 placeholder-slate-500 backdrop-blur-sm"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-cyan-600/80 hover:bg-cyan-500/80 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-cyan-400/30"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="text-red-500 mt-2">{error}</div>}

      {results.length > 0 && (
        <ul className="space-y-2 mt-4">
          {results.map(user => {
            const avatarSrc = user.pfp_url || 'https://placehold.co/32x32?text=%20';

            return (
              <li key={user.fid} className="flex items-center gap-2 p-2 bg-black/40 rounded-lg">
                <Image
                  src={avatarSrc}
                  alt={user.username}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                  unoptimized
                />
                <div>
                  <p className="font-semibold">{user.display_name}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UserSearch;
