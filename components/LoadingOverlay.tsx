
import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-400"></div>
      <p className="text-white text-xl mt-4 text-center px-4">{message}</p>
    </div>
  );
};

export default LoadingOverlay;
