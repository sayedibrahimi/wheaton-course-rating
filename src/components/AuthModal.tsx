// src/components/AuthModal.tsx
// Purpose: A modal that prompts the user to sign in or sign up to continue with an action
// Description: This component is used to display a modal when a user tries to perform an action that requires authentication, such as writing a review, marking a review as helpful, or reporting a review. The modal provides options for the user to sign in, sign up, or continue as a guest. It also handles the logic for redirecting the user to the appropriate authentication page based on the action and callback URL.
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  callbackUrl: string;
  action: 'review' | 'helpful' | 'report'; // Different actions might have different messages
}

export default function AuthModal({ isOpen, onClose, callbackUrl, action }: AuthModalProps) {
  const router = useRouter();
  
  // Close the modal when ESC is pressed
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Get the appropriate message based on the action
  const getMessage = () => {
    switch (action) {
      case 'review':
        return 'You need to sign in to write a review';
      case 'helpful':
        return 'You need to sign in to mark reviews as helpful';
      case 'report':
        return 'You need to sign in to report reviews';
      default:
        return 'You need to sign in to continue';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in Required</h3>
          <p className="text-gray-600">{getMessage()}</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
          
          <button
            onClick={() => router.push(`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Create an Account
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}