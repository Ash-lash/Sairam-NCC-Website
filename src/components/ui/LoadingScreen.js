import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion } from 'framer-motion';

import nccLogo from '../../assets/ncc-logo.svg';
import armyLogo from '../../assets/army-logo.png';
import navyLogo from '../../assets/navy-logo.png';
import airforceLogo from '../../assets/airforce-logo.png';

const spin = keyframes`
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
`;
const textFlicker = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;
const ScreenContainer = styled(motion.div)` position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: radial-gradient(ellipse at center, #10152D 0%, #0A0A10 100%); display: flex; justify-content: center; align-items: center; z-index: 9999; overflow: hidden; font-family: 'monospace', sans-serif; `;
const Scene = styled.div` width: 200px; height: 200px; perspective: 1200px; `;
const Cube = styled(motion.div)` width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transform: rotateX(-15deg); animation: ${css`${spin} 10s linear infinite`}; `;
const CubeFace = styled(motion.div)` position: absolute; width: 200px; height: 200px; background: rgba(0, 190, 255, 0.1); border: 1px solid rgba(0, 190, 255, 0.5); display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); box-shadow: 0 0 20px rgba(0, 190, 255, 0.3); img { width: 100px; height: 100px; object-fit: contain; filter: drop-shadow(0 0 10px #fff); } `;
const FrontFace = styled(CubeFace)` transform: rotateY(0deg) translateZ(100px); `;
const BackFace = styled(CubeFace)` transform: rotateY(180deg) translateZ(100px); `;
const RightFace = styled(CubeFace)` transform: rotateY(90deg) translateZ(100px); `;
const LeftFace = styled(CubeFace)` transform: rotateY(-90deg) translateZ(100px); `;
const TopFace = styled(CubeFace)` transform: rotateX(90deg) translateZ(100px); `;
const BottomFace = styled(CubeFace)` transform: rotateX(-90deg) translateZ(100px); `;
const LoadingText = styled(motion.p)` position: absolute; bottom: 10%; color: #00beff; font-size: 1rem; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 0 10px #00beff; animation: ${css`${textFlicker} 2s infinite`}; `;
const CornerBracket = styled.div` position: absolute; width: 50px; height: 50px; border: 2px solid rgba(0, 190, 255, 0.7); box-shadow: 0 0 15px rgba(0, 190, 255, 0.5); `;
const TopLeft = styled(CornerBracket)`top: 30px; left: 30px; border-right: none; border-bottom: none;`;
const TopRight = styled(CornerBracket)`top: 30px; right: 30px; border-left: none; border-bottom: none;`;
const BottomLeft = styled(CornerBracket)`bottom: 30px; left: 30px; border-right: none; border-top: none;`;
const BottomRight = styled(CornerBracket)`bottom: 30px; right: 30px; border-left: none; border-top: none;`;

const loadingSequence = ["Booting Sairam NCC OS...", "Calibrating Cadet Matrix...", "Loading Wing Dynamics...", "Engaging Unity Protocol...", "SYSTEM READY",];

const faceVariants = { exit: (custom) => { const transformMap = { front: 'rotateY(0deg) translateZ(600px)', back: 'rotateY(180deg) translateZ(600px)', right: 'rotateY(90deg) translateZ(600px)', left: 'rotateY(-90deg) translateZ(600px)', top: 'rotateX(90deg) translateZ(600px)', bottom: 'rotateX(-90deg) translateZ(600px)' }; return { transform: transformMap[custom], opacity: 0, scale: 2, transition: { duration: 0.8, ease: 'easeOut' } }; } };

const LoadingScreen = () => {
  const [textIndex, setTextIndex] = useState(0);
  useEffect(() => {
    const textInterval = setInterval(() => {
      setTextIndex(prev => {
        if (prev >= loadingSequence.length - 1) {
          clearInterval(textInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(textInterval);
  }, []);

  return (
    <ScreenContainer exit={{ opacity: 0, transition: { duration: 1 } }}>
      <TopLeft /> <TopRight /> <BottomLeft /> <BottomRight />
      <Scene>
        <Cube exit={{ animation: 'none' }}>
          <FrontFace custom="front" variants={faceVariants} exit="exit"><img src={armyLogo} alt="Army Wing" /></FrontFace>
          <BackFace custom="back" variants={faceVariants} exit="exit"><img src={nccLogo} alt="NCC" /></BackFace>
          <RightFace custom="right" variants={faceVariants} exit="exit"><img src={navyLogo} alt="Navy Wing" /></RightFace>
          <LeftFace custom="left" variants={faceVariants} exit="exit"><img src={airforceLogo} alt="Air Force Wing" /></LeftFace>
          <TopFace custom="top" variants={faceVariants} exit="exit"><img src={nccLogo} alt="NCC" /></TopFace>
          <BottomFace custom="bottom" variants={faceVariants} exit="exit"><img src={nccLogo} alt="NCC" /></BottomFace>
        </Cube>
      </Scene>
      <LoadingText key={textIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
        {loadingSequence[textIndex]}
      </LoadingText>
    </ScreenContainer>
  );
};

export default LoadingScreen;