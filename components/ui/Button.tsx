import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-mono font-medium rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-aou-green/50 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  
  const variants = {
    primary: "bg-aou-green text-aou-darker hover:bg-[#00e63a] hover:shadow-[0_0_15px_rgba(0,255,65,0.4)] border border-transparent",
    secondary: "bg-aou-panel text-aou-green border border-aou-green hover:bg-aou-green/10 hover:shadow-[0_0_10px_rgba(0,255,65,0.2)]",
    danger: "bg-red-600/10 text-red-500 border border-red-600 hover:bg-red-600 hover:text-white",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5"
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-5 py-2 text-sm",
    lg: "px-8 py-3 text-base"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};
