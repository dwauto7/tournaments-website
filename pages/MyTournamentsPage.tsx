import React, { useState, useEffect, useCallback } from 'react';
import { getMyTournaments } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Tournament } from '../types';
import TournamentCard from '../components/TournamentCard';

enum Tab {
  Created = 'CREATED',
  Joined = 'JOINED',
}

const MyTournamentsPage: React.FC = () => {
  const [created, setCreated] = useState<Tournament[]>([]);
  const [joined, setJoined] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Created);
  const { user } = useAuth();

  const fetchTournaments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { created: createdTournaments, joined: joinedTournaments } = await getMyTournaments(user.id);
      setCreated(createdTournaments);
      setJoined(joinedTournaments);
    } catch (error) {
      console.error("Failed to fetch user's tournaments:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);
  
  const TabButton: React.FC<{tab: Tab, label: string, count: number}> = ({tab, label, count}) => {
    const isActive = activeTab === tab;
    return (
        <button
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-lg font-semibold uppercase tracking-wider transition-colors relative ${
                isActive 
                ? 'text-brand-accent' 
                : 'text-white/60 hover:text-white'
            }`}
        >
            {label} <span className={`text-xs rounded-full px-2 py-0.5 ml-2 transition-colors ${isActive ? 'bg-brand-accent text-white' : 'bg-white/20 text-white/80'}`}>{count}</span>
            {isActive && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-accent"></div>}
        </button>
    )
  }

  const renderTournamentList = (tournaments: Tournament[], type: string) => {
    if (tournaments.length === 0) {
        return <p className="text-center text-gray-400 mt-12 text-lg">You haven't {type} any tournaments yet.</p>;
    }
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-6">
            {tournaments.map(tournament => (
                <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
        </div>
    )
  }

  if (loading) {
    return <p className="text-center text-white/80">Loading your tournaments...</p>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold font-heading text-brand-light text-center uppercase tracking-wider mb-10">My Tournaments</h1>
      <div className="border-b border-white/20 flex justify-center">
        <TabButton tab={Tab.Created} label="Created by Me" count={created.length}/>
        <TabButton tab={Tab.Joined} label="Joined" count={joined.length}/>
      </div>
      
      <div className="py-8">
        {activeTab === Tab.Created && renderTournamentList(created, 'created')}
        {activeTab === Tab.Joined && renderTournamentList(joined, 'joined')}
      </div>
    </div>
  );
};

export default MyTournamentsPage;