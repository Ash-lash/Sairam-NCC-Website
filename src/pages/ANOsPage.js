import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Phone, Mail, User } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/common/SEO';
import CadetDetailModal from '../components/ui/CadetDetailModal';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import OptimizedImage from '../components/common/OptimizedImage';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2b4c 0%, #2d4a7c 100%);
  padding: 100px 2rem 4rem;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const PageTitle = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #FFBF00 0%, #FFD700 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  margin-bottom: 4rem;
  font-weight: 300;
`;

const ANOsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ANOCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem 2rem;
  text-align: center;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 48px rgba(255, 191, 0, 0.3);
  }
`;

const WingBanner = styled.div`
  height: 8px;
  width: 100%;
  background: ${props => {
    switch (props.$wing) {
      case 'Army': return 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)'; // Red for Army
      case 'Air': return 'linear-gradient(90deg, #38BDF8 0%, #60A5FA 100%)'; // Light Blue for Air
      case 'Navy': return 'linear-gradient(90deg, #1E3A8A 0%, #3B82F6 100%)'; // Dark Blue for Navy
      default: return 'linear-gradient(90deg, #FFBF00 0%, #FFD700 100%)';
    }
  }};
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`;

const PhotoFrame = styled.div`
  width: 240px;
  height: 300px;
  border-radius: 20px;
  background: ${props => {
    switch (props.$wing) {
      case 'Army': return 'linear-gradient(135deg, #DC2626, #EF4444)';
      case 'Air': return 'linear-gradient(135deg, #38BDF8, #60A5FA)';
      case 'Navy': return 'linear-gradient(135deg, #1E3A8A, #3B82F6)';
      default: return 'linear-gradient(135deg, #FFBF00, #FFD700)';
    }
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  border: 4px solid white;
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  position: relative;
  cursor: ${props => props.$hasReport ? 'pointer' : 'default'};
  transition: transform 0.3s ease;
  
  &:hover {
    transform: ${props => props.$hasReport ? 'scale(1.02)' : 'none'};
  }
`;

const ANOPhoto = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const PhotoPlaceholder = styled.div`
  color: white;
  svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
`;

const WingLabel = styled.div`
  display: inline-block;
  padding: 0.5rem 1.2rem;
  background: ${props => {
    switch (props.$wing) {
      case 'Army': return 'linear-gradient(135deg, #DC2626, #EF4444)'; // Red for Army
      case 'Air': return 'linear-gradient(135deg, #38BDF8, #60A5FA)'; // Light Blue for Air
      case 'Navy': return 'linear-gradient(135deg, #1E3A8A, #3B82F6)'; // Dark Blue for Navy
      default: return 'linear-gradient(135deg, #FFBF00, #FFD700)';
    }
  }};
  color: white;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const RankName = styled.h2`
  font-size: 1.6rem;
  font-weight: 700;
  color: #1a2b4c;
  margin-bottom: 0.5rem;
`;

const Name = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 2rem;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  width: 100%;
`;

const ContactItem = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 0.9rem;
  background: rgba(255, 191, 0, 0.08);
  border-radius: 12px;
  text-decoration: none;
  color: #333;
  transition: all 0.3s ease;
  font-weight: 500;
  
  &:hover {
    background: ${props => {
    switch (props.$wing) {
      case 'Army': return '#DC2626'; // Red for Army
      case 'Air': return '#38BDF8'; // Light Blue for Air
      case 'Navy': return '#1E3A8A'; // Dark Blue for Navy
      default: return '#FFBF00';
    }
  }};
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    
    svg {
      color: white;
    }
  }
  
  svg {
    color: ${props => {
    switch (props.$wing) {
      case 'Army': return '#DC2626'; // Red for Army
      case 'Air': return '#38BDF8'; // Light Blue for Air
      case 'Navy': return '#1E3A8A'; // Dark Blue for Navy
      default: return '#FFBF00';
    }
  }};
    flex-shrink: 0;
    transition: color 0.3s ease;
  }
`;

const ContactText = styled.span`
  font-size: 0.95rem;
  word-break: break-all;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: white;
  font-size: 1.5rem;
`;

const ANOsPage = () => {
  const [anos, setAnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedANO, setSelectedANO] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchANOs();
  }, []);

  const fetchANOs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'anos'));
      const anosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by custom order first, then by wing as fallback
      const wingOrder = { 'Army': 1, 'Navy': 2, 'Air': 3 };
      anosData.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return wingOrder[a.wing] - wingOrder[b.wing];
      });

      setAnos(anosData);
    } catch (error) {
      console.error('Error fetching ANOs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingContainer>Loading ANO Information...</LoadingContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SEO
        title="Associate NCC Officers (ANOs)"
        description="Meet the dedicated Associate NCC Officers (ANOs) leading the NCC units at Sri Sairam Engineering College."
      />
      <ContentWrapper>
        <PageTitle
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Our Associate NCC Officers
        </PageTitle>
        <Subtitle>
          Meet the dedicated officers leading our NCC unit across all three wings
        </Subtitle>

        <ANOsGrid>
          {anos.map((ano, index) => (
            <ANOCard
              key={ano.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <WingBanner $wing={ano.wing} />
              <PhotoFrame
                $wing={ano.wing}
                $hasReport={!!ano.pdfUrl}
                onClick={() => {
                  if (ano.pdfUrl) {
                    setSelectedANO(ano);
                    setIsModalOpen(true);
                  }
                }}
              >
                {ano.photoUrl ? (
                  <OptimizedImage
                    src={ano.photoUrl}
                    alt={ano.name}
                    width={500}
                    quality={85}
                    objectFit="cover"
                    objectPosition="top center"
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <PhotoPlaceholder>
                    <User size={64} />
                  </PhotoPlaceholder>
                )}
              </PhotoFrame>
              <WingLabel $wing={ano.wing}>{ano.wing} Wing</WingLabel>
              <RankName>{ano.rank}</RankName>
              <Name>{ano.name}</Name>
              <ContactInfo>
                <ContactItem href={`tel:${ano.phone}`} $wing={ano.wing}>
                  <Phone size={20} />
                  <ContactText>{ano.phone}</ContactText>
                </ContactItem>
                <ContactItem href={`mailto:${ano.email}`} $wing={ano.wing}>
                  <Mail size={20} />
                  <ContactText>{ano.email}</ContactText>
                </ContactItem>
              </ContactInfo>
            </ANOCard>
          ))}
        </ANOsGrid>
      </ContentWrapper>

      {/* Shim ANO data to match CadetDetailModal expectations */}
      <CadetDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cadet={selectedANO ? {
          Name: selectedANO.name,
          pdfURL: selectedANO.pdfUrl
        } : null}
      />
    </PageContainer>
  );
};

export default ANOsPage;
