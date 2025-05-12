import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/utils';

export const GradientButton = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "relative inline-flex items-center justify-center px-6 py-3 overflow-hidden text-[#292728] font-medium transition-all rounded-lg group",
          "bg-gradient-to-br from-[#eaaa07] to-[#d69c07] hover:from-[#eaaa07] hover:to-[#c08b06]",
          "shadow-md hover:shadow-lg",
          "focus:ring-4 focus:ring-[#eaaa07]/30 focus:outline-none",
          "active:scale-[0.98] active:shadow-inner",
          "transform-gpu",
          className
        )}
        ref={ref}
        {...props}
      >
        <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent to-[#292728] opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
        <span className="relative">{children}</span>
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';

GradientButton.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
}; 