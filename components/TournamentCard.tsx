import React from 'react';
import { Link } from 'react-router-dom';
import type { Tournament } from '../types';

interface TournamentCardProps {
  tournament: Tournament;
}

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm10 5H4v8h12V7z" clipRule="evenodd" />
    </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
    </svg>
);


const TournamentCard: React.FC<TournamentCardProps> = ({ tournament }) => {
  const formattedDate = new Date(tournament.startDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link to={`/tournaments/${tournament.id}`} className="block group">
        <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-lg overflow-hidden transform group-hover:-translate-y-1 transition-all duration-300 h-full flex flex-col border border-white/20 group-hover:border-brand-accent">
        <img src={tournament.imageUrl} alt={tournament.name} className="w-full h-48 object-cover" />
        <div className="p-6 flex flex-col flex-grow text-white">
            <h3 className="text-xl font-bold font-heading uppercase tracking-wider mb-2">{tournament.name}</h3>
            <div className="flex items-center text-white/80 mb-2">
                <CalendarIcon className="w-5 h-5 mr-2 text-brand-accent" />
                <span>{formattedDate}</span>
            </div>
            <div className="flex items-center text-white/80">
                <UsersIcon className="w-5 h-5 mr-2 text-brand-accent" />
                <span>{tournament.participantIds.length} / {tournament.maxPlayers} players</span>
            </div>
            <p className="text-sm text-white/60 mt-auto pt-4">Created by: {tournament.creatorName}</p>
        </div>
        </div>
    </Link>
  );
};

export default TournamentCard;