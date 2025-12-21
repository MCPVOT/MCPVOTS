'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface User {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

interface MutualFollowsProps {
  fid1: number;
  fid2: number;
}

const MutualFollows = ({ fid1, fid2 }: MutualFollowsProps) => {
  const [mutualFollows, setMutualFollows] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMutualFollows = async () => {
      try {
        const response = await fetch(`/api/farcaster/mutual-follows?fid1=${fid1}&fid2=${fid2}`);
        if (!response.ok) {
          throw new Error('Failed to fetch mutual follows');
        }
        const data = await response.json();
        setMutualFollows(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMutualFollows();
  }, [fid1, fid2]);

  if (loading) {
    return <div>Loading mutual follows...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (mutualFollows.length === 0) {
    return <div>No mutual follows found.</div>;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold">Followed by</h3>
      <ul className="space-y-2">
        {mutualFollows.map(user => {
          const avatarSrc = user.pfp_url || 'https://placehold.co/32x32?text=%20';

          return (
            <li key={user.fid} className="flex items-center gap-2">
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
    </div>
  );
};

export default MutualFollows;
