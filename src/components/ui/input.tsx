import * as React from 'react';
import { cn } from '@/src/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-11 w-full rounded-2xl border-2 border-[#E9DCCF] bg-white px-4 py-2 text-sm font-semibold text-[#3D3045] placeholder:font-medium placeholder:text-[#817487]/70 transition-colors focus-visible:outline-none focus-visible:border-[#9B7BFF] focus-visible:ring-4 focus-visible:ring-[#9B7BFF]/15 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
