'use client';

import { useAuth } from '@/providers';
import { ConnectButton } from '@rainbow-me/rainbowkit';

/**
 * UserProfile - Displays authenticated user information
 * Shows Farcaster profile or wallet address based on auth method
 */
export default function UserProfile() {
  const auth = useAuth();

  // If user is authenticated via Farcaster Mini App
  if (auth && auth.method === 'farcaster' && auth.fid) {
    return (
      <div className="user-profile farcaster-profile">
        <div className="profile-avatar">
          <div className="avatar-ring"></div>
          <span className="farcaster-icon">🟣</span>
        </div>
        <div className="profile-info">
          <div className="username">@{auth.username}</div>
          <div className="fid">FID: {auth.fid}</div>
          {auth.address && (
            <div className="address">
              {auth.address.slice(0, 6)}...{auth.address.slice(-4)}
            </div>
          )}
        </div>
        <div className="status-indicator online"></div>
        <style jsx>{`
          .user-profile {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            background: rgba(0, 255, 65, 0.05);
            border: 1px solid #00ff41;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            position: relative;
          }
          .profile-avatar {
            position: relative;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .avatar-ring {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 2px solid #00ff41;
            border-radius: 50%;
            animation: pulse-ring 2s ease-in-out infinite;
          }
          @keyframes pulse-ring {
            0%,
            100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.5;
            }
          }
          .farcaster-icon {
            font-size: 2rem;
            position: relative;
            z-index: 1;
          }
          .profile-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .username {
            color: #00ff41;
            font-weight: bold;
            font-size: 1rem;
            text-shadow: 0 0 8px rgba(0, 255, 65, 0.5);
          }
          .fid {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
          }
          .address {
            color: rgba(0, 212, 255, 0.8);
            font-size: 0.75rem;
          }
          .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #00ff41;
            box-shadow: 0 0 10px rgba(0, 255, 65, 0.8);
            animation: pulse-dot 2s ease-in-out infinite;
          }
          @keyframes pulse-dot {
            0%,
            100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.2);
              opacity: 0.8;
            }
          }
          @media (max-width: 640px) {
            .user-profile {
              padding: 0.5rem 0.75rem;
            }
            .profile-avatar {
              width: 40px;
              height: 40px;
            }
            .farcaster-icon {
              font-size: 1.5rem;
            }
            .username {
              font-size: 0.875rem;
            }
          }
        `}</style>
      </div>
    );
  }

  // If user is connected via wallet
  if (auth && auth.method === 'wallet' && auth.address) {
    return (
      <div className="user-profile wallet-profile">
        <ConnectButton />
        <style jsx>{`
          .wallet-profile {
            display: flex;
            align-items: center;
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated - show connect button
  return (
    <div className="user-profile no-auth">
      <ConnectButton />
      <style jsx>{`
        .no-auth {
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
