
import React from 'react';
import { InteractiveBoxData, BoxType, InputBox } from '../types';
import BoxEditorForm from './BoxEditorForm';
import { PlusCircleIcon } from './icons';

interface ControlsPanelProps {
  selectedBox: InteractiveBoxData | null;
  onAddBox: (type: BoxType) => void;
  onUpdateBox: (id: string, updates: Partial<InteractiveBoxData>) => void;
  onDeleteBox: (id: string) => void;
  disabled?: boolean;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ selectedBox, onAddBox, onUpdateBox, onDeleteBox, disabled }) => {
  return (
    <div className="w-full md:w-80 lg:w-96 p-4 space-y-6 bg-slate-50 rounded-lg shadow-lg">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Controls</h2>
        <div className="space-y-2">
          <button
            onClick={() => onAddBox(BoxType.HOTSPOT)}
            disabled={disabled}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Add Hotspot
          </button>
          <button
            onClick={() => onAddBox(BoxType.INPUT)}
            disabled={disabled}
            className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Add Input Field
          </button>
        </div>
      </div>
      
      <BoxEditorForm 
        box={selectedBox} 
        onUpdateBox={onUpdateBox} 
        onDeleteBox={onDeleteBox}
        disabled={disabled || !selectedBox}
      />
    </div>
  );
};

export default ControlsPanel;
    