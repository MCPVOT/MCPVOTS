'use client';

import { useAuth } from '@/providers/AuthProvider';
import { useSignIn } from '@farcaster/auth-kit';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function AuthButton() {
  const auth = useAuth();
  const { signIn } = useSignIn({});

  // If no auth context or not authenticated
  if (!auth) {
    return (
      <div className="auth-buttons">
        <button
          onClick={() => signIn()}
          className="auth-button farcaster-button"
        >
          <span className="button-icon">🟣</span>
          Sign in with Farcaster
        </button>

        <div className="divider">OR</div>

        <ConnectButton />

        <style jsx>{`
          .auth-buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }
          .auth-button {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1.5rem;
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 8px;
            color: #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .auth-button:hover {
            background: rgba(0, 255, 65, 0.2);
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);
            transform: translateY(-2px);
          }
          .button-icon {
            font-size: 1.25rem;
          }
          .divider {
            color: rgba(255, 255, 255, 0.4);
            font-size: 0.875rem;
            font-family: 'Courier New', monospace;
            letter-spacing: 0.2em;
          }
        `}</style>
      </div>
    );
  }

  // If running inside Farcaster Mini App, user is auto-authenticated
  if (auth.method === 'farcaster' && auth.fid) {
    return (
      <div className="auth-display">
        <div className="user-info">
          <span className="farcaster-icon">🟣</span>
          <div className="user-details">
            <span className="username">@{auth.username}</span>
            <span className="fid">FID: {auth.fid}</span>
          </div>
        </div>
        {auth.basename && (
          <span className="basename">{auth.basename}</span>
        )}
        <style jsx>{`
          .auth-display {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 1rem;
            background: rgba(0, 255, 65, 0.1);
            border: 1px solid #00ff41;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
          }
          .user-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .farcaster-icon {
            font-size: 1.5rem;
          }
          .user-details {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .username {
            color: #00ff41;
            font-weight: bold;
            font-size: 0.875rem;
          }
          .fid {
            color: rgba(255, 255, 255, 0.6);
            font-size: 0.75rem;
          }
          .basename {
            color: #00d4ff;
            font-size: 0.875rem;
            padding: 0.25rem 0.5rem;
            background: rgba(0, 212, 255, 0.1);
            border-radius: 4px;
          }
        `}</style>
      </div>
    );
  }

  // Outside Farcaster: Show both SIWF and wallet options
  return (
    <div className="auth-buttons">
      <button
        onClick={() => signIn()}
        className="auth-button farcaster-button"
      >
        <span className="button-icon">🟣</span>
        Sign in with Farcaster
      </button>

      <div className="divider">OR</div>

      <ConnectButton />

      <style jsx>{`
        .auth-buttons {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
        }
        .auth-button {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.5rem;
          background: rgba(0, 255, 65, 0.1);
          border: 2px solid #00ff41;
          border-radius: 8px;
          color: #00ff41;
          font-family: 'Courier New', monospace;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .auth-button:hover {
          background: rgba(0, 255, 65, 0.2);
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.4);
          transform: translateY(-2px);
        }
        .button-icon {
          font-size: 1.25rem;
        }
        .divider {
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.875rem;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.2em;
        }
      `}</style>
    </div>
  );
}
