import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { ArrowLeft, Users, Shield, Zap, Compass, Heart, Share2, Sparkles, MapPin, GraduationCap, IdCard } from 'lucide-react';
import { db } from '../firebase';
import SEO from '../components/common/SEO';
import { getFullRank } from '../rankStructure';
import OptimizedImage from '../components/common/OptimizedImage';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #fdfdfd;
  background-image: 
    radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.03) 0%, transparent 50%);
  padding: 140px 2rem 100px;
  color: #0f172a;
`;

const ContentWrapper = styled.div`
  max-width: 1700px;
  margin: 0 auto;
`;

const BackButton = styled(motion.button)`
  position: fixed; top: 40px; left: 40px; background: white; border: 1px solid #f1f5f9;
  width: 54px; height: 54px; border-radius: 20px; color: #0f172a; display: flex; align-items: center; justify-content: center;
  cursor: pointer; z-index: 100; box-shadow: 0 10px 25px rgba(0,0,0,0.05);
  &:hover { background: #0f172a; color: white; border-color: #0f172a; }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BatchBadge = styled.div`
  display: inline-flex;
  align-items: center;
  background: #0f172a;
  color: white;
  padding: 0.6rem 2rem;
  border-radius: 50px;
  font-weight: 800;
  font-size: 0.9rem;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.2);
  margin-bottom: 1rem;
`;

const BatchNav = styled.div`
  display: flex;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 24px;
  border: 1px solid #f1f5f9;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

const BatchTab = styled.button`
  background: ${props => props.active ? 'white' : 'transparent'};
  color: ${props => props.active ? '#0f172a' : '#94a3b8'};
  border: none;
  padding: 0.6rem 1.8rem;
  border-radius: 18px;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: ${props => props.active ? '0 10px 20px rgba(0,0,0,0.05)' : 'none'};
  &:hover { color: #0f172a; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1.5rem;
  padding-bottom: 2rem;
  width: 100%;
  
  @media (max-width: 1400px) {
    gap: 1rem;
  }

  @media (max-width: 1100px) {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 50px;
  border: 1px solid #f1f5f9;
  padding: 3.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.02);
  position: relative;
  overflow: hidden;
  min-width: 0; /* Allow cards to shrink to fit grid */

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: ${props => props.$color};
    opacity: 0.8;
  }
`;

const PhotoContainer = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 60px;
  background: white;
  padding: 8px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 30px 60px rgba(0,0,0,0.06);
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 2;

  .img-box {
    width: 100%;
    height: 100%;
    border-radius: 52px;
    overflow: hidden;
    position: relative;
  }
`;

const RoleTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${props => props.$color + '10'};
  color: ${props => props.$color};
  padding: 0.5rem 1.25rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  margin-bottom: 1rem;
`;

const RankText = styled.div`
  font-size: 0.85rem;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 0.25rem;
  span { display: block; color: #cbd5e1; font-weight: 700; font-size: 0.75rem; margin-top: 2px; }
`;

const FullName = styled.h2`
  font-size: 1.6rem;
  font-weight: 950;
  color: #0f172a;
  letter-spacing: -0.5px;
  line-height: 1.1;
  margin: 0.5rem 0 1.5rem;
  min-height: 2.2em;
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-word;

  @media (max-width: 1400px) {
    font-size: 1.4rem;
  }
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: linear-gradient(to right, transparent, #f1f5f9, transparent);
  margin-bottom: 2rem;
`;

const InfoStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #64748b;
  font-weight: 750;
  font-size: 0.95rem;
  
  svg { color: #cbd5e1; flex-shrink: 0; }
`;

const WatermarkIcon = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  opacity: 0.03;
  color: #000;
  transform: rotate(-15deg);
`;

const MagicMembersPage = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [activeBatch, setActiveBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  const roles = [
    { name: 'Mastermind', icon: Zap, color: '#fbbf24' },
    { name: 'Advocate', icon: Shield, color: '#10b981' },
    { name: 'Guide', icon: Compass, color: '#3b82f6' },
    { name: 'Influencer', icon: Heart, color: '#f43f5e' },
    { name: 'Communicator', icon: Share2, color: '#a855f7' }
  ];

  useEffect(() => {
    const fetchMems = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'magicMembers')));
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembers(items);
        const b = [...new Set(items.map(m => m.batch).filter(Boolean))].sort((a, b) => b.localeCompare(a));
        if (b.length > 0) setActiveBatch(b[0]);
        else setActiveBatch('2023-2026');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchMems();
  }, []);

  const batches = useMemo(() => {
    return [...new Set(members.map(m => m.batch).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  }, [members]);

  const displayedList = useMemo(() => {
    const map = {};
    members.filter(m => m.batch === activeBatch).forEach(m => { map[m.role] = m; });
    return map;
  }, [members, activeBatch]);

  if (loading) return null;

  return (
    <PageContainer>
      <SEO title="MAGIC Elite" description="The core strategic leadership team of Sairam NCC." />
      <BackButton whileHover={{ scale: 1.1, x: -5 }} onClick={() => navigate('/')}><ArrowLeft size={24} /></BackButton>

      <ContentWrapper>
        <Header>
          <BatchBadge>BATCH {activeBatch}</BatchBadge>
          <BatchNav>
            {batches.map(b => (
              <BatchTab key={b} active={activeBatch === b} onClick={() => setActiveBatch(b)}>{b}</BatchTab>
            ))}
          </BatchNav>
        </Header>

        <AnimatePresence mode="wait">
          <Grid key={activeBatch}>
            {roles.map((r, i) => {
              const m = displayedList[r.name];
              if (!m) return null;

              const fullRank = getFullRank(m.rank) || 'CADET';
              const rankShort = m.rank ? `(${m.rank.toUpperCase()})` : '';

              return (
                <Card
                  key={r.name}
                  $color={r.color}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  whileHover={{ y: -15, boxShadow: '0 40px 80px rgba(0,0,0,0.06)' }}
                >
                  <WatermarkIcon><r.icon size={150} /></WatermarkIcon>

                  <PhotoContainer>
                    <div className="img-box">
                      {m.photoURL ? (
                        <OptimizedImage
                          src={m.photoURL}
                          width={400}
                          quality={95}
                          alt={m.name}
                          objectFit="cover"
                          objectPosition="top center"
                          style={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <div style={{ height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={60} color="#cbd5e1" /></div>
                      )}
                    </div>
                  </PhotoContainer>

                  <RoleTag $color={r.color}>{r.name}</RoleTag>

                  <RankText>
                    {getFullRank(m.rank) || 'CADET'}
                  </RankText>

                  <FullName>{m.name}</FullName>

                  <Divider />

                  <InfoStack>
                    <InfoRow><GraduationCap size={18} /> {m.department}</InfoRow>
                    <InfoRow><MapPin size={18} /> Section {m.section}</InfoRow>
                    <InfoRow><IdCard size={18} /> {m.studentID}</InfoRow>
                  </InfoStack>
                </Card>
              );
            })}
          </Grid>
        </AnimatePresence>
      </ContentWrapper>
    </PageContainer>
  );
};

export default MagicMembersPage;
