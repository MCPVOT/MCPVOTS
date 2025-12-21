'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

interface Mission {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    reward: {
        nft: string;
        votTokens: number;
        xp: number;
    };
    requirements: string[];
    progress: number;
    maxProgress: number;
    completed: boolean;
    claimed: boolean;
    icon: string;
    color: string;
}

interface MissionStats {
    totalMissions: number;
    completedMissions: number;
    totalXP: number;
    totalVOT: number;
}

export function useMissions() {
    const { address } = useAccount();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [stats, setStats] = useState<MissionStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMissions = useCallback(async () => {
        if (!address) return;

        try {
            setError(null);
            const response = await fetch(`/api/missions?address=${address}`);

            if (!response.ok) {
                throw new Error('Failed to fetch missions');
            }

            const data = await response.json();
            setMissions(data.data.missions);
            setStats(data.data.stats);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [address]);

    const completeMission = useCallback(async (missionId: string) => {
        if (!address) return null;

        try {
            const response = await fetch('/api/missions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    missionId,
                    action: 'complete',
                    userAddress: address,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to complete mission');
            }

            const data = await response.json();

            // Update local state
            setMissions(prev => prev.map(mission =>
                mission.id === missionId
                    ? { ...mission, completed: true, progress: mission.maxProgress }
                    : mission
            ));

            return data.data;
        } catch (err) {
            console.error('Error completing mission:', err);
            return null;
        }
    }, [address]);

    const claimReward = useCallback(async (missionId: string) => {
        if (!address) return null;

        try {
            const response = await fetch('/api/missions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    missionId,
                    action: 'claim',
                    userAddress: address,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to claim reward');
            }

            const data = await response.json();

            // Update local state
            setMissions(prev => prev.map(mission =>
                mission.id === missionId
                    ? { ...mission, claimed: true }
                    : mission
            ));

            return data.data;
        } catch (err) {
            console.error('Error claiming reward:', err);
            return null;
        }
    }, [address]);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    return {
        missions,
        stats,
        loading,
        error,
        completeMission,
        claimReward,
        refetch: fetchMissions
    };
}
