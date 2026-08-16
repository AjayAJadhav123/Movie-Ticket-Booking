import React from 'react';

export default function Spinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-slate-700 border-t-indigo-600 rounded-full animate-spin`}
    ></div>
  );
}
