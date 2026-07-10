import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as authService from '../services/authService';
import { GraduationCap, Mail, Lock, User, School, HelpCircle, ShieldAlert } from 'lucide-react';

const SECURITY_QUESTIONS = [
    "What was the name of your first school?",
    "What is the name of your favorite childhood friend?",
    "In which city were you born?",
    "What was the name of your first pet?",
    "What is your mother's maiden name?",
    "Write your own custom question..."
];

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    
    // Register/Login fields
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [selectedQuestion, setSelectedQuestion] = useState(SECURITY_QUESTIONS[0]);
    const [customQuestion, setCustomQuestion] = useState('');
    const [securityAnswer, setSecurityAnswer] = useState('');
    
    // Forgot Password fields
    const [forgotEmail, setForgotEmail] = useState('');
    const [recoveryQuestion, setRecoveryQuestion] = useState('');
    const [recoveryAnswer, setRecoveryAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const finalQuestion = selectedQuestion === "Write your own custom question..." ? customQuestion : selectedQuestion;

        if (!finalQuestion) {
            setError('Please provide a security question.');
            setLoading(false);
            return;
        }

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(name, email, password, collegeName, finalQuestion, securityAnswer);
            }
            navigate('/dashboard');
        } catch (err) {
            console.error('Authentication error:', err);
            setError(err.response?.data?.error || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleFetchQuestion = async () => {
        if (!forgotEmail) return;
        try {
            setError('');
            const data = await authService.getSecurityQuestion(forgotEmail);
            setRecoveryQuestion(data.question);
        } catch (err) {
            setError(err.response?.data?.error || 'Could not retrieve security question');
            setRecoveryQuestion('');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            await authService.resetPassword(forgotEmail, recoveryAnswer, newPassword);
            setSuccessMessage('Password reset successfully! Redirecting...');
            setTimeout(() => {
                setIsForgotPassword(false);
                setIsLogin(true);
                setForgotEmail('');
                setRecoveryQuestion('');
                setRecoveryAnswer('');
                setNewPassword('');
                setSuccessMessage('');
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            {isForgotPassword ? (
                <div className="login-card">
                    <div className="login-header">
                        <div className="brand-logo-box" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                            <GraduationCap size={28} color="white" />
                        </div>
                        <h2>Reset Password</h2>
                        <p>Recover your account password using security question</p>
                    </div>

                    {error && (
                        <div className="projection-banner danger" style={{ margin: 0, padding: '0.75rem 1rem', fontSize: '0.85rem', marginTop: '1rem' }}>
                            <span>{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="projection-banner safe" style={{ margin: 0, padding: '0.75rem 1rem', fontSize: '0.85rem', marginTop: '1rem' }}>
                            <span>{successMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                        <div className="form-group">
                            <label htmlFor="forgot-email">Email Address</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input 
                                    type="email" 
                                    id="forgot-email"
                                    placeholder="name@college.edu"
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    required 
                                    style={{ flex: 1 }}
                                    onBlur={handleFetchQuestion}
                                />
                                <button type="button" className="btn btn-outline" onClick={handleFetchQuestion} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                                    Verify
                                </button>
                            </div>
                        </div>

                        {recoveryQuestion && (
                            <>
                                <div className="projection-banner warning" style={{ margin: 0, padding: '0.75rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                                    <HelpCircle size={18} />
                                    <span><b>Question:</b> {recoveryQuestion}</span>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="recovery-answer">Security Answer</label>
                                    <input 
                                        type="text" 
                                        id="recovery-answer"
                                        placeholder="Enter your secret answer"
                                        value={recoveryAnswer}
                                        onChange={(e) => setRecoveryAnswer(e.target.value)}
                                        required 
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="new-password">New Password</label>
                                    <input 
                                        type="password" 
                                        id="new-password"
                                        placeholder="Min 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required 
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    style={{ marginTop: '0.5rem', padding: '0.8rem' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Reset Password'}
                                </button>
                            </>
                        )}
                    </form>

                    <div className="login-footer-text" style={{ marginTop: '1.5rem' }}>
                        <span className="login-link" onClick={() => { setIsForgotPassword(false); setIsLogin(true); setError(''); setSuccessMessage(''); }}>Back to Sign In</span>
                    </div>
                </div>
            ) : (
                <div className="login-card">
                    <div className="login-header">
                        <div className="brand-logo-box" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                            <GraduationCap size={28} color="white" />
                        </div>
                        <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
                        <p>{isLogin ? 'Welcome back! Manage your B.Tech attendance' : 'Get started by creating your student profile'}</p>
                    </div>

                    {error && (
                        <div className="projection-banner danger" style={{ margin: 0, padding: '0.75rem 1rem', fontSize: '0.85rem', marginTop: '1rem' }}>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
                        {!isLogin && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="reg-name">Full Name</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            id="reg-name"
                                            placeholder="e.g. Krishna Kumar"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="reg-college">College / University</label>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type="text" 
                                            id="reg-college"
                                            placeholder="e.g. NIT Delhi"
                                            value={collegeName}
                                            onChange={(e) => setCollegeName(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="reg-question">Security Question *</label>
                                    <select 
                                        id="reg-question"
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
                                    <label htmlFor="reg-answer">Security Answer *</label>
                                    <input 
                                        type="text" 
                                        id="reg-answer"
                                        placeholder="Case-insensitive answer"
                                        value={securityAnswer}
                                        onChange={(e) => setSecurityAnswer(e.target.value)}
                                        required 
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="login-email">Email Address</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="email" 
                                    id="login-email"
                                    placeholder="name@college.edu"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="login-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="password" 
                                    id="login-password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        {isLogin && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
                                <span 
                                    className="login-link" 
                                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                                    style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                                >
                                    Forgot Password?
                                </span>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ marginTop: '0.5rem', padding: '0.8rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="login-footer-text" style={{ marginTop: '1.5rem' }}>
                        {isLogin ? (
                            <span>New here? <span className="login-link" onClick={() => { setIsLogin(false); setError(''); }}>Create an account</span></span>
                        ) : (
                            <span>Already have an account? <span className="login-link" onClick={() => { setIsLogin(true); setError(''); }}>Sign In</span></span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
