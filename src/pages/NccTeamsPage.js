import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { ArrowLeft, ChevronRight, X, Image as ImageIcon, ShieldCheck, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { db } from '../firebase';
import SEO from '../components/common/SEO';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import OptimizedImage from '../components/common/OptimizedImage';

// --- Animations ---
// float removed as it was unused

const blobAnimation = keyframes`
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
`;

// --- Styled Components ---

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 100px 0 0;
  color: #1e293b;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
`;

const BackgroundBlob = styled.div`
  position: absolute;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.6;
  animation: ${blobAnimation} 20s infinite alternate;
  border-radius: 50%;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 6rem;
  width: 100%;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) { padding: 0 1rem 6rem; }
`;

const Header = styled.div`
  text-align: center; 
  margin-bottom: 5rem;
  padding: 0 1rem;
  position: relative;
`;

const PageTitle = styled(motion.h1)`
  font-size: 4.5rem; font-weight: 900;
  color: #0f172a; margin-bottom: 1.5rem;
  line-height: 1.1;
  letter-spacing: -0.03em;
  
  @media (max-width: 768px) { font-size: 3rem; }
  
  span {
    background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }
`;

const Subtitle = styled(motion.p)`
  font-size: 1.25rem; color: #64748b; 
  max-width: 600px; margin: 0 auto; 
  font-weight: 500; line-height: 1.6;
`;

const TeamGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 3rem;
  perspective: 1000px;
`;

const TeamCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 30px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;

  &:hover {
    border-color: #bfdbfe;
    box-shadow: 0 25px 50px -12px rgba(37, 99, 235, 0.25);
  }
`;

const IconWrapper = styled(motion.div)`
  width: 100px; height: 100px;
  background: white;
  border-radius: 24px;
  margin: 0 auto 2rem;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  overflow: hidden;
`;

const TeamName = styled.h3`
  font-size: 1.8rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
`;

const ViewLabel = styled.div`
  display: inline-flex; alignItems: center; gap: 0.5rem; 
  margin-top: 2rem; 
  padding: 0.8rem 1.5rem;
  background: #f1f5f9;
  border-radius: 100px;
  color: #475569; font-weight: 700; font-size: 0.9rem;
  transition: all 0.3s ease;
  
  ${TeamCard}:hover & {
    background: #2563eb;
    color: white;
    transform: translateY(-2px);
  }
`;

// Detail View Styles

const DetailHeader = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 4rem;
  position: relative;
`;

const BackButton = styled.button`
  position: fixed; top: 120px; left: 2rem;
  background: white; border: 1px solid #e2e8f0;
  display: flex; align-items: center; gap: 0.5rem;
  font-weight: 700; color: #64748b; cursor: pointer;
  padding: 0.8rem 1.5rem;
  font-size: 0.9rem;
  border-radius: 100px;
  transition: all 0.2s;
  z-index: 50;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  
  &:hover { color: #0f172a; transform: translateX(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  
  @media (max-width: 1024px) { position: absolute; top: 0; left: 0; }
`;

const BatchGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2.5rem;
  padding: 1rem 0;
`;

const BatchCard = styled(motion.div)`
  cursor: pointer;
`;

const PosterFrame = styled(motion.div)`
  width: 100%;
  aspect-ratio: 3/4;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 40px -5px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
  position: relative;
  background: white;
  
  img {
    width: 100%; height: 100%; object-fit: cover;
    transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  
  &:hover img { transform: scale(1.05); }

  &::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.3), transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  
  &:hover::after { opacity: 1; }
  
  .zoom-icon {
    position: absolute; top: 50%; left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(5px);
    border-radius: 50%;
    padding: 1rem;
    color: white;
    opacity: 0;
    transition: all 0.3s;
  }
  
  &:hover .zoom-icon { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const BatchTitle = styled.h4`
  font-size: 1.4rem; font-weight: 700; color: #1e293b;
  text-align: center; margin: 0;
`;

// Modal Styles - Improved for Portal

const ModalOverlay = styled(motion.div)`
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.96);
  z-index: 99999;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(10px);
`;

const PosterContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  height: 100%;
  max-width: 1600px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const FullPoster = styled(OptimizedImage)`
  max-width: 100%;
  max-height: 90vh;
  border-radius: 4px;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
  user-select: none;
`;

const TopControls = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 2rem;
  display: flex;
  gap: 1rem;
  z-index: 100000;
`;

const ControlButton = styled.a`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);

  &:hover {
    background: white;
    color: #0f172a;
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(255,255,255,0.4);
  }
`;

// Updated Styles for Library Compatibility
// LibraryWrapper removed as it was unused

const AlertBox = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.6);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  pointer-events: none;
  opacity: 0.7;
`;

// --- Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0, opacity: 1, scale: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

const NccTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Updated state for modal slideshow
  const [viewBatchData, setViewBatchData] = useState(null); // { urls: [], index: 0 }

  // State for card slideshows (object with batchId -> currentImageIndex)
  const [cardSlideshows, setCardSlideshows] = useState({});

  useEffect(() => {
    fetchTeams();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setViewBatchData(null);
      if (viewBatchData) {
        if (e.key === 'ArrowRight') handleNextSlide();
        if (e.key === 'ArrowLeft') handlePrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewBatchData]);

  // Slideshow interval for cards
  useEffect(() => {
    const interval = setInterval(() => {
      setCardSlideshows(prev => {
        const newState = { ...prev };
        batches.forEach(batch => {
          const images = getBatchImages(batch);
          if (images.length > 1) {
            const currentIndex = newState[batch.id] || 0;
            newState[batch.id] = (currentIndex + 1) % images.length;
          }
        });
        return newState;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [batches]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'nccTeams'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleTeamClick = async (team) => {
    setSelectedTeam(team);
    setLoading(true);
    try {
      const q = query(collection(db, 'nccTeamBatches'), where('teamId', '==', team.id));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => {
        const yearA = parseInt(a.name.match(/\d{4}/)?.[0] || 0, 10);
        const yearB = parseInt(b.name.match(/\d{4}/)?.[0] || 0, 10);
        return yearB - yearA;
      });
      setBatches(fetched);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const clearSelection = () => {
    setSelectedTeam(null);
    setBatches([]);
  };

  const getBatchImages = (batch) => {
    if (batch.posterURLs && Array.isArray(batch.posterURLs) && batch.posterURLs.length > 0) {
      return batch.posterURLs;
    }
    if (batch.posterURL) return [batch.posterURL];
    return [];
  };

  const openModal = (batch) => {
    const images = getBatchImages(batch);
    if (images.length > 0) {
      setViewBatchData({ urls: images, index: 0 });
    }
  };

  const handleNextSlide = () => {
    setViewBatchData(prev => {
      if (!prev) return null;
      return { ...prev, index: (prev.index + 1) % prev.urls.length };
    });
  };

  const handlePrevSlide = () => {
    setViewBatchData(prev => {
      if (!prev) return null;
      return { ...prev, index: (prev.index - 1 + prev.urls.length) % prev.urls.length };
    });
  };

  return (
    <PageContainer>
      <SEO title="Teams & Wings | NCC" />

      {/* Animated Background */}
      <BackgroundBlob style={{ top: '-10%', left: '-10%', width: '600px', height: '600px', background: '#e0e7ff' }} />
      <BackgroundBlob style={{ top: '40%', right: '-5%', width: '500px', height: '500px', background: '#fae8ff', animationDelay: '-5s' }} />
      <BackgroundBlob style={{ bottom: '-10%', left: '20%', width: '700px', height: '700px', background: '#ecfdf5', animationDelay: '-10s' }} />

      <ContentWrapper>
        <AnimatePresence mode="wait">
          {!selectedTeam ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <Header>
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <PageTitle>Elite <span>Squadrons</span></PageTitle>
                  <Subtitle>
                    Discover the specialized units that form the backbone of our excellence.
                    Each team represents a legacy of discipline and achievement.
                  </Subtitle>
                </motion.div>
              </Header>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.2rem', color: '#94a3b8' }}>Initializing Teams...</div>
              ) : (
                <TeamGrid variants={containerVariants} initial="hidden" animate="visible">
                  {teams.map((team) => (
                    <TeamCard
                      key={team.id}
                      variants={itemVariants}
                      whileHover={{ y: -10, transition: { duration: 0.2 } }}
                      onClick={() => handleTeamClick(team)}
                    >
                      <IconWrapper whileHover={{ rotate: [0, -10, 10, 0] }}>
                        {team.iconURL ? (
                          <OptimizedImage src={team.iconURL} width={100} quality={90} alt={team.name} objectFit="contain" style={{ width: '60%', height: '60%' }} />
                        ) : (
                          <ShieldCheck size={40} color="#2563eb" />
                        )}
                      </IconWrapper>
                      <TeamName>{team.name}</TeamName>
                      <ViewLabel>Explore Batches <ChevronRight size={16} /></ViewLabel>
                    </TeamCard>
                  ))}
                  {teams.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                      No teams active right now.
                    </div>
                  )}
                </TeamGrid>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BackButton onClick={clearSelection}><ArrowLeft size={18} /> Teams</BackButton>

              <DetailHeader initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{ width: '120px', height: '120px', background: 'white', borderRadius: '30px', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}
                >
                  {selectedTeam.iconURL ? <img src={selectedTeam.iconURL} alt="Icon" loading="lazy" style={{ width: '65%', height: '65%', objectFit: 'contain' }} /> : <ShieldCheck size={50} color="#2563eb" />}
                </motion.div>
                <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{selectedTeam.name}</h2>
                <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 500 }}>Batch Yearbooks & Portfolios</p>
              </DetailHeader>

              {loading ? <div style={{ textAlign: 'center', padding: '2rem' }}>Retrieving Data...</div> : (
                <BatchGrid variants={containerVariants} initial="hidden" animate="visible">
                  {batches.map((batch) => {
                    const images = getBatchImages(batch);
                    const currentCardIndex = cardSlideshows[batch.id] || 0;

                    return (
                      <BatchCard
                        key={batch.id}
                        variants={itemVariants}
                        onClick={() => openModal(batch)}
                      >
                        <PosterFrame>
                          {images.length > 0 ? (
                            <>
                              <OptimizedImage
                                src={images[currentCardIndex]}
                                width={500}
                                quality={70}
                                alt={batch.name}
                                objectFit="cover"
                                style={{ width: '100%', height: '100%' }}
                              />
                              {images.length > 1 && (
                                <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                  {images.map((_, idx) => (
                                    <div key={idx} style={{ width: '6px', height: '6px', borderRadius: '50%', background: idx === currentCardIndex ? 'white' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }} />
                                  ))}
                                </div>
                              )}
                              <div className="zoom-icon"><ZoomIn size={24} /></div>
                            </>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: '#cbd5e1', background: '#f1f5f9' }}>
                              <ImageIcon size={48} />
                              <span style={{ fontSize: '1rem' }}>Coming Soon</span>
                            </div>
                          )}
                        </PosterFrame>
                        <BatchTitle>{batch.name}</BatchTitle>
                      </BatchCard>
                    );
                  })}
                  {batches.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                      No portfolios uploaded for this team yet.
                    </div>
                  )}
                </BatchGrid>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ContentWrapper>

      {/* PORTAL FOR MODAL - Renders outside root to cover Navbar */}
      {createPortal(
        <AnimatePresence>
          {viewBatchData && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewBatchData(null)}
            >
              <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={5}
                centerOnInit={true}
                wheel={{ step: 0.2 }}
                doubleClick={{ disabled: true }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <TopControls onClick={(e) => e.stopPropagation()}>
                      {viewBatchData.urls.length > 1 && (
                        <>
                          <span style={{ color: 'white', marginRight: '1rem', alignSelf: 'center', fontSize: '0.9rem', fontWeight: 500 }}>
                            {viewBatchData.index + 1} / {viewBatchData.urls.length}
                          </span>
                        </>
                      )}
                      <ControlButton as="button" onClick={() => zoomOut()} title="Zoom Out">
                        <ZoomOut size={24} />
                      </ControlButton>
                      <ControlButton as="button" onClick={() => zoomIn()} title="Zoom In">
                        <ZoomIn size={24} />
                      </ControlButton>
                      <div style={{ width: '1rem' }} /> {/* Spacer */}
                      <ControlButton
                        href={viewBatchData.urls[viewBatchData.index]}
                        download="NCC_Poster.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download"
                      >
                        <Download size={24} />
                      </ControlButton>
                      <ControlButton as="button" onClick={() => setViewBatchData(null)} title="Close">
                        <X size={24} />
                      </ControlButton>
                    </TopControls>

                    {/* Navigation Arrows for Slideshow */}
                    {viewBatchData.urls.length > 1 && (
                      <>
                        <ControlButton
                          as="button"
                          style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 100000 }}
                          onClick={(e) => { e.stopPropagation(); handlePrevSlide(); resetTransform(); }}
                        >
                          <ArrowLeft size={24} />
                        </ControlButton>
                        <ControlButton
                          as="button"
                          style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 100000 }}
                          onClick={(e) => { e.stopPropagation(); handleNextSlide(); resetTransform(); }}
                        >
                          <ChevronRight size={24} />
                        </ControlButton>
                      </>
                    )}

                    <PosterContainer onClick={(e) => e.stopPropagation()}>
                      <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                        <FullPoster src={viewBatchData.urls[viewBatchData.index]} width={1600} quality={85} alt="Full Poster" objectFit="contain" />
                      </TransformComponent>
                    </PosterContainer>

                    <AlertBox>Scroll or Pinch to Zoom • Drag to Pan</AlertBox>
                  </>
                )}
              </TransformWrapper>
            </ModalOverlay>
          )}
        </AnimatePresence>,
        document.body
      )}
    </PageContainer>
  );
};

export default NccTeamsPage;
