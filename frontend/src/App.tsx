import { useState, useEffect } from 'react';
import { CheckCircle, Wallet, LogOut, ChevronDown } from 'lucide-react';
import SubmitClaimForm from './components/SubmitClaimForm';
import ClaimsExplorer from './components/ClaimsExplorer';
import UserDashboard from './components/UserDashboard';
import {
  connectStacksWallet,
  connectWalletConnect,
  getWalletAddress,
  isWalletConnected,
  disconnectWallet,
  getStxBalance,
} from './wallet/walletConnect';

type Tab = 'submit' | 'explore' | 'dashboard';

const FactVerificationApp = () => {
  const [activeTab, setActiveTab] = useState<Tab>('explore');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [stxBalance, setStxBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  // Check wallet connection on mount
  useEffect(() => {
    const connected = isWalletConnected();
    setWalletConnected(connected);
    if (connected) {
      const address = getWalletAddress();
      setWalletAddress(address);
      if (address) {
        loadBalance(address);
      }
    }
  }, []);

  const loadBalance = async (address: string) => {
    try {
      const balance = await getStxBalance(address, 'testnet');
      setStxBalance(balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleConnectBrowserWallet = async () => {
    setLoading(true);
    setShowWalletMenu(false);
    try {
      await connectStacksWallet();
      const address = getWalletAddress();
      setWalletAddress(address);
      setWalletConnected(true);
      if (address) {
        await loadBalance(address);
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectWalletConnect = async () => {
    setLoading(true);
    setShowWalletMenu(false);
    try {
      await connectWalletConnect('testnet');
      const address = getWalletAddress();
      setWalletAddress(address);
      setWalletConnected(true);
      if (address) {
        await loadBalance(address);
      }
    } catch (error) {
      console.error('Failed to connect via WalletConnect:', error);
      alert('Failed to connect via WalletConnect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await disconnectWallet();
      setWalletConnected(false);
      setWalletAddress(null);
      setStxBalance(0);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleClaimSuccess = (txId: string) => {
    console.log('Claim submitted successfully:', txId);
    // Switch to explorer tab to see the claim
    setActiveTab('explore');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-md">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FactStack</h1>
                <p className="text-sm text-gray-600">Decentralized Truth Verification on Stacks</p>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="flex items-center space-x-4">
              {walletConnected && walletAddress ? (
                <>
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900">
                      {formatAddress(walletAddress)}
                    </span>
                    <span className="text-xs text-gray-600">{stxBalance.toFixed(2)} STX</span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Disconnect</span>
                  </button>
                </>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                    disabled={loading}
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{loading ? 'Connecting...' : 'Connect Wallet'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Wallet Menu Dropdown */}
                  {showWalletMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                      <div className="p-2">
                        <button
                          onClick={handleConnectBrowserWallet}
                          className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg transition-all"
                        >
                          <div className="font-medium text-gray-900">Browser Wallet</div>
                          <div className="text-xs text-gray-600">Hiro, Xverse, Leather</div>
                        </button>
                        <button
                          onClick={handleConnectWalletConnect}
                          className="w-full text-left px-4 py-3 hover:bg-green-50 rounded-lg transition-all"
                        >
                          <div className="font-medium text-gray-900">WalletConnect</div>
                          <div className="text-xs text-gray-600">Mobile & Desktop Wallets</div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-8 border border-green-100">
          {[
            { id: 'explore' as Tab, label: 'Explore Claims' },
            { id: 'submit' as Tab, label: 'Submit Claim' },
            { id: 'dashboard' as Tab, label: 'My Dashboard' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'submit' && (
            <SubmitClaimForm onSuccess={handleClaimSuccess} />
          )}

          {activeTab === 'explore' && (
            <ClaimsExplorer />
          )}

          {activeTab === 'dashboard' && (
            <UserDashboard />
          )}
        </div>
      </div>

      {/* Click outside to close wallet menu */}
      {showWalletMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowWalletMenu(false)}
        />
      )}
    </div>
  );
};

export default FactVerificationApp;
