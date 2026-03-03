import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { ChevronDown, Menu as MenuIcon, X as XIcon, Phone, Mail, ChevronRight, Info, Users, Award, Calendar, Image, FileText, UserPlus, LogIn, LayoutDashboard, Settings, PenTool } from "lucide-react";
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

import sairamLogo from '../../assets/sairam-logo.png';
import nccCrest from '../../assets/ncc-logo.svg';
import armyInsignia from '../../assets/army-logo.png';
import navyInsignia from '../../assets/navy-logo.png';
import airforceInsignia from '../../assets/airforce-logo.png';
import FuturisticLogout from '../common/FuturisticLogout';

const NAV_BG = "rgba(255, 255, 255, 0.85)";
const NAV_BORDER = "rgba(0, 0, 0, 0.08)";
const GOLD = "#FFBF00";
const PRIMARY_TEXT = "#1A2B4C";
const NAV_HEIGHT = "110px";

const fadeIn = keyframes` from { opacity: 0; transform: translateY(-15px); } to { opacity: 1; transform: translateY(0); } `;

const NavBar = styled.nav`
  width: 100%;
  height: ${props => props.$scrolled ? '80px' : '110px'};
  background: ${props => props.$scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)'};
  backdrop-filter: blur(${props => props.$scrolled ? '20px' : '10px'});
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: ${props => props.$scrolled ? '0 10px 30px rgba(0, 0, 0, 0.08)' : '0 4px 30px rgba(0, 0, 0, 0.03)'};
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: ${fadeIn} 1s ease-out forwards;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
    opacity: ${props => props.$scrolled ? '0.8' : '0.4'};
    transition: opacity 0.4s ease;
  }

  @media (max-width: 1600px) {
    height: ${props => props.$scrolled ? '70px' : '80px'};
  }
  @media (max-width: 768px) {
    height: 65px;
  }
`;
const NavRow = styled.div`
  width: 100%;
  max-width: 1800px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: ${props => props.$scrolled ? '80px' : '110px'};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 1600px) {
    height: ${props => props.$scrolled ? '70px' : '80px'};
  }
  @media (max-width: 768px) {
    height: 65px;
  }
`;
const LeftSection = styled.div` display: flex; align-items: center; gap: 1rem; `;
const NavBranding = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  text-decoration: none;
`;

const NavLogosGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const MainBrandingLogo = styled.img`
  height: 85px;
  object-fit: contain;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  
  &:hover {
    transform: scale(1.05);
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  }

   @media (max-width: 1600px) { height: 60px; }
  @media (max-width: 768px) { height: 45px; }
`;

const NccBrandingLogo = styled.img`
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05) rotate(5deg);
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
  }

   @media (max-width: 1600px) { height: 55px; }
  @media (max-width: 768px) { height: 40px; }
`;

const BrandingTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  @media (max-width: 900px) {
    display: none;
  }
`;

const NccTitle = styled.h1`
  font-size: 1.45rem;
  font-weight: 800;
  color: ${PRIMARY_TEXT};
  margin: 0;
  letter-spacing: 0.5px;
  white-space: nowrap;

  @media (max-width: 1600px) {
    font-size: 1rem;
  }
`;

const WingInsigniasRow = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-top: 0.25rem;
`;

const NavInsignia = styled.img`
  height: 24px;
  opacity: 0.6;
  filter: grayscale(1);
  transition: all 0.3s ease;
  &:hover {
    opacity: 1;
    filter: grayscale(0);
    transform: scale(1.1);
  }

  @media (max-width: 1600px) {
    height: 16px;
  }
`;

const CollegeTagline = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748B;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;

  @media (max-width: 1600px) {
    font-size: 0.6rem;
  }
`;
const DesktopMenu = styled.ul`
  display: flex;
  align-items: center;
  gap: 0.1rem;
  list-style: none;
  margin: 0;
  padding: 0;
  height: 110px;

  @media (max-width: 1600px) {
    height: 80px;
  }
  @media (max-width: 1400px) {
    display: none;
  }
`;
const MenuItem = styled.li` 
  position: relative; 
  display: flex; 
  align-items: center; 
  height: 110px; 
  
  @media (max-width: 1600px) {
    height: 80px;
  }
`;
const MenuLink = styled(Link)`
  font-weight: 700;
  text-decoration: none;
  font-size: 1.05rem;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: ${props => (props.$active ? PRIMARY_TEXT : '#334155')};
  background: transparent;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  letter-spacing: 0.3px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: ${props => (props.$active ? '80%' : '0')};
    height: 3px;
    background: ${GOLD};
    border-radius: 2px;
    transition: width 0.3s ease;
    box-shadow: 0 2px 4px rgba(255, 191, 0, 0.3);
  }

  &:hover {
    color: ${PRIMARY_TEXT};
    background: rgba(255, 191, 0, 0.08);
    transform: translateY(-2px);
    
    &::after {
      width: 80%;
    }
  }

  @media (max-width: 1600px) {
    font-size: 0.9rem;
  }
`;
const MenuButton = styled.button`
  font-family: 'Poppins', sans-serif;
  font-weight: 700;
  text-decoration: none;
  font-size: 1.05rem;
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #334155;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  white-space: nowrap;
  letter-spacing: 0.3px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 3px;
    background: ${GOLD};
    border-radius: 2px;
    transition: width 0.3s ease;
    box-shadow: 0 2px 4px rgba(255, 191, 0, 0.3);
  }

  &:hover {
    color: ${PRIMARY_TEXT};
    background: rgba(255, 191, 0, 0.08);
    transform: translateY(-2px);
    
    &::after {
      width: 80%;
    }
  }

  @media (max-width: 1600px) {
    font-size: 0.9rem;
  }
`;
const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-top: 4px solid ${GOLD};
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.2);
  min-width: 250px;
  padding: 0.8rem 0;
  z-index: 1001;
  overflow: visible; /* Changed to visible for flyout */
`;

const StyledDropdownLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0.9rem 1.5rem;
  color: #1a202c;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: linear-gradient(90deg, rgba(255, 191, 0, 0.08) 0%, rgba(255, 255, 255, 0) 100%);
    color: ${PRIMARY_TEXT};
    padding-left: 1.8rem;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 3px;
      background: ${GOLD};
      box-shadow: 2px 0 8px rgba(255, 191, 0, 0.4);
    }
    
    svg {
      color: ${GOLD};
      transform: scale(1.1);
    }
  }

  svg {
    color: #64748b;
    transition: all 0.2s ease;
    width: 18px;
    height: 18px;
  }
`;

const StyledDropdownButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  text-align: left;
  padding: 0.9rem 1.5rem;
  color: #1a202c;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: linear-gradient(90deg, rgba(255, 191, 0, 0.08) 0%, rgba(255, 255, 255, 0) 100%);
    color: ${PRIMARY_TEXT};
    padding-left: 1.8rem;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 3px;
      background: ${GOLD};
      box-shadow: 2px 0 8px rgba(255, 191, 0, 0.4);
    }

    svg {
      color: ${GOLD};
      transform: scale(1.1);
    }
  }

  svg {
    color: #64748b;
    transition: all 0.2s ease;
    width: 18px;
    height: 18px;
  }
`;

// Safe bridge to prevent mouse leave events when bridging gaps
const SafeBridge = styled.div`
  position: absolute;
  top: 0;
  right: -20px;
  width: 40px;
  height: 100%;
  z-index: 1002;
  background: transparent;
`;

const DropdownItem = ({ to, icon: Icon, children }) => (
  <StyledDropdownLink to={to}>
    {Icon && <Icon size={18} />}
    {children}
  </StyledDropdownLink>
);

const DropdownItemButton = ({ onClick, icon: Icon, style, children, ...props }) => (
  <StyledDropdownButton onClick={onClick} style={style} {...props}>
    {Icon && <Icon size={18} />}
    {children}
  </StyledDropdownButton>
);
const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  @media (max-width: 1400px) {
    display: block;
  }
`;
const MobileMenu = styled(motion.div)`
  display: none;
  @media (max-width: 1400px) {
    display: block;
    position: fixed;
    top: ${NAV_HEIGHT};
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    max-height: calc(100vh - ${NAV_HEIGHT});
    overflow-y: auto;
    z-index: 999;
  }
`;
const MobileMenuItem = styled.div`
  padding: 1rem 2rem;
  border-bottom: 1px solid #f0f0f0;
  a, button {
    color: #333;
    text-decoration: none;
    font-size: 1.1rem;
    font-weight: 500;
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    font-family: 'Poppins', sans-serif;
    cursor: pointer;
    &:hover {
      color: ${GOLD};
    }
  }
`;
const MobileDropdownContent = styled.div`
  padding-left: 1rem;
  margin-top: 0.5rem;
  a, button {
    display: block;
    padding: 0.5rem 0;
    font-size: 1rem;
    color: #666;
    &:hover {
      color: ${GOLD};
    }
  }
`;

const ContactDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  min-width: 320px;
  max-width: 350px;
  padding: 0.8rem;
  z-index: 1003;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  
  /* Custom scrollbar for premium feel */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb {
    background: #FFBF00;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: #e6ac00;
  }
`;

const ContactCard = styled.div`
  background: white;
  border-radius: 10px;
  padding: 1.2rem;
  margin-bottom: 0.8rem;
  border: 2px solid ${props => props.$borderColor || '#FFBF00'};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const WingBadge = styled.div`
  display: inline-block;
  background: ${props => props.$bgColor || '#FFBF00'};
  color: white;
  padding: 0.3rem 0.7rem;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 700;
  margin-bottom: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ContactName = styled.div`
  font-size: 1.05rem;
  font-weight: 700;
  color: #1A2B4C;
  margin-bottom: 0.8rem;
`;

const ContactDetail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  svg {
    color: ${props => props.$iconColor || '#FFBF00'};
    flex-shrink: 0;
  }
  
  a {
    color: #555;
    text-decoration: none;
    
    &:hover {
      color: ${props => props.$iconColor || '#FFBF00'};
    }
  }
`;

const EmptyContact = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
`;

const ExplodingPortal = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #FFBF00;
  border-radius: 50%;
  z-index: 20000;
  pointer-events: none;
`;

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isAlumni, isAlumniManager } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [contactFlyoutOpen, setContactFlyoutOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileNewsletterOpen, setMobileNewsletterOpen] = useState(false);
  const [mobileConnectOpen, setMobileConnectOpen] = useState(false);
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);

  const [anos, setAnos] = useState([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // For Logout Animation
  const [scrolled, setScrolled] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const handleHomeClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    // The FuturisticLogout component handles the actual signOut and navigation
  };

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    fetchANOs();
  }, []);


  const fetchANOs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'anos'));
      const anosList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const wingOrder = { 'Army': 1, 'Navy': 2, 'Air': 3 };
      anosList.sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;

        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (wingOrder[a.wing] || 4) - (wingOrder[b.wing] || 4);
      });
      setAnos(anosList);
    } catch (error) {
      console.error('Error fetching ANOs:', error);
    }
  };

  const getWingColor = (wing) => {
    switch (wing?.toLowerCase()) {
      case 'army':
        return {
          gradient: 'linear-gradient(135deg, #DC2626, #EF4444)',
          border: '#DC2626'
        };
      case 'air':
        return {
          gradient: 'linear-gradient(135deg, #38BDF8, #60A5FA)',
          border: '#38BDF8'
        };
      case 'navy':
        return {
          gradient: 'linear-gradient(135deg, #1E3A8A, #3B82F6)',
          border: '#1E3A8A'
        };
      default:
        return {
          gradient: 'linear-gradient(135deg, #FFBF00, #FCD34D)',
          border: '#FFBF00'
        };
    }
  };

  const handleScrollTo = (sectionId) => {
    const scrollToElement = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        // Offset for the fixed navbar (approx 80px + padding)
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    };

    if (location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete before scrolling
      setTimeout(scrollToElement, 300);
    } else {
      scrollToElement();
    }
    setIsMobileMenuOpen(false);
  };

  const handleBlogClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/blog') return;
    setIsRevealing(true);
    setTimeout(() => {
      navigate('/blog');
      setIsRevealing(false);
    }, 800);
  };

  return (
    <>
      <AnimatePresence>
        {isRevealing && (
          <ExplodingPortal
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 500, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </AnimatePresence>
      <NavBar $scrolled={scrolled}>
        <NavRow $scrolled={scrolled}>
          <LeftSection>
            <NavBranding to="/" onClick={handleHomeClick}>
              <NavLogosGroup>
                <MainBrandingLogo src={sairamLogo} alt="Sairam College Logo" loading="lazy" />
                <NccBrandingLogo src={nccCrest} alt="NCC Crest" loading="lazy" />
              </NavLogosGroup>
              <BrandingTextGroup>
                <NccTitle>NATIONAL CADET CORPS</NccTitle>
                <WingInsigniasRow>
                  <NavInsignia src={armyInsignia} alt="Army" title="Army Wing" loading="lazy" />
                  <NavInsignia src={navyInsignia} alt="Navy" title="Navy Wing" loading="lazy" />
                  <NavInsignia src={airforceInsignia} alt="Air Force" title="Air Force Wing" loading="lazy" />
                </WingInsigniasRow>
                <CollegeTagline>SRI SAIRAM ENGINEERING COLLEGE</CollegeTagline>
              </BrandingTextGroup>
            </NavBranding>
          </LeftSection>

          <DesktopMenu>
            <MenuItem><MenuLink to="/" $active={location.pathname === "/"} onClick={handleHomeClick}>Home</MenuLink></MenuItem>

            {/* I. About */}
            <MenuItem onMouseEnter={() => setAboutOpen(true)} onMouseLeave={() => setAboutOpen(false)}>
              <MenuLink to="#" $active={['/about-ncc', '/anos'].includes(location.pathname)}>
                About <ChevronDown size={11} />
              </MenuLink>
              <AnimatePresence>
                {aboutOpen && (
                  <DropdownMenu
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <DropdownItem to="/about-ncc" icon={Info}>Know Your NCC</DropdownItem>
                    <DropdownItem to="/anos" icon={Users}>ANO's</DropdownItem>
                    <DropdownItemButton onClick={() => handleScrollTo('wings')} icon={Award}>Wings</DropdownItemButton>
                  </DropdownMenu>
                )}
              </AnimatePresence>
            </MenuItem>

            {/* II. Achievements */}
            <MenuItem><MenuLink to="/achievements" $active={location.pathname === "/achievements"}>Achievements</MenuLink></MenuItem>

            {/* III. Activities */}
            <MenuItem><MenuLink to="/events" $active={location.pathname === "/events"}>Activities</MenuLink></MenuItem>

            {/* IV. Newsletter */}
            <MenuItem onMouseEnter={() => setNewsletterOpen(true)} onMouseLeave={() => setNewsletterOpen(false)}>
              <MenuLink to="#" $active={['/gallery', '/reports', '/downloads', '/scholarships'].includes(location.pathname)}>
                Newsletter <ChevronDown size={11} />
              </MenuLink>
              <AnimatePresence>
                {newsletterOpen && (
                  <DropdownMenu
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <DropdownItem to="/gallery" icon={Image}>Gallery</DropdownItem>
                    <DropdownItem to="/reports" icon={FileText}>Reports</DropdownItem>
                    <DropdownItem to="/downloads" icon={FileText}>Downloads</DropdownItem>
                    <DropdownItem to="/scholarships" icon={Award}>Scholarships</DropdownItem>
                  </DropdownMenu>
                )}
              </AnimatePresence>
            </MenuItem>

            {/* V. Alumni */}
            <MenuItem><MenuLink to="/alumni" $active={location.pathname === "/alumni"}>Alumni</MenuLink></MenuItem>

            {/* VI. Blog */}
            <MenuItem><MenuLink to="/blog" $active={location.pathname === "/blog"} onClick={handleBlogClick}>Blog</MenuLink></MenuItem>

            {/* VII. Connect */}
            <MenuItem onMouseEnter={() => setConnectOpen(true)} onMouseLeave={() => setConnectOpen(false)}>
              <MenuLink to="#">Connect <ChevronDown size={11} /></MenuLink>
              <AnimatePresence>
                {connectOpen && (
                  <DropdownMenu
                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <DropdownItemButton onClick={() => handleScrollTo('register')} icon={UserPlus}>Join NCC</DropdownItemButton>

                    <div
                      onMouseEnter={() => setContactFlyoutOpen(true)}
                      onMouseLeave={() => setContactFlyoutOpen(false)}
                      style={{ position: 'relative' }}
                    >
                      <DropdownItemButton
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        icon={Phone}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>Contact Us</span>
                        <ChevronRight size={14} style={{ opacity: 0.5 }} />
                      </DropdownItemButton>

                      <AnimatePresence>
                        {contactFlyoutOpen && (
                          <>
                            <SafeBridge />
                            <ContactDropdown
                              initial={{ opacity: 0, x: -10, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -10, scale: 0.95 }}
                              transition={{ duration: 0.2 }}
                              style={{
                                top: '-4px',
                                right: '100%',
                                marginRight: '-5px',
                                borderTop: `4px solid ${GOLD}`
                              }}
                            >
                              {anos.length === 0 ? (
                                <EmptyContact>No ANO contacts available</EmptyContact>
                              ) : (
                                anos.map((ano) => {
                                  const wingColors = getWingColor(ano.wing);
                                  return (
                                    <ContactCard key={ano.id} $borderColor={wingColors.border}>
                                      <WingBadge $bgColor={wingColors.border}>
                                        {ano.wing} Wing
                                      </WingBadge>
                                      <ContactName>{ano.name}</ContactName>
                                      <ContactDetail $iconColor={wingColors.border}>
                                        <Phone size={14} />
                                        <a href={`tel:${ano.phone}`}>{ano.phone}</a>
                                      </ContactDetail>
                                      <ContactDetail $iconColor={wingColors.border}>
                                        <Mail size={14} />
                                        <a href={`mailto:${ano.email}`}>{ano.email}</a>
                                      </ContactDetail>
                                    </ContactCard>
                                  );
                                })
                              )}
                            </ContactDropdown>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </DropdownMenu>
                )}
              </AnimatePresence>
            </MenuItem>

            {/* VII. Alumni Login (if not logged in) */}
            {!user && (
              <MenuItem><MenuLink to="/alumni-login" $active={location.pathname === "/alumni-login"}>Alumni Login</MenuLink></MenuItem>
            )}

            {user ? (
              <>
                {isAdmin && (
                  <MenuItem onMouseEnter={() => setIsAdminOpen(true)} onMouseLeave={() => setIsAdminOpen(false)}>
                    <MenuLink to="#">Admin <ChevronDown size={11} /></MenuLink>
                    {isAdminOpen && (
                      <DropdownMenu
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        <DropdownItem to="/admin/slideshow" icon={LayoutDashboard}>Slideshow</DropdownItem>
                        <DropdownItem to="/admin/gallery" icon={Image}>Gallery</DropdownItem>
                        <DropdownItem to="/admin/anos" icon={Users}>ANOs</DropdownItem>
                        <DropdownItem to="/admin/achievements" icon={Award}>Achievements</DropdownItem>
                        <DropdownItem to="/admin/alumni" icon={Users}>Alumni</DropdownItem>
                        <DropdownItem to="/admin/events" icon={Calendar}>Events</DropdownItem>
                        <DropdownItem to="/admin/organization" icon={Settings}>Organization</DropdownItem>
                        <DropdownItem to="/admin/magic-members" icon={UserPlus}>MAGIC Members</DropdownItem>
                        <DropdownItem to="/admin/teams" icon={Users}>NCC Teams</DropdownItem>

                        <DropdownItem to="/admin/leadership" icon={Award}>Leadership</DropdownItem>
                        <DropdownItem to="/admin/downloads" icon={FileText}>Downloads</DropdownItem>
                        <DropdownItem to="/admin/scholarships" icon={Award}>Scholarships</DropdownItem>
                        <DropdownItem to="/admin/blogs" icon={PenTool}>Blogs</DropdownItem>
                        <DropdownItem to="/admin/announcements" icon={FileText}>Updates</DropdownItem>
                      </DropdownMenu>
                    )}
                  </MenuItem>
                )}

                {isAlumniManager && (
                  <MenuItem><MenuLink to="/admin/alumni" $active={location.pathname === "/admin/alumni"}>Manage Alumni</MenuLink></MenuItem>
                )}

                {isAlumni && (
                  <MenuItem><MenuLink to="/alumni/profile" $active={location.pathname === "/alumni/profile"}>My Profile</MenuLink></MenuItem>
                )}

                <MenuItem><MenuButton onClick={handleLogout}>Logout</MenuButton></MenuItem>
              </>
            ) : null}
          </DesktopMenu>

          <HamburgerButton onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <XIcon size={30} color={PRIMARY_TEXT} /> : <MenuIcon size={30} color={PRIMARY_TEXT} />}
          </HamburgerButton>
        </NavRow>
      </NavBar>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MobileMenuItem><Link to="/" onClick={handleHomeClick}>Home</Link></MobileMenuItem>

            {/* About Dropdown */}
            <MobileMenuItem>
              <button
                onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                About <ChevronDown size={16} />
              </button>
              {mobileAboutOpen && (
                <MobileDropdownContent>
                  <Link to="/about-ncc">Know Your NCC</Link>
                  <Link to="/anos">ANO's</Link>
                  <button onClick={() => handleScrollTo('wings')}>Wings</button>
                </MobileDropdownContent>
              )}
            </MobileMenuItem>

            <MobileMenuItem><Link to="/achievements">Achievements</Link></MobileMenuItem>
            <MobileMenuItem><Link to="/events">Activities</Link></MobileMenuItem>

            {/* Newsletter Dropdown */}
            <MobileMenuItem>
              <button
                onClick={() => setMobileNewsletterOpen(!mobileNewsletterOpen)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                Newsletter <ChevronDown size={16} />
              </button>
              {mobileNewsletterOpen && (
                <MobileDropdownContent>
                  <Link to="/gallery">Gallery</Link>
                  <Link to="/reports">Report</Link>
                  <Link to="/downloads">Downloads</Link>
                  <Link to="/scholarships">Scholarships</Link>
                </MobileDropdownContent>
              )}
            </MobileMenuItem>

            <MobileMenuItem><Link to="/blog" onClick={handleBlogClick}>Blog</Link></MobileMenuItem>

            <MobileMenuItem><Link to="/alumni">Alumni</Link></MobileMenuItem>

            {/* Connect Dropdown */}
            <MobileMenuItem>
              <button
                onClick={() => setMobileConnectOpen(!mobileConnectOpen)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                Connect <ChevronDown size={16} />
              </button>
              {mobileConnectOpen && (
                <MobileDropdownContent>
                  <button onClick={() => handleScrollTo('register')}>Join NCC</button>
                  <button onClick={() => handleScrollTo('contact')}>Contact Us</button>
                </MobileDropdownContent>
              )}
            </MobileMenuItem>

            {!user && (
              <MobileMenuItem><Link to="/alumni-login">Alumni Login</Link></MobileMenuItem>
            )}

            {user && (
              <>
                {isAdmin && (
                  <MobileMenuItem>
                    <button onClick={() => setMobileAdminOpen(!mobileAdminOpen)} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      Admin <ChevronDown size={14} />
                    </button>
                    {mobileAdminOpen && (
                      <MobileDropdownContent>
                        <Link to="/admin/slideshow">Slideshow</Link>
                        <Link to="/admin/gallery">Gallery</Link>
                        <Link to="/admin/anos">ANOs</Link>
                        <Link to="/admin/achievements">Achievements</Link>
                        <Link to="/admin/alumni">Alumni</Link>
                        <Link to="/admin/events">Events</Link>
                        <Link to="/admin/organization">Organization</Link>
                        <Link to="/admin/magic-members">MAGIC Members</Link>
                        <Link to="/admin/teams">NCC Teams</Link>
                        <Link to="/admin/leadership">Leadership</Link>
                        <Link to="/admin/downloads">Downloads</Link>
                        <Link to="/admin/scholarships">Scholarships</Link>
                        <Link to="/admin/blogs">Blogs</Link>
                        <Link to="/admin/announcements">Updates</Link>
                      </MobileDropdownContent>
                    )}
                  </MobileMenuItem>
                )}

                {isAlumniManager && (
                  <MobileMenuItem><Link to="/admin/alumni">Manage Alumni</Link></MobileMenuItem>
                )}

                {isAlumni && (
                  <MobileMenuItem><Link to="/alumni/profile">My Profile</Link></MobileMenuItem>
                )}

                <MobileMenuItem><button onClick={handleLogout}>Logout</button></MobileMenuItem>
              </>
            )}
          </MobileMenu>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isLoggingOut && <FuturisticLogout onLogoutComplete={() => setIsLoggingOut(false)} />}
      </AnimatePresence>
    </>
  );
};

export default Navbar;