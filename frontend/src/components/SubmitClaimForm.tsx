import { useState, useEffect } from 'react';
import { FileText, Plus, X, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { submitClaim, getSubmissionFee, microStxToStx } from '../contracts/factRegistry';
import { isWalletConnected } from '../wallet/walletConnect';

interface SubmitClaimFormProps {
  onSuccess?: (txId: string) => void;
  onCancel?: () => void;
}

export default function SubmitClaimForm({ onSuccess, onCancel }: SubmitClaimFormProps) {
  const [claimText, setClaimText] = useState('');
  const [category, setCategory] = useState('');
  const [sources, setSources] = useState<string[]>(['']);
  const [ipfsHash, setIpfsHash] = useState('');
  const [submissionFee, setSubmissionFee] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load submission fee on mount
  useEffect(() => {
    async function loadFee() {
      const fee = await getSubmissionFee('testnet');
      setSubmissionFee(fee);
    }
    loadFee();
  }, []);

  const addSourceField = () => {
    if (sources.length < 5) {
      setSources([...sources, '']);
    }
  };

  const removeSourceField = (index: number) => {
    const newSources = sources.filter((_, i) => i !== index);
    setSources(newSources.length > 0 ? newSources : ['']);
  };

  const updateSource = (index: number, value: string) => {
    const newSources = [...sources];
    newSources[index] = value;
    setSources(newSources);
  };

  const validateForm = (): string | null => {
    if (!isWalletConnected()) {
      return 'Please connect your wallet first';
    }

    if (!claimText.trim()) {
      return 'Claim text is required';
    }

    if (claimText.length > 500) {
      return 'Claim text must be 500 characters or less';
    }

    if (!category.trim()) {
      return 'Category is required';
    }

    if (category.length > 50) {
      return 'Category must be 50 characters or less';
    }

    const nonEmptySources = sources.filter(s => s.trim());
    if (nonEmptySources.length === 0) {
      return 'At least one source is required';
    }

    for (const source of nonEmptySources) {
      if (source.length > 200) {
        return 'Each source must be 200 characters or less';
      }
      // Basic URL validation
      try {
        new URL(source);
      } catch {
        return `Invalid URL: ${source.substring(0, 30)}...`;
      }
    }

    if (ipfsHash && ipfsHash.length > 100) {
      return 'IPFS hash must be 100 characters or less';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const nonEmptySources = sources.filter(s => s.trim());
      const result = await submitClaim(
        claimText.trim(),
        category.trim(),
        nonEmptySources,
        ipfsHash.trim() || '',
        'testnet'
      );

      if ('error' in result) {
        setError(result.error);
      } else {
        setSuccess(`Claim submitted successfully! Transaction ID: ${result.txId}`);
        // Reset form
        setClaimText('');
        setCategory('');
        setSources(['']);
        setIpfsHash('');

        if (onSuccess) {
          onSuccess(result.txId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit claim');
    } finally {
      setLoading(false);
    }
  };

  const characterCount = claimText.length;
  const isOverLimit = characterCount > 500;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-green-100 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Submit Fact Claim</h2>
            <p className="text-sm text-gray-600">
              Fee: {microStxToStx(submissionFee)} STX
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-800 font-medium">Success!</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Claim Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fact Claim *
          </label>
          <textarea
            value={claimText}
            onChange={(e) => setClaimText(e.target.value)}
            placeholder="Enter the factual claim you want to verify..."
            rows={4}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
              isOverLimit
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-200 focus:border-green-500 focus:ring-green-200'
            }`}
            disabled={loading}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              Clear, concise statement of the fact to be verified
            </p>
            <p className={`text-xs font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}>
              {characterCount}/500
            </p>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            disabled={loading}
          >
            <option value="">Select a category</option>
            <option value="Politics">Politics</option>
            <option value="Science">Science</option>
            <option value="Health">Health</option>
            <option value="Technology">Technology</option>
            <option value="Economics">Economics</option>
            <option value="Environment">Environment</option>
            <option value="History">History</option>
            <option value="Other">Other</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose the most relevant category for your claim
          </p>
        </div>

        {/* Sources */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Sources * (Max 5)
            </label>
            {sources.length < 5 && (
              <button
                type="button"
                onClick={addSourceField}
                className="flex items-center space-x-1 text-sm text-green-600 hover:text-green-700 font-medium"
                disabled={loading}
              >
                <Plus className="w-4 h-4" />
                <span>Add Source</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {sources.map((source, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="url"
                  value={source}
                  onChange={(e) => updateSource(index, e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                  disabled={loading}
                />
                {sources.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSourceField(index)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    disabled={loading}
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Provide credible sources to support your claim
          </p>
        </div>

        {/* IPFS Hash (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IPFS Evidence Hash (Optional)
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
              placeholder="QmXxxx... (IPFS hash)"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              disabled={loading}
            />
            <button
              type="button"
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all flex items-center space-x-2"
              disabled={loading}
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Add additional evidence stored on IPFS
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Required Fee: {microStxToStx(submissionFee)} STX</p>
            <p className="text-xs">Will be deducted on submission</p>
          </div>
          <button
            type="submit"
            disabled={loading || !isWalletConnected()}
            className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                <span>Submit Claim</span>
              </>
            )}
          </button>
        </div>

        {!isWalletConnected() && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 text-center">
              Please connect your wallet to submit a claim
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
