import React, { useState } from 'react';
import { CheckCircle } from 'lucide-react';

const FactVerificationApp = () => {
  const [activeTab, setActiveTab] = useState('submit');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">FactStack</h1>
                <p className="text-sm text-gray-600">Decentralized Truth Verification on Stacks</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">STX Balance: 10.5</span>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-purple-600">U</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm mb-8">
          {[
            { id: 'submit', label: 'Submit Claim' },
            { id: 'verify', label: 'Verify Claims' },
            { id: 'explore', label: 'Explore Truth' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Placeholders */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {activeTab === 'submit' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Submit a Fact Claim</h2>
              <p className="text-gray-600">Claim submission form coming soon...</p>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Claims</h2>
              <p className="text-gray-600">Verification interface coming soon...</p>
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Explore Truth</h2>
              <p className="text-gray-600">Truth explorer coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactVerificationApp;
