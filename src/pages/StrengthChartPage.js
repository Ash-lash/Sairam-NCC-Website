import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, RefreshCw, BarChart2, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';

// --- STYLING (NCC PREMIUM LIGHT THEME) ---
const PageContainer = styled.div`
  min-height: 100vh;
  background: #fdfdfd;
  background-image: 
    radial-gradient(at 0% 0%, hsla(253,16%,7%,0.03) 0, transparent 50%), 
    radial-gradient(at 50% 0%, hsla(225,39%,30%,0.03) 0, transparent 50%), 
    radial-gradient(at 100% 0%, hsla(339,49%,30%,0.03) 0, transparent 50%);
  padding: 160px 2rem 4rem;
  color: #1e293b;
  position: relative;
  font-family: 'Exo 2', sans-serif;
  overflow-x: hidden;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const BackButton = styled(motion.button)`
  position: absolute;
  top: 10px;
  left: 0;
  background: #c9a227;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: white;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(201, 162, 39, 0.3);
  z-index: 100;
  
  &:hover { 
    background: #b08e21; 
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(201, 162, 39, 0.4);
  }

  svg {
    stroke-width: 3px;
  }
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: 60px;
  position: relative;
`;

const TitleSpan = styled.h1`
  font-family: 'Cinzel', serif;
  font-size: clamp(1.8rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #1A2B4C, #c9a227);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  text-transform: uppercase;
`;

const SubtitleP = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 1.1rem;
  color: #64748b;
  font-weight: 700;
  letter-spacing: 4px;
  margin-top: 12px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const SecLabel = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #1A2B4C;
  text-transform: uppercase;
  margin-bottom: 30px;
  margin-top: 40px;
  display: flex;
  align-items: center;
  gap: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f1f5f9;

  &::before {
    content: '';
    width: 40px;
    height: 4px;
    background: #c9a227;
    border-radius: 2px;
  }
`;

/* ── STATS CARDS ── */
const HeroRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 340px 1fr;
  gap: 24px;
  margin-bottom: 60px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const StatGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
`;

const StatCard = styled(motion.div)`
  background: white;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 20px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    right: 0; top: 0; height: 100%; width: 4px;
    background: ${props => props.$color};
  }
`;

const StatVal = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 48px;
  font-weight: 800;
  color: ${props => props.$color || '#1e293b'};
  line-height:1;
`;

const StatLabel = styled.div`
  font-size: 14px;
  letter-spacing: 2px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
`;

const TotalBox = styled(motion.div)`
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-radius: 24px;
  border: 2px solid #c9a227;
  padding: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%; left: -50%; width: 200%; height: 200%;
    background: radial-gradient(circle, rgba(201, 162, 39, 0.1) 0%, transparent 60%);
  }
`;

const TotalVal = styled.div`
  font-family: 'Cinzel', serif;
  font-size: 90px;
  font-weight: 900;
  line-height: 1;
  color: #c9a227;
  text-shadow: 0 0 30px rgba(201, 162, 39, 0.3);
  position: relative;
  z-index: 1;
`;

const TotalLbl = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 14px;
  letter-spacing: 4px;
  color: #94a3b8;
  text-transform: uppercase;
  margin-top: 15px;
  position: relative;
  z-index: 1;
`;

/* ── WING CARDS ── */
const WingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 60px;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const WingCard = styled(motion.div)`
  background: white;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 24px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.04);
  position: relative;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 6px;
    background: ${props => props.$color};
    border-radius: 24px 24px 0 0;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 25px 50px rgba(0,0,0,0.08);
  }
`;

const WingHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
`;

const WingTitleGrp = styled.div`
  .icon { font-size: 38px; margin-bottom: 12px; }
  .name {
    font-family: 'Rajdhani', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: ${props => props.$color};
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .unit {
    font-size: 11px;
    color: #64748b;
    margin-top: 5px;
    text-transform: uppercase;
    font-weight: 700;
  }
`;

const WingMainNum = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 54px;
  font-weight: 900;
  color: ${props => props.$color};
  line-height: 1;
  text-shadow: 0 4px 10px ${props => props.$color}20;
`;

const GenderGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 30px;
`;

const GenderItem = styled.div`
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px 8px;
  text-align: center;
  border: 1px solid #f1f5f9;

  .val {
    font-family: 'Rajdhani', sans-serif;
    font-size: 24px;
    font-weight: 800;
    color: ${props => props.$color || '#1e293b'};
  }
  .lbl {
    font-size: 10px;
    color: #94a3b8;
    text-transform: uppercase;
    margin-top: 5px;
    font-weight: 700;
    letter-spacing: 1px;
  }
`;

const YearList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const YearRow = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  .lbl {
    font-size: 11px;
    color: #475569;
    width: 50px;
    font-weight: 800;
    text-transform: uppercase;
  }
  .bar-track {
    flex: 1;
    height: 8px;
    background: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: ${props => props.$color};
    border-radius: 4px;
  }
  .num {
    font-size: 14px;
    color: #1e293b;
    font-weight: 800;
    width: 30px;
    text-align: right;
  }
`;

/* ── DEPT CHART ── */
const DeptSection = styled.div`
  background: white;
  border-radius: 30px;
  padding: 50px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.03);
`;

const DeptBarRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 200px 1fr 60px;
  align-items: center;
  gap: 20px;
  margin-bottom: 18px;

  @media (max-width: 640px) {
    grid-template-columns: 100px 1fr 40px;
  }
`;

const DeptLabel = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 15px;
  font-weight: 800;
  color: #1A2B4C;
  text-align: right;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const MultiSegmentBar = styled.div`
  height: 30px;
  background: #f8fafc;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
`;

const BarSeg = styled(motion.div)`
  height: 100%;
  background: ${props => props.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 800;
  color: white;
  min-width: 0;
  overflow: hidden;
`;

const DeptSumNum = styled.div`
  font-family: 'Rajdhani', sans-serif;
  font-size: 22px;
  font-weight: 900;
  color: #1A2B4C;
  text-align: center;
`;

const LegendGrid = styled.div`
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-top: 50px;
  padding-top: 40px;
  border-top: 1px solid #f1f5f9;
  flex-wrap: wrap;
`;

const LegItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  .box { width: 16px; height: 16px; border-radius: 4px; background: ${props => props.$color}; box-shadow: 0 2px 4px ${props => props.$color}30; }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 40px;
  flex-wrap: wrap;
`;

const FilterBtn = styled.button`
  padding: 10px 20px;
  border-radius: 10px;
  border: 2px solid ${props => props.$active ? '#c9a227' : '#f1f5f9'};
  background: ${props => props.$active ? '#c9a227' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-family: 'Rajdhani', sans-serif;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: ${props => props.$active ? '0 4px 15px rgba(201, 162, 39, 0.3)' : 'none'};

  &:hover {
    border-color: #c9a227;
    color: ${props => props.$active ? 'white' : '#c9a227'};
  }
`;

/* ── CONSTANTS ── */
const WING_COLORS = {
  'ARMY BTY': '#D22B2B', // Red
  'ARMY MED': '#8B4513', // Brown
  'NAVY': '#1e3a8a',     // Dark Blue
  'AIR': '#0ea5e9'       // Light Blue
};

const WING_ICONS = {
  'ARMY BTY': '🪖',
  'ARMY MED': '⚕️',
  'NAVY': '⚓',
  'AIR': '✈️'
};

const WING_UNITS = {
  'ARMY BTY': '1 (TN) BTY NCC',
  'ARMY MED': '1 (TN) MED NCC',
  'NAVY': '4 (TN) NAVAL TECH NCC',
  'AIR': '1 (TN) AIR SQN NCC'
};

/* ── UTILS ── */
const getAcademicYear = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  // PROMOTION IN APRIL (Month index 3)
  return currentMonth >= 3 ? currentYear : currentYear - 1;
};

const getCollegeYear = (batchValue) => {
  const academicYear = getAcademicYear();
  const match = (batchValue || '').toString().match(/(\d{4})/);
  const startYear = match ? parseInt(match[0]) : 0;
  if (!startYear) return 1;

  const yos = academicYear - startYear + 1;
  return yos; // Return actual number of years since start
};

const normalizeWing = (wingStr) => {
  const w = (wingStr || '').trim().toLowerCase();
  if (w.includes('bn')) return 'OTHER'; 
  if (w.includes('med')) return 'ARMY MED';
  if (w.includes('navy')) return 'NAVY';
  if (w.includes('air')) return 'AIR';
  if (w.includes('army') || w.includes('bty') || w.includes('battery')) return 'ARMY BTY';
  return 'OTHER';
};

const guessGender = (name) => {
  const lowerName = (name || '').toLowerCase();
  if (lowerName.startsWith('ms ') || lowerName.startsWith('miss ')) return 'F';
  if (lowerName.startsWith('mr ')) return 'M';
  const firstName = lowerName.split(' ')[0];
  const femaleNames = ['priya', 'devi', 'sneha', 'swetha', 'divya', 'pooja', 'kavya', 'ramya', 'shruthi'];
  if (femaleNames.includes(firstName)) return 'F';
  const lastChar = firstName.slice(-1);
  if (firstName.length > 3 && (lastChar === 'a' || lastChar === 'i')) {
    if (['krishna', 'shiva', 'surya', 'aditya', 'muralidhara', 'raja'].includes(firstName)) return 'M';
    return 'F';
  }
  return 'M';
};

const StrengthChartPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [data, setData] = useState({
    total: 0, males: 0, females: 0,
    byWing: { 'ARMY BTY': 0, 'ARMY MED': 0, 'NAVY': 0, 'AIR': 0 },
    detailed: {
      'ARMY BTY': { 1: 0, 2: 0, 3: 0, 4: 0, alumni: 0, m: 0, f: 0 },
      'ARMY MED': { 1: 0, 2: 0, 3: 0, 4: 0, alumni: 0, m: 0, f: 0 },
      'NAVY': { 1: 0, 2: 0, 3: 0, 4: 0, alumni: 0, m: 0, f: 0 },
      'AIR': { 1: 0, 2: 0, 3: 0, 4: 0, alumni: 0, m: 0, f: 0 }
    },
    byDept: {}
  });

  const [deptFilter, setDeptFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const cadetsSnap = await getDocs(collection(db, 'cadets'));
      const alumniSnap = await getDocs(collection(db, 'alumni'));

      const finalData = {
        total: 0, males: 0, females: 0,
        byWing: { 'ARMY BTY': 0, 'ARMY MED': 0, 'NAVY': 0, 'AIR': 0 },
        detailed: {
          'ARMY BTY': { 1: 0, 2: 0, 3: 0, 4: 0, alumni: 0, m: 0, f: 0 },
          'ARMY MED': { 1: 0, 2: 0, 3: 0, 4: 0, alumni: 0, m: 0, f: 0 },
          'NAVY': { 1: 0, 2: 0, 3: 0, 4: 0, alumni: 0, m: 0, f: 0 },
          'AIR': { 1: 0, 2: 0, 3: 0, 4: 0, alumni: 0, m: 0, f: 0 }
        },
        byDept: {}
      };

      const processRecord = (docData, isForceAlumni) => {
        const w = normalizeWing(docData.Wing || docData.wing || '');
        if (!finalData.byWing[w] && finalData.byWing[w] !== 0) return;

        const year = getCollegeYear(docData.Batch);
        const gender = guessGender(docData.Name || docData.name);
        const isPassedOut = isForceAlumni || year > 4;
        const yearKey = isPassedOut ? 'alumni' : year.toString();

        finalData.total++;
        finalData.byWing[w]++;
        
        if (isPassedOut) {
          finalData.detailed[w].alumni++;
        } else {
          finalData.detailed[w][year]++;
        }
        
        if (gender === 'M') {
          finalData.males++;
          finalData.detailed[w].m++;
        } else {
          finalData.females++;
          finalData.detailed[w].f++;
        }

        const deptOrig = docData.dept || docData.department || '';
        const dept = deptOrig.toUpperCase().trim() || 'UNKNOWN';
        
        if (w !== 'OTHER') {
          if (!finalData.byDept[dept]) {
            const init = { 'ARMY BTY': 0, 'ARMY MED': 0, 'NAVY': 0, 'AIR': 0, total: 0 };
            finalData.byDept[dept] = {
              'ALL': { ...init }, '1': { ...init }, '2': { ...init }, '3': { ...init }, '4': { ...init }, 'alumni': { ...init }
            };
          }
          // Update ALL
          finalData.byDept[dept].ALL[w]++;
          finalData.byDept[dept].ALL.total++;
          
          // Update Specific Year
          if (finalData.byDept[dept][yearKey]) {
            finalData.byDept[dept][yearKey][w]++;
            finalData.byDept[dept][yearKey].total++;
          }
        }
      };

      cadetsSnap.forEach(d => processRecord(d.data(), false));
      alumniSnap.forEach(d => processRecord(d.data(), true));

      setData(finalData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageContainer style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={48} color="#c9a227" className="animate-spin" />
        <h2 style={{ marginTop: '20px', fontFamily: 'Rajdhani', color: '#1A2B4C' }}>FETCHING WING DATA...</h2>
      </PageContainer>
    );
  }

  const sortedDepts = Object.entries(data.byDept).sort((a, b) => b[1].total - a[1].total);
  const maxDept = sortedDepts.length > 0 ? sortedDepts[0][1].total : 1;

  return (
    <PageContainer>
      <SEO title="NCC Strength Chart" description="Live Cadet strength analytics for Sri Sairam Engineering College NCC units." />
      
      <ContentWrapper>
        <BackButton onClick={() => navigate('/')} whileTap={{ scale: 0.95 }}>
          <ArrowLeft size={20} />
          Back to Home
        </BackButton>

        <HeaderSection>
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <TitleSpan>Sri Sairam Engineering College</TitleSpan>
            <SubtitleP>
              <BarChart2 size={24} color="#c9a227" />
              NCC Cadets Strength Analysis
            </SubtitleP>
          </motion.div>
        </HeaderSection>

        <HeroRow>
          <StatGrid>
             <StatCard $color="#D22B2B" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <StatVal $color="#D22B2B">{data.males}</StatVal>
                <div style={{ flex: 1 }}><StatLabel>Male Personnel</StatLabel></div>
             </StatCard>
             <StatCard $color="#0ea5e9" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <StatVal $color="#0ea5e9">{data.females}</StatVal>
                <div style={{ flex: 1 }}><StatLabel>Female Personnel</StatLabel></div>
             </StatCard>
          </StatGrid>

          <TotalBox 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 1 }}
          >
            <TotalVal>{data.total}</TotalVal>
            <TotalLbl>Total Enrolled Registry</TotalLbl>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>
               Dynamic April Promotion Active
            </div>
          </TotalBox>

          <StatGrid>
             <StatCard $color="#1e3a8a" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                <StatVal $color="#1e3a8a">{Object.values(data.byWing).reduce((a,b)=>a+b, 0)}</StatVal>
                <div style={{ flex: 1 }}><StatLabel>Wing Totals</StatLabel></div>
             </StatCard>
             <StatCard $color="#c9a227" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                <StatVal $color="#c9a227">{Object.keys(data.byDept).length}</StatVal>
                <div style={{ flex: 1 }}><StatLabel>Departments</StatLabel></div>
             </StatCard>
          </StatGrid>
        </HeroRow>

        <SecLabel>Wing-Wise Detailed Strength</SecLabel>
        
        <WingsGrid>
          {Object.keys(WING_COLORS).map((w, idx) => {
            const wData = data.detailed[w];
            const wTotal = data.byWing[w];
            const color = WING_COLORS[w];
            const share = data.total ? Math.round((wTotal / data.total) * 100) : 0;
            const years = [
              { l: 'I YR', v: wData[1] },
              { l: 'II YR', v: wData[2] },
              { l: 'III YR', v: wData[3] },
              { l: 'IV YR', v: wData[4] },
              { l: 'Alumni', v: wData.alumni }
            ];
            const maxWYear = Math.max(...years.map(y => y.v), 1);

            return (
              <WingCard 
                key={w} 
                $color={color} 
                initial={{ y: 30, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.4 + (idx * 0.1) }}
              >
                <WingHeader>
                  <WingTitleGrp $color={color}>
                    <div className="icon">{WING_ICONS[w]}</div>
                    <div className="name">{w.replace('ARMY ', '')} Wing</div>
                    <div className="unit">{WING_UNITS[w]}</div>
                  </WingTitleGrp>
                  <WingMainNum $color={color}>{wTotal}</WingMainNum>
                </WingHeader>

                <GenderGrid>
                  <GenderItem $color="#D22B2B"><div className="val">{wData.m}</div><div className="lbl">M</div></GenderItem>
                  <GenderItem $color="#0ea5e9"><div className="val">{wData.f}</div><div className="lbl">F</div></GenderItem>
                  <GenderItem $color="#c9a227"><div className="val">{share}%</div><div className="lbl">Share</div></GenderItem>
                </GenderGrid>

                <YearList>
                  {years.map(y => (
                    <YearRow key={y.l} $color={color}>
                      <div className="lbl">{y.l}</div>
                      <div className="bar-track">
                        <motion.div 
                          className="bar-fill" 
                          initial={{ width: 0 }} 
                          animate={{ width: `${(y.v / maxWYear) * 100}%` }}
                          transition={{ duration: 1, delay: 0.6 }}
                        />
                      </div>
                      <div className="num">{y.v}</div>
                    </YearRow>
                  ))}
                </YearList>

                <div style={{ marginTop: '20px', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                    <motion.div style={{ height: '100%', background: color }} initial={{ width: 0 }} animate={{ width: `${share}%` }} />
                </div>
              </WingCard>
            );
          })}
        </WingsGrid>

        <SecLabel>Department-Wise Cadet Strength ({deptFilter === 'ALL' ? 'All Personnel' : `${deptFilter} Yr`})</SecLabel>
        
        <FilterContainer>
          {['ALL', '1', '2', '3', '4', 'alumni'].map(f => (
            <FilterBtn 
              key={f} 
              $active={deptFilter === f} 
              onClick={() => setDeptFilter(f)}
            >
              {f === 'ALL' ? 'Overall' : f === 'alumni' ? 'Alumni' : `${f}${f === '1' ? 'st' : f === '2' ? 'nd' : f === '3' ? 'rd' : 'th'} Year`}
            </FilterBtn>
          ))}
        </FilterContainer>

        <DeptSection>
          {Object.entries(data.byDept)
            .map(([deptName, yearsData]) => [deptName, yearsData[deptFilter]])
            .filter(([_, dData]) => dData.total > 0)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([deptName, dData], idx) => {
              const maxForFilter = Math.max(...Object.values(data.byDept).map(yd => yd[deptFilter].total), 1);
              const sumRow = dData.total;
              return (
                <DeptBarRow key={deptName} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                  <DeptLabel>{deptName}</DeptLabel>
                  <MultiSegmentBar>
                    {['ARMY BTY', 'ARMY MED', 'NAVY', 'AIR'].map(wKey => {
                      const val = dData[wKey];
                      if (val <= 0) return null;
                      const pctOfMax = (val / maxForFilter) * 100;
                      return (
                        <BarSeg 
                          key={wKey}
                          $color={WING_COLORS[wKey]} 
                          initial={{ width: 0 }} 
                          animate={{ width: `${pctOfMax}%` }}
                          transition={{ duration: 1 }}
                        >
                          {val}
                        </BarSeg>
                      );
                    })}
                  </MultiSegmentBar>
                  <DeptSumNum>{sumRow}</DeptSumNum>
                </DeptBarRow>
              );
            })}


          <LegendGrid>
            <LegItem $color={WING_COLORS['ARMY BTY']}><div className="box" /> Army BTY</LegItem>
            <LegItem $color={WING_COLORS['ARMY MED']}><div className="box" /> Army MED</LegItem>
            <LegItem $color={WING_COLORS['NAVY']}><div className="box" /> Navy</LegItem>
            <LegItem $color={WING_COLORS['AIR']}><div className="box" /> Air</LegItem>
          </LegendGrid>
        </DeptSection>

        <div style={{ textAlign: 'center', marginTop: '80px', color: '#94a3b8', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase' }}>
          Real-time Wing Analytics • Sri Sairam Engineering College
        </div>
      </ContentWrapper>
    </PageContainer>
  );
};

export default StrengthChartPage;
