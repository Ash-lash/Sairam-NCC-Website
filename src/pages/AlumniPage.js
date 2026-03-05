import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { GraduationCap, User, Briefcase, MapPin, Mail, Linkedin, Search, Filter, Users, Award, ArrowRight, Phone, Calendar } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/common/SEO';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import OptimizedImage from '../components/common/OptimizedImage';


// ─── NCC Colors ───
const NCC = {
  navy: '#1A2B4C', navyLight: '#2D4A7C',
  gold: '#FFBF00', goldLight: '#FFD700',
  bg: '#f4f6fb', white: '#ffffff',
  text: '#1e293b', textMid: '#475569', textLight: '#94a3b8',
  army: '#DC2626', navyWing: '#1E3A8A', air: '#0284c7',
};

const getWingColor = (wing) => {
  switch (wing) { case 'Army': return NCC.army; case 'Navy': return NCC.navyWing; case 'Air': return NCC.air; default: return NCC.navy; }
};
const getWingGrad = (wing) => {
  switch (wing) { case 'Army': return 'linear-gradient(135deg, #991b1b, #DC2626)'; case 'Navy': return 'linear-gradient(135deg, #1e3a5f, #2563eb)'; case 'Air': return 'linear-gradient(135deg, #075985, #0ea5e9)'; default: return `linear-gradient(135deg, ${NCC.navy}, ${NCC.navyLight})`; }
};

const fadeUp = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } }
};

const shimmer = keyframes`
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
`;

const Skeleton = styled.div`
  width: 100%;
  height: 100%;
  background: #f1f5f9;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: ${shimmer} 1.5s infinite linear;
  }
`;

// ─── Hero ───
const HeroSection = styled.section`
  background: linear-gradient(160deg, ${NCC.navy} 0%, ${NCC.navyLight} 60%, #1a3a6e 100%);
  padding: 140px 2rem 80px; text-align: center; position: relative; overflow: hidden;
  &::before { content:''; position:absolute; inset:0; background: radial-gradient(circle at 20% 80%, rgba(255,191,0,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%); }
  &::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:80px; background:${NCC.bg}; clip-path:ellipse(55% 100% at 50% 100%); }
`;
const HeroContent = styled.div`max-width:800px; margin:0 auto; position:relative; z-index:2;`;
const HeroBadge = styled(motion.div)`display:inline-flex; align-items:center; gap:0.5rem; background:rgba(255,191,0,0.15); border:1px solid rgba(255,191,0,0.3); padding:0.5rem 1.2rem; border-radius:50px; color:${NCC.gold}; font-size:0.85rem; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:1.5rem;`;
const HeroTitle = styled(motion.h1)`font-size:3.5rem; font-weight:900; color:white; margin-bottom:1.25rem; line-height:1.15; span{background:linear-gradient(135deg,${NCC.gold},${NCC.goldLight}); -webkit-background-clip:text; -webkit-text-fill-color:transparent;} @media(max-width:768px){font-size:2.2rem;}`;
const HeroSub = styled(motion.p)`font-size:1.15rem; color:rgba(255,255,255,0.7); max-width:600px; margin:0 auto 2.5rem; line-height:1.7;`;
const StatsRow = styled(motion.div)`display:flex; justify-content:center; gap:3rem; flex-wrap:wrap; @media(max-width:600px){gap:1.5rem;}`;
const StatItem = styled.div`text-align:center; .number{font-size:2.5rem; font-weight:900; color:${NCC.gold}; line-height:1; margin-bottom:0.3rem;} .label{font-size:0.85rem; color:rgba(255,255,255,0.6); font-weight:600; text-transform:uppercase; letter-spacing:1px;}`;

// ─── Main ───
const MainContent = styled.div`max-width:1300px; margin:0 auto; padding:0 2rem 5rem;`;

// ─── Search ───
const SearchFilterBar = styled(motion.div)`background:${NCC.white}; border-radius:20px; padding:1.5rem 2rem; box-shadow:0 8px 30px rgba(0,0,0,0.06); margin-top:-40px; position:relative; z-index:10; margin-bottom:3rem; @media(max-width:768px){padding:1rem 1.25rem;}`;
const SearchInputWrapper = styled.div`position:relative; svg{position:absolute; left:1rem; top:50%; transform:translateY(-50%); color:${NCC.textLight};} input{width:100%; padding:0.85rem 1rem 0.85rem 3rem; border:2px solid #e8ecf2; border-radius:14px; font-size:1rem; font-weight:500; color:${NCC.text}; box-sizing:border-box; transition:all 0.3s; &:focus{outline:none; border-color:${NCC.gold}; box-shadow:0 0 0 4px rgba(255,191,0,0.1);} &::placeholder{color:#b0b8c9;}}`;
const FilterChips = styled.div`display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:1rem; align-items:center;`;
const Chip = styled(motion.button)`padding:0.45rem 1rem; border-radius:50px; font-size:0.82rem; font-weight:600; cursor:pointer; transition:all 0.25s; border:2px solid ${p => p.$active ? NCC.navy : '#e2e6ef'}; background:${p => p.$active ? NCC.navy : NCC.white}; color:${p => p.$active ? 'white' : NCC.textLight}; &:hover{border-color:${NCC.navy}; color:${p => p.$active ? 'white' : NCC.navy};}`;
const WingChip = styled(Chip)`${p => p.$active && p.$wing === 'Army' && `background:${NCC.army};border-color:${NCC.army};`} ${p => p.$active && p.$wing === 'Navy' && `background:${NCC.navyWing};border-color:${NCC.navyWing};`} ${p => p.$active && p.$wing === 'Air' && `background:${NCC.air};border-color:${NCC.air};`}`;
const FilterLabel = styled.span`font-size:0.75rem; font-weight:700; color:${NCC.textLight}; text-transform:uppercase; letter-spacing:1px; margin-right:0.25rem;`;
const ResultCount = styled.div`text-align:center; color:${NCC.textMid}; font-size:0.95rem; font-weight:500; margin-bottom:2rem; strong{color:${NCC.navy}; font-weight:800;}`;

// ─── Grid ───
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.75rem;
  @media(max-width:768px) { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1rem; }
`;

// ─── Alumni Card (like Cadet Card — big photo on top) ───
const Card = styled(motion.div)`
  background: ${NCC.white};
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.04);
  border-top: 5px solid ${p => getWingColor(p.$wing)};
  transition: all 0.35s ease;
  text-align: center;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.1);
  }
`;

const PhotoContainer = styled.div`
  width: 100%;
  height: 260px;
  background: #f0f2f5;
  overflow: hidden;
  position: relative;
  cursor: default;
`;

const Photo = styled(OptimizedImage)`
  width: 100%;
  height: 100%;
  border-radius: 0;
`;

const InitialsBox = styled.div`
  width: 100%;
  height: 100%;
  background: ${p => getWingGrad(p.$wing)};
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.85);
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: 2px;
`;



const CardInfo = styled.div`
  padding: 1rem 1rem 0.75rem;
`;

const AlumName = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${NCC.text};
  margin: 0 0 0.2rem 0;
`;

const AlumDept = styled.div`
  font-size: 0.72rem;
  font-weight: 700;
  color: ${NCC.gold};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AlumBatch = styled.div`
  font-size: 0.75rem;
  color: ${NCC.textLight};
  font-weight: 500;
  margin-top: 0.1rem;
  margin-bottom: 0.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: ${NCC.textMid};
  padding: 0.3rem 0;
  svg { color: ${NCC.navyLight}; width: 13px; height: 13px; flex-shrink: 0; }
  span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
`;

const AchievementBadge = styled.div`
  background: linear-gradient(135deg, #fffbeb, #fef9c3);
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: #92400e;
  font-weight: 500;
  display: flex;
  align-items: flex-start;
  gap: 0.4rem;
  text-align: left;
  line-height: 1.3;
  svg { color: ${NCC.gold}; width: 13px; height: 13px; flex-shrink: 0; margin-top: 1px; }
`;

const PrivateInfo = styled.div`
  background: #f0f9ff;
  border-top: 1px dashed #bae6fd;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: #0369a1;
`;

const CardFooter = styled.div`
  display: flex;
  gap: 0.4rem;
  padding: 0.6rem 0.75rem;
  border-top: 1px solid #f1f5f9;
`;

const SocialBtn = styled.a`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.45rem;
  border-radius: 8px;
  background: ${NCC.bg};
  color: ${NCC.textMid};
  font-size: 0.72rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s;
  svg { width: 13px; height: 13px; }
  &:hover { background: ${NCC.navy}; color: white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(26,43,76,0.2); }
`;

// ─── CTA ───
const CTASection = styled(motion.div)`background:linear-gradient(135deg,${NCC.navy} 0%,${NCC.navyLight} 100%); border-radius:24px; padding:3.5rem; text-align:center; margin-top:4rem; position:relative; overflow:hidden; &::before{content:''; position:absolute; top:-50%; right:-20%; width:400px; height:400px; border-radius:50%; border:1px solid rgba(255,191,0,0.1);} @media(max-width:768px){padding:2.5rem 1.5rem;}`;
const CTATitle = styled.h2`font-size:2rem; font-weight:800; color:white; margin-bottom:0.75rem; @media(max-width:768px){font-size:1.5rem;}`;
const CTAText = styled.p`color:rgba(255,255,255,0.7); font-size:1.05rem; margin-bottom:2rem; max-width:500px; margin-left:auto; margin-right:auto;`;
const CTAButton = styled(motion.button)`background:linear-gradient(135deg,${NCC.gold},${NCC.goldLight}); color:${NCC.navy}; border:none; padding:1rem 2.5rem; border-radius:14px; font-size:1.1rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:0.5rem; box-shadow:0 8px 30px rgba(255,191,0,0.3);`;

// ─── Empty/Loading ───
const EmptyState = styled.div`text-align:center; padding:5rem 2rem; background:${NCC.white}; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.04); svg{color:${NCC.textLight}; margin-bottom:1rem;} h3{color:${NCC.text}; font-size:1.3rem; margin-bottom:0.5rem;} p{color:${NCC.textLight};}`;
const SkeletonGrid = styled.div`display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1.75rem;`;
const SkeletonCard = styled.div`
  background:${NCC.white}; border-radius:16px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.04);
  .photo{height:260px; background:linear-gradient(90deg,#e8ecf2 25%,#f0f3f7 50%,#e8ecf2 75%); background-size:200% 100%; animation:${shimmer} 1.5s infinite;}
  .body{padding:1rem; display:flex; flex-direction:column; align-items:center; gap:0.5rem;}
  .line{height:12px; border-radius:6px; background:linear-gradient(90deg,#e8ecf2 25%,#f0f3f7 50%,#e8ecf2 75%); background-size:200% 100%; animation:${shimmer} 1.5s infinite;}
  .w70{width:70%} .w50{width:50%} .w40{width:40%}
`;

const Particles = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const createParticles = () => {
      particles = [];
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.4 + 0.1,
          opacity: Math.random() * 0.4 + 0.2
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        p.y += p.speed;
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
        createParticles();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    draw();
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />;
};

const getInitials = (name) => {
  if (!name) return '?';
  const p = name.trim().split(' ');
  return p.length === 1 ? p[0][0]?.toUpperCase() || '?' : (p[0][0] + p[p.length - 1][0]).toUpperCase();
};

// ─── Component ───
const AlumniPage = () => {
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [selectedWing, setSelectedWing] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [imgErrors, setImgErrors] = useState({});
  const [imgLoaded, setImgLoaded] = useState({});
  const [displayLimit, setDisplayLimit] = useState(20);
  const navigate = useNavigate();
  const { user, isAdmin, isAlumniManager } = useAuth();

  const canSeePrivate = isAdmin || isAlumniManager;

  useEffect(() => { fetchAlumni(); }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'alumni'), orderBy('batch', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumni(data);
    } catch (err) {
      console.error('Error fetching alumni:', err);
    } finally {
      setLoading(false);
    }
  };

  const batches = useMemo(() => [...new Set(alumni.map(a => a.batch).filter(Boolean))].sort().reverse(), [alumni]);
  const departments = useMemo(() => [...new Set(alumni.map(a => a.department).filter(Boolean))].sort(), [alumni]);

  const filtered = useMemo(() => {
    return alumni.filter(a => {
      const matchB = selectedBatch === 'All' || a.batch === selectedBatch;
      const matchW = selectedWing === 'All' || a.wing === selectedWing;
      const matchD = selectedDept === 'All' || a.department === selectedDept;
      const q = searchQuery.toLowerCase();
      const matchS = !q || [a.name, a.company, a.currentPosition, a.department].some(f => f?.toLowerCase().includes(q));
      return matchB && matchW && matchD && matchS;
    });
  }, [alumni, selectedBatch, selectedWing, selectedDept, searchQuery]);

  const stats = useMemo(() => ({
    total: alumni.length,
    army: alumni.filter(a => a.wing === 'Army').length,
    navy: alumni.filter(a => a.wing === 'Navy').length,
    air: alumni.filter(a => a.wing === 'Air').length,
  }), [alumni]);

  return (
    <>
      <SEO title="Alumni Network" description="Connect with distinguished NCC alumni from Sairam Engineering College." />

      <HeroSection>
        <Particles />
        <HeroContent>
          <HeroBadge initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <GraduationCap size={16} /> Alumni Network
          </HeroBadge>
          <HeroTitle initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
            Our <span>Distinguished</span> Sairam<br />NCC Alumni
          </HeroTitle>
          <HeroSub initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            Honouring the cadets who served with pride and continue to make a mark in every field.
          </HeroSub>
          <StatsRow initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <StatItem><div className="number">{stats.total}</div><div className="label">Alumni</div></StatItem>
            <StatItem><div className="number">{stats.army}</div><div className="label">Army</div></StatItem>
            <StatItem><div className="number">{stats.navy}</div><div className="label">Navy</div></StatItem>
            <StatItem><div className="number">{stats.air}</div><div className="label">Air</div></StatItem>
          </StatsRow>
        </HeroContent>
      </HeroSection>

      <MainContent>
        <SearchFilterBar initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <SearchInputWrapper>
            <Search size={18} />
            <input placeholder="Search by name, company, department..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </SearchInputWrapper>
          <FilterChips>
            <FilterLabel>Wing:</FilterLabel>
            {['All', 'Army', 'Navy', 'Air'].map(w => (
              <WingChip key={w} $active={selectedWing === w} $wing={w} onClick={() => setSelectedWing(w)} whileTap={{ scale: 0.95 }}>{w === 'All' ? 'All' : w}</WingChip>
            ))}
          </FilterChips>
          {batches.length > 0 && (
            <FilterChips>
              <FilterLabel>Batch:</FilterLabel>
              <Chip $active={selectedBatch === 'All'} onClick={() => setSelectedBatch('All')} whileTap={{ scale: 0.95 }}>All</Chip>
              {batches.map(b => <Chip key={b} $active={selectedBatch === b} onClick={() => setSelectedBatch(b)} whileTap={{ scale: 0.95 }}>{b}</Chip>)}
            </FilterChips>
          )}
          {departments.length > 0 && (
            <FilterChips>
              <FilterLabel>Dept:</FilterLabel>
              <Chip $active={selectedDept === 'All'} onClick={() => setSelectedDept('All')} whileTap={{ scale: 0.95 }}>All</Chip>
              {departments.map(d => <Chip key={d} $active={selectedDept === d} onClick={() => setSelectedDept(d)} whileTap={{ scale: 0.95 }}>{d}</Chip>)}
            </FilterChips>
          )}
        </SearchFilterBar>

        {!loading && <ResultCount>Showing <strong>{filtered.length}</strong> alumni{searchQuery && ` for "${searchQuery}"`}</ResultCount>}

        {loading ? (
          <SkeletonGrid>
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i}><div className="photo" /><div className="body"><div className="line w70" /><div className="line w50" /><div className="line w40" /></div></SkeletonCard>
            ))}
          </SkeletonGrid>
        ) : filtered.length === 0 ? (
          <EmptyState><Users size={48} /><h3>No Alumni Found</h3><p>Try adjusting your search or filter criteria.</p></EmptyState>
        ) : (
          <Grid>
            {filtered.slice(0, displayLimit).map((alum, index) => {
              const isOwner = user && (user.uid === alum.userId || user.email === alum.email);
              const showPrivate = canSeePrivate || isOwner;

              return (
                <Card key={index} $wing={alum.wing}>
                  <PhotoContainer>
                    {alum.photoUrl && !imgErrors[alum.id] ? (
                      <Photo
                        src={alum.photoUrl}
                        width={400}
                        quality={75}
                        alt={alum.name}
                        objectFit="cover"
                        objectPosition="top center"
                        style={{ width: '100%', height: '100%' }}
                        onError={() => setImgErrors(p => ({ ...p, [alum.id]: true }))}
                      />
                    ) : (
                      <InitialsBox $wing={alum.wing}>{getInitials(alum.name)}</InitialsBox>
                    )}
                  </PhotoContainer>

                  <CardInfo>
                    <AlumName>{alum.name}</AlumName>
                    {alum.department && <AlumDept>{alum.department}</AlumDept>}
                    <AlumBatch>{alum.batch} • {alum.wing} Wing</AlumBatch>

                    {alum.currentPosition && <InfoItem><Briefcase /><span>{alum.currentPosition}</span></InfoItem>}
                    {alum.company && <InfoItem><MapPin /><span>{alum.company}</span></InfoItem>}
                    {alum.achievements && (
                      <AchievementBadge><Award /><span>{alum.achievements}</span></AchievementBadge>
                    )}
                  </CardInfo>

                  {/* Private info: phone & DOB — only admin/manager or owner */}
                  {showPrivate && (alum.phone || alum.dob) && (
                    <PrivateInfo>
                      {alum.phone && <InfoItem><Phone /><span>{alum.phone}</span></InfoItem>}
                      {alum.dob && <InfoItem><Calendar /><span>{alum.dob}</span></InfoItem>}
                    </PrivateInfo>
                  )}

                  {(alum.email || alum.linkedin) && (
                    <CardFooter>
                      {alum.email && <SocialBtn href={`mailto:${alum.email}`} title="Email"><Mail /> Email</SocialBtn>}
                      {alum.linkedin && <SocialBtn href={alum.linkedin} target="_blank" rel="noopener noreferrer" title="LinkedIn"><Linkedin /> LinkedIn</SocialBtn>}
                    </CardFooter>
                  )}
                </Card>
              );
            })}
          </Grid>
        )}

        {displayLimit < filtered.length && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
            <CTAButton onClick={() => setDisplayLimit(prev => prev + 20)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Load More Alumni <Users size={18} style={{ marginLeft: '8px' }} />
            </CTAButton>
          </div>
        )}

        <CTASection initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <CTATitle>Are You an NCC Alumni?</CTATitle>
          <CTAText>Join our alumni network and reconnect with your NCC family.</CTAText>
          <CTAButton onClick={() => navigate('/alumni-login')} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
            Join As Alumni <ArrowRight size={20} />
          </CTAButton>
        </CTASection>
      </MainContent>
    </>
  );
};

export default AlumniPage;
