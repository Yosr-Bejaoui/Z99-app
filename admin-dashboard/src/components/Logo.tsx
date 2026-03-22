import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 40, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10a37f" />
          <stop offset="100%" stopColor="#19c37d" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" rx="20" fill="url(#logoGradient)" />
      <path d="M50 20L65 35L50 50L35 35L50 20Z" fill="white" fillOpacity="0.9" />
      <path d="M50 50L65 65L50 80L35 65L50 50Z" fill="white" fillOpacity="0.7" />
      <path d="M30 35L45 50L30 65L15 50L30 35Z" fill="white" fillOpacity="0.8" />
      <path d="M70 35L85 50L70 65L55 50L70 35Z" fill="white" fillOpacity="0.8" />
    </svg>
  );
};

export default Logo;
