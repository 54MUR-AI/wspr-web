import React, { useEffect, useState } from 'react';
import { BrowserCompatibilityService } from '../../services/BrowserCompatibilityService';

interface BrowserCompatibilityProps {
  onCompatibilityCheck: (isCompatible: boolean) => void;
  children: React.ReactNode;
}

export const BrowserCompatibility: React.FC<BrowserCompatibilityProps> = ({
  onCompatibilityCheck,
  children
}) => {
  const [browserInfo, setBrowserInfo] = useState<any>(null);
  const [showWarning, setShowWarning] = useState(false);
  const compatibilityService = BrowserCompatibilityService.getInstance();

  useEffect(() => {
    const info = compatibilityService.getBrowserInfo();
    setBrowserInfo(info);
    onCompatibilityCheck(info.isSupported);
    setShowWarning(!info.isSupported || !info.features.webAuthn);
  }, [onCompatibilityCheck]);

  if (!browserInfo) {
    return null;
  }

  if (!showWarning) {
    return <>{children}</>;
  }

  const upgradeInstructions = compatibilityService.getUpgradeInstructions(browserInfo);
  const alternativeMethods = compatibilityService.getAlternativeAuthMethods(browserInfo);

  return (
    <div className="space-y-4">
      {/* Compatibility Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Browser Compatibility Warning
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>{upgradeInstructions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Support Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Feature Support Status
        </h4>
        <ul className="space-y-2">
          {Object.entries(browserInfo.features).map(([feature, supported]) => (
            <li key={feature} className="flex items-center text-sm">
              <span className={`w-2 h-2 rounded-full mr-2 ${supported ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-gray-600">
                {feature.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className={`ml-2 ${supported ? 'text-green-600' : 'text-red-600'}`}>
                {supported ? 'Supported' : 'Not Supported'}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Alternative Methods */}
      {alternativeMethods.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Alternative Authentication Methods
          </h4>
          <ul className="space-y-2">
            {alternativeMethods.map((method) => (
              <li key={method} className="flex items-center text-sm">
                <svg className="h-4 w-4 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-600">
                  {method.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Continue with Limited Functionality */}
      {!browserInfo.features.webAuthn && browserInfo.isSupported && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};
