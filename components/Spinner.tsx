import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 animate-in fade-in duration-300">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
      <p className="text-gray-400 text-sm font-medium animate-pulse">
        Dreaming up new pixels...
      </p>
    </div>
  );
};