import { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, Calendar, User, TrendingUp } from 'lucide-react';
import {
  getContractStats,
  getMultipleClaims,
  ClaimStatus,
  StatusLabels,
  microStxToStx,
  type Claim,
} from '../contracts/factRegistry';

export default function ClaimsExplorer() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [totalClaims, setTotalClaims] = useState(0);

  // Load claims on mount
  useEffect(() => {
    loadClaims();
  }, []);

  // Filter claims when filters change
  useEffect(() => {
    filterClaims();
  }, [searchQuery, selectedCategory, selectedStatus, claims]);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const stats = await getContractStats('testnet');
      setTotalClaims(stats.totalClaims);

      if (stats.totalClaims > 0) {
        // Load all claims (up to 100 for performance)
        const claimIds = Array.from({ length: Math.min(stats.totalClaims, 100) }, (_, i) => i + 1);
        const loadedClaims = await getMultipleClaims(claimIds, 'testnet');
        setClaims(loadedClaims.reverse()); // Show newest first
      }
    } catch (error) {
      console.error('Error loading claims:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClaims = () => {
    let filtered = [...claims];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (claim) =>
          claim.claimText.toLowerCase().includes(query) ||
          claim.category.toLowerCase().includes(query) ||
          claim.submitter.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((claim) => claim.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((claim) => claim.status === parseInt(selectedStatus));
    }

    setFilteredClaims(filtered);
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
    });
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Get unique categories from claims
  const categories = Array.from(new Set(claims.map((c) => c.category)));

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold mb-2">Claims Explorer</h2>
        <p className="text-green-100 mb-4">Browse and verify factual claims on the blockchain</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-green-100 text-sm">Total Claims</p>
            <p className="text-3xl font-bold">{totalClaims}</p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-green-100 text-sm">Verified</p>
            <p className="text-3xl font-bold">
              {claims.filter((c) => c.status === ClaimStatus.VERIFIED).length}
            </p>
          </div>
          <div className="bg-white/20 rounded-lg p-4">
            <p className="text-green-100 text-sm">Pending</p>
            <p className="text-3xl font-bold">
              {claims.filter((c) => c.status === ClaimStatus.PENDING).length}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search claims, categories, or addresses..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
            >
              <option value="all">All Statuses</option>
              <option value={ClaimStatus.PENDING}>Pending</option>
              <option value={ClaimStatus.VERIFIED}>Verified</option>
              <option value={ClaimStatus.DISPUTED}>Disputed</option>
              <option value={ClaimStatus.REJECTED}>Rejected</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>
                Showing {filteredClaims.length} of {claims.length} claims
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading claims...</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border-2 border-gray-100">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No claims found</h3>
            <p className="text-gray-600">
              {claims.length === 0
                ? 'No claims have been submitted yet. Be the first!'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          filteredClaims.map((claim) => (
            <div
              key={claim.claimId}
              className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100 hover:border-green-300 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
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
                    <span className="text-xs text-gray-500">Claim #{claim.claimId}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{claim.claimText}</h3>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>Submitter: {formatAddress(claim.submitter)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(claim.timestamp)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>Score: {claim.verificationScore}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">Verifiers: {claim.verifierCount}</span>
                  {claim.stakeTotal > 0 && (
                    <span className="text-green-600">
                      • {microStxToStx(claim.stakeTotal)} STX staked
                    </span>
                  )}
                </div>
              </div>

              {/* Sources */}
              {claim.sources.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Sources:</p>
                  <div className="space-y-1">
                    {claim.sources.map((source, idx) => (
                      <a
                        key={idx}
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-sm text-green-600 hover:text-green-700 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{source}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* IPFS Hash */}
              {claim.ipfsHash && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-600">
                    IPFS Evidence:{' '}
                    <span className="font-mono text-gray-800">{claim.ipfsHash}</span>
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
