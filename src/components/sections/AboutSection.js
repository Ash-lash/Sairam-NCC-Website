import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { useInView } from 'react-intersection-observer';
import { Target, Users, Award, Shield } from 'lucide-react';

const AboutContainer = styled.section`
  padding: 6rem 2rem;
  position: relative;
  overflow: hidden;
`;
const AboutContent = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  position: relative;
  z-index: 2;

  @media (max-width: 1440px) {
    max-width: 1200px;
  }
`;
const SectionTitle = styled(motion.h2)`
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  color: #1A2B4C;
`;
const SectionSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: #555;
  text-align: center;
  max-width: 800px;
  margin: 0 auto 4rem auto;
  line-height: 1.6;
`;
const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-bottom: 6rem;
`;
const StatCard = styled(motion.div)`
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 15px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
`;
const StatIcon = styled.div`
  width: 70px;
  height: 70px;
  margin: 0 auto 1rem;
  background: #F0F2F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1A2B4C;
`;
const StatNumber = styled(motion.h3)`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1A2B4C;
  margin-bottom: 0.5rem;
`;
const StatLabel = styled.p`
  font-size: 1rem;
  color: #6B7280;
  font-weight: 500;
`;
const ValuesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;
const ValueCard = styled(motion.div)`
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 2.5rem;
  text-align: left;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
`;
const ValueTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1A2B4C;
  margin-bottom: 1rem;
`;
const ValueDescription = styled.p`
  font-size: 1rem;
  color: #555;
  line-height: 1.6;
`;

const AboutSection = () => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });

  const stats = [
    { icon: Users, number: 500, label: 'Active Cadets' },
    { icon: Award, number: 25, label: 'Years of Excellence' },
    { icon: Target, number: 100, label: 'Training Programs' },
    { icon: Shield, number: 95, label: 'Success Rate %' }
  ];

  const values = [
    { title: 'Discipline', description: 'Building character through structured training and adherence to military values and ethics.' },
    { title: 'Leadership', description: 'Developing future leaders who can guide and inspire others in both military and civilian contexts.' },
    { title: 'Service', description: 'Instilling a sense of duty and commitment to serve the nation with honor and dedication.' },
    { title: 'Unity', description: 'Fostering teamwork, cooperation, and national integration among cadets from diverse backgrounds.' }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  return (
    <AboutContainer ref={ref}>
      <AboutContent>
        <motion.div variants={containerVariants} initial="hidden" animate={inView ? "visible" : "hidden"}>
          <SectionTitle variants={itemVariants}>About Sairam NCC</SectionTitle>
          <SectionSubtitle variants={itemVariants}>
            The National Cadet Corps at Sri Sai Ram Engineering College is dedicated to developing character, comradeship, discipline, leadership, and the spirit of adventure among our students.
          </SectionSubtitle>
          <StatsContainer>
            {stats.map((stat, index) => (
              <StatCard key={index} variants={itemVariants} whileHover={{ scale: 1.05, y: -5, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}>
                <StatIcon><stat.icon size={32} /></StatIcon>
                <StatNumber>{stat.number}+</StatNumber>
                <StatLabel>{stat.label}</StatLabel>
              </StatCard>
            ))}
          </StatsContainer>
          <ValuesContainer>
            {values.map((value, index) => (
              <ValueCard key={index} variants={itemVariants} whileHover={{ scale: 1.02, y: -5, boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)" }}>
                <ValueTitle>{value.title}</ValueTitle>
                <ValueDescription>{value.description}</ValueDescription>
              </ValueCard>
            ))}
          </ValuesContainer>
        </motion.div>
      </AboutContent>
    </AboutContainer>
  );
};

export default AboutSection;