import React from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function AIButton({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 ${
        isOpen
          ? 'bg-red-500 hover:bg-red-600 text-white md:hidden'
          : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
      }`}
      title={isOpen ? 'Close Chat' : 'Open AI Chat'}
    >
      {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
    </button>
  );
}
