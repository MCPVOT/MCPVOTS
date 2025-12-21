import type { AxiosInstance } from 'axios';
import axios from 'axios';

const API_BASE_URL = '/api';

// Base axios instance without payment interceptor
export const baseApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// This will be dynamically set based on wallet connection
let apiClient: AxiosInstance = baseApiClient;

// Update the API client with a wallet
export async function updateApiClient() {
  // Temporarily disabled x402 due to build conflicts
  // TODO: Re-enable after resolving Solana dependency issues
  console.log('⚠️ x402 temporarily disabled - using base client');
  apiClient = baseApiClient;
}

// API endpoints
export const api = {
  // Paid endpoints
  mintNFT: async () => {
    console.log('🔐 Requesting to mint NFT...');
    const response = await apiClient.post('/mint');
    console.log('✅ NFT minted:', response.data);
    return response.data;
  },
};
