import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';

import armyLogo from '../../assets/army-logo.png';
import navyLogo from '../../assets/navy-logo.png';
import airforceLogo from '../../assets/airforce-logo.png';
import { getOptimizedUrl } from '../../utils/imageOptimizer';
import OptimizedImage from '../common/OptimizedImage';

const WingsContainer = styled.section`
  padding: 6rem 2rem;
  background-color: #F8F9FA; // A slightly different background color to stand out

  // ✨ Responsive: Reduce padding on smaller screens
  @media (max-width: 768px) {
    padding: 4rem 1rem;
  }
`;

const WingsContent = styled.div`
  max-width: 1600px;
  margin: 0 auto;

  @media (max-width: 1440px) {
    max-width: 1200px;
  }
`;

const SectionTitle = styled(motion.h2)`
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4rem;
  color: #1A2B4C;

  // ✨ Responsive: Adjust font size for smaller screens
  @media (max-width: 768px) {
    font-size: 2.2rem;
    margin-bottom: 3rem;
  }
`;

const WingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2.5rem;

  // ✨ Responsive: Adjust gap for smaller screens
  @media (max-width: 768px) {
    gap: 2rem;
  }
`;

const WingCard = styled(motion.div)`
  background: #FFFFFF;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease; // Added transition for hover

  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
`;

const CardImage = styled.div`
  height: 200px;
  overflow: hidden;
`;

const CardContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex-grow: 1;
`;

const WingIcon = styled.div`
  width: 90px;
  height: 90px;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-top: -60px;
  margin-bottom: 1rem;
  border: 4px solid #fff;
  img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
`;

const WingTitle = styled.h3`
  font-size: 1.75rem;
  font-weight: 700;
  color: #1A2B4C;
  margin: 0;

  // ✨ Responsive: Adjust font size
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const WingDescription = styled.p`
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
  margin: 1rem 0;
  flex-grow: 1;
`;

const ExploreButton = styled(motion.button)`
  background: #FFBF00;
  border: none;
  color: #1A2B4C;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: auto;
`;

const wings = [
  { id: 'army', title: 'Army Wing', description: 'Building strong, disciplined leaders through comprehensive military training.', icon: armyLogo, image: 'https://img.etimg.com/thumb/width-1600,height-900,imgsize-305892,resizemode-75,msid-107807698/news/defence/army-plans-rs-57000-crore-project-to-replace-t-72-tanks-with-modern-combat-vehicles.jpg' },
  { id: 'navy', title: 'Navy Wing', description: 'Preparing maritime leaders with naval traditions, seamanship, and oceanic adventures.', icon: navyLogo, image: 'https://cf-img-a-in.tosshub.com/sites/visualstory/wp/2024/02/Screenshot-2024-02-08-at-42905-PM.png' },
  { id: 'airforce', title: 'Air Wing', description: 'Soaring to new heights with aviation excellence and aerospace technology.', icon: airforceLogo, image: 'https://th.bing.com/th/id/OIP.fkJWC2RbMq5Pm5qAbfkepAHaEI?w=334&h=186&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3' }
];

// --- The component's logic is unchanged ---
const WingsSection = ({ id }) => { // ✨ Added id prop for scrolling
  const navigate = useNavigate();
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
  };

  return (
    <WingsContainer id={id} ref={ref}> {/* ✨ Use the id prop here */}
      <WingsContent>
        <motion.div variants={containerVariants} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <SectionTitle>Three Wings of Excellence</SectionTitle>
          <WingsGrid>
            {wings.map((wing) => (
              <WingCard
                key={wing.id}
                variants={cardVariants}
                // whileHover is better handled by CSS for performance unless it's a complex animation
                onClick={() => navigate(`/wing/${wing.id}`)}
              >
                <CardImage>
                  <OptimizedImage
                    src={wing.image}
                    width={600}
                    quality={70}
                    alt={wing.title}
                    objectFit="cover"
                    style={{ width: '100%', height: '100%' }}
                  />
                </CardImage>
                <CardContent>
                  <WingIcon><img src={wing.icon} alt={`${wing.title} Logo`} loading="lazy" /></WingIcon>
                  <WingTitle>{wing.title}</WingTitle>
                  <WingDescription>{wing.description}</WingDescription>
                  <ExploreButton
                    onClick={(e) => { e.stopPropagation(); navigate(`/wing/${wing.id}`); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Explore Wing
                  </ExploreButton>
                </CardContent>
              </WingCard>
            ))}
          </WingsGrid>
        </motion.div>
      </WingsContent>
    </WingsContainer>
  );
};

export default WingsSection;