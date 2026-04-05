import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useTransform, useMotionValue, useSpring } from 'framer-motion';
import styled from 'styled-components';
import { ChevronDown, GraduationCap, Star, Users, PieChart } from 'lucide-react';
import AnnouncementsBoard from './AnnouncementsBoard';

const ARMY_RED = '#D22B2B';
const AIR_LIGHT_BLUE = '#87CEEB';
const NAVY_DARK_BLUE = '#000080';

const HeroContainer = styled.div`
  min-height: 100vh;
  height: auto;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
  @media (max-width: 768px) {
    align-items: flex-start;
    padding-top: 100px;
    padding-bottom: 3rem;
  }
`;

const HeroContent = styled(motion.div)`
  text-align: center;
  z-index: 10;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FeatureNav = styled(motion.div)`
  display: flex;
  gap: 2rem;
  margin-bottom: 2rem;
  z-index: 20;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;
  }
`;

const FeatureButton = styled(motion.button)`
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem 1.5rem;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  color: #1A2B4C;
  font-weight: 700;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    border-color: #FFBF00;
  }

  svg {
    color: #FFBF00;
  }
`;

const MainTitle = styled(motion.h1)`
  font-size: clamp(3rem, 7vw, 7rem);
  font-weight: 900;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  line-height: 1.1;
  span {
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const WingsInfoContainer = styled(motion.div)`
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: #FFFFFF;
  border-radius: 15px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  padding: 1.5rem 2rem;
  margin: 1rem 0;
  width: 100%;
  max-width: 1000px;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;
    width: 90%;
  }
`;

const WingDetail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  padding: 0 1rem;
  flex: 1;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }

  &:not(:last-child)::after {
    content: '';
    position: absolute;
    right: -1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1px;
    height: 60%;
    background-color: #E0E0E0;
    @media (max-width: 768px) {
      display: none;
    }
  }
`;

const WingName = styled.h3`
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  color: ${props => props.color};
  @media (max-width: 480px) {
    font-size: 1.4rem;
  }
`;

const UnitName = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  font-weight: 500;
  color: ${props => props.color};
  opacity: 0.8;
  white-space: pre-line;
  @media (max-width: 480px) {
    font-size: 0.85rem;
  }
`;

const SubTitle = styled(motion.h2)`
  font-size: clamp(1.2rem, 3vw, 2rem);
  font-weight: 400;
  color: #555;
  letter-spacing: 0.1em;
  margin-top: 0.5rem;
`;

const ScrollIndicator = styled(motion.div)`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #888;
  cursor: pointer;
`;

const ScrollText = styled.span`
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const wingsData = [
  { name: 'Air', color: AIR_LIGHT_BLUE, units: '1 (TN) AIR SQN NCC', slug: 'airforce' },
  { name: 'Army', color: ARMY_RED, units: '1 (TN) BTY NCC\n1 (TN) MED NCC', slug: 'army' },
  { name: 'Navy', color: NAVY_DARK_BLUE, units: '4 (TN) NAVAL TECH NCC', slug: 'navy' }
];

const HeroSection = () => {
  const navigate = useNavigate();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springMouseX = useSpring(mouseX, { stiffness: 300, damping: 30 });
  const springMouseY = useSpring(mouseY, { stiffness: 300, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      mouseX.set((clientX - innerWidth / 2) / 50);
      mouseY.set((clientY - innerHeight / 2) / 50);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const contentVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.5 } } };
  const sairamNccVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.8 } } };

  return (
    <HeroContainer>
      <AnnouncementsBoard />

      <HeroContent style={{ x: useTransform(springMouseX, [-50, 50], [-15, 15]), y: useTransform(springMouseY, [-50, 50], [-15, 15]), }}>
        <FeatureNav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <FeatureButton
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/departments')}
          >
            <GraduationCap size={20} />
            Department Wise Cadet List
          </FeatureButton>
          <FeatureButton
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/strength-chart')}
          >
            <PieChart size={20} />
            NCC CADETS STRENGTH CHART
          </FeatureButton>
          <FeatureButton
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/magic-members')}
          >
            <Star size={20} />
            MAGIC Member
          </FeatureButton>
          <FeatureButton
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/teams')}
          >
            <Users size={20} />
            Teams of Sairam NCC
          </FeatureButton>
        </FeatureNav>

        <MainTitle variants={sairamNccVariants} initial="hidden" animate="visible">
          <span style={{ color: ARMY_RED }}>SAI</span>
          <span style={{ color: NAVY_DARK_BLUE }}>RAM</span>{' '}
          <span style={{ color: AIR_LIGHT_BLUE }}>NCC</span>
        </MainTitle>

        <WingsInfoContainer variants={contentVariants} initial="hidden" animate="visible">
          {wingsData.map(wing => (
            <WingDetail
              key={wing.name}
              onClick={() => navigate(`/wing/${wing.slug}`)}
            >
              <WingName color={wing.color}>{wing.name}</WingName>
              <UnitName color={wing.color}>{wing.units}</UnitName>
            </WingDetail>
          ))}
        </WingsInfoContainer>
        <SubTitle variants={contentVariants} initial="hidden" animate="visible">
          Sri Sairam Engineering College
        </SubTitle>
      </HeroContent>

      <ScrollIndicator onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
        <ScrollText>Scroll Down</ScrollText>
        <ChevronDown size={20} />
      </ScrollIndicator>
    </HeroContainer>
  );
};
export default HeroSection;