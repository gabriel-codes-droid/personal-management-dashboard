import { useState } from 'react';
import { auth } from './api';
import { useAuth } from './auth';

export default function Settings() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    
    // Profile state
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Security state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Forgot password state
    const [resetEmail, setResetEmail] = useState('');
    const [resetCode, setResetCode] = useState('');
    const [resetNewPassword, setResetNewPassword] = useState('');
    const [resetStep, setResetStep] = useState<'email' | 'code' | 'success'>('email');
    const [resettingPassword, setResettingPassword] = useState(false);
    const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        setProfileMessage(null);
        try {
            await auth.updateProfileImage(profileImage);
            setProfileMessage({ type: 'success', text: 'Profile image updated successfully' });
            // Reload user data
            window.location.reload();
        } catch (error: any) {
            setProfileMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile image' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setChangingPassword(true);
        setPasswordMessage(null);
        try {
            await auth.changePassword(currentPassword, newPassword);
            setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleForgotPassword = async () => {
        setResettingPassword(true);
        setResetMessage(null);
        try {
            await auth.forgotPassword(resetEmail);
            setResetStep('code');
            setResetMessage({ type: 'success', text: 'Reset code sent to your email' });
        } catch (error: any) {
            setResetMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send reset code' });
        } finally {
            setResettingPassword(false);
        }
    };

    const handleResetPassword = async () => {
        if (resetNewPassword.length < 6) {
            setResetMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setResettingPassword(true);
        setResetMessage(null);
        try {
            // First verify the code to get the full token
            const verifyResponse = await auth.verifyResetCode(resetEmail, resetCode);
            const fullToken = verifyResponse.resetToken;
            
            // Then reset password with the full token
            await auth.resetPassword(resetEmail, fullToken, resetNewPassword);
            setResetStep('success');
            setResetMessage({ type: 'success', text: 'Password reset successfully' });
        } catch (error: any) {
            setResetMessage({ type: 'error', text: error.response?.data?.message || 'Failed to reset password' });
        } finally {
            setResettingPassword(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h2>Settings</h2>
                <p>Manage your account settings and preferences</p>
            </div>

            <div className="settings-tabs">
                <button 
                    className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    👤 Profile
                </button>
                <button 
                    className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    🔒 Security
                </button>
            </div>

            {activeTab === 'profile' && (
                <div className="settings-section">
                    <h3>Profile Image</h3>
                    <div className="profile-image-section">
                        <div className="current-avatar">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt="Profile" className="avatar-preview" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div className="image-input-section">
                            <label>Profile Image URL</label>
                            <input
                                type="text"
                                value={profileImage}
                                onChange={(e) => setProfileImage(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="input"
                            />
                            <button 
                                className="btn primary"
                                onClick={handleSaveProfile}
                                disabled={savingProfile}
                            >
                                {savingProfile ? 'Saving...' : 'Save Profile Image'}
                            </button>
                        </div>
                    </div>
                    {profileMessage && (
                        <div className={`message ${profileMessage.type}`}>
                            {profileMessage.text}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'security' && (
                <div className="settings-section">
                    <h3>Change Password</h3>
                    <div className="password-change-form">
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="input"
                                placeholder="Enter current password"
                            />
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="input"
                                placeholder="Enter new password (min 6 characters)"
                            />
                        </div>
                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="input"
                                placeholder="Confirm new password"
                            />
                        </div>
                        <button 
                            className="btn primary"
                            onClick={handleChangePassword}
                            disabled={changingPassword}
                        >
                            {changingPassword ? 'Changing...' : 'Change Password'}
                        </button>
                    </div>
                    {passwordMessage && (
                        <div className={`message ${passwordMessage.type}`}>
                            {passwordMessage.text}
                        </div>
                    )}

                    <div className="divider" />

                    <h3>Forgot Password</h3>
                    <p className="help-text">Can't remember your password? We'll send you a reset code via email.</p>
                    
                    {resetStep === 'email' && (
                        <div className="forgot-password-form">
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="input"
                                    placeholder="Enter your email"
                                />
                            </div>
                            <button 
                                className="btn primary"
                                onClick={handleForgotPassword}
                                disabled={resettingPassword}
                            >
                                {resettingPassword ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </div>
                    )}

                    {resetStep === 'code' && (
                        <div className="forgot-password-form">
                            <div className="form-group">
                                <label>Reset Code</label>
                                <input
                                    type="text"
                                    value={resetCode}
                                    onChange={(e) => setResetCode(e.target.value)}
                                    className="input"
                                    placeholder="Enter 6-digit code from email"
                                    maxLength={6}
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    value={resetNewPassword}
                                    onChange={(e) => setResetNewPassword(e.target.value)}
                                    className="input"
                                    placeholder="Enter new password (min 6 characters)"
                                />
                            </div>
                            <button 
                                className="btn primary"
                                onClick={handleResetPassword}
                                disabled={resettingPassword}
                            >
                                {resettingPassword ? 'Resetting...' : 'Reset Password'}
                            </button>
                            <button 
                                className="btn ghost"
                                onClick={() => setResetStep('email')}
                            >
                                Back
                            </button>
                        </div>
                    )}

                    {resetStep === 'success' && (
                        <div className="success-message">
                            <div className="success-icon">✓</div>
                            <h4>Password Reset Successful</h4>
                            <p>You can now log in with your new password.</p>
                            <button 
                                className="btn primary"
                                onClick={() => setResetStep('email')}
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {resetMessage && (
                        <div className={`message ${resetMessage.type}`}>
                            {resetMessage.text}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}