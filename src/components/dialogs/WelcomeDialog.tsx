import React from 'react';
import { useNavigate } from 'react-router-dom';

interface WelcomeDialogProps {
  open: boolean;
  onClose: () => void;
}

const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();

  const handleCreateStore = () => {
    onClose();
    navigate('/create-store');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
      
      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-xl transition-all">
          {/* Logo and Title */}
          <div className="mb-6 flex items-center justify-center space-x-3">
            <h3 className="text-2xl font-semibold leading-6 text-gray-900">
              Welcome to LinkedNet!
            </h3>
          </div>

          {/* Content */}
          <div className="mt-4">
            <p className="text-center text-sm leading-6 text-gray-500">
              You have just created an account. There is no store associated with
              this account yet. Please create a store to get started.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleCreateStore}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Create Your Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDialog;