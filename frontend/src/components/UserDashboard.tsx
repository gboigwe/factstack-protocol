import { useState, useEffect } from 'react';
import {
  User,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Award,
} from 'lucide-react';
import {
  getUserClaims,
  getMultipleClaims,
  ClaimStatus,
  StatusLabels,
  microStxToStx,
  type Claim,
} from '../contracts/factRegistry';
import { getWalletAddress, getStxBalance } from '../wallet/walletConnect';

export default function UserDashboard() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    disputed: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setLoading(true);
    try {
      const address = getWalletAddress();
      if (!address) {
        setLoading(false);
        return;
      }

      setUserAddress(address);

      // Load balance
      const bal = await getStxBalance(address, 'testnet');
      setBalance(bal);

      // Load user claims
      const userClaimsData = await getUserClaims(address, 'testnet');

      if (userClaimsData.claimIds.length > 0) {
        const claimsData = await getMultipleClaims(userClaimsData.claimIds, 'testnet');
        setClaims(claimsData.reverse()); // Newest first

        // Calculate stats
        const newStats = {
          total: claimsData.length,
          pending: claimsData.filter((c) => c.status === ClaimStatus.PENDING).length,
          verified: claimsData.filter((c) => c.status === ClaimStatus.VERIFIED).length,
          disputed: claimsData.filter((c) => c.status === ClaimStatus.DISPUTED).length,
          rejected: claimsData.filter((c) => c.status === ClaimStatus.REJECTED).length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: number) => {
    switch (status) {
      case ClaimStatus.VERIFIED:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case ClaimStatus.PENDING:
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case ClaimStatus.DISPUTED:
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case ClaimStatus.REJECTED:
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case ClaimStatus.VERIFIED:
        return 'bg-green-100 text-green-700 border-green-200';
      case ClaimStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case ClaimStatus.DISPUTED:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case ClaimStatus.REJECTED:
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAccuracy = () => {
    if (stats.total === 0) return 0;
    return ((stats.verified / stats.total) * 100).toFixed(1);
  };

  if (!userAddress) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center border-2 border-green-100">
        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to view your dashboard</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1">Your Dashboard</h2>
              <p className="text-green-100 text-sm font-mono">{userAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-sm">Balance</p>
            <p className="text-3xl font-bold">{balance.toFixed(2)} STX</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Total Claims</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{stats.verified}</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Verified</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-yellow-100">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-600">{stats.pending}</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Pending</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{calculateAccuracy()}%</span>
          </div>
          <p className="text-sm font-medium text-gray-600">Accuracy</p>
        </div>
      </div>

      {/* Claims List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Your Claims</h3>
          {claims.length > 0 && (
            <span className="text-sm text-gray-600">{claims.length} total</span>
          )}
        </div>

        {claims.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-gray-900 mb-2">No claims yet</h4>
            <p className="text-gray-600 mb-4">
              You haven't submitted any claims. Start by submitting your first fact claim!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div
                key={claim.claimId}
                className="border-2 border-gray-100 rounded-lg p-4 hover:border-green-300 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(claim.status)}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        claim.status
                      )}`}
                    >
                      {StatusLabels[claim.status as keyof typeof StatusLabels]}
                    </span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {claim.category}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">#{claim.claimId}</span>
                </div>

                <p className="text-gray-900 font-medium mb-2">{claim.claimText}</p>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{formatDate(claim.timestamp)}</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>Score: {claim.verificationScore}</span>
                    </div>
                    <span>Verifiers: {claim.verifierCount}</span>
                    {claim.stakeTotal > 0 && (
                      <span className="text-green-600 font-medium">
                        {microStxToStx(claim.stakeTotal)} STX
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Additional Stats */}
      {stats.total > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Status Breakdown</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Verified</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.verified} ({((stats.verified / stats.total) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Pending</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.pending} ({((stats.pending / stats.total) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Disputed</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.disputed} ({((stats.disputed / stats.total) * 100).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">Rejected</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.rejected} ({((stats.rejected / stats.total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Activity Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">First Claim</span>
                <span className="text-sm font-medium text-gray-900">
                  {claims.length > 0 ? formatDate(claims[claims.length - 1].timestamp) : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Latest Claim</span>
                <span className="text-sm font-medium text-gray-900">
                  {claims.length > 0 ? formatDate(claims[0].timestamp) : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Success Rate</span>
                <span className="text-sm font-medium text-green-600">{calculateAccuracy()}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
