import React from 'react';
import { InteractiveBoxData, BoxType, InputBox } from '../types';
import BoxEditorForm from './BoxEditorForm';

interface ControlsPanelProps {
  selectedBox: InteractiveBoxData | null;
  onUpdateBox: (id: string, updates: Partial<InteractiveBoxData>) => void;
  onDeleteBox: (id: string) => void;
  disabled?: boolean;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ selectedBox, onUpdateBox, onDeleteBox, disabled }) => {
  return (
    <div className="w-full md:w-80 lg:w-96 p-4 space-y-6 bg-slate-50 rounded-lg shadow-lg">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Controls</h2>
        <div className="p-3 bg-slate-200 rounded-md text-sm text-slate-600 space-y-2">
            <p><span className="font-semibold">Add Hotspot:</span> Click anywhere on the frame.</p>
            <p><span className="font-semibold">Add Input Field:</span> Click and drag on the frame.</p>
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