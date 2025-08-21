
import React, { useState } from 'react';
import { JsonFrame } from '../types';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonData: JsonFrame[];
}

const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, jsonData }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(jsonData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy: ', err));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Published Test JSON</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
        </div>
        <textarea
          readOnly
          value={jsonString}
          className="w-full flex-grow p-3 border border-gray-300 rounded-md text-sm bg-gray-50 font-mono resize-none"
          rows={15}
        />
        <div className="mt-4 flex justify-end space-x-3">
          <button
            onClick={handleCopy}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                        ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
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

export default PublishModal;
    