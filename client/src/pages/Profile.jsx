import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import * as authService from '../services/authService';
import { useAuth } from '../hooks/useAuth';
import { User, School, Target, Save, Lock, HelpCircle } from 'lucide-react';

const SECURITY_QUESTIONS = [
    "What was the name of your first school?",
    "What is the name of your favorite childhood friend?",
    "In which city were you born?",
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "Write your own custom question..."
];

const Profile = () => {
    const { user, updateUser } = useAuth();
    
    // Check if user's question is in pre-defined list
    const isQuestionPredefined = user?.securityQuestion ? SECURITY_QUESTIONS.includes(user.securityQuestion) : true;

    // Form fields
    const [name, setName] = useState(user?.name || '');
    const [collegeName, setCollegeName] = useState(user?.collegeName || '');
    const [targetPercentage, setTargetPercentage] = useState(user?.targetPercentage || 75);
    const [individualTargetPercentage, setIndividualTargetPercentage] = useState(user?.individualTargetPercentage || 40);
    const [selectedQuestion, setSelectedQuestion] = useState(
        user?.securityQuestion 
            ? (isQuestionPredefined ? user.securityQuestion : "Write your own custom question...") 
            : SECURITY_QUESTIONS[0]
    );
    const [customQuestion, setCustomQuestion] = useState(
        user?.securityQuestion && !isQuestionPredefined ? user.securityQuestion : ''
    );
    const [securityAnswer, setSecurityAnswer] = useState('');
    
    // Password settings
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [infoMsg, setInfoMsg] = useState('');
    const [errMsg, setErrMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSaveSecurityQuestion = async (e) => {
        e.preventDefault();
        setInfoMsg('');
        setErrMsg('');
        
        const finalQuestion = selectedQuestion === "Write your own custom question..." ? customQuestion : selectedQuestion;

        if (!finalQuestion) {
            setErrMsg('Please enter a custom question.');
            return;
        }

        if (!securityAnswer) {
            setErrMsg('Please enter an answer to your security question.');
            return;
        }

        setLoading(true);
        try {
            const updated = await authService.updateProfile({
                securityQuestion: finalQuestion,
                securityAnswer
            });

            // Update AuthContext global user state
            updateUser({
                securityQuestion: updated.securityQuestion
            });

            setSecurityAnswer('');
            setInfoMsg('Security question and answer updated successfully.');
        } catch (error) {
            console.error('Error updating security question:', error);
            setErrMsg(error.response?.data?.error || 'Failed to update security settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setInfoMsg('');
        setErrMsg('');
        setLoading(true);

        try {
            const updated = await authService.updateProfile({
                name,
                collegeName,
                targetPercentage: parseInt(targetPercentage),
                individualTargetPercentage: parseInt(individualTargetPercentage)
            });

            // Update AuthContext global user state
            updateUser({
                name: updated.name,
                collegeName: updated.collegeName,
                targetPercentage: updated.targetPercentage,
                individualTargetPercentage: updated.individualTargetPercentage
            });

            setInfoMsg('Student profile details updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            setErrMsg(error.response?.data?.error || 'Failed to update profile settings.');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        setInfoMsg('');
        setErrMsg('');
        
        if (!newPassword) return;
        if (newPassword !== confirmPassword) {
            setErrMsg('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await authService.updateProfile({
                password: newPassword
            });
            setNewPassword('');
            setConfirmPassword('');
            setInfoMsg('Password changed successfully.');
        } catch (error) {
            console.error('Error updating password:', error);
            setErrMsg(error.response?.data?.error || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
            <Navbar 
                title="Profile Settings" 
                subtitle="Configure personal attendance targets and university credentials" 
            />

            {infoMsg && (
                <div className="projection-banner safe" style={{ marginBottom: '1.5rem' }}>
                    <span>{infoMsg}</span>
                </div>
            )}

            {errMsg && (
                <div className="projection-banner danger" style={{ marginBottom: '1.5rem' }}>
                    <span>{errMsg}</span>
                </div>
            )}

            <div className="settings-grid">
                {/* Profile info card */}
                <div className="card settings-card">
                    <div className="panel-header" style={{ marginBottom: '0.5rem' }}>
                        <h2>Personal Information</h2>
                    </div>

                    <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label htmlFor="prof-name">Full Name *</label>
                            <input 
                                type="text" 
                                id="prof-name" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required 
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="prof-college">College / University</label>
                            <input 
                                type="text" 
                                id="prof-college" 
                                value={collegeName}
                                onChange={(e) => setCollegeName(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="prof-target">Overall Attendance Target ({targetPercentage}%)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input 
                                    type="range" 
                                    id="prof-target" 
                                    min="50" 
                                    max="100" 
                                    value={targetPercentage}
                                    onChange={(e) => setTargetPercentage(parseInt(e.target.value))}
                                    style={{ flex: 1, cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '45px', textAlign: 'right' }}>
                                    {targetPercentage}%
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="prof-indiv-target">Individual Subject Target ({individualTargetPercentage}%)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input 
                                    type="range" 
                                    id="prof-indiv-target" 
                                    min="10" 
                                    max="100" 
                                    value={individualTargetPercentage}
                                    onChange={(e) => setIndividualTargetPercentage(parseInt(e.target.value))}
                                    style={{ flex: 1, cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: 'bold', fontSize: '1.1rem', minWidth: '45px', textAlign: 'right' }}>
                                    {individualTargetPercentage}%
                                </span>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }} disabled={loading}>
                            <Save size={18} />
                            <span>Save Profile</span>
                        </button>
                    </form>
                </div>

                {/* Password card */}
                <div className="card settings-card">
                    <div className="panel-header" style={{ marginBottom: '0.5rem' }}>
                        <h2>Security Settings</h2>
                    </div>

                    <form onSubmit={handleSavePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div className="form-group">
                            <label htmlFor="prof-pass-new">New Password</label>
                            <input 
                                type="password" 
                                id="prof-pass-new" 
                                placeholder="Enter new password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength="6"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="prof-pass-confirm">Confirm Password</label>
                            <input 
                                type="password" 
                                id="prof-pass-confirm" 
                                placeholder="Re-enter new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength="6"
                            />
                        </div>

                        <button type="submit" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }} disabled={loading || !newPassword}>
                            <Lock size={18} />
                            <span>Update Password</span>
                        </button>
                    </form>

                    <form onSubmit={handleSaveSecurityQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                        <div className="panel-header" style={{ marginBottom: '0rem' }}>
                            <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <HelpCircle size={18} color="var(--accent-blue)" />
                                <span>Security Question Recovery</span>
                            </h3>
                        </div>

                        <div className="form-group">
                            <label htmlFor="prof-question">Security Question *</label>
                            <select 
                                id="prof-question"
                                value={selectedQuestion}
                                onChange={(e) => setSelectedQuestion(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                            >
                                {SECURITY_QUESTIONS.map((q, idx) => (
                                    <option key={idx} value={q} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{q}</option>
                                ))}
                            </select>
                            {selectedQuestion === "Write your own custom question..." && (
                                <input 
                                    type="text"
                                    placeholder="Enter your custom security question"
                                    value={customQuestion}
                                    onChange={(e) => setCustomQuestion(e.target.value)}
                                    required
                                    style={{ marginTop: '0.75rem' }}
                                />
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="prof-answer">Security Answer *</label>
                            <input 
                                type="text" 
                                id="prof-answer" 
                                placeholder="Enter answer to set or update question"
                                value={securityAnswer}
                                onChange={(e) => setSecurityAnswer(e.target.value)}
                                required 
                            />
                        </div>

                        <button type="submit" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }} disabled={loading}>
                            <Save size={18} />
                            <span>Update Question</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;
