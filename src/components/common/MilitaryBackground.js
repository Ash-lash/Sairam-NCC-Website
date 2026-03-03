import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
  background: #f8fafc;
`;

const FloatingElement = styled(motion.div)`
  position: absolute;
  color: ${props => props.$color || 'rgba(26, 43, 76, 0.08)'};
  filter: drop-shadow(0 20px 30px rgba(0, 0, 0, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TankIcon = () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 15v-1h-2v1H7v-1H5v1c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2zM5 19H3v-2h2v2zm16 0h-2v-2h2v2zM6.5 10c0-1.1.9-2 2-2h7c1.1 0 2 .9 2 2v3H6.5v-3zM14 6V4h-4v2h4z" />
    </svg>
);

const JetIcon = () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
);

const ShipIcon = () => (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 8.62V5c0-1.1-.9-2-2-2h-4V1l-1 1v1h-2V1l-1 1v1H6c-1.1 0-2 .9-2 2v3.62L1.72 10c-.26.08-.48.26-.6.5s-.14.52-.06.78L3.05 18zM18 5v3.13L7.39 12H18v3.13c-1.25.54-2.58.87-4 .87s-2.75-.33-4-.87V5h8z" />
    </svg>
);

const MilitaryBackground = () => {
    return (
        <Container>
            {/* Jet - Air Force */}
            <FloatingElement
                $color="rgba(30, 64, 175, 0.05)"
                style={{ width: 180, height: 180, top: '10%', right: '10%', rotate: -15 }}
                animate={{
                    y: [0, -30, 0],
                    x: [0, 20, 0],
                    rotate: [-15, -10, -15]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
                <JetIcon />
            </FloatingElement>

            <FloatingElement
                $color="rgba(30, 64, 175, 0.03)"
                style={{ width: 120, height: 120, top: '25%', right: '25%', rotate: -15 }}
                animate={{
                    y: [0, -40, 0],
                    x: [0, -30, 0],
                    rotate: [-15, -20, -15]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
                <JetIcon />
            </FloatingElement>

            {/* Tank - Army */}
            <FloatingElement
                $color="rgba(21, 128, 61, 0.05)"
                style={{ width: 220, height: 220, bottom: '15%', left: '5%' }}
                animate={{
                    x: [0, 40, 0],
                    y: [0, -10, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            >
                <TankIcon />
            </FloatingElement>

            {/* Ship - Navy */}
            <FloatingElement
                $color="rgba(30, 58, 138, 0.06)"
                style={{ width: 280, height: 280, bottom: '5%', right: '5%' }}
                animate={{
                    x: [-20, 20, -20],
                    y: [0, 15, 0],
                    rotate: [-2, 2, -2]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            >
                <ShipIcon />
            </FloatingElement>

            {/* Decorative Orbs for 3D depth */}
            <motion.div
                style={{
                    position: 'absolute',
                    width: 600,
                    height: 600,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(234, 179, 8, 0.05) 0%, rgba(255, 255, 255, 0) 70%)',
                    top: '-10%',
                    left: '-10%',
                    zIndex: 0
                }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
            />
        </Container>
    );
};

export default MilitaryBackground;
