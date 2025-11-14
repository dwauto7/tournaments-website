import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTournamentById, getUsersByIds } from '../services/api';
import type { Tournament, User } from '../types';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import TournamentChat from '../components/TournamentChat';

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

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6.002l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
  );

const TournamentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [participants, setParticipants] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copyStatus, setCopyStatus] = useState('Share');
    const isParticipant = user && tournament?.participantIds.includes(user.id);

    useEffect(() => {
        const fetchTournamentDetails = async () => {
            if (!id) {
                setError('Tournament ID is missing.');
                setLoading(false);
                return;
            };
            setLoading(true);
            setError('');
            try {
                const tournamentData = await getTournamentById(id);
                if (!tournamentData) {
                    throw new Error('Tournament not found.');
                }
                setTournament(tournamentData);
                
                if (tournamentData.participantIds.length > 0) {
                    const participantData = await getUsersByIds(tournamentData.participantIds);
                    setParticipants(participantData.sort((a,b) => (a.handicap ?? 99) - (b.handicap ?? 99)));
                }
                
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };
        fetchTournamentDetails();
    }, [id]);
    
    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Share'), 2000);
        }).catch(() => {
            setError('Failed to copy link.');
        });
    }

    if (loading) return <p className="text-center text-lg text-white/80">Loading tournament details...</p>;
    if (error) return <p className="text-center text-red-500">{error}</p>;
    if (!tournament) return <p className="text-center text-white/80">Tournament could not be found.</p>;

    const formattedDate = new Date(tournament.startDate).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="max-w-5xl mx-auto space-y-8">
             <Link to="/tournaments" className="inline-flex items-center gap-2 text-brand-accent hover:text-brand-light transition-colors font-semibold">
                <ArrowLeftIcon className="w-5 h-5" />
                Back to My Tournaments
            </Link>

            <div className="bg-white/10 backdrop-blur-md rounded-lg shadow-xl overflow-hidden text-white">
                <img src={tournament.imageUrl} alt={tournament.name} className="w-full h-64 object-cover" />
                <div className="p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div>
                            <h1 className="text-4xl font-bold font-heading uppercase tracking-wider">{tournament.name}</h1>
                            <p className="text-sm text-white/60 mt-2">Created by: {tournament.creatorName}</p>
                        </div>
                        <Button onClick={handleShare} variant="outline" className="flex items-center gap-2 flex-shrink-0">
                            <ShareIcon className="w-5 h-5" />
                            {copyStatus}
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-white/80 mt-6 border-t border-white/20 pt-6">
                        <div className="flex items-center">
                            <CalendarIcon className="w-6 h-6 mr-3 text-brand-accent" />
                            <span className="text-lg">{formattedDate}</span>
                        </div>
                        <div className="flex items-center">
                            <UsersIcon className="w-6 h-6 mr-3 text-brand-accent" />
                            <span className="text-lg">{tournament.participantIds.length} / {tournament.maxPlayers} players</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content-wrapper text-brand-dark p-8 rounded-lg shadow-xl">
                <h2 className="text-3xl font-bold font-heading uppercase tracking-wider mb-6">Participants</h2>
                {participants.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider border-b-2 border-gray-200">Player Name</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider text-right border-b-2 border-gray-200">Handicap</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {participants.map(player => (
                                    <tr key={player.id}>
                                        <td className="p-4 whitespace-nowrap font-medium text-gray-800">{player.fullName}</td>
                                        <td className="p-4 whitespace-nowrap font-semibold text-gray-800 text-right">{player.handicap ?? 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-600">No participants have joined yet.</p>
                )}
            </div>

            {isParticipant && user && (
                 <TournamentChat tournamentId={tournament.id} user={user} />
            )}
        </div>
    );
};

export default TournamentDetailPage;