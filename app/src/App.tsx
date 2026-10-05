import { RouterProvider } from 'react-router-dom';
import { Toaster, TooltipProvider } from '@/components/ui';
import { router } from './routes';

export default function App() {
  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={200}>
      <RouterProvider router={router} />
      <Toaster />
    </TooltipProvider>
  );
}
