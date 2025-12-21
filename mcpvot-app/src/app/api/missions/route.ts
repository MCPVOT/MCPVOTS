import { NextRequest, NextResponse } from 'next/server';

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

// Mission templates - static configuration defining available missions
const missions: Mission[] = [
    {
        id: 'wallet-connect',
        title: 'Wallet Connection',
        description: 'Connect your wallet to access the MCPVOT ecosystem',
        difficulty: 'beginner',
        reward: {
            nft: 'Genesis Connector',
            votTokens: 10,
            xp: 100
        },
        requirements: ['Connect any Web3 wallet'],
        progress: 0,
        maxProgress: 1,
        completed: false,
        claimed: false,
        icon: '🔗',
        color: 'green'
    },
    {
        id: 'first-swap',
        title: 'Token Swap Master',
        description: 'Complete your first token swap on Base network',
        difficulty: 'beginner',
        reward: {
            nft: 'Swap Initiate',
            votTokens: 25,
            xp: 250
        },
        requirements: ['Execute token swap', 'Pay gas fees'],
        progress: 0,
        maxProgress: 1,
        completed: false,
        claimed: false,
        icon: '🔄',
        color: 'orange'
    },
    {
        id: 'social-explorer',
        title: 'Social Explorer',
        description: 'Discover and interact with 5 different mini-apps',
        difficulty: 'intermediate',
        reward: {
            nft: 'Social Pioneer',
            votTokens: 50,
            xp: 500
        },
        requirements: ['Visit 5 mini-apps', 'Interact with each'],
        progress: 0,
        maxProgress: 5,
        completed: false,
        claimed: false,
        icon: '🌐',
        color: 'blue'
    },
    {
        id: 'agent-coordinator',
        title: 'Agent Coordinator',
        description: 'Work with MCP agents to complete complex tasks',
        difficulty: 'advanced',
        reward: {
            nft: 'Agent Architect',
            votTokens: 100,
            xp: 1000
        },
        requirements: ['Complete 3 agent-guided tasks', 'Rate agent performance'],
        progress: 0,
        maxProgress: 3,
        completed: false,
        claimed: false,
        icon: '🤖',
        color: 'orange'
    },
    {
        id: 'ecosystem-builder',
        title: 'Ecosystem Builder',
        description: 'Contribute to the MCPVOT ecosystem growth',
        difficulty: 'advanced',
        reward: {
            nft: 'Ecosystem Guardian',
            votTokens: 200,
            xp: 2000
        },
        requirements: ['Refer 5 new users', 'Complete 10 missions', 'Stake VOT tokens'],
        progress: 0,
        maxProgress: 16,
        completed: false,
        claimed: false,
        icon: '🏗️',
        color: 'gold'
    }
];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userAddress = searchParams.get('address');

        if (!userAddress) {
            return NextResponse.json({
                success: false,
                error: 'User address required'
            }, { status: 400 });
        }

        // In production, this would fetch user-specific mission progress from database
        // For now, return the base mission data
        const userMissions = missions.map(mission => ({
            ...mission,
            // Simulate some progress based on user address hash for demo purposes
            progress: Math.floor(parseInt(userAddress.slice(-8), 16) % (mission.maxProgress + 1)),
            completed: Math.floor(parseInt(userAddress.slice(-8), 16) % (mission.maxProgress + 1)) === mission.maxProgress
        }));

        return NextResponse.json({
            success: true,
            data: {
                missions: userMissions,
                stats: {
                    totalMissions: userMissions.length,
                    completedMissions: userMissions.filter(m => m.completed).length,
                    totalXP: userMissions.filter(m => m.completed).reduce((sum, m) => sum + m.reward.xp, 0),
                    totalVOT: userMissions.filter(m => m.completed).reduce((sum, m) => sum + m.reward.votTokens, 0)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching missions:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch missions'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { missionId, action, userAddress } = body;

        if (!missionId || !action || !userAddress) {
            return NextResponse.json({
                success: false,
                error: 'Missing required parameters'
            }, { status: 400 });
        }

        // In production, this would update the database
        const mission = missions.find(m => m.id === missionId);
        if (!mission) {
            return NextResponse.json({
                success: false,
                error: 'Mission not found'
            }, { status: 404 });
        }

        // Simulate mission completion
        if (action === 'complete') {
            return NextResponse.json({
                success: true,
                data: {
                    mission: {
                        ...mission,
                        completed: true,
                        progress: mission.maxProgress
                    },
                    reward: mission.reward
                }
            });
        }

        if (action === 'claim') {
            return NextResponse.json({
                success: true,
                data: {
                    claimed: true,
                    transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`
                }
            });
        }

        return NextResponse.json({
            success: false,
            error: 'Invalid action'
        }, { status: 400 });

    } catch (error) {
        console.error('Error updating mission:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to update mission'
        }, { status: 500 });
    }
}
