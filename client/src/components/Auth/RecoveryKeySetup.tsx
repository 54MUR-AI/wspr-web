import React, { useState } from 'react';
import RecoveryKeyService from '../../services/RecoveryKeyService';

interface RecoveryKeySetupProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const RecoveryKeySetup: React.FC<RecoveryKeySetupProps> = ({
  onSuccess,
  onError
}) => {
  const [recoveryKey, setRecoveryKey] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showCopySuccess, setShowCopySuccess] = useState<boolean>(false);
  const recoveryKeyService = RecoveryKeyService.getInstance();

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const result = await recoveryKeyService.generateKey();
      setRecoveryKey(recoveryKeyService.formatRecoveryKey(result.recoveryKey));
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Recovery key generation failed:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(recoveryKey);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recovery Key Setup</h2>

        {!recoveryKey ? (
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-2 px-4 rounded-md text-white font-medium
              ${isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isGenerating ? 'Generating...' : 'Generate Recovery Key'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-center font-mono text-lg break-all">
                {recoveryKey}
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="w-full py-2 px-4 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium"
            >
              {showCopySuccess ? 'Copied!' : 'Copy to Clipboard'}
            </button>

            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
              <h3 className="font-semibold mb-2">Important:</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Store this recovery key in a secure location</li>
                <li>You'll need this key if you lose access to your security key</li>
                <li>This key will only be shown once</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecoveryKeySetup;
