import {
  stringAsciiCV,
  uintCV,
  listCV,
  fetchCallReadOnlyFunction,
  cvToJSON,
  principalCV,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { userSession } from '../wallet/walletConnect';

// Contract configuration
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
const CONTRACT_NAME = 'fact-registry';

// Network configuration
export function getNetworkUrl(networkType: 'mainnet' | 'testnet' = 'testnet'): string {
  return networkType === 'mainnet'
    ? 'https://api.mainnet.hiro.so'
    : 'https://api.testnet.hiro.so';
}

// Status constants matching the contract
export const ClaimStatus = {
  PENDING: 0,
  VERIFIED: 1,
  DISPUTED: 2,
  REJECTED: 3,
} as const;

export const StatusLabels = {
  [ClaimStatus.PENDING]: 'Pending',
  [ClaimStatus.VERIFIED]: 'Verified',
  [ClaimStatus.DISPUTED]: 'Disputed',
  [ClaimStatus.REJECTED]: 'Rejected',
};

// Type definitions
export interface Claim {
  claimId: number;
  submitter: string;
  claimText: string;
  category: string;
  sources: string[];
  ipfsHash: string;
  timestamp: number;
  status: number;
  verificationScore: number;
  stakeTotal: number;
  verifierCount: number;
}

export interface ContractStats {
  totalClaims: number;
  submissionFee: number;
  isPaused: boolean;
}

export interface UserClaims {
  claimIds: number[];
  claimCount: number;
}

// Read-only function calls

/**
 * Get a specific claim by ID
 */
export async function getClaim(
  claimId: number,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<Claim | null> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-claim',
      functionArgs: [uintCV(claimId)],
      network: network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const jsonResult = cvToJSON(result);

    if (jsonResult.type === 'none' || !jsonResult.value) {
      return null;
    }

    const claimData = jsonResult.value.value;

    return {
      claimId,
      submitter: claimData.submitter.value,
      claimText: claimData['claim-text'].value,
      category: claimData.category.value,
      sources: claimData.sources.value.map((s: any) => s.value),
      ipfsHash: claimData['ipfs-hash'].value,
      timestamp: parseInt(claimData.timestamp.value),
      status: parseInt(claimData.status.value),
      verificationScore: parseInt(claimData['verification-score'].value),
      stakeTotal: parseInt(claimData['stake-total'].value),
      verifierCount: parseInt(claimData['verifier-count'].value),
    };
  } catch (error) {
    console.error('Error fetching claim:', error);
    return null;
  }
}

/**
 * Get all claims for a specific user
 */
export async function getUserClaims(
  userAddress: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<UserClaims> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-user-claims',
      functionArgs: [principalCV(userAddress)],
      network: network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const jsonResult = cvToJSON(result);
    const data = jsonResult.value;

    return {
      claimIds: data['claim-ids'].value.map((id: any) => parseInt(id.value)),
      claimCount: parseInt(data['claim-count'].value),
    };
  } catch (error) {
    console.error('Error fetching user claims:', error);
    return { claimIds: [], claimCount: 0 };
  }
}

/**
 * Get claims by category
 */
export async function getCategoryClaims(
  category: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<number[]> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-category-claims',
      functionArgs: [stringAsciiCV(category)],
      network: network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const jsonResult = cvToJSON(result);
    const claimIds = jsonResult.value['claim-ids'].value;

    return claimIds.map((id: any) => parseInt(id.value));
  } catch (error) {
    console.error('Error fetching category claims:', error);
    return [];
  }
}

/**
 * Search claims by category
 */
export async function searchClaimsByCategory(
  category: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<number[]> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'search-claims-by-category',
      functionArgs: [stringAsciiCV(category)],
      network: network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const jsonResult = cvToJSON(result);

    if (jsonResult.type === 'ok') {
      const claimIds = jsonResult.value.value['claim-ids'].value;
      return claimIds.map((id: any) => parseInt(id.value));
    }

    return [];
  } catch (error) {
    console.error('Error searching claims:', error);
    return [];
  }
}

/**
 * Get contract statistics
 */
export async function getContractStats(
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<ContractStats> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-contract-stats',
      functionArgs: [],
      network: network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const jsonResult = cvToJSON(result);
    const data = jsonResult.value;

    return {
      totalClaims: parseInt(data['total-claims'].value),
      submissionFee: parseInt(data['submission-fee'].value),
      isPaused: data['is-paused'].value,
    };
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    return { totalClaims: 0, submissionFee: 0, isPaused: false };
  }
}

/**
 * Get current submission fee
 */
export async function getSubmissionFee(
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<number> {
  try {
    const result = await fetchCallReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'get-submission-fee',
      functionArgs: [],
      network: network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const jsonResult = cvToJSON(result);
    return parseInt(jsonResult.value);
  } catch (error) {
    console.error('Error fetching submission fee:', error);
    return 0;
  }
}

// Write functions (transactions)

/**
 * Submit a new claim
 */
export async function submitClaim(
  claimText: string,
  category: string,
  sources: string[],
  ipfsHash: string,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<{ txId: string } | { error: string }> {
  try {
    if (!userSession.isUserSignedIn()) {
      return { error: 'Wallet not connected' };
    }

    // Validate inputs
    if (!claimText || claimText.length === 0 || claimText.length > 500) {
      return { error: 'Claim text must be between 1 and 500 characters' };
    }

    if (!category || category.length === 0 || category.length > 50) {
      return { error: 'Category must be between 1 and 50 characters' };
    }

    if (sources.length > 5) {
      return { error: 'Maximum 5 sources allowed' };
    }

    for (const source of sources) {
      if (source.length > 200) {
        return { error: 'Each source must be 200 characters or less' };
      }
    }

    if (ipfsHash.length > 100) {
      return { error: 'IPFS hash must be 100 characters or less' };
    }

    // Prepare function arguments
    const functionArgs = [
      stringAsciiCV(claimText),
      stringAsciiCV(category),
      listCV(sources.map(s => stringAsciiCV(s))),
      stringAsciiCV(ipfsHash),
    ];

    // Open contract call popup (returns a promise that resolves when user confirms)
    return new Promise((resolve) => {
      openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'submit-claim',
        functionArgs,
        network: network,
        appDetails: {
          name: 'FactStack Protocol',
          icon: window.location.origin + '/logo.png',
        },
        onFinish: (data: any) => {
          console.log('Transaction successful:', data);
          resolve({ txId: data.txId || 'pending' });
        },
        onCancel: () => {
          console.log('Transaction cancelled');
          resolve({ error: 'Transaction cancelled by user' });
        },
      });
    });
  } catch (error: any) {
    console.error('Error submitting claim:', error);
    return { error: error.message || 'Failed to submit claim' };
  }
}

/**
 * Update claim status (owner only)
 */
export async function updateClaimStatus(
  claimId: number,
  newStatus: number,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<{ txId: string } | { error: string }> {
  try {
    if (!userSession.isUserSignedIn()) {
      return { error: 'Wallet not connected' };
    }

    if (newStatus < 0 || newStatus > 3) {
      return { error: 'Invalid status value' };
    }

    const functionArgs = [
      uintCV(claimId),
      uintCV(newStatus),
    ];

    return new Promise((resolve) => {
      openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'update-claim-status',
        functionArgs,
        network: network,
        appDetails: {
          name: 'FactStack Protocol',
          icon: window.location.origin + '/logo.png',
        },
        onFinish: (data: any) => {
          console.log('Status update successful:', data);
          resolve({ txId: data.txId || 'pending' });
        },
        onCancel: () => {
          resolve({ error: 'Transaction cancelled by user' });
        },
      });
    });
  } catch (error: any) {
    console.error('Error updating claim status:', error);
    return { error: error.message || 'Failed to update status' };
  }
}

/**
 * Update verification data for a claim
 */
export async function updateVerificationData(
  claimId: number,
  verificationScore: number,
  stakeTotal: number,
  verifierCount: number,
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<{ txId: string } | { error: string }> {
  try {
    if (!userSession.isUserSignedIn()) {
      return { error: 'Wallet not connected' };
    }

    const functionArgs = [
      uintCV(claimId),
      uintCV(verificationScore),
      uintCV(stakeTotal),
      uintCV(verifierCount),
    ];

    return new Promise((resolve) => {
      openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'update-verification-data',
        functionArgs,
        network: network,
        appDetails: {
          name: 'FactStack Protocol',
          icon: window.location.origin + '/logo.png',
        },
        onFinish: (data: any) => {
          console.log('Verification data updated:', data);
          resolve({ txId: data.txId || 'pending' });
        },
        onCancel: () => {
          resolve({ error: 'Transaction cancelled by user' });
        },
      });
    });
  } catch (error: any) {
    console.error('Error updating verification data:', error);
    return { error: error.message || 'Failed to update verification data' };
  }
}

/**
 * Helper function to fetch multiple claims by IDs
 */
export async function getMultipleClaims(
  claimIds: number[],
  network: 'mainnet' | 'testnet' = 'testnet'
): Promise<Claim[]> {
  const claims = await Promise.all(
    claimIds.map(id => getClaim(id, network))
  );

  return claims.filter((claim): claim is Claim => claim !== null);
}

/**
 * Helper to convert microSTX to STX
 */
export function microStxToStx(microStx: number): number {
  return microStx / 1000000;
}

/**
 * Helper to convert STX to microSTX
 */
export function stxToMicroStx(stx: number): number {
  return Math.floor(stx * 1000000);
}

export default {
  getClaim,
  getUserClaims,
  getCategoryClaims,
  searchClaimsByCategory,
  getContractStats,
  getSubmissionFee,
  submitClaim,
  updateClaimStatus,
  updateVerificationData,
  getMultipleClaims,
  microStxToStx,
  stxToMicroStx,
};
