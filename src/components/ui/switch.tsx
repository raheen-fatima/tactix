import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/src/utils/cn';

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      'peer inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded-full border-2 border-[#3D3045] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B7BFF] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#53C99A] data-[state=unchecked]:bg-[#FFF0DF]',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full border-2 border-[#3D3045] bg-white transition-transform data-[state=checked]:translate-x-6 data-[state=unchecked]:translate-x-0.5'
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;
