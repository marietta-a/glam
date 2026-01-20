import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  return (
    <div className={`relative flex items-center justify-center ${sizes[size]} ${className}`}>
      {/* Subtle outer decorative ring to integrate the logo into the UI */}
      <div className="absolute inset-0 rounded-full border border-[#26A69A]/10" />
      
      {/* Your exact Logo Image */}
      <img 
        src="./logo.png" 
        alt="GlamAI Logo" 
        className="w-full h-full object-contain drop-shadow-sm"
        onError={(e) => {
          // Fallback just in case the path is different, but ideally ./logo.png is used
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
};

export default BrandLogo;