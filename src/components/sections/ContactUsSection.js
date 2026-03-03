import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Phone, Mail, User, Shield } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const ContactSection = styled.section`
  padding: 5rem 2rem;
  background: linear-gradient(135deg, #1a2b4c 0%, #2d4a7c 100%);
  position: relative;
  overflow: hidden;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled(motion.h2)`
  font-size: 3rem;
  font-weight: 900;
  color: #FFBF00;
  text-align: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const SectionSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  margin-bottom: 3rem;
`;

const ANOGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
`;

const ANOCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  border: 2px solid ${props => props.$borderColor || '#FFBF00'};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 12px 40px rgba(255, 191, 0, 0.4);
    border-color: #FFBF00;
  }
`;

const WingBadge = styled.div`
  display: inline-block;
  background: ${props => props.$bgColor || '#FFBF00'};
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-transform: uppercase;
`;

const ANOName = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFBF00;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ANORank = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ContactInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const ContactItem = styled.a`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  font-size: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 191, 0, 0.2);
    color: #FFBF00;
    transform: translateX(5px);
  }
  
  svg {
    flex-shrink: 0;
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  padding: 3rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.2rem;
  padding: 3rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  border: 2px dashed rgba(255, 191, 0, 0.5);
`;

const ContactUsSection = () => {
    const [anos, setAnos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchANOs();
    }, []);

    const fetchANOs = async () => {
        try {
            const q = query(collection(db, 'anos'), orderBy('order', 'asc'));
            const querySnapshot = await getDocs(q);
            const anosList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAnos(anosList);
        } catch (error) {
            console.error('Error fetching ANOs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWingColor = (wing) => {
        switch (wing?.toLowerCase()) {
            case 'army':
                return {
                    bg: 'linear-gradient(135deg, #059669, #10B981)',
                    border: '#10B981'
                };
            case 'air':
                return {
                    bg: 'linear-gradient(135deg, #0EA5E9, #38BDF8)',
                    border: '#38BDF8'
                };
            case 'navy':
                return {
                    bg: 'linear-gradient(135deg, #1E40AF, #3B82F6)',
                    border: '#3B82F6'
                };
            default:
                return {
                    bg: 'linear-gradient(135deg, #FFBF00, #FCD34D)',
                    border: '#FFBF00'
                };
        }
    };

    return (
        <ContactSection id="contact">
            <Container>
                <SectionTitle
                    initial={{ opacity: 0, y: -30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    Contact Us
                </SectionTitle>
                <SectionSubtitle
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    Get in touch with our Associate NCC Officers
                </SectionSubtitle>

                {loading ? (
                    <LoadingMessage>Loading ANO contacts...</LoadingMessage>
                ) : anos.length === 0 ? (
                    <EmptyMessage>
                        No ANO contacts available. Please add ANOs through the admin panel.
                    </EmptyMessage>
                ) : (
                    <ANOGrid>
                        {anos.map((ano, index) => {
                            const wingColors = getWingColor(ano.wing);
                            return (
                                <ANOCard
                                    key={ano.id}
                                    $borderColor={wingColors.border}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <WingBadge $bgColor={wingColors.bg}>
                                        {ano.wing} Wing
                                    </WingBadge>

                                    <ANOName>
                                        <User size={24} />
                                        {ano.name}
                                    </ANOName>

                                    <ANORank>
                                        <Shield size={20} />
                                        {ano.rank}
                                    </ANORank>

                                    <ContactInfo>
                                        {ano.phone && (
                                            <ContactItem href={`tel:${ano.phone}`}>
                                                <Phone size={20} />
                                                {ano.phone}
                                            </ContactItem>
                                        )}

                                        {ano.email && (
                                            <ContactItem href={`mailto:${ano.email}`}>
                                                <Mail size={20} />
                                                {ano.email}
                                            </ContactItem>
                                        )}
                                    </ContactInfo>
                                </ANOCard>
                            );
                        })}
                    </ANOGrid>
                )}
            </Container>
        </ContactSection>
    );
};

export default ContactUsSection;
