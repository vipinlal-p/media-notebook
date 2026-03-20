import React from 'react';

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 p-4">
      <h2 className="text-xl font-bold mb-4">Media Notebook</h2>
      <nav>
        <ul>
          <li className="mb-2">
            <a href="#" className="text-gray-300 hover:text-white">
              Collections
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="text-gray-300 hover:text-white">
              Tags
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="text-gray-300 hover:text-white">
              Favorites
            </a>
          </li>
          <li className="mb-2">
            <a href="#" className="text-gray-300 hover:text-white">
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
