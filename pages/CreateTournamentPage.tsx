import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createTournament } from '../services/api';
import Button from '../components/Button';
import Input from '../components/Input';

const CreateTournamentPage: React.FC = () => {
  const [name, setName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        setError('You must be logged in to create a tournament.');
        return;
    }
    if (!name || !maxPlayers || !startDate || !startTime) {
        setError('Please fill out all fields.');
        return;
    }

    setSubmitting(true);
    setError('');
    
    try {
        const fullDateTime = new Date(`${startDate}T${startTime}`).toISOString();
        await createTournament(name, parseInt(maxPlayers, 10), fullDateTime, user);
        // On success, redirect to the My Tournaments page
        navigate('/tournaments');
    } catch (apiError) {
        setError((apiError as Error).message || 'An unexpected error occurred.');
        setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <div className="content-wrapper text-brand-dark p-8 md:p-12 rounded-lg shadow-2xl">
            <h1 className="text-3xl font-bold font-heading text-center uppercase tracking-wider mb-2">Create New Tournament</h1>
            <p className="text-center text-gray-500 mb-8">Fill in the details below to get started.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input 
                    id="tournamentName"
                    label="Tournament Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <Input 
                    id="maxPlayers"
                    label="Total Number of Players"
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    min="2"
                    required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input 
                        id="startDate"
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                    />
                    <Input 
                        id="startTime"
                        label="Start Time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                    />
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <Button type="submit" disabled={submitting} className="w-full py-3 text-lg">
                    {submitting ? 'Creating...' : 'Create Tournament'}
                </Button>
            </form>
        </div>
    </div>
  );
};

export default CreateTournamentPage;