import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-transparent text-white/50">
      <div className="container mx-auto px-4 py-8 text-center border-t border-white/10 mt-16">
        <p>&copy; {new Date().getFullYear()} MatchMate. All rights reserved.</p>
        <p className="text-sm mt-1">Effortless Golf Tournament Management</p>
      </div>
    </footer>
  );
};

export default Footer;
