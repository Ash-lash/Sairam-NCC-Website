import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, MessageSquare, ChevronUp } from 'lucide-react';
import TwitterIcon from './TwitterIcon';

const SocialBarContainer = styled.div`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (max-width: 768px) {
    bottom: 1rem;
    right: 1rem;
    gap: 0.5rem;
  }
`;

const IconBase = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: rgba(26, 43, 76, 0.9);
  backdrop-filter: blur(5px);
  color: #FFFFFF;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease-in-out, background-color 0.2s ease-in-out;
  border: none;
  cursor: pointer;

  &:hover {
    transform: scale(1.1);
    background-color: #FFBF00;
    color: #1A2B4C;
  }

  svg {
    width: 24px;
    height: 24px;
  }

  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
  }
`;

const IconLink = styled(IconBase).attrs({ as: 'a' })`
  text-decoration: none;
`;

const ScrollButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background-color: #FFBF00;
  color: #1A2B4C;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  border: none;
  cursor: pointer;
  margin-bottom: 0.5rem;

  &:hover {
    background-color: #1A2B4C;
    color: #FFBF00;
  }

  svg {
    width: 24px;
    height: 24px;
  }

  @media (max-width: 768px) {
    width: 45px;
    height: 45px;
  }
`;

const socialLinks = [
  {
    href: 'https://www.instagram.com/sairam_ncc?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    icon: <Instagram />,
    label: 'Instagram'
  },
  {
    href: 'https://x.com/ncc_sairam',
    icon: <TwitterIcon />,
    label: 'X'
  },
  {
    href: 'https://whatsapp.com/channel/0029Va8Rd1D7z4kWvsDyw23K',
    icon: <MessageSquare />,
    label: 'WhatsApp Channel'
  }
];

const SocialLinks = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <SocialBarContainer>
      <AnimatePresence>
        {showScrollTop && (
          <ScrollButton
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <ChevronUp />
          </ScrollButton>
        )}
      </AnimatePresence>
      {socialLinks.map(link => (
        <IconLink
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
        >
          {link.icon}
        </IconLink>
      ))}
    </SocialBarContainer>
  );
};

export default SocialLinks;