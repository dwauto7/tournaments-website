import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
// FIX: The useAuth hook is defined in hooks/useAuth.ts, not in context/AuthContext.ts.
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import MyTournamentsPage from './pages/MyTournamentsPage';
import CreateTournamentPage from './pages/CreateTournamentPage';
import LoginPage from './pages/LoginPage';
import TournamentDetailPage from './pages/TournamentDetailPage';

// A wrapper for protected routes that redirects to login if not authenticated.
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="flex flex-col min-h-screen bg-brand-dark text-brand-light">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 md:py-16">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/tournaments"
                element={
                  <ProtectedRoute>
                    <MyTournamentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tournaments/:id"
                element={
                  <ProtectedRoute>
                    <TournamentDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create"
                element={
                  <ProtectedRoute>
                    <CreateTournamentPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;