import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const API_BASE = '/api';

const ChangePassword = () => {
    const { token } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordChangeMessage, setPasswordChangeMessage] = useState<string | null>(null);
    const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

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

    return (
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
    )
}

export default ChangePassword;