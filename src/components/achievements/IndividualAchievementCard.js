import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, FileText, Target, Shield, User } from 'lucide-react';
import { getFullRank } from '../../rankStructure';
import { getOptimizedUrl } from '../../utils/imageOptimizer';
import OptimizedImage from '../common/OptimizedImage';

const GOLD = '#FFD700';
const DEEP_BLUE = '#020617';

const VanguardContainer = styled(motion.div)`
  height: 600px;
  position: relative;
  border-radius: 32px;
  background: ${DEEP_BLUE};
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 50px 100px -20px rgba(0,0,0,0.7);
  border: 1px solid rgba(255, 215, 0, 0.05);
  container-type: inline-size;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.8) 100%);
    z-index: 2;
  }
`;

const SignaturePhoto = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 1;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
    filter: saturate(1.2) contrast(1.1);
  }
`;

const SpotlightOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 3;
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* ALIGN TO BOTTOM AS ORIGINALLY INTENDED BUT CLEANER */
  background: linear-gradient(to top, rgba(2, 6, 23, 0.95), transparent 60%);
`;

const RankStripe = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, ${GOLD}, transparent);
  }
`;

const NameHighlight = styled.h3`
  font-size: clamp(0.5rem, 5.5cqw, 3.5rem);
  font-weight: 900;
  color: white;
  margin: 0.5rem 0;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  -webkit-text-stroke: 1px rgba(255,255,255,0.1);
  white-space: nowrap;
  overflow: visible;
  width: 100%;
  display: block;
  box-sizing: border-box;
`;

const ProfileReveal = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: ${DEEP_BLUE};
  display: flex;
  flex-direction: column;
`;

const ProfileHero = styled.div`
  height: 280px;
  width: 100%;
  position: relative;
  overflow: hidden;
`;

const ProfileDetails = styled.div`
  flex: 1;
  padding: 3rem;
  background: radial-gradient(circle at top right, rgba(255, 215, 0, 0.03), transparent);
  overflow-y: auto;
  
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${GOLD}33; border-radius: 10px; }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  margin-bottom: 3rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 2rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    color: ${GOLD};
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  
  span {
    color: white;
    font-size: 1.1rem;
    font-weight: 700;
  }
`;

const DescriptionBox = styled.div`
  display: flex;
  gap: 2rem;
  
  .icon {
    flex-shrink: 0;
    width: 50px;
    height: 50px;
    background: rgba(255, 215, 0, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${GOLD};
  }
  
  p {
    color: rgba(255,255,255,0.8);
    font-size: 1.2rem;
    line-height: 1.8;
    font-family: 'Outfit', sans-serif;
    font-weight: 300;
    margin: 0;
  }
`;

const ActionButton = styled(motion.button)`
  background: ${GOLD};
  color: ${DEEP_BLUE};
  border: none;
  padding: 1rem 2rem;
  border-radius: 16px;
  font-weight: 900;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  box-shadow: 0 10px 30px ${GOLD}44;
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 101;
`;

const IndividualAchievementCard = ({ item, onReportClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <VanguardContainer
        onClick={() => setIsExpanded(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -10 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <SignaturePhoto
          animate={{ scale: isHovered ? 1.05 : 1 }}
        >
          <OptimizedImage
            src={item.photo}
            width={800}
            quality={85}
            alt={item.name}
            objectFit="cover"
            objectPosition="top center"
            style={{
              width: '100%',
              height: '100%',
              filter: isHovered ? 'saturate(1.5) brightness(0.8)' : 'saturate(1.2) brightness(0.7)'
            }}
          />
        </SignaturePhoto>

        <SpotlightOverlay>
          <div style={{ position: 'absolute', top: '3rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 10 }}>
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{ background: GOLD, color: DEEP_BLUE, padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900 }}
            >
              PREMIUM HONOR
            </motion.div>
            <Shield color={GOLD} size={24} style={{ opacity: isHovered ? 1 : 0.4 }} />
          </div>

          <div>
            <RankStripe>
              <span style={{ color: GOLD, fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px' }}>
                {getFullRank(item.rank)}
              </span>
            </RankStripe>
            <NameHighlight>{item.name}</NameHighlight>
            <div style={{ display: 'flex', gap: '1rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '0.9rem' }}>
              <span>{item.department}</span>
              <span>•</span>
              <span>{item.title}</span>
            </div>
          </div>
        </SpotlightOverlay>
      </VanguardContainer>

      <AnimatePresence>
        {isExpanded && (
          <ProfileReveal
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <CloseButton onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>✕</CloseButton>

            <ProfileHero>
              <div style={{ position: 'absolute', inset: 0, background: DEEP_BLUE, zIndex: 1, opacity: 0.4 }}>
                <OptimizedImage src={item.photo} width={1200} quality={70} alt="hero" objectFit="cover" />
              </div>
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to top, ' + DEEP_BLUE + ', transparent)' }} />
              <div style={{ position: 'absolute', bottom: '2rem', left: '3rem', zIndex: 3 }}>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  style={{ color: GOLD, fontWeight: 900, letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Distinguished Profile
                </motion.div>
                <div style={{ fontSize: 'clamp(2rem, 8vw, 4rem)', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '-2px', lineHeight: 1 }}>
                  {item.name}
                </div>
              </div>
            </ProfileHero>

            <ProfileDetails>
              <StatsGrid>
                <StatItem>
                  <label>Rank Designation</label>
                  <span>{getFullRank(item.rank)}</span>
                </StatItem>
                <StatItem>
                  <label>Mission / Event</label>
                  <span>{item.title}</span>
                </StatItem>
                <StatItem>
                  <label>Deployment</label>
                  <span>Batch {item.batch} • {item.date}</span>
                </StatItem>
              </StatsGrid>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem' }}>
                <DescriptionBox>
                  <div className="icon"><Target size={24} /></div>
                  <div>
                    <div style={{ color: GOLD, fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Honor Report</div>
                    <p>{item.description}</p>
                  </div>
                </DescriptionBox>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,215,0,0.1)' }}>
                    <div style={{ color: GOLD, fontWeight: 900, marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Verification & Records</div>
                    {item.reportUrl ? (
                      <ActionButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onReportClick({ Name: item.title, pdfURL: item.reportUrl })}
                      >
                        <FileText size={20} /> Access Full Dossier
                      </ActionButton>
                    ) : (
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                        No attached dossier for this profile.
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DEEP_BLUE }}>
                      <Award size={20} />
                    </div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Verified Achievement • National Cadet Corps</span>
                  </div>
                </div>
              </div>
            </ProfileDetails>
          </ProfileReveal>
        )}
      </AnimatePresence>
    </>
  );
};

export default IndividualAchievementCard;
