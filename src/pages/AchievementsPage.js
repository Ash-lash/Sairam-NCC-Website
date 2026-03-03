import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users } from 'lucide-react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/common/SEO';
import CadetDetailModal from '../components/ui/CadetDetailModal';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import IndividualAchievementCard from '../components/achievements/IndividualAchievementCard';
import GroupAchievementCard from '../components/achievements/GroupAchievementCard';

const PageContainer = styled.div`
  min-height: 100vh;
  padding: 120px 2rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const PageTitle = styled(motion.h1)`
  font-size: 4rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #1A2B4C 0%, #2D4A7C 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media(max-width: 768px) { font-size: 2.5rem; }
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  font-size: 1.25rem;
  margin-bottom: 4rem;
  font-weight: 300;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const SectorSelector = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 4rem;
  background: #f1f5f9;
  padding: 0.5rem;
  border-radius: 99px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
`;

const SectorButton = styled.button`
  padding: 0.8rem 2rem;
  border: none;
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? '#1A2B4C' : '#64748b'};
  border-radius: 99px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};
  svg { color: ${props => props.$active ? '#FFD700' : 'inherit'}; }
`;

const FilterSection = styled.div` margin-bottom: 4rem; `;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  &:last-child { border-bottom: none; padding-bottom: 0; margin-bottom: 0; }
`;

const FilterTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 700;
  color: #1a2b4c;
  margin: 0;
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &::before { content: ''; display: block; width: 4px; height: 24px; background: #FFBF00; border-radius: 4px; }
`;

const FilterGrid = styled.div` display: flex; flex-wrap: wrap; gap: 0.8rem; `;

const FilterButton = styled(motion.button)`
  padding: 0.6rem 1.2rem;
  border: 1px solid ${props => props.$active ? '#1A2B4C' : 'rgba(0,0,0,0.1)'};
  background: ${props => props.$active ? '#1A2B4C' : 'white'};
  color: ${props => props.$active ? 'white' : '#555'};
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
`;

const AchievementsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 3rem;
  @media(max-width: 768px) { grid-template-columns: 1fr; }
`;

const NoResults = styled.div` text-align: center; color: #64748b; font-size: 1.25rem; padding: 6rem 2rem; `;

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedWing, setSelectedWing] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [sector, setSector] = useState('individual');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'achievements')));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => (a.order !== undefined && b.order !== undefined) ? a.order - b.order : new Date(b.date) - new Date(a.date));
        setAchievements(data);
        const individualOnly = data.filter(a => !a.isGroup);
        const uniqueBatches = [...new Set(individualOnly.map(a => a.batch?.trim()).filter(Boolean))].sort();
        setBatches(uniqueBatches);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const filtered = useMemo(() => achievements.filter(a => {
    const bM = selectedBatch === 'All' || a.batch?.trim() === selectedBatch;
    const wM = selectedWing === 'All' || a.wing === selectedWing;
    const dM = selectedDepartment === 'All' || a.department === selectedDepartment;
    return bM && wM && dM;
  }), [achievements, selectedBatch, selectedWing, selectedDepartment]);

  const displayData = useMemo(() => {
    if (sector === 'individual') {
      return filtered.filter(a => !a.isGroup).map(a => ({
        ...a,
        photo: a.cadetPhotoUrl,
        name: a.cadetName,
        title: a.campName || a.eventName,
        isGroup: false
      }));
    }

    // Direct mapping for group achievements
    return achievements.filter(a => a.isGroup).map(a => ({
      ...a,
      title: a.campName || a.eventName,
      cadets: a.groupMembers || [],
      photo: a.groupPhotoUrl,
      isGroup: true
    }));
  }, [filtered, sector]);

  return (
    <PageContainer>
      <SEO title="Achievements" description="Hall of Fame of NCC Excellence." />
      <ContentWrapper>
        <PageTitle initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>Hall of Fame</PageTitle>
        <Subtitle>Honoring the exceptional spirit and service of our cadets.</Subtitle>

        <SectorSelector>
          <SectorButton $active={sector === 'individual'} onClick={() => setSector('individual')}><User size={18} /> Individual</SectorButton>
          <SectorButton $active={sector === 'group'} onClick={() => setSector('group')}><Users size={18} /> Group</SectorButton>
        </SectorSelector>

        {sector === 'individual' && (
          <FilterSection>
            <FilterGroup>
              <FilterTitle>Batch</FilterTitle>
              <FilterGrid>
                <FilterButton $active={selectedBatch === 'All'} onClick={() => setSelectedBatch('All')}>All</FilterButton>
                {batches.map(b => <FilterButton key={b} $active={selectedBatch === b} onClick={() => setSelectedBatch(b)}>{b}</FilterButton>)}
              </FilterGrid>
            </FilterGroup>
            <FilterGroup>
              <FilterTitle>Wing</FilterTitle>
              <FilterGrid>
                {['All', 'Army', 'Navy', 'Air'].map(w => <FilterButton key={w} $active={selectedWing === w} onClick={() => setSelectedWing(w)}>{w}</FilterButton>)}
              </FilterGrid>
            </FilterGroup>
          </FilterSection>
        )}

        {loading ? <NoResults>Loading Honors...</NoResults> : (
          <AchievementsGrid>
            {displayData.map((item, idx) => (
              item.isGroup ? (
                <GroupAchievementCard
                  key={item.id || idx}
                  item={item}
                  onReportClick={setSelectedReport}
                />
              ) : (
                <IndividualAchievementCard
                  key={item.id || idx}
                  item={item}
                  onReportClick={setSelectedReport}
                />
              )
            ))}
          </AchievementsGrid>
        )}

        <CadetDetailModal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} cadet={selectedReport} />
      </ContentWrapper>
    </PageContainer>
  );
};

export default AchievementsPage;
