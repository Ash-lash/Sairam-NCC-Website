import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

const NotificationOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const NotificationCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const NotificationHeader = styled.div`
  background: linear-gradient(135deg, #FFBF00 0%, #FFD700 100%);
  padding: 1.5rem;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.5);
    transform: rotate(90deg);
  }
  
  svg {
    color: #1a2b4c;
  }
`;

const NotificationTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a2b4c;
  margin: 0;
  padding-right: 3rem;
`;

const NotificationBadge = styled.span`
  display: inline-block;
  background: #1a2b4c;
  color: #FFBF00;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.5rem;
`;

const PosterSection = styled.div`
  width: 100%;
  height: 250px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ContentSection = styled.div`
  padding: 2rem;
`;

const EventName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a2b4c;
  margin-bottom: 1rem;
`;

const EventDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
`;

const DetailItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  color: #555;
  
  svg {
    color: #FFBF00;
    flex-shrink: 0;
  }
`;

const Description = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
  margin-bottom: 1.5rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  
  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  flex: 1;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.$primary ? `
    background: linear-gradient(135deg, #FFBF00 0%, #FFD700 100%);
    color: #1a2b4c;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 191, 0, 0.4);
    }
  ` : `
    background: #f0f0f0;
    color: #666;
    
    &:hover {
      background: #e0e0e0;
    }
  `}
`;

const EventNotification = () => {
  const [event, setEvent] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    fetchUpcomingEvent();
  }, []);

  const fetchUpcomingEvent = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(db, 'events'),
        where('date', '>=', today)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        let events = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Local Filter to avoid Index Error
        events = events.filter(e => e.status === 'upcoming');

        if (events.length === 0) return;

        // Sort by date and get the nearest event
        events.sort((a, b) => new Date(a.date) - new Date(b.date));
        const upcomingEvent = events[0];

        // Check if this event was already dismissed in this session
        const dismissedEvents = JSON.parse(sessionStorage.getItem('dismissedEvents') || '[]');

        if (!dismissedEvents.includes(upcomingEvent.id)) {
          setEvent(upcomingEvent);
          setShowNotification(true);
        }
      }
    } catch (error) {
      console.error('Error fetching upcoming event:', error);
    }
  };

  const handleClose = () => {
    setShowNotification(false);
  };

  const handleDismiss = () => {
    if (event) {
      const dismissedEvents = JSON.parse(sessionStorage.getItem('dismissedEvents') || '[]');
      dismissedEvents.push(event.id);
      sessionStorage.setItem('dismissedEvents', JSON.stringify(dismissedEvents));
    }
    setShowNotification(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {showNotification && event && (
        <NotificationOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <NotificationCard
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <NotificationHeader>
              <CloseButton onClick={handleClose}>
                <X size={20} />
              </CloseButton>
              <NotificationTitle>Upcoming Event!</NotificationTitle>
              <NotificationBadge>{event.eventType}</NotificationBadge>
            </NotificationHeader>

            {event.posterUrl && (
              <PosterSection>
                <img src={event.posterUrl} alt={event.eventName} loading="lazy" />
              </PosterSection>
            )}

            <ContentSection>
              <EventName>{event.eventName}</EventName>

              <EventDetails>
                <DetailItem>
                  <Calendar size={20} />
                  <span>{formatDate(event.date)}</span>
                </DetailItem>

                {event.time && (
                  <DetailItem>
                    <Clock size={20} />
                    <span>{event.time}</span>
                  </DetailItem>
                )}

                {event.venue && (
                  <DetailItem>
                    <MapPin size={20} />
                    <span>{event.venue}</span>
                  </DetailItem>
                )}
              </EventDetails>

              {event.description && (
                <Description>{event.description}</Description>
              )}

              <ButtonGroup>
                <Button $primary onClick={handleClose}>
                  View Details
                </Button>
                <Button onClick={handleDismiss}>
                  Don't Show Again
                </Button>
              </ButtonGroup>
            </ContentSection>
          </NotificationCard>
        </NotificationOverlay>
      )}
    </AnimatePresence>
  );
};

export default EventNotification;
