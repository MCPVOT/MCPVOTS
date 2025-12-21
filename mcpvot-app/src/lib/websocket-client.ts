
import { useEffect, useState } from 'react';

export interface GasData {
  gasPrice: number;
  maxPrice: number;
}

export const useGasPrice = () => {
  const [gasPrice, setGasPrice] = useState<GasData | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8765');

    ws.onopen = () => {
      console.log('Connected to gas price WebSocket');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.gasPrice && data.maxPrice) {
          setGasPrice(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from gas price WebSocket');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return gasPrice;
};
