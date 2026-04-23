import React from 'react';
export default function Placeholder({ name }) {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4 gradient-text">{name}</h1>
      <div className="glass p-12 text-center text-secondary">
        This is the placeholder for {name}. Content coming soon.
      </div>
    </div>
  );
}
