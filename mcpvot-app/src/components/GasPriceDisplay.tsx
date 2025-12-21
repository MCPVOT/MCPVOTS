
'use client';

import { useGasPrice } from '@/lib/websocket-client';

const GasPriceDisplay = () => {
  const gasPrice = useGasPrice();

  if (!gasPrice) {
    return <div>Connecting to gas price stream...</div>;
  }

  return (
    <div>
      <p>Gas Price: {gasPrice.gasPrice} Gwei</p>
      <p>Max Price: {gasPrice.maxPrice} Gwei</p>
    </div>
  );
};

export default GasPriceDisplay;
