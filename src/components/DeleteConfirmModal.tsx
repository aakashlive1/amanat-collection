import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  itemDetails?: string;
  warningText: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  itemName,
  itemDetails,
  warningText,
  onClose,
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-red-600 font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-base text-slate-900 font-black">{title}</span>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-bold text-red-900">
              Are you sure you want to delete:
            </p>
            <p className="text-sm font-extrabold text-slate-900 mt-1">
              {itemName}
            </p>
            {itemDetails && (
              <p className="text-xs text-slate-600 font-medium mt-0.5 font-mono">
                {itemDetails}
              </p>
            )}
          </div>

          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            {warningText}
          </p>

          <div className="flex items-center space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="w-1/2 py-2.5 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md shadow-red-200 transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
