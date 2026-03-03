import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Megaphone, AlertTriangle, ArrowRight, X, Info } from 'lucide-react';

const NCC = {
  navy: '#1A2B4C',
  red: '#D22B2B',
  gold: '#FFBF00',
  sky: '#87CEEB',
};

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
`;

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(210, 43, 43, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(210, 43, 43, 0); }
  100% { box-shadow: 0 0 0 0 rgba(210, 43, 43, 0); }
`;

const NotificationWrapper = styled(motion.div)`
  position: absolute;
  top: 100px;
  right: 2rem;
  width: 340px;
  z-index: 1000;
  
  @media (max-width: 1024px) {
    position: fixed;
    top: auto;
    bottom: 2rem;
    right: 1rem;
    left: 1rem;
    width: auto;
    max-width: 400px;
    margin: 0 auto;
  }
`;

const MainContainer = styled.div`
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  border: 1px solid rgba(26, 43, 76, 0.1);
  display: flex;
  flex-direction: column;
  animation: ${float} 4s ease-in-out infinite;
`;

const Header = styled.div`
  background: ${NCC.navy};
  padding: 1rem 1.25rem;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, ${NCC.gold}, ${NCC.red});
  }
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 800;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  svg { color: ${NCC.gold}; }
`;

const CloseBtn = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${NCC.red};
    transform: rotate(90deg);
  }
`;

const ContentArea = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(26, 43, 76, 0.1);
    border-radius: 10px;
  }
`;

const ItemWrapper = styled(motion.div)`
  padding: 1rem;
  background: ${props => props.$urgent ? 'linear-gradient(135deg, #fffafa, #fff1f1)' : '#F8FAFC'};
  border-radius: 16px;
  border: 2px solid ${props => props.$urgent ? 'rgba(210, 43, 43, 0.1)' : 'transparent'};
  position: relative;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.02);
  }
`;

const UrgentBadge = styled.div`
  position: absolute;
  top: -8px;
  left: 1rem;
  background: ${NCC.red};
  color: white;
  font-size: 0.6rem;
  font-weight: 900;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: uppercase;
  animation: ${pulse} 2s infinite;
`;

const ItemTitle = styled.h4`
  margin: 0 0 0.4rem 0;
  font-size: 1rem;
  font-weight: 800;
  color: ${NCC.navy};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ItemBody = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
  line-height: 1.5;
`;

const ActionRow = styled.div`
  margin-top: 0.75rem;
  display: flex;
  justify-content: flex-end;
`;

const LinkButton = styled.a`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 800;
  color: ${NCC.navy};
  text-decoration: none;
  background: white;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  border: 1px solid rgba(26, 43, 76, 0.05);
  transition: all 0.2s;
  
  &:hover {
    background: ${NCC.navy};
    color: white;
    gap: 0.5rem;
  }
`;

const AnnouncementsBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (closed || loading || items.length === 0) return null;

  return (
    <AnimatePresence>
      <NotificationWrapper
        initial={{ opacity: 0, scale: 0.8, x: 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: 50 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      >
        <MainContainer>
          <Header>
            <HeaderTitle>
              <Megaphone size={18} />
              Brigate Updates
            </HeaderTitle>
            <CloseBtn onClick={() => setClosed(true)}>
              <X size={16} />
            </CloseBtn>
          </Header>

          <ContentArea>
            {items.map((item, i) => (
              <ItemWrapper
                key={item.id}
                $urgent={item.highPriority}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.1) }}
              >
                {item.highPriority && <UrgentBadge>Attention</UrgentBadge>}
                <ItemTitle>
                  {!item.highPriority && <Info size={14} color={NCC.gold} />}
                  {item.highPriority && <AlertTriangle size={14} color={NCC.red} />}
                  {item.title}
                </ItemTitle>
                <ItemBody>{item.content}</ItemBody>
                {item.link && (
                  <ActionRow>
                    <LinkButton href={item.link} target="_blank" rel="noreferrer">
                      DETAILS <ArrowRight size={12} />
                    </LinkButton>
                  </ActionRow>
                )}
              </ItemWrapper>
            ))}
          </ContentArea>
        </MainContainer>
      </NotificationWrapper>
    </AnimatePresence>
  );
};

export default AnnouncementsBoard;
