import React, { useState, useCallback } from 'react';
import { LoadingSpinnerIcon, CopyIcon, CheckIcon } from './icons';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPublishing: boolean;
  shareLink: string | null;
  error: string | null;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, isPublishing, shareLink, error }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Failed to copy link:", err);
    });
  }, [shareLink]);

  if (!isOpen) return null;

  const renderContent = () => {
    if (isPublishing) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4">
          <LoadingSpinnerIcon className="w-12 h-12 text-blue-600" />
          <p className="text-lg text-slate-600">Publishing to Google Drive...</p>
          <p className="text-sm text-slate-500">Please follow any prompts to sign in.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-700 mb-2">Publishing Failed</h3>
          <p className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">{error}</p>
        </div>
      );
    }

    if (shareLink) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-700 text-center">Successfully Published!</h3>
          <p className="text-sm text-slate-600">Your test package has been uploaded to Google Drive. Anyone with the link can view it.</p>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-gray-50 font-mono"
              aria-label="Google Drive share link"
            />
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center px-3 py-2 w-28 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                          ${copied ? 'bg-green-600 text-white focus:ring-green-500' : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'}`}
              aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
            >
              {copied ? <CheckIcon className="w-5 h-5 mr-1" /> : <CopyIcon className="w-5 h-5 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" aria-modal="true" role="dialog" aria-labelledby="share-modal-title">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 id="share-modal-title" className="text-xl font-semibold text-gray-800">Publish Test</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none" aria-label="Close modal">&times;</button>
        </div>
        <div className="min-h-[120px] flex items-center justify-center">
          {renderContent()}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
