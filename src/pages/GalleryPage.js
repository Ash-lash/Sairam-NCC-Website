// src/pages/GalleryPage.js
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, getDocs, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, ChevronDown, ChevronRight, X, Folder, Image as ImageIcon } from 'lucide-react';
import SEO from '../components/common/SEO';
import PhotoSlideshow from '../components/sections/PhotoSlideshow';
import OptimizedImage from '../components/common/OptimizedImage';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import { prefetchList } from '../utils/mediaCache';

// --- STYLING ---

const PageContainer = styled.div`
  padding-top: 100px;
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
  overflow-x: hidden;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem 5rem;
  
  @media (max-width: 768px) { padding: 0 1rem 3rem; }
`;

const Header = styled.div`
  margin-bottom: 3rem;
  text-align: center;
`;

const LargeTitle = styled(motion.h1)`
  font-size: clamp(2.5rem, 8vw, 4rem);
  font-weight: 900;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.04em;
`;

const Subtitle = styled(motion.p)`
  color: #64748b;
  font-size: 1.1rem;
  margin-top: 0.5rem;
`;

const AlbumGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
`;

const AlbumCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }
`;

const AlbumCoverWrapper = styled.div`
  width: 100%;
  height: 240px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const AlbumInfo = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #f1f5f9;
`;

const SdgBadge = styled.div`
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
`;

const AlbumTitleText = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
`;

// --- PHOTOS VIEW ---

const PhotoViewContainer = styled(motion.div)`
  min-height: 100vh;
`;

const StickyHeader = styled.div`
  position: sticky;
  top: 70px;
  z-index: 100;
  background: rgba(248, 250, 252, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 2rem;
`;

const BackBtn = styled(motion.button)`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
`;

const SubfolderSection = styled.div`
  margin-bottom: 3rem;
`;

const SubfolderHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e2e8f0;

  h3 { margin: 0; font-size: 1.5rem; font-weight: 800; color: #1e293b; }
  svg { color: #3b82f6; }
`;

const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
`;

const PhotoItem = styled(motion.div)`
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f1f5f9;
  cursor: pointer;
  position: relative;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

// Modal Viewer
const ModalOverlay = styled(motion.div)`
  position: fixed; inset: 0; background: #000; z-index: 100000;
  display: flex; flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 100001;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
`;

const Counter = styled.div`
  font-size: 1.1rem;
  color: white;
  font-weight: 600;
  background: rgba(0,0,0,0.3);
  padding: 5px 12px;
  border-radius: 20px;
`;

const IconButton = styled(motion.button)`
  background: rgba(255,255,255,0.1);
  border: none;
  width: 40px; height: 40px;
  border-radius: 50%;
  color: white;
  display: flex; alignItems: center; justifyContent: center;
  cursor: pointer;
  backdrop-filter: blur(5px);
`;

const GalleryPage = () => {
  const [view, setView] = useState('albums');
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [showSlideshow, setShowSlideshow] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [slideshowList, setSlideshowList] = useState([]);

  useEffect(() => { fetchAlbums(); }, []);

  // Warm the service-worker image cache in the background once data is in.
  useEffect(() => {
    if (!albums.length) return;
    const urls = albums.map(a => a.coverImage).filter(Boolean).map(u => getOptimizedUrl(u, 500, 70));
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 400));
    const handle = schedule(() => prefetchList(urls));
    return () => { if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle); };
  }, [albums]);

  useEffect(() => {
    if (!photos.length) return;
    const urls = photos.map(p => p.imageUrl).filter(Boolean).map(u => getOptimizedUrl(u, 450, 60));
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 400));
    const handle = schedule(() => prefetchList(urls));
    return () => { if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle); };
  }, [photos]);

  const fetchAlbums = async () => {
    try {
      const q = query(collection(db, 'galleryAlbums'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setAlbums(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAlbumSelect = async (album) => {
    setSelectedAlbum(album);
    setView('photos');
    setPhotos([]);
    setPhotosLoading(true);
    window.scrollTo(0, 0);

    try {
      const q = query(
        collection(db, 'galleryImages'),
        where('albumId', '==', album.id),
        limit(500) // Increased limit to fetch all photos in folders
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setPhotos(fetched);
    } catch (e) { console.error(e); }
    finally { setPhotosLoading(false); }
  };

  const groupPhotos = (photos) => {
    return photos.reduce((acc, photo) => {
      const sub = photo.subfolderName || 'General';
      if (!acc[sub]) acc[sub] = [];
      acc[sub].push(photo);
      return acc;
    }, {});
  };

  const openPhoto = (allPhotos, photoId) => {
    const index = allPhotos.findIndex(p => p.id === photoId);
    setSlideshowList(allPhotos);
    setStartIndex(index);
    setShowSlideshow(true);
  };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setShowSlideshow(false); };
    if (showSlideshow) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [showSlideshow]);

  if (loading && view === 'albums') {
    return (
      <PageContainer>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: '1.5rem' }}>
          <div className="skeleton-spinner"></div>
          <p style={{ color: '#1A2B4C', opacity: 0.6, fontWeight: 600 }}>Scanning Photo Vault...</p>
        </div>
      </PageContainer>
    );
  }

  const grouped = groupPhotos(photos);

  return (
    <PageContainer>
      <SEO title="Gallery | SAIRAM NCC" />

      <AnimatePresence mode="wait">
        {view === 'albums' ? (
          <ContentWrapper as={motion.div} key="albums" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Header>
              <LargeTitle>Gallery</LargeTitle>
              <Subtitle>Capturing moments of transition, service, and excellence.</Subtitle>
            </Header>

            <AlbumGrid>
              {albums.map((album) => (
                <AlbumCard key={album.id} onClick={() => handleAlbumSelect(album)}>
                  <AlbumCoverWrapper>
                    <OptimizedImage src={album.coverImage} width={500} quality={70} alt={album.name} objectFit="cover" style={{ width: '100%', height: '100%' }} />
                  </AlbumCoverWrapper>
                  <AlbumInfo>
                    <SdgBadge>{album.sdgGoal}</SdgBadge>
                    <AlbumTitleText>{album.name}</AlbumTitleText>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '5px' }}>{album.sdgName}</p>
                  </AlbumInfo>
                </AlbumCard>
              ))}
            </AlbumGrid>
          </ContentWrapper>
        ) : (
          <PhotoViewContainer key="photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <StickyHeader>
              <ContentWrapper style={{ padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: 0 }}>
                <BackBtn onClick={() => setView('albums')} whileTap={{ scale: 0.95 }}>
                  <ArrowLeft size={20} /> Albums
                </BackBtn>
                <div>
                  <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>{selectedAlbum.name}</h1>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{selectedAlbum.sdgGoal} • {selectedAlbum.sdgName}</p>
                </div>
              </ContentWrapper>
            </StickyHeader>

            <ContentWrapper>
              {photosLoading ? (
                <div style={{ textAlign: 'center', padding: '10rem 0' }} className="skeleton-spinner"></div>
              ) : (
                <>
                  {Object.entries(grouped).map(([folder, folderPhotos]) => (
                    <SubfolderSection key={folder}>
                      {folder !== 'General' && (
                        <SubfolderHeader>
                          <Folder size={24} />
                          <h3>{folder}</h3>
                        </SubfolderHeader>
                      )}
                      <PhotoGrid>
                        {folderPhotos.map((photo, index) => (
                          <PhotoItem key={photo.id} onClick={() => openPhoto(photos, photo.id)}>
                            <OptimizedImage
                              src={photo.imageUrl}
                              width={400}
                              quality={75}
                              priority={index < 8}
                              alt={photo.caption || "gallery photo"}
                              objectFit="cover"
                              style={{ width: '100%', height: '100%' }}
                            />
                          </PhotoItem>
                        ))}
                      </PhotoGrid>
                    </SubfolderSection>
                  ))}
                  {photos.length === 0 && <p style={{ textAlign: 'center', color: '#64748b' }}>No photos found in this album.</p>}
                </>
              )}
            </ContentWrapper>
          </PhotoViewContainer>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSlideshow && (
          <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ModalHeader>
              <Counter>{startIndex + 1} / {slideshowList.length}</Counter>
              <IconButton onClick={() => setShowSlideshow(false)}><X size={24} /></IconButton>
            </ModalHeader>
            <div style={{ flex: 1, position: 'relative' }}>
              <PhotoSlideshow
                images={slideshowList}
                currentIndex={startIndex}
                onSlideChange={(idx) => setStartIndex(idx)}
                isModal={true}
              />
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default GalleryPage;
