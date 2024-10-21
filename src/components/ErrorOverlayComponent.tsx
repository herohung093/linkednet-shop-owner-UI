import React from 'react';


interface ErrorMessageProps {
  message?: string;
}

const ErrorOverlayComponent: React.FC<ErrorMessageProps> = ({ message }) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-lg">{message || "Please try again later."}</p>
      </div>
    </div>
  );
};

export default ErrorOverlayComponent;