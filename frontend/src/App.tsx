import React from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MediaGrid from './components/MediaGrid';

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex">
      <Sidebar />
      <main className="flex-1">
        <Topbar />
        <MediaGrid />
      </main>
    </div>
  );
}

export default App;
