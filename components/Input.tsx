import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-4 py-3 bg-white/50 border-2 border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-0 focus:border-brand-accent transition-colors text-brand-dark placeholder-gray-500 ${className}`}
        {...props}
      />
    </div>
  );
};

export default Input;