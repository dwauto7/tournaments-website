import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getTournamentMessages, sendTournamentMessage } from '../services/api';
import type { ChatMessage, User } from '../types';
import Button from './Button';
import Input from './Input';

interface TournamentChatProps {
  tournamentId: string;
  user: User;
}

const ChatBubble: React.FC<{ message: ChatMessage; isCurrentUser: boolean }> = ({ message, isCurrentUser }) => {
    const alignment = isCurrentUser ? 'justify-end' : 'justify-start';
    const colors = isCurrentUser 
        ? 'bg-brand-accent text-white' 
        : 'bg-gray-200 text-brand-dark';
    
    const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`flex ${alignment} mb-4`}>
            <div className={`max-w-md rounded-lg px-4 py-2 shadow-sm`}>
                 <div className={`${colors} rounded-lg px-4 py-2`}>
                    {!isCurrentUser && (
                        <p className="text-xs font-bold text-brand-secondary">{message.userName.split(' ')[0]}</p>
                    )}
                    <p className="text-md">{message.message}</p>
                 </div>
                 <p className={`text-xs mt-1 text-gray-400 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                    {formattedTime}
                </p>
            </div>
        </div>
    );
};

const TournamentChat: React.FC<TournamentChatProps> = ({ tournamentId, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const fetchedMessages = await getTournamentMessages(tournamentId);
      setMessages(fetchedMessages);
    } catch (err) {
      setError('Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const sentMessage = await sendTournamentMessage(tournamentId, user, newMessage.trim());
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (err) {
      setError('Failed to send message.');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="content-wrapper text-brand-dark p-8 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold font-heading uppercase tracking-wider mb-6">Tournament Chat</h2>
      <div className="h-96 bg-gray-100 rounded-lg p-4 overflow-y-auto flex flex-col">
        {loading ? (
          <p className="m-auto text-gray-500">Loading chat...</p>
        ) : error ? (
          <p className="m-auto text-red-500">{error}</p>
        ) : messages.length > 0 ? (
          <>
            {messages.map(msg => (
              <ChatBubble key={msg.id} message={msg} isCurrentUser={msg.userId === user.id} />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <p className="m-auto text-gray-500">No messages yet. Be the first to say something!</p>
        )}
      </div>
      <form onSubmit={handleSendMessage} className="mt-6 flex items-start gap-4">
        <Input
          id="chatMessage"
          label=""
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={sending}
          className="flex-grow"
        />
        <Button type="submit" disabled={sending} className="py-3">
          {sending ? '...' : 'Send'}
        </Button>
      </form>
    </div>
  );
};

export default TournamentChat;