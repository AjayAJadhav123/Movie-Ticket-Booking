import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import AuthLayout from '../components/AuthLayout';

export default function SignUpPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">QuickShow</h1>
          <p className="text-slate-600 text-sm md:text-base">Create your account to start booking</p>
        </div>

        {/* Clerk Sign Up Component */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 md:p-8 shadow-xl">
          <SignUp 
            routing="path" 
            path="/sign-up"
            redirectUrl="/"
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent border-0 shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-slate-900 font-semibold rounded-lg py-2.5 transition-all",
                formFieldInput: "bg-slate-100 border border-slate-300 text-slate-900 rounded-lg py-2 px-4 focus:border-indigo-500 focus:outline-none transition",
                formFieldLabel: "text-slate-700 text-sm font-medium",
                dividerLine: "bg-slate-700",
                dividerText: "text-slate-600 text-xs",
                socialButtonsBlockButton: "bg-slate-100 border border-slate-300 text-slate-900 hover:bg-slate-700 rounded-lg py-2 transition-all",
                socialButtonsBlockButtonText: "font-semibold",
                footerActionLink: "text-indigo-600 hover:text-indigo-700 transition",
                footerAction: "text-slate-600",
                formResendCodeLink: "text-indigo-600 hover:text-indigo-700 transition",
              }
            }}
          />
        </div>

        {/* Help Text */}
        <p className="text-center text-slate-600 text-xs md:text-sm">
          By signing up, you agree to our Terms & Conditions and Privacy Policy
        </p>
      </div>
    </AuthLayout>
  );
}

