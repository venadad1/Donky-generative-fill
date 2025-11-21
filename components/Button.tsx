import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500 shadow-lg shadow-indigo-500/20",
    secondary: "bg-gray-800 hover:bg-gray-700 text-gray-200 focus:ring-gray-500 border border-gray-700",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 focus:ring-red-500 border border-red-500/20",
    ghost: "bg-transparent hover:bg-gray-800 text-gray-400 hover:text-gray-200",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};