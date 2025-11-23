import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import SignClient from '@walletconnect/sign-client';
import QRCodeModal from '@walletconnect/qrcode-modal';

// Reown Project ID (formerly WalletConnect) - Get from https://cloud.reown.com/
const WALLETCONNECT_PROJECT_ID = process.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID';

// Stacks configuration
const appConfig = new AppConfig(['store_write', 'publish_data']);
export const userSession = new UserSession({ appConfig });

// Reown WalletConnect Client
let walletConnectClient: InstanceType<typeof SignClient> | null = null;
let currentSession: any = null;

// Supported Stacks chains
const STACKS_MAINNET_CHAIN = 'stacks:1';
const STACKS_TESTNET_CHAIN = 'stacks:2147483648';

/**
 * Initialize Reown WalletConnect client
 */
export async function initWalletConnect() {
  try {
    walletConnectClient = await SignClient.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      metadata: {
        name: 'FactStack Protocol',
        description: 'Decentralized Truth Verification on Stacks Blockchain',
        url: window.location.origin,
        icons: [`${window.location.origin}/logo.png`],
      },
    });

    console.log('Reown WalletConnect client initialized');
    return walletConnectClient;
  } catch (error) {
    console.error('Failed to initialize Reown WalletConnect:', error);
    throw error;
  }
}

/**
 * Connect wallet via Reown WalletConnect
 */
export async function connectWalletConnect(network: 'mainnet' | 'testnet' = 'testnet') {
  try {
    if (!walletConnectClient) {
      await initWalletConnect();
    }

    const chain = network === 'mainnet' ? STACKS_MAINNET_CHAIN : STACKS_TESTNET_CHAIN;

    const { uri, approval } = await walletConnectClient!.connect({
      requiredNamespaces: {
        stacks: {
          methods: [
            'stacks_signMessage',
            'stacks_stxTransfer',
            'stacks_contractCall',
            'stacks_contractDeploy',
          ],
          chains: [chain],
          events: [],
        },
      },
    });

    if (uri) {
      QRCodeModal.open(uri, () => {
        console.log('QR Code Modal closed');
      });
    }

    const session = await approval();
    currentSession = session;
    QRCodeModal.close();

    console.log('Reown WalletConnect session established:', session);
    return session;
  } catch (error) {
    console.error('Reown WalletConnect connection failed:', error);
    QRCodeModal.close();
    throw error;
  }
}

/**
 * Connect wallet via Stacks Connect (browser extension wallets)
 */
export async function connectStacksWallet() {
  return new Promise((resolve, reject) => {
    showConnect({
      appDetails: {
        name: 'FactStack Protocol',
        icon: `${window.location.origin}/logo.png`,
      },
      onFinish: () => {
        const userData = userSession.loadUserData();
        resolve(userData);
      },
      onCancel: () => {
        reject(new Error('User cancelled authentication'));
      },
      userSession,
    });
  });
}

/**
 * Get current wallet address
 */
export function getWalletAddress(): string | null {
  if (userSession.isUserSignedIn()) {
    const userData = userSession.loadUserData();
    return userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
  }

  if (currentSession) {
    const accounts = currentSession.namespaces.stacks?.accounts || [];
    if (accounts.length > 0) {
      // Extract address from CAIP-10 format: "stacks:1:ST..."
      const address = accounts[0].split(':')[2];
      return address;
    }
  }

  return null;
}

/**
 * Check if wallet is connected
 */
export function isWalletConnected(): boolean {
  return userSession.isUserSignedIn() || currentSession !== null;
}

/**
 * Disconnect wallet
 */
export async function disconnectWallet() {
  try {
    if (currentSession && walletConnectClient) {
      await walletConnectClient.disconnect({
        topic: currentSession.topic,
        reason: {
          code: 6000,
          message: 'User disconnected',
        },
      });
      currentSession = null;
    }

    if (userSession.isUserSignedIn()) {
      userSession.signUserOut();
    }

    console.log('Wallet disconnected');
  } catch (error) {
    console.error('Failed to disconnect wallet:', error);
    throw error;
  }
}

/**
 * Sign a message using connected wallet
 */
export async function signMessage(message: string): Promise<string> {
  const address = getWalletAddress();
  if (!address) {
    throw new Error('No wallet connected');
  }

  if (currentSession && walletConnectClient) {
    // Use Reown WalletConnect
    const result = await walletConnectClient.request({
      topic: currentSession.topic,
      chainId: currentSession.namespaces.stacks.chains[0],
      request: {
        method: 'stacks_signMessage',
        params: {
          pubkey: address,
          message,
        },
      },
    });
    return result as string;
  }

  // Use Stacks Connect for browser wallets
  // This would require additional implementation using @stacks/connect's openSignatureRequestPopup
  throw new Error('Message signing not implemented for Stacks Connect yet');
}

/**
 * Get STX balance
 */
export async function getStxBalance(address: string, network: 'mainnet' | 'testnet' = 'testnet'): Promise<number> {
  try {
    const networkUrl = network === 'mainnet'
      ? 'https://api.mainnet.hiro.so'
      : 'https://api.testnet.hiro.so';

    const response = await fetch(`${networkUrl}/v2/accounts/${address}`);
    const data = await response.json();

    // Convert from microSTX to STX
    return parseInt(data.balance) / 1000000;
  } catch (error) {
    console.error('Failed to fetch STX balance:', error);
    return 0;
  }
}

export default {
  initWalletConnect,
  connectWalletConnect,
  connectStacksWallet,
  getWalletAddress,
  isWalletConnected,
  disconnectWallet,
  signMessage,
  getStxBalance,
};
