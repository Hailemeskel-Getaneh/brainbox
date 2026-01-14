import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const API_BASE = '/api';

const UserProfile = () => {
  const { token, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ id: number; username: string; email: string } | null>(null);

  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
        setEditUsername(data.username);
        setEditEmail(data.email);
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

  const handleSubmitProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true); // Reusing loading state for submission
      setError(null);
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: editUsername, email: editEmail })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update profile');
      }

      const updatedData = await res.json();
      setProfile(updatedData); // Update local profile state
      updateUser(updatedData); // Update user in AuthContext
      setIsEditingProfile(false); // Exit editing mode
    } catch (err: unknown) {
        if (err instanceof Error) {
            setError(err.message || 'Error updating profile');
        }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage(null);
    setPasswordChangeError(null);
    if (!token) return;

    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError('New passwords do not match');
      return;
    }

    if (!oldPassword || !newPassword || !confirmNewPassword) {
        setPasswordChangeError('All password fields are required');
        return;
    }

    try {
      setIsChangingPassword(true);
      const res = await fetch(`${API_BASE}/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to change password');
      }

      setPasswordChangeMessage('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
        if (err instanceof Error) {
            setPasswordChangeError(err.message || 'Error changing password');
        }
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-red-300">
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800/50 rounded-lg shadow-xl p-6 border border-gray-700/50">
        <h1 className="text-3xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          User Profile
        </h1>

        {profile && (
          <div className="space-y-6">
            <div className="bg-gray-700/30 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              {!isEditingProfile ? (
                <div className="space-y-2">
                  <p><strong>Username:</strong> {profile.username}</p>
                  <p><strong>Email:</strong> {profile.email}</p>
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition"
                  >
                    Edit Profile
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitProfileUpdate} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300">Username</label>
                    <input
                      type="text"
                      id="username"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="bg-gray-700/30 p-4 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Change Password</h2>
              {passwordChangeMessage && (
                <div className="mb-4 text-green-400">{passwordChangeMessage}</div>
              )}
              {passwordChangeError && (
                <div className="mb-4 text-red-400">{passwordChangeError}</div>
              )}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-300">Old Password</label>
                  <input
                    type="password"
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">New Password</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-300">Confirm New Password</label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="mt-1 block w-full bg-gray-900 border border-gray-700 rounded-md shadow-sm p-2 text-white focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    {isChangingPassword ? <Loader2 className="inline mr-2 animate-spin" size={16} /> : null}
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
