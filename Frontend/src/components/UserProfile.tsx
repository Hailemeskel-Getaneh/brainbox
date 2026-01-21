import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import ProfileInformation from './ProfileInformation';
import ChangePassword from './ChangePassword';

const API_BASE = '/api';

const UserProfile = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ id: number; username: string; email: string } | null>(null);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to fetch profile');
        }

        const data = await res.json();
        setProfile(data);
      } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message || 'Error fetching profile');
            if (err.message === 'jwt expired' || err.message === 'Not authorized') {
                logout();
                navigate('/login');
            }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate, logout]);

  // @ts-ignore
  const handleSomething = () => {
    // This is a dummy function
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-8 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-red-300">
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-700 rounded-lg hover:bg-blue-500 dark:hover:bg-blue-600 text-white">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-300 transition-colors duration-200"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={24} className="mr-2" />
            <span className="text-lg">Back to Dashboard</span>
          </button>
        </div>
        <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          User Profile
        </h1>

        {profile && (
          <div className="space-y-6">
            <ProfileInformation />
            <ChangePassword />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;

