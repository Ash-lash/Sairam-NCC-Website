import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, X, ZoomIn, ZoomOut, Download, ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import ElfsightWidget from '../components/ui/ElfsightWidget';
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
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); /* Softer initial shadow */
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(0,0,0,0.03);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
    
    img {
      transform: scale(1.08);
    }
    
    h3 {
      color: #D32F2F; /* Title color change on hover */
    }
  }
`;

const EventBanner = styled.div`
  height: 220px;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5));
    opacity: 0.6;
    transition: opacity 0.3s;
  }
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.8s ease;
  }

  ${props => props.$isUpcoming && `
    &::before {
      content: 'UPCOMING';
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: #D32F2F;
      color: white;
      padding: 0.4rem 0.8rem;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.75rem;
      z-index: 2;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      letter-spacing: 1px;
    }
  `}
`;

const PlaceholderBanner = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #2D4A7C 0%, #1A2B4C 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.4);
`;

const EventContent = styled.div`
  padding: 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const EventTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A2B4C;
  margin-bottom: 0.75rem;
  line-height: 1.3;
`;

const EventType = styled.span`
  display: inline-block;
  padding: 0.35rem 0.8rem;
  background: rgba(26, 43, 76, 0.05);
  color: #1A2B4C;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

const UpcomingEventsSection = styled.div`
  margin-bottom: 4rem;
`;

const YearFolder = styled.div`
  margin-bottom: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.03);
`;

const YearHeader = styled.div`
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: ${props => props.$isOpen ? '#f8fafc' : 'white'};
  transition: all 0.3s ease;
  
  &:hover {
    background: #f8fafc;
  }
`;

const YearTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1A2B4C;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0;
  
  &::before {
    content: '';
    display: block;
    width: 24px;
    height: 24px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FFBF00' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'/%3E%3C/svg%3E") no-repeat center;
  }
`;

const YearContent = styled(motion.div)`
  overflow: hidden;
`;

const EventsGridContainer = styled.div`
  padding: 2rem;
  background: #f8fafc;
  border-top: 1px solid rgba(0,0,0,0.05);
`;

const ToggleIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1A2B4C;
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
  height: 300px;
  background: ${props => props.$imageUrl ? `url(${props.$imageUrl})` : 'linear-gradient(135deg, #FFBF00 0%, #FFD700 100%)'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 2rem;
`;

const PhotosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
`;

const Photo = styled.img`
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const InstagramSection = styled.div`
  margin-top: 4rem;
`;

const PlaceholderIcon = styled.div`
  color: #1a2b4c;
  opacity: 0.3;
`;

// --- Image Viewer Styles (Copied from NccTeamsPage) ---

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

const FullPoster = styled.img`
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

const EventsPage = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewImageData, setViewImageData] = useState(null); // { urls: [], index: 0 }
  const [activeYear, setActiveYear] = useState(null);

  const calculateAcademicYear = (dateString) => {
    if (!dateString) return 'Other';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); 
    if (month >= 5) return `${year}-${year + 1}`;
    return `${year - 1}-${year}`;
  };

  const groupedPastEvents = pastEvents.reduce((groups, event) => {
    const year = event.academicYear || calculateAcademicYear(event.date);
    if (!groups[year]) groups[year] = [];
    groups[year].push(event);
    return groups;
  }, {});

  const sortedYears = Object.keys(groupedPastEvents).sort((a, b) => b.localeCompare(a));

  useEffect(() => {
    if (sortedYears.length > 0 && !activeYear) {
      setActiveYear(sortedYears[0]);
    }
  }, [sortedYears, activeYear]);

  useEffect(() => {
    fetchEvents();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (viewImageData) setViewImageData(null);
        else if (selectedEvent) setSelectedEvent(null);
      }
      if (viewImageData) {
        if (e.key === 'ArrowRight') handleNextImage();
        if (e.key === 'ArrowLeft') handlePrevImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewImageData, selectedEvent]);

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

  const fetchEvents = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch upcoming events
      const upcomingQuery = query(
        collection(db, 'events'),
        where('date', '>=', today)
      );
      const upcomingSnapshot = await getDocs(upcomingQuery);
      const upcomingData = upcomingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Local dynamic sort
      const sortedUpcoming = upcomingData.sort((a, b) => a.date.localeCompare(b.date));
      setUpcomingEvents(sortedUpcoming);

      // Fetch past events
      const pastQuery = query(
        collection(db, 'events'),
        where('date', '<', today)
      );
      const pastSnapshot = await getDocs(pastQuery);
      const pastData = pastSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Local dynamic sort (Descending)
      const sortedPast = pastData.sort((a, b) => b.date.localeCompare(a.date));
      setPastEvents(sortedPast);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const renderEventCard = (event, isUpcoming = false) => (
    <EventCard
      key={event.id}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      onClick={() => setSelectedEvent(event)}
    >
      <EventBanner $isUpcoming={isUpcoming}>
        {event.posterUrl ? (
          <OptimizedImage
            src={event.posterUrl}
            width={600}
            quality={80}
            alt={event.name}
            objectFit="cover"
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <PlaceholderBanner>
            <Calendar size={64} />
          </PlaceholderBanner>
        )}
      </EventBanner>
      <EventContent>
        <EventType>{event.eventType || 'Event'}</EventType>
        <EventTitle>{event.name}</EventTitle>
        <EventMeta>
          <MetaItem>
            <Calendar size={18} />
            {new Date(event.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </MetaItem>
          {event.time && (
            <MetaItem>
              <Clock size={18} />
              {event.time}
            </MetaItem>
          )}
          {event.location && (
            <MetaItem>
              <MapPin size={18} />
              {event.location}
            </MetaItem>
          )}
        </EventMeta>
        <EventDescription>{event.description}</EventDescription>
      </EventContent>
    </EventCard>
  );

  return (
    <PageContainer>
      <SEO
        title="Events"
        description="Stay updated with the latest events, camps, and activities organized by NCC Sri Sairam Engineering College."
      />
      <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Title>Events & Activities</Title>
        <Subtitle>Stay updated with our latest events and activities</Subtitle>
      </Header>

      {upcomingEvents.length > 0 && (
        <UpcomingEventsSection>
          <SectionTitle>🔔 Upcoming Events</SectionTitle>
          <EventsGrid>
            {upcomingEvents.map(event => renderEventCard(event, true))}
          </EventsGrid>
        </UpcomingEventsSection>
      )}

      {pastEvents.length > 0 && (
        <div>
          <SectionTitle>Past Events</SectionTitle>
          {sortedYears.map(year => (
            <YearFolder key={year}>
              <YearHeader 
                $isOpen={activeYear === year} 
                onClick={() => setActiveYear(activeYear === year ? null : year)}
              >
                <YearTitle>{year}</YearTitle>
                <ToggleIcon
                  animate={{ rotate: activeYear === year ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={24} />
                </ToggleIcon>
              </YearHeader>
              <AnimatePresence>
                {activeYear === year && (
                  <YearContent
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <EventsGridContainer>
                      <EventsGrid style={{ marginBottom: 0 }}>
                        {groupedPastEvents[year].map(event => renderEventCard(event, false))}
                      </EventsGrid>
                    </EventsGridContainer>
                  </YearContent>
                )}
              </AnimatePresence>
            </YearFolder>
          ))}
        </div>
      )}

      {upcomingEvents.length === 0 && pastEvents.length === 0 && (
        <NoEvents>No events to display at the moment.</NoEvents>
      )}

      <InstagramSection>
        <SectionTitle>Follow Us on Instagram</SectionTitle>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <ElfsightWidget />
        </motion.div>
      </InstagramSection>

      <AnimatePresence>
        {selectedEvent && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedEvent(null)}
          >
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <CloseButton onClick={() => setSelectedEvent(null)}>
                <X size={24} />
              </CloseButton>
              <ModalBanner
                $imageUrl={selectedEvent.posterUrl ? getOptimizedUrl(selectedEvent.posterUrl, 1000, 85) : undefined}
                style={{ cursor: selectedEvent.posterUrl ? 'pointer' : 'default' }}
                onClick={() => selectedEvent.posterUrl && openImageViewer([selectedEvent.posterUrl], 0)}
              >
                {!selectedEvent.posterUrl && (
                  <PlaceholderIcon>
                    <Calendar size={80} />
                  </PlaceholderIcon>
                )}
              </ModalBanner>
              <ModalBody>
                <EventType>{selectedEvent.eventType || 'Event'}</EventType>
                <EventTitle>{selectedEvent.name}</EventTitle>
                <EventMeta>
                  <MetaItem>
                    <Calendar size={18} />
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </MetaItem>
                  {selectedEvent.time && (
                    <MetaItem>
                      <Clock size={18} />
                      {selectedEvent.time}
                    </MetaItem>
                  )}
                  {selectedEvent.location && (
                    <MetaItem>
                      <MapPin size={18} />
                      {selectedEvent.location}
                    </MetaItem>
                  )}
                </EventMeta>
                <EventDescription style={{ WebkitLineClamp: 'unset' }}>
                  {selectedEvent.description}
                </EventDescription>

                {selectedEvent.photos && selectedEvent.photos.length > 0 && (
                  <>
                    <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#1a2b4c' }}>
                      Event Photos
                    </h3>
                    <PhotosGrid>
                      {selectedEvent.photos.map((photo, idx) => (
                        <div
                          key={idx}
                          style={{ borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', height: '150px' }}
                          onClick={() => openImageViewer(selectedEvent.photos, idx)}
                        >
                          <OptimizedImage
                            src={photo}
                            width={400}
                            quality={80}
                            alt={`Event photo ${idx + 1}`}
                            objectFit="cover"
                            style={{ width: '100%', height: '100%' }}
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

      {/* Image Viewer Portal */}
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
                        download={`NCC_Event_${viewImageData.index + 1}.jpg`}
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

                    {/* Navigation Arrows */}
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

export default EventsPage;