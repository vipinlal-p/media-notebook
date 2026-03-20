import React from 'react';

const Topbar = () => {
  return (
    <div className="h-16 bg-gray-800 flex items-center px-4">
      <input
        type="text"
        placeholder="Search..."
        className="bg-gray-700 text-white rounded-lg px-4 py-2 w-full"
      />
    </div>
  );
};

export default Topbar;
