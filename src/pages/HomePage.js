import React, { lazy, Suspense } from 'react';
import HeroSection from '../components/sections/HeroSection';
import SEO from '../components/common/SEO';

// PERFORMANCE: Lazy-load everything below the fold
// Only HeroSection is visible on first paint — everything else loads on demand
import LeadershipMessages from '../components/sections/LeadershipMessages';
import WingsSection from '../components/sections/WingsSection';
const PhotoSlideshow = lazy(() => import('../components/sections/PhotoSlideshow'));
const RegistrationForm = lazy(() => import('../components/sections/RegistrationForm'));
const ContactUsSection = lazy(() => import('../components/sections/ContactUsSection'));

const SectionFallback = () => (
  <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="skeleton-spinner" />
  </div>
);

const HomePage = () => {
  return (
    <div className="home-page">
      <SEO
        title="SAIRAM NATIONAL CADET CORPS"
        description="Official website of National Cadet Corps (NCC) at Sri Sairam Engineering College, Chennai. Building character, discipline, and leadership since 2003."
      />
      <div id="hero">
        <HeroSection />
      </div>
      <Suspense fallback={<SectionFallback />}>
        <div id="leadership">
          <LeadershipMessages />
        </div>
        <PhotoSlideshow />
        <div id="wings">
          <WingsSection />
        </div>
        <div id="register">
          <RegistrationForm />
        </div>
        <ContactUsSection />
      </Suspense>
    </div>
  );
};

export default HomePage;