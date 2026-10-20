import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-extrabold tracking-tight border-2 border-[#3D3045] border-b-4 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7BFF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FFF7ED] hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2 disabled:pointer-events-none disabled:opacity-45 disabled:hover:translate-y-0 cursor-pointer shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[#9B7BFF] text-white hover:bg-[#8A66FA]',
        secondary: 'bg-[#FFD166] text-[#3D3045] hover:bg-[#FFC645]',
        mint: 'bg-[#8BDCC0] text-[#3D3045] hover:bg-[#76D4B3]',
        coral: 'bg-[#FF8E9E] text-[#3D3045] hover:bg-[#FF798C]',
        sky: 'bg-[#70C7F2] text-[#3D3045] hover:bg-[#58BCEE]',
        outline: 'bg-white text-[#3D3045] border-[#3D3045] hover:bg-[#FFF0DF]',
        ghost:
          'border-transparent border-b-2 text-[#817487] hover:text-[#3D3045] hover:bg-[#FFF0DF] hover:border-[#E9DCCF]',
        destructive: 'bg-[#F27676] text-white hover:bg-[#EC5E5E]',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 px-3.5 text-xs rounded-xl',
        lg: 'h-12 px-7 text-base rounded-2xl',
        icon: 'h-11 w-11 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';
