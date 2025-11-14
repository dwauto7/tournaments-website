import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className,
  ...props
}) => {
  const baseClasses =
    'px-6 py-2 rounded-sm font-semibold text-white transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm';

  const variantClasses = {
    primary: 'bg-brand-accent hover:bg-brand-accent-hover focus:ring-brand-accent',
    secondary: 'bg-brand-secondary hover:bg-brand-secondary-hover focus:ring-brand-secondary',
    outline: 'bg-transparent border-2 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white focus:ring-brand-accent'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;