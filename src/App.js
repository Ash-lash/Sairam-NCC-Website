import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { HelmetProvider } from 'react-helmet-async';

import './App.css';

// --- EAGERLY LOADED (needed on first paint) ---
import HomePage from './pages/HomePage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollProgressIndicator from './components/ui/ScrollProgressIndicator';
import SocialLinks from './components/ui/SocialLinks';
import EventNotification from './components/ui/EventNotification';
import ScrollToTop from './components/common/ScrollToTop';
import AdminRoute from './components/auth/AdminRoute';
import LoadingScreen from './components/ui/LoadingScreen';
import { preloadImages } from './utils/imageOptimizer';
import { prefetchList } from './utils/mediaCache';

// Import logos for preloading
import armyLogo from './assets/army-logo.png';
import navyLogo from './assets/navy-logo.png';
import airforceLogo from './assets/airforce-logo.png';
import nccLogo from './assets/ncc-logo.svg';
import sairamLogo from './assets/sairam-logo.png';

// --- LAZILY LOADED (only downloaded when user navigates to these pages) ---
const WingPage = lazy(() => import('./pages/WingPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const AdminSlideshowPage = lazy(() => import('./pages/AdminSlideshowPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const AlumniLoginPage = lazy(() => import('./pages/AlumniLoginPage'));
const AlumniProfilePage = lazy(() => import('./pages/AlumniProfilePage'));
const BecomeMentorPage = lazy(() => import('./pages/BecomeMentorPage'));
const AdminGalleryPage = lazy(() => import('./pages/AdminGalleryPage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const AboutNCCPage = lazy(() => import('./pages/AboutNCCPage'));
const ANOsPage = lazy(() => import('./pages/ANOsPage'));
const AchievementsPage = lazy(() => import('./pages/AchievementsPage'));
const AlumniPage = lazy(() => import('./pages/AlumniPage'));
const AdminANOsPage = lazy(() => import('./pages/AdminANOsPage'));
const AdminAchievementsPage = lazy(() => import('./pages/AdminAchievementsPage'));
const AdminAlumniPage = lazy(() => import('./pages/AdminAlumniPage'));
const AdminEventsPage = lazy(() => import('./pages/AdminEventsPage'));
const AdminOrganizationPage = lazy(() => import('./pages/AdminOrganizationPage'));
const DepartmentCadetsPage = lazy(() => import('./pages/DepartmentCadetsPage'));
const StrengthChartPage = lazy(() => import('./pages/StrengthChartPage'));
const MagicMembersPage = lazy(() => import('./pages/MagicMembersPage'));
const NccTeamsPage = lazy(() => import('./pages/NccTeamsPage'));
const AdminMagicMembersPage = lazy(() => import('./pages/AdminMagicMembersPage'));
const AdminNccTeamsPage = lazy(() => import('./pages/AdminNccTeamsPage'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));
const AdminDownloadsPage = lazy(() => import('./pages/AdminDownloadsPage'));
const AdminAnnouncementsPage = lazy(() => import('./pages/AdminAnnouncementsPage'));
const AdminLeadershipPage = lazy(() => import('./pages/AdminLeadershipPage'));
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogPostPage = lazy(() => import('./pages/BlogPostPage'));
const SubmitBlogPage = lazy(() => import('./pages/SubmitBlogPage'));
const AdminBlogsPage = lazy(() => import('./pages/AdminBlogsPage'));
const ScholarshipsPage = lazy(() => import('./pages/ScholarshipsPage'));
const AdminScholarshipsPage = lazy(() => import('./pages/AdminScholarshipsPage'));
const AdminRegistrationManager = lazy(() => import('./pages/AdminRegistrationManager'));



// Simple fallback for lazy-loaded pages
const PageFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <div className="skeleton-spinner" />
  </div>
);


function App() {
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const preloadEverything = async () => {
      try {
        // --- PERFORMANCE FIX: Only preload critical UI/Hero Assets ---
        // Preloading hundreds of items at once was saturating the connection limit
        const staticAssets = [
          'https://img.etimg.com/thumb/width-1600,height-900,imgsize-305892,resizemode-75,msid-107807698/news/defence/army-plans-rs-57000-crore-project-to-replace-t-72-tanks-with-modern-combat-vehicles.jpg',
          'https://cf-img-a-in.tosshub.com/sites/visualstory/wp/2024/02/Screenshot-2024-02-08-at-42905-PM.png',
          armyLogo, navyLogo, airforceLogo, nccLogo, sairamLogo
        ];

        // 1. Classical Memory Preload
        preloadImages(staticAssets);
        
        // 2. Asynchronous Cache Memory Storage (JavaScript/Java Logic)
        // This persists assets for fast Amazon-like retrieval on next visit
        prefetchList(staticAssets);

      } catch (error) {
        console.error("Critical Preload failed:", error);
      }
    };

    // Release after 4.8s to allow the 3D cube to finish its full rotation + tip to NCC
    Promise.all([new Promise(r => setTimeout(r, 4800)), preloadEverything()]).then(() => {
      setShowLoading(false);
    });
  }, []);

  return (
    <HelmetProvider>
      <div>
        <AnimatePresence mode="wait">
          {showLoading && <LoadingScreen key="loader" />}
        </AnimatePresence>

        <ScrollToTop />
        <ScrollProgressIndicator />
        <Navbar />
        <SocialLinks />
        <EventNotification />
        <main className="main-content">
          <Suspense fallback={<PageFallback />}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about-ncc" element={<AboutNCCPage />} />
              <Route path="/anos" element={<ANOsPage />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/alumni" element={<AlumniPage />} />
              <Route path="/alumni-login" element={<AlumniLoginPage />} />
              <Route path="/alumni/profile" element={<AlumniProfilePage />} />
              <Route path="/become-mentor" element={<BecomeMentorPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/wing/:wingType" element={<WingPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />

              <Route path="/departments" element={<DepartmentCadetsPage />} />
              <Route path="/strength-chart" element={<StrengthChartPage />} />
              <Route path="/magic-members" element={<MagicMembersPage />} />
              <Route path="/teams" element={<NccTeamsPage />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/downloads" element={<DownloadsPage />} />
              <Route path="/scholarships" element={<ScholarshipsPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/blog/:id" element={<BlogPostPage />} />
              <Route path="/submit-blog" element={<SubmitBlogPage />} />

              <Route element={<AdminRoute />}>
                <Route path="/admin/slideshow" element={<AdminSlideshowPage />} />
                <Route path="/admin/gallery" element={<AdminGalleryPage />} />
                <Route path="/admin/anos" element={<AdminANOsPage />} />
                <Route path="/admin/achievements" element={<AdminAchievementsPage />} />
                <Route path="/admin/alumni" element={<AdminAlumniPage />} />
                <Route path="/admin/events" element={<AdminEventsPage />} />
                <Route path="/admin/organization" element={<AdminOrganizationPage />} />
                <Route path="/admin/magic-members" element={<AdminMagicMembersPage />} />
                <Route path="/admin/teams" element={<AdminNccTeamsPage />} />
                <Route path="/admin/downloads" element={<AdminDownloadsPage />} />
                <Route path="/admin/scholarships" element={<AdminScholarshipsPage />} />
                <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
                <Route path="/admin/leadership" element={<AdminLeadershipPage />} />
                <Route path="/admin/blogs" element={<AdminBlogsPage />} />
                <Route path="/admin/registrations" element={<AdminRegistrationManager />} />
              </Route>
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}

export default App;