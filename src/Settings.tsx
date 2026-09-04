import { useState } from 'react';
import { useAuth } from './auth';
import { useTheme } from './theme';
import { getFirebaseErrorMessage } from './firebaseErrorHandler';
import { User, Lock, Palette, Camera, RefreshCw, Moon, Sun, Check } from 'lucide-react';

const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export default function Settings() {
    const { user, updateProfile, updatePassword, resetPassword } = useAuth();
    const { theme, toggle, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'appearance'>('profile');
    
    // Profile state
    const [profileImage, setProfileImage] = useState(user?.profileImage || '');
    const [uploadingImage, setUploadingImage] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setProfileMessage({ type: 'error', text: 'Please select an image file' });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setProfileMessage({ type: 'error', text: 'Image must be less than 5MB' });
            return;
        }

        setUploadingImage(true);
        setProfileMessage(null);

        try {
            const base64 = await convertToBase64(file);
            setProfileImage(base64);
            setProfileMessage({ type: 'success', text: 'Image uploaded successfully' });
        } catch (error) {
            setProfileMessage({ type: 'error', text: 'Failed to process image' });
        } finally {
            setUploadingImage(false);
        }
    };

    // Security state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Forgot password state
    const [resetEmail, setResetEmail] = useState('');
    const [resetStep, setResetStep] = useState<'email' | 'success'>('email');
    const [resettingPassword, setResettingPassword] = useState(false);
    const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        setProfileMessage(null);
        try {
            await updateProfile(profileImage);
            setProfileMessage({ type: 'success', text: 'Profile image updated successfully' });
        } catch (error: any) {
            setProfileMessage({ type: 'error', text: getFirebaseErrorMessage(error) });
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
            await updatePassword(newPassword);
            setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setPasswordMessage({ type: 'error', text: getFirebaseErrorMessage(error) });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleForgotPassword = async () => {
        setResettingPassword(true);
        setResetMessage(null);
        try {
            await resetPassword(resetEmail);
            setResetStep('success');
            setResetMessage({ type: 'success', text: 'Password reset email sent. Check your inbox.' });
        } catch (error: any) {
            setResetMessage({ type: 'error', text: getFirebaseErrorMessage(error) });
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
                    <User size={14} className="inline mr-1" /> Profile
                </button>
                <button
                    className={`tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    <Lock size={14} className="inline mr-1" /> Security
                </button>
                <button
                    className={`tab ${activeTab === 'appearance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('appearance')}
                >
                    <Palette size={14} className="inline mr-1" /> Appearance
                </button>
            </div>

            {activeTab === 'profile' && (
                <div className="settings-section">
                    <h3>Profile Image</h3>
                    <div className="profile-image-section">
                        <div className="current-avatar">
                            {profileImage || user?.profileImage ? (
                                <img src={profileImage || user?.profileImage} alt="Profile" className="avatar-preview" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                                </div>
                            )}
                        </div>
                        <div className="image-upload-section">
                            <div className="upload-placeholder">
                                <input
                                    type="file"
                                    id="profile-image-upload"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="file-input"
                                    disabled={uploadingImage}
                                />
                                <label htmlFor="profile-image-upload" className="upload-label">
                                    <Camera size={20} />
                                    <div className="upload-text">
                                        {uploadingImage ? 'Processing...' : 'Click to upload image'}
                                    </div>
                                    <div className="upload-hint">PNG, JPG up to 5MB</div>
                                </label>
                            </div>
                            <button 
                                className="btn primary"
                                onClick={handleSaveProfile}
                                disabled={savingProfile || !profileImage}
                            >
                                {savingProfile ? 'Saving...' : 'Save Profile Image'}
                            </button>
                            {profileImage && (
                                <button 
                                    className="btn ghost"
                                    onClick={() => setProfileImage('')}
                                >
                                    Remove Image
                                </button>
                            )}
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
                    <p className="help-text">Can't remember your password? We'll send you a password reset link via email.</p>
                    
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
                                {resettingPassword ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    )}

                    {resetStep === 'success' && (
                        <div className="success-message">
                            <div className="success-icon"><Check size={28} /></div>
                            <h4>Password Reset Email Sent</h4>
                            <p>Check your email for the password reset link. The link will expire in 1 hour.</p>
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

            {activeTab === 'appearance' && (
                <div className="settings-section">
                    <h3>Theme</h3>
                    <p className="help-text">Customize the appearance of your dashboard</p>
                    
                    <div className="theme-selector">
                        <div 
                            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => setTheme('dark')}
                        >
                            <div className="theme-preview dark">
                                <span className="theme-icon"><Moon size={16} /></span>
                            </div>
                            <div className="theme-info">
                                <div className="theme-name">Dark Mode</div>
                                <div className="theme-desc">Default dark theme</div>
                            </div>
                            {theme === 'dark' && <div className="theme-check"><Check size={12} /></div>}
                        </div>
                        
                        <div 
                            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                            onClick={() => setTheme('light')}
                        >
                            <div className="theme-preview light">
                                <span className="theme-icon"><Sun size={16} /></span>
                            </div>
                            <div className="theme-info">
                                <div className="theme-name">Light Mode</div>
                                <div className="theme-desc">Lighter theme</div>
                            </div>
                            {theme === 'light' && <div className="theme-check"><Check size={12} /></div>}
                        </div>
                    </div>

                    <div className="appearance-actions">
                        <button 
                            className="btn primary"
                            onClick={toggle}
                        >
                            Toggle Theme ({theme === 'dark' ? <Sun size={14} className="inline mr-1" /> : <Moon size={14} className="inline mr-1" />})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}