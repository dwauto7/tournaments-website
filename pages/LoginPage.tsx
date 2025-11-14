import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// FIX: The useAuth hook is defined in hooks/useAuth.ts, not in context/AuthContext.ts.
import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/tournaments');
    }
  }, [user, navigate]);
  
  const handleLogin = async () => {
    await login();
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full content-wrapper text-brand-dark p-8 rounded-lg shadow-xl text-center">
        <h2 className="text-3xl font-bold font-heading uppercase tracking-wider mb-4">Welcome Back</h2>
        <p className="text-gray-600 mb-8">
            This is a mock login page. In a real application, this would redirect to an OAuth provider like Supabase. Click below to sign in.
        </p>
        <Button onClick={handleLogin} className="w-full py-3">
          Log In
        </Button>
      </div>
    </div>
  );
};

export default LoginPage;