
import React, { useState, useEffect, useCallback } from 'react';
import { InteractiveBoxData, BoxType, InputBox, Hotspot } from '../types';
import { TrashIcon } from './icons';

interface BoxEditorFormProps {
  box: InteractiveBoxData | null;
  onUpdateBox: (id: string, updates: Partial<InteractiveBoxData>) => void;
  onDeleteBox: (id: string) => void;
  disabled?: boolean;
}

const BoxEditorForm: React.FC<BoxEditorFormProps> = ({ box, onUpdateBox, onDeleteBox, disabled }) => {
  const [label, setLabel] = useState('');
  const [expectedValue, setExpectedValue] = useState('');

  useEffect(() => {
    if (box) {
      setLabel(box.label);
      if (box.type === BoxType.INPUT) {
        setExpectedValue((box as InputBox).expected);
      } else {
        setExpectedValue('');
      }
    } else {
      setLabel('');
      setExpectedValue('');
    }
  }, [box]);

  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(e.target.value);
    if (box) {
      onUpdateBox(box.id, { label: e.target.value });
    }
  }, [box, onUpdateBox]);

  const handleExpectedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setExpectedValue(e.target.value);
    if (box && box.type === BoxType.INPUT) {
      onUpdateBox(box.id, { expected: e.target.value } as Partial<InputBox>);
    }
  }, [box, onUpdateBox]);

  if (!box) {
    return <div className="p-4 text-sm text-gray-500">Select a box to edit its properties.</div>;
  }

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Edit {box.type === BoxType.HOTSPOT ? 'Hotspot' : 'Input Field'}
        </h3>
        <button
          onClick={() => onDeleteBox(box.id)}
          disabled={disabled}
          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Delete Box"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
      <div>
        <label htmlFor="box-label" className="block text-sm font-medium text-gray-700 mb-1">
          Label
        </label>
        <input
          type="text"
          id="box-label"
          value={label}
          onChange={handleLabelChange}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
          placeholder="e.g., Submit Button"
        />
      </div>
      {box.type === BoxType.INPUT && (
        <div>
          <label htmlFor="box-expected" className="block text-sm font-medium text-gray-700 mb-1">
            Expected Value
          </label>
          <input
            type="text"
            id="box-expected"
            value={expectedValue}
            onChange={handleExpectedChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed bg-white"
            placeholder="e.g., Brent Crude"
          />
        </div>
      )}
       <p className="text-xs text-gray-500">ID: {box.id.substring(0,8)}...</p>
    </div>
  );
};

export default BoxEditorForm;
    