import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px-200px)] px-4 py-8 md:py-12 bg-[#141414]">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
