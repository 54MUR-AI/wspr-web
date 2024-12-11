import React, { useState } from 'react';
import RecoveryKeyService from '../../services/RecoveryKeyService';

interface RecoveryKeyLoginProps {
  onSuccess?: (token: string) => void;
  onError?: (error: Error) => void;
}

const RecoveryKeyLogin: React.FC<RecoveryKeyLoginProps> = ({
  onSuccess,
  onError
}) => {
  const [recoveryKey, setRecoveryKey] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const recoveryKeyService = RecoveryKeyService.getInstance();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!recoveryKey.trim()) {
      setError('Please enter your recovery key');
      return;
    }

    try {
      setIsVerifying(true);
      const cleanKey = recoveryKeyService.cleanRecoveryKey(recoveryKey);
      const result = await recoveryKeyService.verifyKey(cleanKey);
      
      if (result.token && onSuccess) {
        onSuccess(result.token);
      }
    } catch (error) {
      console.error('Recovery key verification failed:', error);
      setError('Invalid recovery key');
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRecoveryKey(value);
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recovery Key Login</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="recoveryKey"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Enter Recovery Key
            </label>
            <input
              id="recoveryKey"
              type="text"
              value={recoveryKey}
              onChange={handleKeyChange}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className={`w-full px-3 py-2 border rounded-md
                ${error ? 'border-red-500' : 'border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={isVerifying}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className={`w-full py-2 px-4 rounded-md text-white font-medium
              ${isVerifying
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }`}
          >
            {isVerifying ? 'Verifying...' : 'Login with Recovery Key'}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Use the recovery key that was generated during account setup.
        </p>
      </div>
    </div>
  );
};

export default RecoveryKeyLogin;
