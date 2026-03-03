import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: white;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Counter = styled(motion.h1)`
  font-size: 8rem;
  font-weight: 800;
  color: #1A2B4C;
  margin: 0;
  line-height: 1;

  @media (max-width: 768px) {
    font-size: 5rem;
  }
`;

const Label = styled(motion.p)`
  font-size: 1.2rem;
  color: #64748b;
  margin-top: 1rem;
  font-weight: 500;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const CounterLoader = ({ isLoading, label = "Loading..." }) => {
    return (
        <AnimatePresence>
            {isLoading && (
                <Overlay
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.3 } }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                    >
                        <Label style={{ fontSize: '1.5rem', color: '#3b82f6', marginTop: 0 }}>
                            {label}
                        </Label>
                    </motion.div>
                </Overlay>
            )}
        </AnimatePresence>
    );
};

export default CounterLoader;
