import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Quote, ChevronDown, ChevronUp } from 'lucide-react';
import { getOptimizedUrl } from '../../utils/imageOptimizer';
import OptimizedImage from '../common/OptimizedImage';

const Container = styled.section`
  padding: 6rem 2rem;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rem;
  overflow: hidden;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1rem;
  text-align: center;
  position: relative;
  
  &::after {
    content: '';
    display: block;
    width: 60px;
    height: 4px;
    background: #FFBF00;
    margin: 1rem auto 0;
    border-radius: 2px;
  }
`;

const MessageRow = styled.div`
  display: flex;
  flex-direction: ${props => props.$isReverse ? 'row-reverse' : 'row'};
  align-items: center;
  gap: 4rem;
  max-width: 1200px;
  width: 100%;
  position: relative;

  @media (max-width: 968px) {
    flex-direction: column;
    gap: 2rem;
  }
`;

const PhotoCard = styled.div`
  flex: 0 0 320px;
  height: 400px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 20px 20px 60px rgba(0, 0, 0, 0.1), -20px -20px 60px rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 2;
  border: 4px solid white;
  transition: transform 0.4s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }

  &:hover {
    transform: translateY(-10px);
    
    img {
      transform: scale(1.05);
    }
  }

  @media (max-width: 968px) {
    width: 100%;
    max-width: 320px;
    height: 380px;
  }
`;

const ContentCard = styled.div`
  flex: 1;
  background: white;
  padding: 3.5rem;
  border-radius: 30px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.03);
  
  /* Decorative elements */
  &::before {
    content: '';
    position: absolute;
    top: 30px;
    ${props => props.$isReverse ? 'right: 0;' : 'left: 0;'}
    width: 4px;
    height: 60px;
    background: #FFBF00;
    border-radius: 0 4px 4px 0;
  }
`;

const QuoteIcon = styled.div`
  position: absolute;
  top: -20px;
  right: 40px;
  background: #FFBF00;
  color: white;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 20px rgba(255, 191, 0, 0.3);
  
  svg {
    width: 28px;
    height: 28px;
    fill: currentColor;
  }
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1.5rem;
`;

const Name = styled.h3`
  font-size: 2.2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.5px;
`;

const Role = styled.div`
  font-size: 0.9rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 2px;
    background: #FFBF00;
  }
`;

const MessageText = styled.div`
  font-size: 1.15rem;
  line-height: 1.9;
  color: #475569;
  font-family: 'Inter', sans-serif;
  white-space: pre-wrap;
  margin: 0;
  font-style: italic;
  position: relative;
`;

const ReadMoreButton = styled.button`
  background: none;
  border: none;
  color: #FFBF00;
  font-weight: 800;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  padding: 0.5rem 0;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  
  &:hover {
    color: #1a2b4c;
    gap: 12px;
  }
`;

const LeadershipMessages = () => {
  const [messages, setMessages] = useState([]);
  const [expandedIds, setExpandedIds] = useState({});

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const fetchLeadership = async () => {
      try {
        const q = query(collection(db, 'leadership'), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(data);
      } catch (error) {
        console.error('Error fetching leadership:', error);
      }
    };
    fetchLeadership();
  }, []);

  if (messages.length === 0) return null;

  return (
    <Container>
      <SectionTitle>Leadership Messages</SectionTitle>
      {messages.map((person, index) => {
        const isReverse = index % 2 !== 0;
        return (
          <MessageRow key={person.id} $isReverse={isReverse}>
            <PhotoCard>
              <OptimizedImage
                src={person.imageUrl}
                width={600}
                quality={80}
                alt={person.name}
                objectFit="cover"
                objectPosition="top center"
                style={{ width: '100%', height: '100%' }}
              />
            </PhotoCard>
            <ContentCard $isReverse={isReverse}>
              <QuoteIcon>
                <Quote />
              </QuoteIcon>
              <Header>
                <Name>{person.name}</Name>
                <Role>{person.title}</Role>
              </Header>
              <MessageText>
                {person.quote?.length > 450 && !expandedIds[person.id]
                  ? `${person.quote.substring(0, 450)}...`
                  : person.quote
                }
                {person.quote?.length > 450 && (
                  <ReadMoreButton onClick={() => toggleExpand(person.id)}>
                    {expandedIds[person.id] ? 'Show Less' : 'Read Full Message'}
                    {expandedIds[person.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </ReadMoreButton>
                )}
              </MessageText>
            </ContentCard>
          </MessageRow>
        );
      })}
    </Container>
  );
};

export default LeadershipMessages;
