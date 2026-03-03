import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileText, Award, Shield, Target } from 'lucide-react';
import { getOptimizedUrl } from '../../utils/imageOptimizer';
import OptimizedImage from '../common/OptimizedImage';

const GOLD = '#FFD700';
const DEEP_BLUE = '#020617';

const SquadVanguardContainer = styled(motion.div)`
  height: 600px;
  position: relative;
  border-radius: 32px;
  background: ${DEEP_BLUE};
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 50px 100px -20px rgba(0,0,0,0.7);
  border: 1px solid rgba(255, 215, 0, 0.1);
  container-type: inline-size;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 20%, rgba(0,0,0,0.85) 100%);
    z-index: 2;
  }
`;

const SquadSignaturePhoto = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 1;
`;

const SpotlightOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  z-index: 3;
  padding: 3rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end; /* CONSISTENT WITH INDIVIDUAL CARD */
  gap: 2rem;
  background: linear-gradient(to top, rgba(2, 6, 23, 0.95), transparent 70%);
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

const SquadTitleHighlight = styled.h3`
  font-size: clamp(0.5rem, 4cqw, 2.8rem);
  font-weight: 900;
  color: white;
  margin: 0.5rem 0;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: visible;
  width: 100%;
  display: block;
  box-sizing: border-box;
`;

const SquadReveal = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: ${DEEP_BLUE};
  display: flex;
  flex-direction: column;
`;

const SquadHero = styled.div`
height: 320px;
width: 100 %;
position: relative;
overflow: hidden;
`;

const SquadDetails = styled.div`
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
  margin-bottom: 3.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 2rem;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  label {
    color: ${GOLD};
    font-size: 0.75rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  
  span {
    color: white;
    font-size: 1.2rem;
    font-weight: 700;
  }
`;

const ActionButton = styled(motion.button)`
  background: ${GOLD};
  color: ${DEEP_BLUE};
  border: none;
  padding: 1.2rem 2.5rem;
  border-radius: 16px;
  font-weight: 900;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  box-shadow: 0 15px 35px ${GOLD}44;
`;

const OperativeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.5rem;
`;

const OperativeCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 215, 0, 0.1);
  border-radius: 24px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  .portrait {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 1rem;
    border: 2px solid ${GOLD};
    background: #1e293b;
  }
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: 2rem;
  right: 2rem;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10000;
`;

const GroupAchievementCard = ({ item, onReportClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <SquadVanguardContainer
        onClick={() => setIsExpanded(true)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ y: -10 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <SquadSignaturePhoto
          animate={{ scale: isHovered ? 1.05 : 1 }}
        >
          <OptimizedImage
            src={item.photo || item.groupPhotoUrl}
            width={800}
            quality={85}
            alt={item.title}
            objectFit="cover"
            style={{
              width: '100%',
              height: '100%',
              objectPosition: 'center 15%',
              filter: isHovered ? 'brightness(0.9) saturate(1.2)' : 'brightness(0.8) saturate(1)'
            }}
          />
        </SquadSignaturePhoto>

        <SpotlightOverlay>
          <div style={{ position: 'absolute', top: '3rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
            <div style={{ background: GOLD, color: DEEP_BLUE, padding: '0.4rem 1rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase' }}>
              Squad Honor
            </div>
            <Users color={GOLD} size={24} />
          </div>

          <div>
            <RankStripe>
              <span style={{ color: GOLD, fontSize: '0.75rem', fontWeight: 900, letterSpacing: '4px' }}>DISTINGUISHED SQUAD</span>
            </RankStripe>
            <SquadTitleHighlight>{item.title}</SquadTitleHighlight>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Users size={16} /> {item.cadets?.length || 0} Operatives Recognized
            </div>
          </div>
        </SpotlightOverlay>
      </SquadVanguardContainer>

      <AnimatePresence>
        {isExpanded && (
          <SquadReveal
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <CloseButton onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}>✕</CloseButton>

            <SquadHero>
              <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.4 }}>
                <OptimizedImage src={item.photo || item.groupPhotoUrl} width={1600} quality={70} alt="hero" objectFit="cover" />
              </div>
              <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'linear-gradient(to top, ' + DEEP_BLUE + ', transparent)' }} />
              <div style={{ position: 'absolute', bottom: '2rem', left: '3rem', zIndex: 3 }}>
                <div style={{ color: GOLD, fontWeight: 900, letterSpacing: '10px', textTransform: 'uppercase', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  Mission Briefing
                </div>
                <div style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '-2px', lineHeight: 1 }}>
                  {item.title}
                </div>
              </div>
            </SquadHero>

            <SquadDetails>
              {/* SHOW TEH CADETS FULLY IN THE TOP ITSELF FOR GROUP */}
              <div style={{ marginBottom: '4rem' }}>
                <div style={{ color: GOLD, fontWeight: 900, fontSize: '1.2rem', textAlign: 'center', marginBottom: '3rem', textTransform: 'uppercase', letterSpacing: '6px' }}>
                  Full Squad Operatives
                </div>
                <OperativeGrid>
                  {item.cadets?.map((cadet, i) => (
                    <OperativeCard
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="portrait">
                        <OptimizedImage src={cadet.photoUrl} width={160} quality={85} alt={cadet.name} objectFit="cover" />
                      </div>
                      <div style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>{cadet.name}</div>
                      <div style={{ color: GOLD, fontWeight: 700, fontSize: '0.8rem', marginTop: '0.4rem', textTransform: 'uppercase' }}>{cadet.rank}</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '0.5rem' }}>{cadet.department}</div>
                    </OperativeCard>
                  ))}
                </OperativeGrid>
              </div>

              <StatsGrid>
                <StatItem>
                  <label>Achievement Category</label>
                  <span>Squad Mission</span>
                </StatItem>
                <StatItem>
                  <label>Honor Status</label>
                  <span>Distinguished Deployment</span>
                </StatItem>
                <StatItem>
                  <label>Deployment Date</label>
                  <span>{item.date}</span>
                </StatItem>
              </StatsGrid>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '4rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4rem' }}>
                <div>
                  <div style={{ color: GOLD, fontWeight: 900, marginBottom: '2rem', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Target size={24} /> Mission Report
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.25rem', lineHeight: 1.8, fontWeight: 300, fontFamily: 'Outfit, sans-serif' }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                  {item.reportUrl && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2.5rem', borderRadius: '28px', border: '1px solid rgba(255,215,0,0.1)' }}>
                      <div style={{ color: GOLD, fontWeight: 900, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem' }}>Verification & Records</div>
                      <ActionButton
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onReportClick({ Name: item.title, pdfURL: item.reportUrl })}
                      >
                        <FileText size={20} /> Access Mission Dossier
                      </ActionButton>
                    </div>
                  )}

                  <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DEEP_BLUE }}>
                      <Shield size={20} />
                    </div>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>Verified Group Achievement</span>
                  </div>
                </div>
              </div>
            </SquadDetails>
          </SquadReveal>
        )}
      </AnimatePresence>
    </>
  );
};

export default GroupAchievementCard;
