import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE = '/api';

const ProfileInformation = () => {
    const { token, user, updateUser } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<{ id: number; username: string; email: string } | null>(user ? { id: user.id, username: user.username, email: user.email } : null);
    const [editUsername, setEditUsername] = useState(user?.username || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmitProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            setLoading(true);
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
            setProfile(updatedData);
            updateUser(updatedData);
            setIsEditingProfile(false);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Error updating profile');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-700/30 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            {error && <div className="mb-4 text-red-400">{error}</div>}
            {!isEditingProfile ? (
                <div className="space-y-2">
                    <p><strong>Username:</strong> {profile?.username}</p>
                    <p><strong>Email:</strong> {profile?.email}</p>
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
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-500 transition"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default ProfileInformation;