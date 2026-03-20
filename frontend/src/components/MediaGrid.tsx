import React from 'react';

const MediaGrid = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Media</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Placeholder for media items */}
        <div className="bg-gray-700 h-48 rounded-lg"></div>
        <div className="bg-gray-700 h-48 rounded-lg"></div>
        <div className="bg-gray-700 h-48 rounded-lg"></div>
        <div className="bg-gray-700 h-48 rounded-lg"></div>
      </div>
    </div>
  );
};

export default MediaGrid;
