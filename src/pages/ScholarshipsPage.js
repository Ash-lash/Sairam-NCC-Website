import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, IndianRupee, X, ZoomIn, ZoomOut, Download, ArrowLeft, ChevronRight, Award, FileText, Users, Star } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/common/SEO';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import OptimizedImage from '../components/common/OptimizedImage';

const PageContainer = styled.div`
  padding: 120px 2rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled(motion.div)`
  text-align: center;
  margin-bottom: 4rem;
`;

const Title = styled.h1`
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #1A2B4C 0%, #2D4A7C 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;

  @media(max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #666;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1A2B4C;
  margin-bottom: 2.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  &::before {
    content: '';
    display: block;
    width: 6px;
    height: 40px;
    background: linear-gradient(to bottom, #FFBF00, #FFD700);
    border-radius: 4px;
  }
`;

const EventsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 3rem;
  margin-bottom: 4rem;

  @media(max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EventCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08); 
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.4);
  
  &:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 24px 48px rgba(30, 43, 76, 0.15);
    
    .event-banner img {
      transform: scale(1.1);
    }
    
    .event-title {
      color: #FFBF00;
    }
  }
`;

const EventBanner = styled.div`
  height: 280px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 60%;
    background: linear-gradient(to bottom, transparent, rgba(26, 43, 76, 0.9));
    z-index: 1;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
`;

const PlaceholderBanner = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #1A2B4C 0%, #0F172A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 191, 0, 0.3);
`;

const TopBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.95);
  color: #1A2B4C;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 800;
  font-size: 0.85rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  backdrop-filter: blur(10px);
`;

const EventContent = styled.div`
  padding: 2.5rem 2rem 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
`;

const EventTitle = styled.h3`
  font-size: 1.6rem;
  font-weight: 800;
  color: #1A2B4C;
  margin-bottom: 1rem;
  line-height: 1.3;
  transition: color 0.3s ease;
`;

const EventType = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 1rem;
  background: linear-gradient(135deg, #FFBF00 0%, #FFD700 100%);
  color: #1A2B4C;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 800;
  margin-bottom: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  align-self: flex-start;
  box-shadow: 0 4px 10px rgba(255, 191, 0, 0.3);
`;

const EventMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 1rem 0;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0,0,0,0.05);
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.95rem;
  color: #555;
  font-weight: 500;
  
  svg {
    color: #FFBF00;
    width: 18px;
    height: 18px;
  }
`;

const EventDescription = styled.p`
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: auto;
`;

const NoEvents = styled.div`
  text-align: center;
  padding: 4rem;
  background: rgba(255,255,255,0.5);
  border-radius: 20px;
  color: #888;
  font-size: 1.2rem;
  font-weight: 500;
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalBanner = styled.div`
  height: 350px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const ModalBody = styled.div`
  padding: 2.5rem;
`;

const PhotosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

const ImageViewerOverlay = styled(motion.div)`
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
  object-fit: contain;
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

const ScholarshipsPage = () => {
    const [scholarships, setScholarships] = useState([]);
    const [selectedScholarship, setSelectedScholarship] = useState(null);
    const [viewImageData, setViewImageData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScholarships();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (viewImageData) setViewImageData(null);
                else if (selectedScholarship) setSelectedScholarship(null);
            }
            if (viewImageData) {
                if (e.key === 'ArrowRight') handleNextImage();
                if (e.key === 'ArrowLeft') handlePrevImage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [viewImageData, selectedScholarship]);

    const openImageViewer = (urls, index = 0) => {
        if (urls && urls.length > 0) {
            setViewImageData({ urls, index });
        }
    };

    const handleNextImage = () => {
        setViewImageData(prev => {
            if (!prev) return null;
            return { ...prev, index: (prev.index + 1) % prev.urls.length };
        });
    };

    const handlePrevImage = () => {
        setViewImageData(prev => {
            if (!prev) return null;
            return { ...prev, index: (prev.index - 1 + prev.urls.length) % prev.urls.length };
        });
    };

    const fetchScholarships = async () => {
        try {
            const q = query(collection(db, 'scholarships'), orderBy('date', 'desc'));
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setScholarships(data);
        } catch (error) {
            console.error('Error fetching scholarships:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderCard = (item) => (
        <EventCard
            key={item.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            onClick={() => setSelectedScholarship(item)}
        >
            <EventBanner className="event-banner">
                {item.posterUrl ? (
                    <OptimizedImage
                        src={item.posterUrl}
                        width={600}
                        quality={80}
                        alt={item.name}
                        objectFit="cover"
                        style={{ width: '100%', height: '100%' }}
                    />
                ) : (
                    <PlaceholderBanner>
                        <Award size={80} />
                    </PlaceholderBanner>
                )}
                {item.isGroup && (
                    <TopBadge>
                        <Users size={16} color="#FFBF00" /> Squad Award
                    </TopBadge>
                )}
            </EventBanner>
            <EventContent>
                <EventType><Star size={14} /> Scholarship Award</EventType>
                <EventTitle className="event-title">{item.name}</EventTitle>
                <EventMeta>
                    {item.isGroup ? (
                        <MetaItem>
                            <Users size={18} />
                            <strong>{item.groupMembers?.length || 0} Recipients</strong>
                        </MetaItem>
                    ) : item.recipient && (
                        <MetaItem>
                            <User size={18} />
                            {item.recipient}
                        </MetaItem>
                    )}
                    {item.amount && (
                        <MetaItem>
                            <IndianRupee size={18} />
                            <strong style={{ color: '#1A2B4C' }}>{item.amount}</strong>
                        </MetaItem>
                    )}
                    <MetaItem>
                        <Calendar size={18} />
                        {new Date(item.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </MetaItem>
                </EventMeta>
                <EventDescription>{item.description}</EventDescription>
            </EventContent>
        </EventCard>
    );

    return (
        <PageContainer>
            <SEO
                title="Scholarships"
                description="Explore the scholarships awarded to the dedicated cadets of NCC Sri Sairam Engineering College."
            />
            <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <Title>Scholarships</Title>
                <Subtitle>Honoring the excellence and dedication of our cadets through various scholarships and awards.</Subtitle>
            </Header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }} className="skeleton-spinner"></div>
            ) : scholarships.length > 0 ? (
                <EventsGrid>
                    {scholarships.map(item => renderCard(item))}
                </EventsGrid>
            ) : (
                <NoEvents>No scholarships to display at the moment.</NoEvents>
            )}

            <AnimatePresence>
                {selectedScholarship && (
                    <Modal
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedScholarship(null)}
                    >
                        <ModalContent onClick={(e) => e.stopPropagation()}>
                            <CloseButton onClick={() => setSelectedScholarship(null)}>
                                <X size={24} />
                            </CloseButton>
                            <ModalBanner
                                style={{ cursor: selectedScholarship.posterUrl ? 'pointer' : 'default' }}
                                onClick={() => selectedScholarship.posterUrl && openImageViewer([selectedScholarship.posterUrl], 0)}
                            >
                                {selectedScholarship.posterUrl ? (
                                    <OptimizedImage 
                                      src={selectedScholarship.posterUrl} 
                                      width={1000} 
                                      quality={85} 
                                      alt={selectedScholarship.name}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <PlaceholderBanner style={{ width: '100%' }}>
                                        <Award size={80} />
                                    </PlaceholderBanner>
                                )}
                            </ModalBanner>
                            <ModalBody>
                                <EventType><Star size={16} /> Scholarship Details</EventType>
                                <EventTitle style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: '#1a2b4c', fontWeight: 900 }}>{selectedScholarship.name}</EventTitle>
                                <EventMeta style={{ padding: '2rem', background: '#f8fafc', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '2rem', flexDirection: 'row' }}>
                                    {!selectedScholarship.isGroup && selectedScholarship.recipient && (
                                        <MetaItem style={{ fontSize: '1.2rem', color: '#1a2b4c' }}>
                                            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ background: '#FFBF00', padding: '0.8rem', borderRadius: '50%', color: '#1a2b4c' }}>
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Recipient</div>
                                                    <strong style={{ fontSize: '1.2rem' }}>{selectedScholarship.recipient}</strong>
                                                </div>
                                            </div>
                                        </MetaItem>
                                    )}
                                    {selectedScholarship.amount && (
                                        <MetaItem style={{ fontSize: '1.2rem', color: '#1a2b4c' }}>
                                            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ background: '#10b981', padding: '0.8rem', borderRadius: '50%', color: 'white' }}>
                                                    <IndianRupee size={24} />
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Reward</div>
                                                    <strong style={{ fontSize: '1.2rem' }}>{selectedScholarship.amount}</strong>
                                                </div>
                                            </div>
                                        </MetaItem>
                                    )}
                                    <MetaItem style={{ fontSize: '1.2rem', color: '#1a2b4c' }}>
                                        <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{ background: '#3b82f6', padding: '0.8rem', borderRadius: '50%', color: 'white' }}>
                                                <Calendar size={24} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Date Awarded</div>
                                                <strong style={{ fontSize: '1.1rem' }}>{new Date(selectedScholarship.date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</strong>
                                            </div>
                                        </div>
                                    </MetaItem>
                                </EventMeta>

                                {selectedScholarship.isGroup && selectedScholarship.groupMembers && selectedScholarship.groupMembers.length > 0 && (
                                    <div style={{ marginTop: '3rem', background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                                        <h3 style={{ fontSize: '1.5rem', color: '#1A2B4C', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Users size={24} color="#FFBF00" /> Squad Recipients
                                        </h3>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                            {selectedScholarship.groupMembers.map((member, idx) => (
                                                <div key={idx} style={{ background: 'white', padding: '1.2rem', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                    {member.photoUrl ? (
                                                        <OptimizedImage 
                                                            src={member.photoUrl} 
                                                            alt={member.name} 
                                                            width={100} 
                                                            style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} 
                                                        />
                                                    ) : (
                                                        <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                                            <User size={24} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div style={{ fontSize: '0.85rem', color: '#FFBF00', fontWeight: 800 }}>{member.rank}</div>
                                                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>{member.name}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>{member.department} • {member.batch}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedScholarship.reportUrl && (
                                    <a
                                        href={selectedScholarship.reportUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginTop: '1.5rem',
                                            padding: '0.8rem 1.5rem',
                                            background: '#ebf5ff',
                                            color: '#2563eb',
                                            borderRadius: '8px',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#ebf5ff'}
                                    >
                                        <FileText size={20} />
                                        View Full Report (PDF)
                                    </a>
                                )}

                                <div style={{ marginTop: '2rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', color: '#1A2B4C', marginBottom: '1rem' }}>Report Details</h3>
                                    <EventDescription style={{ WebkitLineClamp: 'unset', fontSize: '1.05rem', color: '#475569' }}>
                                        {selectedScholarship.description}
                                    </EventDescription>
                                </div>

                                {selectedScholarship.photos && selectedScholarship.photos.length > 0 && (
                                    <>
                                        <h3 style={{ marginTop: '3rem', marginBottom: '1rem', color: '#1a2b4c', fontSize: '1.3rem' }}>
                                            Gallery
                                        </h3>
                                        <PhotosGrid>
                                            {selectedScholarship.photos.map((photo, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{ borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', height: '150px' }}
                                                    onClick={() => openImageViewer(selectedScholarship.photos, idx)}
                                                >
                                                    <OptimizedImage
                                                        src={photo}
                                                        width={400}
                                                        quality={80}
                                                        alt={`Scholarship photo ${idx + 1}`}
                                                        objectFit="cover"
                                                        style={{ width: '100%', height: '100%', transition: 'transform 0.3s ease' }}
                                                    />
                                                </div>
                                            ))}
                                        </PhotosGrid>
                                    </>
                                )}
                            </ModalBody>
                        </ModalContent>
                    </Modal>
                )}
            </AnimatePresence>

            {createPortal(
                <AnimatePresence>
                    {viewImageData && (
                        <ImageViewerOverlay
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewImageData(null)}
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
                                            {viewImageData.urls.length > 1 && (
                                                <span style={{ color: 'white', marginRight: '1rem', alignSelf: 'center', fontSize: '0.9rem', fontWeight: 500 }}>
                                                    {viewImageData.index + 1} / {viewImageData.urls.length}
                                                </span>
                                            )}
                                            <ControlButton as="button" onClick={() => zoomOut()} title="Zoom Out">
                                                <ZoomOut size={24} />
                                            </ControlButton>
                                            <ControlButton as="button" onClick={() => zoomIn()} title="Zoom In">
                                                <ZoomIn size={24} />
                                            </ControlButton>
                                            <div style={{ width: '1rem' }} />
                                            <ControlButton
                                                href={viewImageData.urls[viewImageData.index]}
                                                download={`NCC_Scholarship_${viewImageData.index + 1}.jpg`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Download"
                                            >
                                                <Download size={24} />
                                            </ControlButton>
                                            <ControlButton as="button" onClick={() => setViewImageData(null)} title="Close">
                                                <X size={24} />
                                            </ControlButton>
                                        </TopControls>

                                        {viewImageData.urls.length > 1 && (
                                            <>
                                                <ControlButton
                                                    as="button"
                                                    style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 100000 }}
                                                    onClick={(e) => { e.stopPropagation(); handlePrevImage(); resetTransform(); }}
                                                >
                                                    <ArrowLeft size={24} />
                                                </ControlButton>
                                                <ControlButton
                                                    as="button"
                                                    style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', zIndex: 100000 }}
                                                    onClick={(e) => { e.stopPropagation(); handleNextImage(); resetTransform(); }}
                                                >
                                                    <ChevronRight size={24} />
                                                </ControlButton>
                                            </>
                                        )}

                                        <PosterContainer onClick={(e) => e.stopPropagation()}>
                                            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                                                <FullPoster src={viewImageData.urls[viewImageData.index]} alt="Full Image" />
                                            </TransformComponent>
                                        </PosterContainer>

                                        <AlertBox>Scroll or Pinch to Zoom • Drag to Pan</AlertBox>
                                    </>
                                )}
                            </TransformWrapper>
                        </ImageViewerOverlay>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </PageContainer>
    );
};

export default ScholarshipsPage;
