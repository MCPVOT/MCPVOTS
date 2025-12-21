
'use client';

import { useEffect, useState } from 'react';

interface Trade {
  id: number;
  timestamp: number;
  type: string;
  usd_amount: number;
  token_amount: number;
  price_usd: number;
  tx_hash: string;
  gas_used: number;
  success: boolean;
}

const TradingBotTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch('/api/trading-bot/trades');
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        setTrades(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  if (loading) {
    return <div>Loading trades...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-white sm:pl-6">Type</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">USD Amount</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Token Amount</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Price (USD)</th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Timestamp</th>
            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
              <span className="sr-only">View</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800 bg-gray-900">
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-white sm:pl-6">{trade.type}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">${trade.usd_amount.toFixed(2)}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{trade.token_amount.toFixed(4)}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">${trade.price_usd.toFixed(6)}</td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{new Date(trade.timestamp * 1000).toLocaleString()}</td>
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <a href={`https://basescan.org/tx/${trade.tx_hash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">View Tx</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradingBotTrades;
