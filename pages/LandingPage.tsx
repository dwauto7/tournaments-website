import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPublicTournaments, joinTournament } from '../services/api';
import type { Tournament } from '../types';
import TournamentCard from '../components/TournamentCard';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../hooks/useAuth';

const Feature: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="text-center p-6">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-accent text-white mx-auto mb-5">
            {icon}
        </div>
        <h3 className="text-xl font-bold font-heading uppercase tracking-wider text-brand-dark">{title}</h3>
        <p className="mt-2 text-base text-gray-600">{description}</p>
    </div>
);

const LandingPage: React.FC = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [tournamentId, setTournamentId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        const data = await getPublicTournaments();
        setTournaments(data);
      } catch (error) {
        console.error("Failed to fetch tournaments:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);
  
  const handleJoinTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        navigate('/login');
        return;
    }
    if (!tournamentId) {
        setJoinError('Please enter a Tournament ID.');
        return;
    }
    setJoinError('');
    setJoinSuccess('');
    try {
        await joinTournament(tournamentId, user);
        setJoinSuccess(`Successfully joined tournament ${tournamentId}!`);
        setTournamentId('');
        setTimeout(() => navigate('/tournaments'), 2000);
    } catch (error) {
        setJoinError((error as Error).message || 'Failed to join tournament.');
    }
  }

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <div className="text-center py-20 md:py-32">
          <h1 className="text-5xl md:text-7xl font-bold font-heading uppercase tracking-wider text-brand-light mb-4">MatchD</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto text-brand-light/80 mb-8">The Smart Way to Manage Golf Tournaments. Create, manage, and join events with ease.</p>
          <Button onClick={() => navigate('/create')} className="text-lg px-8 py-3">
            Create a Tournament
          </Button>
      </div>
      
      {/* Join & Features Sections */}
      <div className="content-wrapper text-brand-dark p-8 md:p-12 rounded-lg shadow-2xl">
        <div className="grid md:grid-cols-5 gap-12 items-center">
            {/* Join Tournament Section */}
            <div className="md:col-span-2">
                <h2 className="text-3xl font-bold font-heading uppercase tracking-wider text-center mb-4">Join a Tournament</h2>
                <p className="text-center text-gray-600 mb-6">Have an ID? Enter it below to join the fun.</p>
                <form onSubmit={handleJoinTournament} className="flex flex-col gap-4">
                    <Input 
                        id="tournamentId"
                        label="Tournament ID"
                        type="text"
                        placeholder="Enter Tournament ID"
                        value={tournamentId}
                        onChange={(e) => setTournamentId(e.target.value)}
                    />
                    <Button type="submit" className="w-full py-3">Join Now</Button>
                </form>
                {joinError && <p className="text-red-500 text-sm mt-2 text-center">{joinError}</p>}
                {joinSuccess && <p className="text-green-600 text-sm mt-2 text-center">{joinSuccess}</p>}
            </div>

            {/* Vertical Divider */}
            <div className="hidden md:block w-px bg-gray-300 h-full self-stretch mx-auto"></div>

            {/* Single Feature */}
            <div className="md:col-span-2 text-center">
                 <Feature 
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    title="Automated Reminders"
                    description="Automatic SMS reminders are sent to all participants before the event, so no one misses their tee time."
                />
            </div>
        </div>
      </div>


      {/* Featured Tournaments Section */}
      <div>
        <h2 className="text-4xl font-bold font-heading text-center text-brand-light uppercase tracking-wider mb-10">Upcoming Tournaments</h2>
        {loading ? (
          <p className="text-center text-white/80">Loading tournaments...</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
