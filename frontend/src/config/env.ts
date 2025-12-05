/**
 * Environment configuration utility
 * Centralizes environment variable access and provides type-safe defaults
 */

export type NetworkType = 'mainnet' | 'testnet';

interface EnvConfig {
  walletConnectProjectId: string;
  stacksNetwork: NetworkType;
  contractAddress: string;
  stacksApiUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  if (!value && !defaultValue) {
    console.warn(`Missing environment variable: ${key}`);
    return '';
  }
  return value || defaultValue || '';
}

/**
 * Application environment configuration
 */
export const env: EnvConfig = {
  walletConnectProjectId: getEnvVar('VITE_WALLETCONNECT_PROJECT_ID', 'demo_project_id'),
  stacksNetwork: (getEnvVar('VITE_STACKS_NETWORK', 'testnet') as NetworkType),
  contractAddress: getEnvVar('VITE_CONTRACT_ADDRESS', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'),
  stacksApiUrl: getEnvVar(
    'VITE_STACKS_API_URL',
    getEnvVar('VITE_STACKS_NETWORK', 'testnet') === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so'
  ),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

/**
 * Validate environment configuration on app startup
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!env.walletConnectProjectId || env.walletConnectProjectId === 'demo_project_id') {
    errors.push('VITE_WALLETCONNECT_PROJECT_ID is not configured. WalletConnect will not work properly.');
  }

  if (!['mainnet', 'testnet'].includes(env.stacksNetwork)) {
    errors.push(`Invalid VITE_STACKS_NETWORK: ${env.stacksNetwork}. Must be 'mainnet' or 'testnet'.`);
  }

  if (!env.contractAddress) {
    errors.push('VITE_CONTRACT_ADDRESS is not configured.');
  }

  if (!env.stacksApiUrl) {
    errors.push('VITE_STACKS_API_URL is not configured.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get network-specific configuration
 */
export function getNetworkConfig(network: NetworkType = env.stacksNetwork) {
  const configs = {
    mainnet: {
      apiUrl: 'https://api.mainnet.hiro.so',
      explorerUrl: 'https://explorer.hiro.so',
      networkName: 'Mainnet',
    },
    testnet: {
      apiUrl: 'https://api.testnet.hiro.so',
      explorerUrl: 'https://explorer.hiro.so/?chain=testnet',
      networkName: 'Testnet',
    },
  };

  return configs[network];
}

/**
 * Get transaction explorer URL
 */
export function getTxExplorerUrl(txId: string, network: NetworkType = env.stacksNetwork): string {
  const { explorerUrl } = getNetworkConfig(network);
  return `${explorerUrl}/txid/${txId}`;
}

/**
 * Get address explorer URL
 */
export function getAddressExplorerUrl(address: string, network: NetworkType = env.stacksNetwork): string {
  const { explorerUrl } = getNetworkConfig(network);
  return `${explorerUrl}/address/${address}`;
}

/**
 * Get contract explorer URL
 */
export function getContractExplorerUrl(
  contractAddress: string,
  contractName: string,
  network: NetworkType = env.stacksNetwork
): string {
  const { explorerUrl } = getNetworkConfig(network);
  return `${explorerUrl}/txid/${contractAddress}.${contractName}`;
}

// Log environment configuration in development
if (env.isDevelopment) {
  console.log('🔧 Environment Configuration:', {
    network: env.stacksNetwork,
    apiUrl: env.stacksApiUrl,
    contractAddress: env.contractAddress,
    walletConnectConfigured: env.walletConnectProjectId !== 'demo_project_id',
  });

  const validation = validateEnv();
  if (!validation.valid) {
    console.warn('⚠️  Environment validation warnings:', validation.errors);
  }
}

export default env;
