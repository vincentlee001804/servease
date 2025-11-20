import React from 'react';

const Logo = ({ showTagline = false, showText = true, size = 'md', variant = 'light', className = '' }) => {
  const sizeClasses = {
    sm: {
      icon: 'w-6 h-6',
      text: 'text-base',
      tagline: 'text-xs',
      iconText: 'text-sm'
    },
    md: {
      icon: 'w-8 h-8',
      text: 'text-xl',
      tagline: 'text-sm',
      iconText: 'text-lg'
    },
    lg: {
      icon: 'w-12 h-12',
      text: 'text-2xl',
      tagline: 'text-base',
      iconText: 'text-xl'
    }
  };

  const classes = sizeClasses[size];
  const textColor = variant === 'dark' ? 'text-white' : 'text-gray-900';
  const taglineColor = variant === 'dark' ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon - Using full-size PNG image */}
      <img 
        src="/servease-icon-full.png" 
        alt="ServEase Logo" 
        className={`${classes.icon} object-contain`}
      />
      
      {/* Text and Tagline - Optional */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${classes.text} font-bold ${textColor}`}>
            ServEase
          </span>
          {showTagline && (
            <span className={`${classes.tagline} font-normal ${taglineColor}`}>
              Service Booking Made Easy
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;

