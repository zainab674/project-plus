import React, { useState } from "react";

const AnimatedUploadButton = () => {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleUpload = () => {
    setLoading(true);

    // Simulate a 2-second upload process
    setTimeout(() => {
      setLoading(false);
      setCompleted(true);

      // Reset button state after 2 seconds
      setTimeout(() => {
        setCompleted(false);
      }, 2000);
    }, 2000);
  };

  return (
    <button
      className={`relative w-48 h-12 rounded-full text-white font-medium overflow-hidden ${
        loading || completed
          ? "bg-gray-500 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
      onClick={handleUpload}
      disabled={loading || completed}
    >
      {/* Progress bar container */}
      {loading && (
        <div className="absolute inset-0 bg-gray-300">
          <div className="h-full bg-green-500 animate-progress"></div>
        </div>
      )}

      {/* Content inside button */}
      <div
        className={`relative flex items-center justify-center h-full transition-opacity duration-300 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Default Text */}
        {!completed && !loading && <span>Upload Now</span>}

        {/* Completed Icon */}
        {completed && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            width="24"
            height="24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        )}
      </div>

      {/* Loading Spinner */}
      {loading && (
        <svg
          className="absolute inset-0 m-auto animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          width="24"
          height="24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="white"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="white"
            d="M4 12a8 8 0 018-8v4a4 4 0 100 8H4z"
          ></path>
        </svg>
      )}
    </button>
  );
};

export default AnimatedUploadButton;
