// src/pages/AdminGalleryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { collection, getDocs, doc, addDoc, deleteDoc, writeBatch, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import {
  ImagePlus, Trash2, Plus, ArrowLeft, Upload, Grid as GridIcon,
  FolderPlus, ImageIcon, Settings2, CheckCircle2,
  Layers
} from 'lucide-react';
import { uploadFileToFirebaseStorage } from '../utils/firebaseStorage';
import SEO from '../components/common/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import CounterLoader from '../components/common/CounterLoader';
import { getOptimizedUrl } from '../utils/imageOptimizer';

// --- DASHBOARD STYLES ---

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding-top: 80px; /* Navbar offset */
`;

const Sidebar = styled(motion.div)`
  width: 380px;
  background: linear-gradient(180deg, #1a2b4c 0%, #0d1a33 100%);
  color: white;
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: calc(100vh - 80px);
  position: sticky;
  top: 80px;
  overflow-y: auto;
  box-shadow: 4px 0 24px rgba(0,0,0,0.1);
  z-index: 10;
  border-right: 4px solid #00aadf; /* Sky Blue accent */
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #d1202f 0%, #1a2b4c 50%, #00aadf 100%);
  }

  @media (max-width: 1024px) {
    width: 340px;
    padding: 1.5rem;
  }
  @media (max-width: 768px) {
    display: none;
  }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 3rem;
  overflow-y: auto;
  
  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -1px;
  margin: 0;
`;

const SidebarCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 1.25rem;
  backdrop-filter: blur(10px);
`;

const SidebarMethods = styled.h3`
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #94a3b8;
  margin-bottom: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Inputs
const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    font-size: 0.85rem;
    color: #e2e8f0;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
`;

const DarkInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  transition: all 0.2s;
  
  &:focus { 
    outline: none; 
    border-color: #60a5fa; 
    background: rgba(0,0,0,0.4);
    box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.1);
  }
  &::placeholder { color: #64748b; }
`;

const DarkSelect = styled.select`
  width: 100%;
  padding: 14px 16px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  appearance: none;
  cursor: pointer;
  
  option { background: #1e293b; color: white; padding: 10px; }
`;

const UploadZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed rgba(255,255,255,0.2);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255,255,255,0.02);
  text-align: center;
  
  &:hover {
    background: rgba(255,255,255,0.05);
    border-color: #3b82f6;
  }
  
  p { margin: 0.5rem 0 0; font-size: 0.9rem; color: #cbd5e1; }
  span { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem;}
`;

const PrimaryButton = styled(motion.button)`
  width: 100%;
  padding: 14px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  
  &:disabled { opacity: 0.6; cursor: wait; }
  &:hover:not(:disabled) { background: #2563eb; }
`;

// Main Content Grids
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
`;

const AlbumCard = styled(motion.div)`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);
  border: 1px solid #f1f5f9;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  
  &:hover { transform: translateY(-5px); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2); }
`;

const CardImage = styled.div`
  height: 200px;
  background: #e2e8f0;
  position: relative;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const CardContent = styled.div`
  padding: 1.5rem;
  
  h3 { margin: 0 0 0.5rem; font-size: 1.1rem; color: #0f172a; }
  p { margin: 0; font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 6px; }
`;

const Tag = styled.span`
  background: #f1f5f9;
  color: #475569;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
`;

const DeleteFab = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: white;
  color: #ef4444;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  
  &:hover { background: #ef4444; color: white; }
`;

// Photos
const PhotoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const PhotoItem = styled.div`
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  
  img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
  &:hover img { transform: scale(1.05); }
  
  &:hover button { opacity: 1; }
`;

const PhotoOverlayBtn = styled.button`
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  cursor: pointer;
  transition: opacity 0.2s;
`;

const AdminGalleryPage = () => {
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState({}); // Tracking bg uploads: { fileName: progress }

  // Creation State
  const [name, setName] = useState('');
  const [sdgGoal, setSdgGoal] = useState('Goal 1');
  const [sdgName, setSdgName] = useState('');
  const [coverImage, setCoverImage] = useState(null);

  const sdgOptions = Array.from({ length: 17 }, (_, i) => `Goal ${i + 1}`);

  // Fetch Logic - Simplified to remove blocking loader
  const fetchAlbums = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const q = query(collection(db, 'galleryAlbums'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlbums(fetched);
    } catch (e) { console.error(e); }
    finally { if (showLoader) setLoading(false); }
  };

  useEffect(() => {
    fetchAlbums(true); // Only blocking on first load
  }, []);

  const fetchAlbumPhotos = useCallback(async (showLoader = false) => {
    if (!selectedAlbum) return;
    // Removed blocking loader for better UX
    try {
      const q = query(collection(db, 'galleryImages'), where('albumId', '==', selectedAlbum.id), limit(100));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetched.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setAlbumPhotos(fetched);
    } catch (e) { console.error(e); }
  }, [selectedAlbum]);

  useEffect(() => { if (selectedAlbum) fetchAlbumPhotos(); }, [selectedAlbum, fetchAlbumPhotos]);

  // Handlers
  const handleCreateAlbum = async () => {
    if (!name || !sdgName || !coverImage) return alert("Please fill details & cover image.");

    const tempId = 'cover_' + Math.random().toString(36).substring(7);
    const albumName = name;
    const goal = sdgGoal;
    const desc = sdgName;
    const coverFile = coverImage;

    // Reset Form Immediately
    setName(''); setSdgName(''); setCoverImage(null);

    // Background create logic
    setUploadingFiles(prev => ({ ...prev, [tempId]: { name: `Cover: ${albumName}`, progress: '0%' } }));

    try {
      const uploadFileToFirebase = async (file, folderPath) => {
        if (!file) return '';
        setLoadingMsg(`Uploading ${file.name}...`);
        return uploadFileToFirebaseStorage(file, folderPath);
      };

      const coverUrl = await uploadFileToFirebase(
        coverFile,
        'gallery-covers'
      );

      await addDoc(collection(db, 'galleryAlbums'), {
        name: albumName, sdgGoal: goal, sdgName: desc, coverImage: coverUrl, createdAt: new Date().toISOString()
      });

      // Clean up and refresh
      setUploadingFiles(prev => {
        const newState = { ...prev };
        delete newState[tempId];
        return newState;
      });
      fetchAlbums(false);
    } catch (e) {
      console.error(e);
      setUploadingFiles(prev => ({ ...prev, [tempId]: { ...prev[tempId], error: true } }));
    }
  };

  const [subfolderName, setSubfolderName] = useState('');

  // Handlers
  const handlePhotoUpload = async (e) => {
    if (!selectedAlbum || !e.target.files.length) return;

    const files = Array.from(e.target.files);
    const subfolder = subfolderName.trim();

    // Background upload logic
    files.forEach(async (file) => {
      const tempId = Math.random().toString(36).substring(7);
      setUploadingFiles(prev => ({ ...prev, [tempId]: { name: file.name, progress: '0%' } }));

      try {
        const uploadFileToFirebase = async (file, folderPath) => {
          if (!file) return '';
          return uploadFileToFirebaseStorage(file, folderPath);
        };

        const url = await uploadFileToFirebase(
          file,
          `gallery/${selectedAlbum.id}${subfolder ? '/' + subfolder : ''}`
        );

        // Save to DB
        await addDoc(collection(db, 'galleryImages'), {
          albumId: selectedAlbum.id,
          subfolderName: subfolder || null,
          imageUrl: url,
          createdAt: new Date().toISOString()
        });

        // Clean up and refresh
        setUploadingFiles(prev => {
          const newState = { ...prev };
          delete newState[tempId];
          return newState;
        });
        fetchAlbumPhotos(false); // Silent refresh
      } catch (err) {
        console.error(err);
        setUploadingFiles(prev => ({ ...prev, [tempId]: { ...prev[tempId], error: true } }));
      }
    });

    e.target.value = null; // Clear input
  };

  const handleDeleteAlbum = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Danger: Delete album and all its photos?")) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'galleryAlbums', id));
      const q = query(collection(db, 'galleryImages'), where('albumId', '==', id));
      const snaps = await getDocs(q);
      const batch = writeBatch(db);
      snaps.forEach(d => batch.delete(d.ref));
      await batch.commit();
      fetchAlbums();
      if (selectedAlbum?.id === id) setSelectedAlbum(null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDeletePhoto = async (id) => {
    if (!window.confirm("Remove this photo?")) return;
    try {
      await deleteDoc(doc(db, 'galleryImages', id));
      fetchAlbumPhotos(false); // Silent refresh
    } catch (e) { console.error(e); }
  };

  // Progress Bar Helper
  const RenderUploads = () => {
    const active = Object.values(uploadingFiles);
    if (active.length === 0) return null;

    return (
      <SidebarCard style={{
        marginTop: '1rem',
        background: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)'
      }}>
        <SidebarMethods style={{ color: '#60a5fa', marginBottom: '0.8rem' }}>
          Background Uploads ({active.length})
        </SidebarMethods>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {active.slice(0, 3).map((up, i) => (
            <div key={i} style={{ fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{up.name}</span>
                <span>{up.progress}</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: up.progress.includes('%') ? up.progress : '100%' }}
                  style={{ height: '100%', background: '#3b82f6' }}
                />
              </div>
            </div>
          ))}
          {active.length > 3 && <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>+ {active.length - 3} more...</p>}
        </div>
      </SidebarCard>
    );
  };

  return (
    <>
      <SEO title="Admin Gallery | NCC Dashboard" />
      <CounterLoader isLoading={loading} label={loadingMsg || "Updating Database..."} />

      <DashboardContainer>
        {/* --- DYNAMIC SIDEBAR --- */}
        <Sidebar initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 45,
              height: 45,
              background: 'linear-gradient(135deg, #d1202f, #1a2b4c)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              <Layers color="white" size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800, letterSpacing: '-0.5px' }}>Gallery Studio</h2>
              <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                <div style={{ width: 12, height: 2, background: '#d1202f' }}></div>
                <div style={{ width: 12, height: 2, background: '#1a2b4c' }}></div>
                <div style={{ width: 12, height: 2, background: '#00aadf' }}></div>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!selectedAlbum ? (
              <motion.div key="global-controls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

                {/* OVERVIEW REMOVED PER USER REQUEST */}

                <SidebarMethods style={{ marginTop: '1rem' }}><FolderPlus size={16} /> Create New Album</SidebarMethods>

                <InputGroup>
                  <label>Album Title</label>
                  <DarkInput placeholder="e.g. Republic Day 2024" value={name} onChange={e => setName(e.target.value)} />
                </InputGroup>

                {/* Stacked Inputs for Better Space */}
                <InputGroup>
                  <label>SDG Target</label>
                  <DarkSelect value={sdgGoal} onChange={e => setSdgGoal(e.target.value)}>
                    {sdgOptions.map(o => <option key={o} value={o}>{o}</option>)}
                  </DarkSelect>
                </InputGroup>

                <InputGroup>
                  <label>Descriptor</label>
                  <DarkInput placeholder="e.g. Peace" value={sdgName} onChange={e => setSdgName(e.target.value)} />
                </InputGroup>

                <InputGroup>
                  <label>Cover Image</label>
                  <UploadZone>
                    {coverImage ? <CheckCircle2 color="#10b981" size={24} /> : <ImagePlus color="#94a3b8" size={24} />}
                    <p>{coverImage ? coverImage.name : "Click to browse"}</p>
                    <input type="file" hidden accept="image/*" onChange={e => setCoverImage(e.target.files[0])} />
                  </UploadZone>
                </InputGroup>

                <PrimaryButton onClick={handleCreateAlbum} disabled={loading} whileTap={{ scale: 0.98 }}>
                  <Plus size={18} /> Publish Album
                </PrimaryButton>

                <RenderUploads />
              </motion.div>
            ) : (
              <motion.div key="album-controls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <SidebarCard style={{ borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                  <SidebarMethods style={{ color: '#60a5fa', marginBottom: 0 }}>
                    <Settings2 size={16} /> Editing Mode
                  </SidebarMethods>
                </SidebarCard>

                <div style={{ marginTop: '2rem' }}>
                  <button
                    onClick={() => setSelectedAlbum(null)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', gap: '10px', cursor: 'pointer', marginBottom: '1rem' }}
                  >
                    <ArrowLeft size={20} /> Return to Library
                  </button>

                  <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedAlbum.name}</h2>
                  <Tag>{selectedAlbum.sdgGoal}</Tag>
                  <p style={{ color: '#cbd5e1', marginTop: '1rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    Background uploads are supported. You can continue browsing while photos are added.
                  </p>
                </div>

                <RenderUploads />

                <div style={{ margin: '2rem 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                <SidebarMethods><Upload size={16} /> Batch Upload</SidebarMethods>

                <InputGroup>
                  <label>Sub-folder (Optional)</label>
                  <DarkInput
                    placeholder="e.g. Day 1, Prize Distribution"
                    value={subfolderName}
                    onChange={e => setSubfolderName(e.target.value)}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Leave empty for main album
                  </span>
                </InputGroup>

                <UploadZone style={{ borderColor: '#3b82f6', background: 'rgba(59, 130, 246, 0.05)' }}>
                  <Upload color="#60a5fa" size={32} />
                  <p style={{ color: 'white', fontWeight: 600 }}>Drop Photos Here</p>
                  <span>or click to browse multiple files</span>
                  <input type="file" multiple hidden accept="image/*" onChange={handlePhotoUpload} />
                </UploadZone>

              </motion.div>
            )}
          </AnimatePresence>
        </Sidebar>

        {/* --- MAIN CONTENT AREA --- */}
        <MainContent>
          {selectedAlbum && (
            <SectionHeader>
              <div>
                <Title>Photos in Album</Title>
                <p style={{ color: '#64748b', marginTop: '5px' }}>{albumPhotos.length} items total</p>
              </div>
            </SectionHeader>
          )}
          <AnimatePresence mode="wait">
            {!selectedAlbum ? (
              <motion.div key="grid-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SectionHeader>
                  <div>
                    <Title>Album Library</Title>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Manage your digital assets and event galleries.</p>
                  </div>
                </SectionHeader>

                <Grid>
                  {albums.map((album, i) => (
                    <AlbumCard
                      key={album.id}
                      onClick={() => setSelectedAlbum(album)}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <CardImage>
                        <img
                          src={getOptimizedUrl(album.coverImage, 400, 70)}
                          alt={album.name}
                          loading="lazy"
                        />
                        <DeleteFab onClick={(e) => handleDeleteAlbum(e, album.id)}>
                          <Trash2 size={18} />
                        </DeleteFab>
                      </CardImage>
                      <CardContent>
                        <Tag style={{ marginBottom: '8px', display: 'inline-block' }}>{album.sdgGoal}</Tag>
                        <h3>{album.name}</h3>
                        <p>{album.sdgName}</p>
                      </CardContent>
                    </AlbumCard>
                  ))}
                </Grid>
                {albums.length === 0 && !loading && (
                  <div style={{ textAlign: 'center', marginTop: '5rem', color: '#cbd5e1' }}>
                    <ImageIcon size={64} color="#e2e8f0" />
                    <h3 style={{ color: '#94a3b8', marginTop: '1rem' }}>No albums found</h3>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="detail-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <PhotoGrid>
                  {albumPhotos.map((photo, i) => (
                    <PhotoItem key={photo.id}>
                      <img
                        src={getOptimizedUrl(photo.imageUrl, 250, 40)}
                        alt="gallery"
                        loading="lazy"
                      />
                      <PhotoOverlayBtn onClick={() => handleDeletePhoto(photo.id)}>
                        <Trash2 size={24} />
                        <span style={{ marginLeft: '8px' }}>Remove</span>
                      </PhotoOverlayBtn>
                    </PhotoItem>
                  ))}
                </PhotoGrid>
                {albumPhotos.length === 0 && !Object.keys(uploadingFiles).length && (
                  <div style={{ padding: '4rem', background: 'white', borderRadius: '20px', textAlign: 'center' }}>
                    <p style={{ color: '#64748b' }}>This album is empty. Use the sidebar to upload photos.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </MainContent>
      </DashboardContainer>
    </>
  );
};

export default AdminGalleryPage;