import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GraduationCap, Mail, Lock, User, School } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(name, email, password, collegeName);
            }
            navigate('/dashboard');
        } catch (err) {
            console.error('Authentication error:', err);
            setError(err.response?.data?.error || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="brand-logo-box" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>
                        <GraduationCap size={28} color="white" />
                    </div>
                    <h2>{isLogin ? 'Sign In' : 'Create Account'}</h2>
                    <p>{isLogin ? 'Welcome back! Manage your B.Tech attendance' : 'Get started by creating your student profile'}</p>
                </div>

                {error && (
                    <div className="projection-banner danger" style={{ margin: 0, padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ marginTop: '0.5rem', padding: '0.8rem' }}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                <div className="login-footer-text">
                    {isLogin ? (
                        <span>New here? <span className="login-link" onClick={() => setIsLogin(false)}>Create an account</span></span>
                    ) : (
                        <span>Already have an account? <span className="login-link" onClick={() => setIsLogin(true)}>Sign In</span></span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
