import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0F172A; /* Deep Navy/Black */
  z-index: 10000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  font-family: 'Poppins', sans-serif;
`;

const ContentContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rem;
`;

const Spinner = styled(motion.div)`
  width: 60px;
  height: 60px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #FFBF00; /* Gold */
  border-radius: 50%;
`;

const Text = styled(motion.h2)`
  font-size: 1.5rem;
  letter-spacing: 2px;
  font-weight: 300;
  text-transform: uppercase;
`;

const Bar = styled(motion.div)`
  height: 2px;
  background: #FFBF00;
  width: 200px;
  margin-top: 1rem;
`;

const FuturisticLogout = ({ onLogoutComplete }) => {
    const navigate = useNavigate();


    useEffect(() => {
        // Sequence:
        // 0ms: Component Mounts (Effect Triggered)
        // 1000ms: Actual Logout
        // 2500ms: Navigate Home

        const sequence = async () => {
            // Wait for visual intro (reduced time)
            await new Promise(r => setTimeout(r, 700));

            // Perform Logout
            try {
                await signOut(auth);
            } catch (err) {
                console.error("Logout error:", err);
            }

            // Wait a bit MORE briefly for visual confirmation
            await new Promise(r => setTimeout(r, 800));

            // Navigate Home
            navigate('/');

            // Signal completion
            if (onLogoutComplete) onLogoutComplete();
        };

        sequence();
    }, [navigate, onLogoutComplete]);

    return (
        <Overlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <ContentContainer
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
            >
                <Spinner
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                />
                <Text
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Terminating Session
                </Text>
                <Bar
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.2, duration: 1.2, ease: 'easeInOut' }}
                />
            </ContentContainer>
        </Overlay>
    );
};

export default FuturisticLogout;
