import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import SEO from '../components/common/SEO';
import { Mail, Lock, Shield, ArrowRight } from 'lucide-react';
import MilitaryBackground from '../components/common/MilitaryBackground';

const LoginPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
`;



const LoginForm = styled(motion.form)`
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  padding: 3.5rem 2.5rem;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  z-index: 10;
  position: relative;
`;

const LogoContainer = styled(motion.div)`
  width: 80px;
  height: 80px;
  background: #1A2B4C;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
  box-shadow: 0 15px 30px rgba(26, 43, 76, 0.2);
`;

const TitleGroup = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #1e293b;
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  color: #64748b;
  font-size: 0.95rem;
`;

const InputGroup = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const InputIcon = styled.div`
  position: absolute;
  left: 1.25rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
`;

const Input = styled.input`
  width: 100%;
  padding: 1.1rem 1.1rem 1.1rem 3.5rem;
  border: 2px solid #f1f5f9;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: #fdfdfd;
  color: #1e293b;
  
  &:focus {
    outline: none;
    border-color: #1A2B4C;
    background: #fff;
    box-shadow: 0 10px 25px -5px rgba(26, 43, 76, 0.1);
  }

  &:focus + ${InputIcon} {
    color: #1A2B4C;
  }
`;

const Button = styled(motion.button)`
  padding: 1.1rem;
  background: #1A2B4C;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(26, 43, 76, 0.3);
  margin-top: 1rem;
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled(motion.p)`
  color: #ef4444;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
  background: #fef2f2;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #fee2e2;
`;


const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fresh session restart: Log out any existing user when visiting this page
  useEffect(() => {
    signOut(auth).catch(err => console.error("Error clearing session:", err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // STRICT ADMIN CHECK
      const adminEmails = [
        'dineshkumar.mech@sairam.edu.in',
        'murugan.math@sairam.edu.in',
        'prabhu.mech@sairam.edu.in',
        'viswanathan.phy@sairamit.edu.in'
      ];

      if (adminEmails.includes(user.email?.toLowerCase())) {
        navigate('/admin/slideshow');
      } else {
        // Not an authorized admin, log them out immediately
        await signOut(auth);
        setError('Unauthorized access. This login is for authorized Admins only.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginPageContainer>
      <SEO title="Admin Login" noindex={true} />

      <MilitaryBackground />

      <LoginForm
        onSubmit={handleLogin}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.6, type: 'spring', damping: 20 }}
      >
        <LogoContainer
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Shield size={40} />
        </LogoContainer>

        <TitleGroup>
          <Title>Admin Access</Title>
          <Subtitle>Welcome back, Commander.</Subtitle>
        </TitleGroup>

        <InputGroup>
          <Input
            type="email"
            placeholder="Officer Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <InputIcon><Mail size={20} /></InputIcon>
        </InputGroup>

        <InputGroup>
          <Input
            type="password"
            placeholder="Access Key"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <InputIcon><Lock size={20} /></InputIcon>
        </InputGroup>

        <AnimatePresence>
          {error && (
            <ErrorMessage
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </ErrorMessage>
          )}
        </AnimatePresence>

        <Button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Authenticating...' : (
            <>Secure Login <ArrowRight size={20} /></>
          )}
        </Button>
      </LoginForm>
    </LoginPageContainer>
  );
};

export default AdminLoginPage;