import React from 'react';
import { FiPause, FiPlay } from 'react-icons/fi';

const Timer = ({ timeRemaining, isPaused, onPause }) => {
  const formatTime = (seconds) => {
    if (!seconds || seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (seconds) => {
    if (!seconds) return 'text-red-600';
    if (seconds <= 300) return 'text-red-600'; // 5 minutes or less
    if (seconds <= 600) return 'text-yellow-600'; // 10 minutes or less
    return 'text-gray-900';
  };

  const getProgressPercentage = () => {
    if (!timeRemaining) return 0;
    // Assuming exam duration is stored in minutes, convert to seconds
    const totalTime = 180 * 60; // Default 3 hours, should be passed as prop
    return ((totalTime - timeRemaining) / totalTime) * 100;
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <button
          onClick={onPause}
          className="p-1 rounded hover:bg-gray-100 transition-colors duration-200"
        >
          {isPaused ? (
            <FiPlay className="w-4 h-4 text-red-600" />
          ) : (
            <FiPause className="w-4 h-4 text-red-600" />
          )}
        </button>
        <span className={`font-mono font-bold text-lg ${getTimeColor(timeRemaining)}`}>
          {formatTime(timeRemaining)}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="w-16 bg-gray-200 rounded-full h-1">
        <div 
          className="bg-red-600 h-1 rounded-full transition-all duration-300"
          style={{ width: `${getProgressPercentage()}%` }}
        ></div>
      </div>
      
      {isPaused && (
        <span className="text-xs text-red-600 font-medium">
          PAUSED
        </span>
      )}
    </div>
  );
};

export default Timer; 