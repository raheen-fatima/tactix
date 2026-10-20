import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#FFFFFF',
          border: '2px solid #3D3045',
          borderRadius: '16px',
          color: '#3D3045',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 700,
          boxShadow: '0 4px 0 #E9DCCF',
        },
      }}
    />
  );
}
