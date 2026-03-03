import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, BookOpen, Award, Flag, Users, Target } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/common/SEO';
import OrganizationFlowchart from '../components/sections/OrganizationFlowchart';
import PhotoSlideshow from '../components/sections/PhotoSlideshow';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import OptimizedImage from '../components/common/OptimizedImage';

// NEW THEME - Clean White with Blue Accents
const PRIMARY_BLUE = '#1E3A8A';
const ACCENT_GOLD = '#F59E0B';
const LIGHT_BG = '#F8FAFC';
const WHITE = '#FFFFFF';
const TEXT_DARK = '#1F2937';
const TEXT_LIGHT = '#6B7280';

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${WHITE};
  padding-top: 80px;
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_BLUE} 0%, #3B82F6 100%);
  padding: 4rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="none"/><path d="M0 0L50 50L0 100L50 100L100 50L50 0Z" fill="rgba(255,255,255,0.03)"/></svg>');
  opacity: 0.5;
}
`;

const HeroTitle = styled(motion.h1)`
  font-size: 3.5rem;
  font-weight: 900;
  color: ${WHITE};
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 800px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const ContentSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
`;

const SectionTitle = styled(motion.h2)`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${PRIMARY_BLUE};
  margin-bottom: 2rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 3rem 0;
`;

const Card = styled(motion.div)`
  background: ${WHITE};
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 2px solid ${LIGHT_BG};
  transition: all 0.3s ease;
  
  &:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(30, 58, 138, 0.2);
  border-color: ${ACCENT_GOLD};
}
`;

const NodeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const CardIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, ${PRIMARY_BLUE}, #3B82F6);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  animation: ${float} 3s ease-in-out infinite;
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${PRIMARY_BLUE};
  margin-bottom: 1rem;
`;

const CardText = styled.p`
  font-size: 1rem;
  color: ${TEXT_LIGHT};
  line-height: 1.8;
`;

const ContentBox = styled(motion.div)`
  background: ${WHITE};
  border-radius: 15px;
  padding: 2rem;
  margin: 2rem 0;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  border: 2px solid ${LIGHT_BG};
  
  &:hover {
  border-color: ${PRIMARY_BLUE};
}
`;

const ContentTitle = styled.h3`
  font-size: 1.8rem;
  font-weight: 700;
  color: ${PRIMARY_BLUE};
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ContentText = styled.p`
  font-size: 1.05rem;
  line-height: 1.8;
  color: ${TEXT_DARK};
  white-space: pre-line;
`;

const MottoBox = styled(motion.div)`
  background: linear-gradient(135deg, ${ACCENT_GOLD}, #FBBF24);
  padding: 3rem;
  border-radius: 20px;
  text-align: center;
  margin: 3rem 0;
  box-shadow: 0 15px 35px rgba(245, 158, 11, 0.3);
`;

const MottoText = styled.h2`
  font-size: 3rem;
  font-weight: 900;
  color: ${WHITE};
  text-transform: uppercase;
  letter-spacing: 3px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const PrinciplesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
`;

const PrincipleCard = styled(motion.div)`
  background: linear-gradient(135deg, ${PRIMARY_BLUE}, #3B82F6);
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  color: ${WHITE};
  box-shadow: 0 10px 25px rgba(30, 58, 138, 0.3);
  
  &:hover {
  transform: scale(1.05);
}
`;

const PrincipleNumber = styled.div`
  font-size: 2.5rem;
  font-weight: 900;
  color: ${ACCENT_GOLD};
  margin-bottom: 0.5rem;
`;

const PrincipleText = styled.p`
  font-size: 1.1rem;
  font-weight: 600;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  background: ${WHITE};
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const TableHeader = styled.th`
  background: linear-gradient(135deg, ${PRIMARY_BLUE}, #3B82F6);
  color: ${WHITE};
  padding: 1rem;
  text-align: left;
  font-weight: 700;
  font-size: 1.1rem;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
  background: ${LIGHT_BG};
}
  
  &:hover {
  background: rgba(30, 58, 138, 0.05);
}
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #E5E7EB;
  color: ${TEXT_DARK};
`;




// ReactFlow components removed in favor of OrganizationFlowchart

const ProfileModalOverlay = styled(motion.div)`
  position: fixed;
  img {
    width: 100%; height: 100%;
    transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ProfileModalContent = styled(motion.div)`
  background: white;
  width: 100%;
  max-width: 450px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  position: relative;
`;

const FullPoster = styled(OptimizedImage)`
  max-width: 100%;
  max-height: 90vh;
  border-radius: 4px;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.8);
  user-select: none;
`;

const ProfileHero = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_BLUE} 0%, #3B82F6 100%);
  padding: 3rem 2rem;
  color: white;
  text-align: center;
  position: relative;
`;

const ProfileImageContainer = styled.div`
  width: 220px;
  height: 220px;
  border-radius: 20px;
  border: 4px solid white;
  background: #f8fafc;
  margin: 0 auto;
  position: relative;
  top: 50px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.15);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProfileBody = styled.div`
  padding: 60px 2rem 2.5rem;
`;

const DecoTag = styled.span`
  background: ${props => props.$color}15;
  color: ${props => props.$color};
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid ${props => props.$color}30;
`;
const NodeTitleText = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

// Custom Node types removed

const AboutNCCPage = () => {
  const [officerData, setOfficerData] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [selectedOfficer, setSelectedOfficer] = React.useState(null);

  const handleNodeClick = (data) => {
    setSelectedOfficer(data);
  };

  React.useEffect(() => {
    const fetchFlowData = async () => {
      try {
        // Official Default Names based on the latest Directorate reference provided in user image
        const defaultNames = {
          dg: { name: 'LIEUTENANT GENERAL VIRENDRA VATS', rank: 'DIRECTORATE GENERAL', color: '#0f172a' },
          ddg: { name: 'COMMODORE S RAGHAV', rank: 'DEPUTY DIRECTOR GENERAL', color: '#0f172a' },
          group_a: { name: 'COLONEL HARI TEJA', rank: "CHENNAI A GROUP COMMANDER", color: '#0f172a' },
          group_b: { name: 'GROUP CAPTAIN PRABHU', rank: "CHENNAI B GROUP COMMANDER", color: '#0f172a' },
          unit_army: { name: 'COLONEL VISHWANATHAN R', rank: '1 (TN) BTY NCC UNIT (ARMY WING)', subtitle: 'OFFICER COMMANDING', color: '#0f172a' },
          unit_med: { name: 'OFFICER COMMANDING', rank: '1 (TN) MED NCC UNIT (ARMY WING)', color: '#0f172a' },
          unit_air: { name: 'GROUP CAPTAIN THIAGARAJAN J R', rank: '1 (TN) AIR SQN NCC UNIT (AIR WING)', subtitle: 'COMMANDING OFFICER', color: '#0f172a' },
          unit_navy: { name: 'COMMANDER FAZAL BAZHA', rank: '4 (TN) NAVAL (TECH) NCC UNIT (NAVY WING)', subtitle: 'OFFICER COMMANDING', color: '#0f172a' },
          ano_army: { name: 'LIEUTENANT S K DINESH KUMAR', rank: 'ASSOCIATE NCC OFFICER', color: '#0f172a' },
          ano_med: { name: 'ASSOCIATE NCC OFFICER', rank: 'ASSOCIATE NCC OFFICER', color: '#0f172a' },
          ano_air: { name: 'FLIGHT LIEUTENANT K V MURUGAN', rank: 'ASSOCIATE NCC OFFICER', color: '#0f172a' },
          ano_navy: { name: 'SUB LIEUTENANT PRABHU V', rank: 'ASSOCIATE NCC OFFICER', color: '#0f172a' }
        };

        // Fetch Admin Hierarchy from Firebase
        const orgSnapshot = await getDocs(collection(db, 'organization'));
        const officerData = { ...defaultNames };

        orgSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.name) {
            officerData[doc.id] = { ...officerData[doc.id], ...data };
          }
        });

        setOfficerData(officerData);
      } catch (error) {
        console.error('Error fetching flowchart data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFlowData();
  }, []);

  const cardinalPrinciples = [
    "Obey with a smile",
    "Be punctual",
    "Work hard and without fuss",
    "Make no excuse and tell no lies"
  ];

  const aims = [
    {
      icon: <Target size={30} color="#fff" />,
      title: "Character Development",
      text: "To develop character, comradeship, discipline, leadership, secular outlook, spirit of adventure, sportsmanship and the ideals of selfless service amongst the youth."
    },
    {
      icon: <Users size={30} color="#fff" />,
      title: "Human Resource",
      text: "To create a human resource of organized, trained and motivated youth, to provide leadership in all walks of life and always be available for the service of nation."
    },
    {
      icon: <Shield size={30} color="#fff" />,
      title: "Armed Forces Career",
      text: "To provide a suitable environment to motivate the youth to take up a career in armed forces."
    }
  ];

  return (
    <PageContainer>
      <SEO
        title="About NCC"
        description="Learn about the National Cadet Corps (NCC) at Sri Sairam Engineering College, our history, mission, and organizational structure."
      />
      <HeroSection>
        <HeroTitle
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          About NCC
        </HeroTitle>
        <HeroSubtitle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          National Cadet Corps - Building Character, Creating Leaders
        </HeroSubtitle>
      </HeroSection>

      <ContentSection>
        {/* Organization Flowchart */}
        <SectionTitle
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Organization of NCC
        </SectionTitle>

        {!loading && (
          <OrganizationFlowchart
            officerData={officerData}
            onNodeClick={handleNodeClick}
          />
        )}

        <AnimatePresence>
          {selectedOfficer && (
            <ProfileModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOfficer(null)}
            >
              <ProfileModalContent
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ProfileHero style={{ paddingBottom: '0' }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1.5rem', cursor: 'pointer', opacity: 0.7 }} onClick={() => setSelectedOfficer(null)}>✕</div>
                  <NodeTitleText style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '1rem' }}>{selectedOfficer.title}</NodeTitleText>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{selectedOfficer.name}</h2>
                  {selectedOfficer.subtitle && (
                    <div style={{ marginTop: '0.5rem', fontStyle: 'italic', opacity: 0.9 }}>{selectedOfficer.subtitle}</div>
                  )}
                  <ProfileImageContainer>
                    {selectedOfficer.imageUrl ? (
                      <OptimizedImage
                        src={selectedOfficer.imageUrl}
                        width={400}
                        quality={80}
                        alt={selectedOfficer.name}
                        objectFit="cover"
                        objectPosition="top center"
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <Users size={60} color="#cbd5e1" />
                    )}
                  </ProfileImageContainer>
                </ProfileHero>
                <ProfileBody>
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Official Decorations</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedOfficer.decorations && (typeof selectedOfficer.decorations === 'string' ? selectedOfficer.decorations.split(',') : selectedOfficer.decorations).filter(d => d && d.trim().length > 0).length > 0 ? (
                        (typeof selectedOfficer.decorations === 'string' ? selectedOfficer.decorations.split(',') : selectedOfficer.decorations)
                          .filter(deco => deco && deco.trim().length > 0)
                          .map((deco, i) => (
                            <DecoTag key={i} $color={selectedOfficer.color || PRIMARY_BLUE}>{deco.trim()}</DecoTag>
                          ))
                      ) : (
                        <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem' }}>No decorations listed.</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOfficer(null)}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#f1f5f9',
                      color: PRIMARY_BLUE,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Close Profile
                  </button>
                </ProfileBody>
              </ProfileModalContent>
            </ProfileModalOverlay>
          )}
        </AnimatePresence>

        {/* Gallery / Slideshow Section */}
        <div style={{ margin: '4rem 0' }}>
          <PhotoSlideshow collectionName="aboutNCCSlideshowImages" />
        </div>

        {/* NCC Camps Section */}
        <SectionTitle
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Target size={40} color={PRIMARY_BLUE} />
          NCC Camp List
        </SectionTitle>

        <CardText style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 3rem' }}>
          NCC offers a wide range of camps across different levels, providing cadets with unique opportunities for training, adventure, and national service.
        </CardText>

        <Grid>
          <ContentBox
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ borderLeft: `6px solid ${PRIMARY_BLUE}` }}
          >
            <ContentTitle><Shield size={24} /> Basic Training Camps</ContentTitle>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Camp Name</TableHeader>
                  <TableHeader>Description</TableHeader>
                </tr>
              </thead>
              <tbody>
                <TableRow>
                  <TableCell><strong>ATC (Annual Training Camp)</strong></TableCell>
                  <TableCell>Mandatory 10-day unit-level camp focusing on basic drill and certificate training.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>CATC (Combined ATC)</strong></TableCell>
                  <TableCell>Cadets from various schools and colleges train together to foster coordination.</TableCell>
                </TableRow>
              </tbody>
            </Table>
          </ContentBox>

          <ContentBox
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ borderLeft: `6px solid ${ACCENT_GOLD}` }}
          >
            <ContentTitle><Award size={24} /> Centrally Organized Camps</ContentTitle>
            <Table>
              <thead>
                <tr>
                  <TableHeader>Camp Name</TableHeader>
                  <TableHeader>Description</TableHeader>
                </tr>
              </thead>
              <tbody>
                <TableRow>
                  <TableCell><strong>EBSB (Ek Bharat Shreshtha Bharat)</strong></TableCell>
                  <TableCell>National integration camps promoting cultural exchange across states (formerly NIC).</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>ALC (Advanced Leadership Camp)</strong></TableCell>
                  <TableCell>Focuses on developing personality, communication, and leadership skills.</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell><strong>BLC (Basic Leadership Camp)</strong></TableCell>
                  <TableCell>The foundation for leadership training at the directorate level.</TableCell>
                </TableRow>
              </tbody>
            </Table>
          </ContentBox>
        </Grid>

        <ContentBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ background: LIGHT_BG }}
        >
          <ContentTitle><Flag size={24} /> National Level Prestige Camps</ContentTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Wing</TableHeader>
                <TableHeader>Prestigious National Camp</TableHeader>
                <TableHeader>Highlights</TableHeader>
              </tr>
            </thead>
            <tbody>
              <TableRow>
                <TableCell style={{ fontWeight: 700, color: '#D22B2B' }}>ARMY</TableCell>
                <TableCell><strong>Thal Sainik Camp (TSC)</strong></TableCell>
                <TableCell>All India competition in shooting, map reading, and obstacle course (Delhi, Uttar Pradesh).</TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: 700, color: '#87CEEB' }}>AIR</TableCell>
                <TableCell><strong>Vayu Sainik Camp (VSC)</strong></TableCell>
                <TableCell>Elite meet for Air wing; includes flying, aero-modeling, and skeet shooting (Jalalhalli, Karnataka).</TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: 700, color: '#000080' }}>NAVY</TableCell>
                <TableCell><strong>Nau Sainik Camp (NSC)</strong></TableCell>
                <TableCell>Naval training meet; features boat pulling, semaphore, and firing skills (Nasik, Maharashtra).</TableCell>
              </TableRow>
              <TableRow>
                <TableCell style={{ fontWeight: 700 }}>JOINT</TableCell>
                <TableCell><strong>Republic Day Camp (RDC)</strong></TableCell>
                <TableCell>The most prestigious camp. Culminates in the PM Rally and Rajpath Parade on Jan 26th.</TableCell>
              </TableRow>
            </tbody>
          </Table>
        </ContentBox>

        <Grid>
          <Card whileHover={{ scale: 1.02 }}>
            <CardTitle><Target size={20} /> Attachment Camps</CardTitle>
            <CardText>
              Cadets get attached to regular military units:
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                <li>IMA / OTA Attachment</li>
                <li>Naval Ship Attachment</li>
                <li>Air Force Station Attachment</li>
              </ul>
            </CardText>
          </Card>
          <Card whileHover={{ scale: 1.02 }}>
            <CardTitle><Award size={20} /> Adventure Camps</CardTitle>
            <CardText>
              Spirit of adventure training including:
              <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                <li>Para Basic Camp (Agra)</li>
                <li>Mountaineering / Trekking</li>
                <li>Snow Skiing / Scuba Diving</li>
              </ul>
            </CardText>
          </Card>
          <Card whileHover={{ scale: 1.02 }}>
            <CardTitle><Users size={20} /> Youth Exchange (YEP)</CardTitle>
            <CardText>
              Selected RDC cadets visit friendly foreign countries to represent the Indian NCC on a global stage.
            </CardText>
          </Card>
        </Grid>



        {/* History Section */}
        <SectionTitle
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <BookOpen size={40} color={PRIMARY_BLUE} />
          History of NCC
        </SectionTitle>

        <Card
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <CardText>
            The National Cadet Corps (NCC) was officially established in India on July 16, 1948, through the National Cadet Corps Act. Its origins can be traced back to the pre-independence era when the British Indian government created the University Corps in 1917 to meet the need for military officers in the Indian Army. After India gained independence in 1947, the need for a robust organization to develop the character, leadership, and discipline among the nation's youth became more pressing. Over the years, the NCC has grown into one of the largest youth organizations in the world.
          </CardText>
        </Card>

        <SectionTitle
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ marginTop: '4rem' }}
        >
          <Flag size={40} color={PRIMARY_BLUE} />
          History of Sairam NCC
        </SectionTitle>

        <Card
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <CardText>
            The National Cadet Corps (NCC) at Sri Sairam Engineering College, Chennai, has been an integral part of the institution's co-curricular framework since its establishment in 2003. The program initially began with the Air Wing, affiliated with the 4(TN) Air Squadron (Tech) NCC. In 2018, the college introduced the Army Wing under the 1 (TN) Battery NCC. In 2023, the NCC program at the college further expanded with the addition of the Navy Wing under the 4 (TN) Naval Tech NCC.
          </CardText>
        </Card>

        {/* Motto */}
        <MottoBox
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <MottoText>Unity and Discipline</MottoText>
        </MottoBox>

        {/* Cardinal Principles */}
        <SectionTitle
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Flag size={40} color={PRIMARY_BLUE} />
          Cardinal Principles
        </SectionTitle>

        <PrinciplesGrid>
          {cardinalPrinciples.map((principle, index) => (
            <PrincipleCard
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <PrincipleNumber>{index + 1}</PrincipleNumber>
              <PrincipleText>{principle}</PrincipleText>
            </PrincipleCard>
          ))}
        </PrinciplesGrid>

        {/* Aims */}
        <SectionTitle
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Award size={40} color={PRIMARY_BLUE} />
          Aims of NCC
        </SectionTitle>

        <Grid>
          {aims.map((aim, index) => (
            <Card
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
            >
              <CardIcon>{aim.icon}</CardIcon>
              <CardTitle>{aim.title}</CardTitle>
              <CardText>{aim.text}</CardText>
            </Card>
          ))}
        </Grid>

        {/* Static Content Sections - No Dropdowns */}
        <ContentBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ContentTitle>
            <Flag size={28} color={PRIMARY_BLUE} />
            NCC Pledge
          </ContentTitle>
          <ContentText>
            We the cadet of the national cadet corps, do solemnly pledge that we shall always uphold the unity of India. We resolve to be disciplined and responsible citizen of our nation. We shall undertake positive community service in the spirit of selflessness and concern for our fellow beings.
          </ContentText>
        </ContentBox>

        <ContentBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ContentTitle>
            <Shield size={28} color={PRIMARY_BLUE} />
            NCC Oath
          </ContentTitle>
          <ContentText>
            I do hereby solemnly promise that I will serve my motherland most truly and loyally and that, I will abide by the rules and regulations of the National Cadet Crops. Further under the command and control of my commanding officer I will participate in every camp most sincerely and wholeheartedly.
          </ContentText>
        </ContentBox>

        <ContentBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ContentTitle>
            <BookOpen size={28} color={PRIMARY_BLUE} />
            NCC Song
          </ContentTitle>
          <ContentText>
            {`Hum Sab Bharatiya Hain, Hum Sab Bharatiya Hain
Apni Manzil Ek Hai, Ha, Ha, Ha, Ek Hai, Ho, Ho, Ho, Ek Hai.

Kashmir Ki Dharti Rani Hai, Sartaj Himalaya Hai,
  Saadiyon Se Humne Isko Apne Khoon Se Pala Hai
Desh Ki Raksha Ki Khatir Hum Shamshir Utha Lenge,

  Bikhre Bikhre Taare Hain Hum Lekin Jhilmil Ek Hai,
    Ha, Ha, Ha, Ek Hai, Ho, Ho, Ho, Ek Hai

Mandir Gurudwaare Bhi Hain Yahan, Aur Masjid Bhi Hai Yahan
Girija Ka Hai Ghariyaal Kahin, Mullah ki Kahin Hai Ajaan
Ek Hee Apna Ram Hain, Ek hi Allah Taala Hai,

  Raang Birange Deepak Hain Hum, Lekin Jagmag Ek Hai,
    Ha Ha Ha Ek Hai, Ho Ho Ho Ek Hai.`}
          </ContentText>
        </ContentBox>

        <ContentBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ContentTitle>
            <Target size={28} color={PRIMARY_BLUE} />
            Objectives of NCC
          </ContentTitle>
          <ContentText>
            {`1. Reach out to the maximum youths through various institutions.
2. Make NCC as an important part of the society.
3. Teach positive thinking and attitude to the youths.
4. Become a main source of National Integration.
5. Mould the youth into united, secular and disciplined citizens.
6. Provide an ideal platform for nation building.
7. Instill spirit of secularism through National Integration Camps.
8. Reach out to friendly foreign countries through Youth Exchange Programmes.`}
          </ContentText>
        </ContentBox>

        <ContentBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ContentTitle>
            <Award size={28} color={PRIMARY_BLUE} />
            Certificate Examination in NCC
          </ContentTitle>
          <ContentText>
            {`Certificate 'B' & 'C' - Senior Division / Senior Wing NCC

CERTIFICATE 'B':
• Must have attended minimum of 75 % of total training
• Break in NCC service should not exceed 18 months
• Must have attended one Annual Training Camp
• Air Wing to do minimum 10 glider launches

CERTIFICATE 'C':
• Must have 'B' Certificate
• Must be a third year in SD / SW
• Must have attended 75 % of periods
• Break in NCC service should not exceed 18 months
• Must have attended one Annual Training Camp`}
          </ContentText>
        </ContentBox>

        <ContentBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ContentTitle>
            <Award size={28} color={PRIMARY_BLUE} />
            Scholarships in NCC
          </ContentTitle>
          <ContentText>
            <strong>1. Cadet Welfare Society (CWS) Scholarship:</strong><br />
            • Awarded to meritorious cadets for academic excellence.<br />
            • 750 scholarships of ₹6,000/- each annually.<br />
            • Eligibility: Minimum 70% marks in 10th/12th or equivalent.<br /><br />

            <strong>2. Sahara Scholarship:</strong><br />
            • Provided by the Sahara Group to NCC cadets based on academic performance and NCC achievements.<br />
            • JD/JW: ₹6,000/- (365 scholarships)<br />
            • SD/SW: ₹12,000/- (695 scholarships)<br />
            • Professional/Technical Courses: ₹30,000/- (66 scholarships)<br /><br />

            <strong>3. Best Cadet Awards:</strong><br />
            • Cash awards given to the Best Cadets at Group, Directorate, and Republic Day Camp levels.<br />
            • Ranging from ₹3,500/- to ₹20,000/-.<br /><br />

            <strong>4. Chief Minister's Scholarship:</strong><br />
            • Many state governments offer scholarships to outstanding NCC cadets of the state.<br />
            • Details vary by state directorate.
          </ContentText>
        </ContentBox>

        <ContentBox
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <ContentTitle>
            <Shield size={28} color={PRIMARY_BLUE} />
            Ranks in NCC
          </ContentTitle>
          <Table>
            <thead>
              <tr>
                <TableHeader>Army</TableHeader>
                <TableHeader>Air</TableHeader>
                <TableHeader>Navy</TableHeader>
              </tr>
            </thead>
            <tbody>
              <TableRow><TableCell>Senior Under Officer (SUO)</TableCell><TableCell>Cadet Senior Under Officer (CSUO)</TableCell><TableCell>Senior Cadet Captain (SCC)</TableCell></TableRow>
              <TableRow><TableCell>Company Under Officer (CUO)</TableCell><TableCell>Cadet Under Officer (CUO)</TableCell><TableCell>Cadet Captain (CC)</TableCell></TableRow>
              <TableRow><TableCell>Company Sergeant Major (CSM)</TableCell><TableCell>Cadet Warrant Officer (CWO)</TableCell><TableCell>Petty Officer Cadet (POC)</TableCell></TableRow>
              <TableRow><TableCell>Company Quarter Master Sergeant (CQMS)</TableCell><TableCell>Cadet Sergeant (CSGT)</TableCell><TableCell>Leading Cadet (LC)</TableCell></TableRow>
              <TableRow><TableCell>Sergeant (SGT)</TableCell><TableCell>Cadet Corporal (CCPL)</TableCell><TableCell>Naval Cadet 1 (NC 1)</TableCell></TableRow>
              <TableRow><TableCell>Corporal (CPL)</TableCell><TableCell>Leading Flight Cadet (LFC)</TableCell><TableCell>Naval Cadet (NC)</TableCell></TableRow>
              <TableRow><TableCell>Lance Corporal (LCPL)</TableCell><TableCell>Flight Cadet (FC)</TableCell><TableCell>-</TableCell></TableRow>
              <TableRow><TableCell>Cadet (CDT)</TableCell><TableCell>-</TableCell><TableCell>-</TableCell></TableRow>
            </tbody>
          </Table>
        </ContentBox>


      </ContentSection>
    </PageContainer >
  );
};

export default AboutNCCPage;
