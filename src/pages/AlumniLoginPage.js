import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import SEO from '../components/common/SEO';
import { User, Lock, Mail, Eye, EyeOff, ArrowRight, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import emailjs from '@emailjs/browser';

// ─── NCC Color Palette ───
const NCC = {
  navy: '#1A2B4C',
  navyLight: '#2D4A7C',
  gold: '#FFBF00',
  goldLight: '#FFD700',
  bg: '#f4f6fb',
  white: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b',
  success: '#16a34a',
  error: '#dc2626',
};

// ─── Animations ───
const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// ─── Styled Components ───
const PageContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: ${NCC.bg};
  position: relative;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  flex: 1;
  background: linear-gradient(160deg, ${NCC.navy} 0%, ${NCC.navyLight} 50%, #1a3a6e 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(ellipse at 30% 50%, rgba(255, 191, 0, 0.08) 0%, transparent 60%);
    animation: ${float} 8s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
  }

  @media (max-width: 900px) {
    display: none;
  }
`;

const LeftContent = styled.div`
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 450px;
`;

const LogoMark = styled(motion.div)`
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, ${NCC.gold} 0%, ${NCC.goldLight} 100%);
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  box-shadow: 0 20px 60px rgba(255, 191, 0, 0.3);
`;

const LeftTitle = styled.h1`
  color: white;
  font-size: 2.8rem;
  font-weight: 800;
  margin-bottom: 1rem;
  line-height: 1.2;
`;

const LeftSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
  line-height: 1.7;
  margin-bottom: 2.5rem;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
`;

const FeatureItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.95rem;

  .icon-box {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(255, 191, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: ${NCC.gold};
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;

  @media (max-width: 900px) {
    min-height: 100vh;
  }
`;

const AuthCard = styled(motion.div)`
  width: 100%;
  max-width: 460px;
  background: ${NCC.white};
  padding: 3rem 2.5rem;
  border-radius: 28px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.03);

  @media (max-width: 500px) {
    padding: 2rem 1.5rem;
    border-radius: 20px;
  }
`;

const MobileHeader = styled.div`
  display: none;
  text-align: center;
  margin-bottom: 2rem;

  @media (max-width: 900px) {
    display: block;
  }
`;

const TabContainer = styled.div`
  display: flex;
  background: ${NCC.bg};
  border-radius: 16px;
  padding: 5px;
  margin-bottom: 2rem;
`;

const Tab = styled.button`
  flex: 1;
  padding: 0.9rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.$active ? NCC.navy : 'transparent'};
  color: ${props => props.$active ? 'white' : NCC.textLight};

  &:hover {
    background: ${props => props.$active ? NCC.navy : 'rgba(26, 43, 76, 0.06)'};
  }
`;

const FormTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 800;
  color: ${NCC.text};
  margin-bottom: 0.5rem;
`;

const FormSubtitle = styled.p`
  color: ${NCC.textLight};
  font-size: 0.95rem;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const InputGroup = styled.div`
  position: relative;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1.15rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${NCC.textLight};
  display: flex;
  align-items: center;
  transition: color 0.3s;
  z-index: 2;
  pointer-events: none;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1rem 1rem 3.2rem;
  border: 2px solid #e8ecf2;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: #fafbfd;
  color: ${NCC.text};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${NCC.gold};
    background: white;
    box-shadow: 0 0 0 4px rgba(255, 191, 0, 0.1);
  }

  &::placeholder {
    color: #b0b8c9;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${NCC.textLight};
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s;
  z-index: 2;

  &:hover {
    color: ${NCC.navy};
    background: rgba(26, 43, 76, 0.06);
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 1.1rem;
  background: linear-gradient(135deg, ${NCC.navy} 0%, ${NCC.navyLight} 100%);
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  box-shadow: 0 8px 24px rgba(26, 43, 76, 0.25);
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0.5rem 0;
  color: ${NCC.textLight};
  font-size: 0.85rem;
  font-weight: 600;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e8ecf2;
  }
`;

const GoogleButton = styled(motion.button)`
  width: 100%;
  padding: 1rem;
  background: white;
  border: 2px solid #e8ecf2;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 600;
  color: ${NCC.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${NCC.gold};
    background: #fffdf5;
    box-shadow: 0 4px 16px rgba(255, 191, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const Message = styled(motion.div)`
  padding: 1rem 1.25rem;
  border-radius: 14px;
  font-size: 0.9rem;
  font-weight: 600;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  line-height: 1.5;

  ${props => props.$type === 'error' && `
    background: #fef2f2;
    color: ${NCC.error};
    border: 1px solid #fecaca;
  `}

  ${props => props.$type === 'success' && `
    background: #f0fdf4;
    color: ${NCC.success};
    border: 1px solid #bbf7d0;
  `}

  ${props => props.$type === 'info' && `
    background: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  `}

  svg {
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

// ─── Verification Screen ───
const VerificationContainer = styled(motion.div)`
  text-align: center;
  padding: 1rem 0;
`;

const VerificationIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${NCC.gold}, ${NCC.goldLight});
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  box-shadow: 0 12px 40px rgba(255, 191, 0, 0.3);
`;

const VerificationTitle = styled.h2`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${NCC.text};
  margin-bottom: 0.75rem;
`;

const VerificationText = styled.p`
  color: ${NCC.textLight};
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const VerificationEmail = styled.span`
  display: block;
  color: ${NCC.navy};
  font-weight: 700;
  font-size: 1rem;
  margin-top: 0.5rem;
`;

const ResendButton = styled.button`
  background: none;
  border: none;
  color: ${NCC.navyLight};
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.95rem;
  margin-top: 1rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    text-decoration: none;
  }
`;

const ProceedButton = styled(motion.button)`
  width: 100%;
  padding: 1.1rem;
  background: linear-gradient(135deg, ${NCC.gold} 0%, ${NCC.goldLight} 100%);
  color: ${NCC.navy};
  border: none;
  border-radius: 14px;
  font-size: 1.1rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  box-shadow: 0 8px 24px rgba(255, 191, 0, 0.3);
`;

const BackLink = styled.button`
  background: none;
  border: none;
  color: ${NCC.textLight};
  font-size: 0.9rem;
  cursor: pointer;
  margin-top: 1.5rem;
  text-decoration: underline;

  &:hover { color: ${NCC.navy}; }
`;

const DecorCircle = styled.div`
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 191, 0, 0.15);

  &:nth-child(1) {
    width: 300px;
    height: 300px;
    top: -100px;
    right: -100px;
  }
  &:nth-child(2) {
    width: 200px;
    height: 200px;
    bottom: 100px;
    left: -80px;
  }
  &:nth-child(3) {
    width: 150px;
    height: 150px;
    bottom: -50px;
    right: 50px;
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

// ─── Component ───
const googleProvider = new GoogleAuthProvider();

const AlumniLoginPage = () => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'verify'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const alumniManagerEmails = ['alumini@sairamtao.edu.in', 'alumini@sairamtap.edu.in'];

  // Clear previous session on mount
  useEffect(() => {
    signOut(auth).catch(() => { });
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleNavigateAfterAuth = (user) => {
    const isManager = alumniManagerEmails.includes(user.email?.toLowerCase());
    if (isManager) {
      navigate('/admin/alumni');
    } else {
      navigate('/alumni/profile');
    }
  };

  // ─── Email/Password Login ───
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const user = cred.user;

      // Alumni managers skip verification
      const isManager = alumniManagerEmails.includes(email.toLowerCase());
      if (!isManager && !user.emailVerified) {
        setError('Your email is not verified. Please check your inbox for the verification link.');
        await signOut(auth);
        setLoading(false);
        return;
      }

      handleNavigateAfterAuth(user);
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        setError('Incorrect email or password. Please try again.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError(`Login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Email/Password Register ───
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword || !name) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with name immediately
      await updateProfile(cred.user, {
        displayName: name
      });

      // Send Verification Email
      await sendEmailVerification(cred.user);

      // Send Greeting Email (Welcome)
      try {
        await emailjs.send(
          'service_YOUR_SERVICE_ID', // Replace with your Service ID
          'template_YOUR_TEMPLATE_ID', // Replace with your Template ID
          {
            to_name: name,
            to_email: email,
            message: `Welcome to the Sairam NCC Alumni Network! We are thrilled to have you join our community. Please verify your email to access exclusive alumni features.`
          },
          'YOUR_PUBLIC_KEY' // Replace with your Public Key
        );
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't block registration success if email fails
      }

      setMode('verify');
      setResendCooldown(60);
      await signOut(auth);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else {
        setError(`Registration failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Google Sign In ───
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      handleNavigateAfterAuth(result.user);
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Google Sign-In failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Resend Verification ───
  const handleResendVerification = async () => {
    if (resendCooldown > 0) return;
    try {
      // Sign in briefly to resend
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user);
      await signOut(auth);
      setResendCooldown(60);
      setSuccess('Verification email resent! Check your inbox.');
    } catch (err) {
      setError('Failed to resend verification email. Please try again.');
    }
  };

  // ─── Check Verification & Proceed ───
  const handleCheckVerification = async () => {
    setLoading(true);
    setError('');
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Force reload to get latest emailVerified status
      await cred.user.reload();
      const refreshedUser = auth.currentUser;

      if (refreshedUser.emailVerified) {
        handleNavigateAfterAuth(refreshedUser);
      } else {
        setError('Email not yet verified. Please click the link in your email first.');
        await signOut(auth);
      }
    } catch (err) {
      setError('Could not verify. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───
  return (
    <PageContainer>
      <SEO title="Alumni Portal - Login & Register" description="Join the Sairam NCC Alumni Network. Register or login to connect with fellow cadets." />

      {/* Left Decorative Panel */}
      <LeftPanel>
        <DecorCircle />
        <DecorCircle />
        <DecorCircle />
        <LeftContent>
          <LogoMark
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', duration: 0.8 }}
          >
            <Shield size={48} color={NCC.navy} />
          </LogoMark>
          <LeftTitle>
            Sairam NCC<br />Alumni Network
          </LeftTitle>
          <LeftSubtitle>
            Join a legacy of excellence. Connect with fellow cadets,
            share your journey, and inspire the next generation.
          </LeftSubtitle>
          <FeatureList>
            {[
              'Build your professional alumni profile',
              'Connect with NCC cadets across all wings',
              'Share achievements & career milestones',
              'Stay updated on NCC events & news',
            ].map((text, i) => (
              <FeatureItem
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
              >
                <div className="icon-box"><CheckCircle size={20} /></div>
                {text}
              </FeatureItem>
            ))}
          </FeatureList>
        </LeftContent>
      </LeftPanel>

      {/* Right Auth Panel */}
      <RightPanel>
        <AuthCard
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, type: 'spring', damping: 20 }}
        >
          {/* Mobile only header */}
          <MobileHeader>
            <Shield size={36} color={NCC.navy} style={{ marginBottom: '0.5rem' }} />
            <h2 style={{ color: NCC.navy, fontWeight: 800, fontSize: '1.4rem' }}>Sairam NCC Alumni</h2>
          </MobileHeader>

          <AnimatePresence mode="wait">
            {mode === 'verify' ? (
              /* ─── Verification Screen ─── */
              <VerificationContainer
                key="verify"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <VerificationIcon
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                >
                  <Mail size={36} color={NCC.navy} />
                </VerificationIcon>
                <VerificationTitle>Verify Your Email</VerificationTitle>
                <VerificationText>
                  We've sent a verification link to your email address.
                  Please check your inbox and click the link to verify.
                  <VerificationEmail>{email}</VerificationEmail>
                </VerificationText>

                <AnimatePresence>
                  {error && (
                    <Message $type="error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <AlertCircle size={18} />{error}
                    </Message>
                  )}
                  {success && (
                    <Message $type="success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <CheckCircle size={18} />{success}
                    </Message>
                  )}
                </AnimatePresence>

                <ProceedButton
                  onClick={handleCheckVerification}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Checking...' : (<>I've Verified My Email <ArrowRight size={20} /></>)}
                </ProceedButton>

                <ResendButton
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
                </ResendButton>

                <BackLink onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                  ← Back to Login
                </BackLink>
              </VerificationContainer>
            ) : (
              /* ─── Login / Register Form ─── */
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'register' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'register' ? -20 : 20 }}
                transition={{ duration: 0.3 }}
              >
                <TabContainer>
                  <Tab $active={mode === 'login'} onClick={() => { setMode('login'); setError(''); setSuccess(''); }}>
                    Login
                  </Tab>
                  <Tab $active={mode === 'register'} onClick={() => { setMode('register'); setError(''); setSuccess(''); }}>
                    Register
                  </Tab>
                </TabContainer>

                <FormTitle>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</FormTitle>
                <FormSubtitle>
                  {mode === 'login'
                    ? 'Login to manage your alumni profile and connect with your NCC family.'
                    : 'Register to join the Sairam NCC Alumni Network and build your profile.'}
                </FormSubtitle>

                <AnimatePresence>
                  {error && (
                    <Message $type="error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: '1rem' }}>
                      <AlertCircle size={18} />{error}
                    </Message>
                  )}
                  {success && (
                    <Message $type="success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: '1rem' }}>
                      <CheckCircle size={18} />{success}
                    </Message>
                  )}
                </AnimatePresence>

                {/* Google Sign In */}
                <GoogleButton
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="button"
                >
                  <GoogleIcon />
                  Continue with Google
                </GoogleButton>

                <Divider>or</Divider>

                <Form onSubmit={mode === 'login' ? handleLogin : handleRegister}>
                  {mode === 'register' && (
                    <InputGroup>
                      <InputIcon><User size={18} /></InputIcon>
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </InputGroup>
                  )}
                  <InputGroup>
                    <InputIcon><Mail size={18} /></InputIcon>
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </InputGroup>

                  <InputGroup>
                    <InputIcon><Lock size={18} /></InputIcon>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ paddingRight: '3.2rem' }}
                    />
                    <PasswordToggle type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </PasswordToggle>
                  </InputGroup>

                  {mode === 'register' && (
                    <InputGroup>
                      <InputIcon><Lock size={18} /></InputIcon>
                      <Input
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ paddingRight: '3.2rem' }}
                      />
                      <PasswordToggle type="button" onClick={() => setShowConfirm(!showConfirm)}>
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </PasswordToggle>
                    </InputGroup>
                  )}

                  <SubmitButton
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (mode === 'login' ? 'Logging in...' : 'Creating Account...') : (
                      <>{mode === 'login' ? 'Login' : 'Create Account'} <ArrowRight size={20} /></>
                    )}
                  </SubmitButton>
                </Form>
              </motion.div>
            )}
          </AnimatePresence>
        </AuthCard>
      </RightPanel>
    </PageContainer>
  );
};

export default AlumniLoginPage;
