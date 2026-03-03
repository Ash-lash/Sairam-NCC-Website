import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone, Instagram, MessageSquare, ChevronRight } from 'lucide-react';
import TwitterIcon from '../ui/TwitterIcon';

const FooterContainer = styled.footer`
  background: #111827;
  color: #e2e8f0;
  padding-top: 4rem;
  font-family: 'Inter', sans-serif;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(90deg, #DC2626, #1E3A8A, #0EA5E9); /* Army Red, Navy Blue, Air Blue */
  }
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
  gap: 3rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
`;

const FooterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.5rem;

  img {
    height: 45px;
    width: auto;
  }

  div {
    display: flex;
    flex-direction: column;
    
    h3 {
      font-size: 1.4rem;
      font-weight: 800;
      color: white;
      line-height: 1;
      margin: 0;
      letter-spacing: -0.5px;
    }
    
    span {
      font-size: 0.75rem;
      color: #94a3b8;
      font-weight: 500;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 4px;
    }
  }
`;

const Description = styled.p`
  color: #94a3b8;
  line-height: 1.6;
  font-size: 0.95rem;
  max-width: 320px;
`;

const SectionTitle = styled.h4`
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  position: relative;
  display: inline-block;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 40px;
    height: 3px;
    background: #FFD700; /* Gold */
    border-radius: 2px;
  }
`;

const LinkList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const FooterLink = styled(Link)`
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.95rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    width: 14px;
    height: 14px;
    color: #64748b;
    transition: transform 0.2s;
  }

  &:hover {
    color: #FFD700;
    transform: translateX(5px);
    
    svg {
      color: #FFD700;
    }
  }
`;

const ContactItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  color: #cbd5e1;
  font-size: 0.95rem;
  line-height: 1.5;

  svg {
    width: 18px;
    height: 18px;
    color: #FFD700;
    flex-shrink: 0;
    margin-top: 3px;
  }
`;

const SocialRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SocialIcon = styled.a`
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: all 0.3s;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:hover {
    background: ${props => props.$color || '#3b82f6'};
    border-color: ${props => props.$color || '#3b82f6'};
    transform: translateY(-3px);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

const BottomBar = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 4rem;
  padding: 1.5rem 2rem;
  background: #0f172a;
`;

const BottomContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const CopyrightText = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
`;

const DeveloperCredit = styled.p`
  color: #64748b;
  font-size: 0.9rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <FooterContainer>
      <FooterContent>
        {/* Brand Section */}
        <FooterSection>
          <FooterLogo>
            <div style={{ width: 45, height: 45, background: 'linear-gradient(135deg, #FFD700, #F59E0B)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#1a2b4c' }}>NCC</div>
            <div>
              <h3>SAIRAM NCC</h3>
              <span>Unity & Discipline</span>
            </div>
          </FooterLogo>
          <Description>
            Empowering youth with leadership, discipline, and patriotism. One of the finest NCC units in Tamil Nadu, dedicated to nation-building.
          </Description>
          <SocialRow>
            <SocialIcon
              href="https://www.instagram.com/sairam_ncc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
              target="_blank"
              $color="#E1306C"
              title="Instagram"
            >
              <Instagram />
            </SocialIcon>
            <SocialIcon
              href="https://x.com/ncc_sairam"
              target="_blank"
              $color="#000000"
              title="X (Twitter)"
            >
              <TwitterIcon />
            </SocialIcon>
            <SocialIcon
              href="https://whatsapp.com/channel/0029Va8Rd1D7z4kWvsDyw23K"
              target="_blank"
              $color="#25D366"
              title="WhatsApp"
            >
              <MessageSquare />
            </SocialIcon>
          </SocialRow>
        </FooterSection>

        {/* Quick Links */}
        <FooterSection>
          <SectionTitle>Quick Links</SectionTitle>
          <LinkList>
            <li><FooterLink to="/"><ChevronRight /> Home</FooterLink></li>
            <li><FooterLink to="/about-ncc"><ChevronRight /> About NCC</FooterLink></li>
            <li><FooterLink to="/achievements"><ChevronRight /> Achievements</FooterLink></li>
            <li><FooterLink to="/gallery"><ChevronRight /> Gallery</FooterLink></li>
            <li><FooterLink to="/events"><ChevronRight /> Events</FooterLink></li>
            <li><FooterLink to="/downloads"><ChevronRight /> Downloads</FooterLink></li>
            <li><FooterLink to="/admin-login"><ChevronRight /> Admin Login</FooterLink></li>
          </LinkList>
        </FooterSection>

        {/* Wings */}
        <FooterSection>
          <SectionTitle>Our Wings</SectionTitle>
          <LinkList>
            <li><FooterLink to="/wing/army"><ChevronRight /> Army Wing</FooterLink></li>
            <li><FooterLink to="/wing/navy"><ChevronRight /> Navy Wing</FooterLink></li>
            <li><FooterLink to="/wing/airforce"><ChevronRight /> Air Wing</FooterLink></li>
            <li><FooterLink to="/alumni"><ChevronRight /> Alumni Network</FooterLink></li>
          </LinkList>
        </FooterSection>

        {/* Contact */}
        <FooterSection>
          <SectionTitle>Get in Touch</SectionTitle>
          <ContactItem>
            <MapPin />
            <span>Sri Sairam Engineering College,<br />West Tambaram, Chennai - 600044.</span>
          </ContactItem>
          <ContactItem>
            <Mail />
            <span>sairamnccarmy@sairam.edu.in</span>
          </ContactItem>
          <ContactItem>
            <Phone />
            <span>+91 9944815991</span>
          </ContactItem>
        </FooterSection>
      </FooterContent>

      <BottomBar>
        <BottomContent>
          <CopyrightText>
            &copy; {currentYear} NCC Sairam. All rights reserved.
          </CopyrightText>
          <DeveloperCredit>
            Made By Sairam NCC Cadets of Batch 2023
          </DeveloperCredit>
        </BottomContent>
      </BottomBar>
    </FooterContainer>
  );
};

export default Footer;
