import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { collection, getDocs, doc, addDoc, deleteDoc, writeBatch, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFileToFirebaseStorage, deleteFileFromFirebaseStorage } from '../utils/firebaseStorage';
import AsyncCachedImage from '../components/common/AsyncCachedImage';
import {
    ImagePlus, Trash2, Plus, ArrowLeft, Upload, Grid as GridIcon,
    FolderPlus, ImageIcon, Settings2, CheckCircle2,
    PieChart, Layers
} from 'lucide-react';
import { uploadFile } from '../utils/uploadHelper';
import SEO from '../components/common/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import CounterLoader from '../components/common/CounterLoader';
import BackfillImagesButton from '../components/admin/BackfillImagesButton';

// --- DASHBOARD STYLES ---

const DashboardContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  padding-top: 80px;
`;

const Sidebar = styled(motion.div)`
  width: 400px;
  background: #1a2b4c;
  color: white;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  height: calc(100vh - 80px);
  position: sticky;
  top: 80px;
  overflow-y: auto;
  box-shadow: 4px 0 24px rgba(0,0,0,0.05);
  z-index: 10;

  @media (max-width: 1024px) {
    width: 320px;
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
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
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

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const StatBox = styled.div`
  background: rgba(0,0,0,0.2);
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  
  .num { font-size: 1.8rem; font-weight: 800; color: #3b82f6; }
  .lbl { font-size: 0.75rem; color: #cbd5e1; font-weight: 600; text-transform: uppercase; margin-top: 4px;}
`;

const InputGroup = styled.div`
  margin-bottom: 1.25rem;
  
  label {
    display: block;
    font-size: 0.85rem;
    color: #cbd5e1;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
`;

const DarkInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  transition: all 0.2s;
  
  &:focus { 
    outline: none; 
    border-color: #3b82f6; 
    background: rgba(0,0,0,0.4);
  }
  &::placeholder { color: #64748b; }
`;

const DarkSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: white;
  font-size: 0.95rem;
  appearance: none;
  cursor: pointer;
  
  option { background: #1e293b; color: white; }
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
    const [stats, setStats] = useState({ albums: 0, photos: 0 });

    const [name, setName] = useState('');
    const [sdgGoal, setSdgGoal] = useState('Goal 1');
    const [sdgName, setSdgName] = useState('');
    const [coverImage, setCoverImage] = useState(null);

    const sdgOptions = Array.from({ length: 17 }, (_, i) => `Goal ${i + 1}`);

    const fetchAlbums = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'galleryAlbums'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAlbums(fetched);

            const photosSnap = await getDocs(collection(db, 'galleryImages'));
            setStats({ albums: fetched.length, photos: photosSnap.size });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAlbums(); }, []);

    const fetchAlbumPhotos = useCallback(async () => {
        if (!selectedAlbum) return;
        setLoading(true);
        try {
            const q = query(collection(db, 'galleryImages'), where('albumId', '==', selectedAlbum.id));
            const snapshot = await getDocs(q);
            setAlbumPhotos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selectedAlbum]);

    useEffect(() => { if (selectedAlbum) fetchAlbumPhotos(); }, [selectedAlbum, fetchAlbumPhotos]);

    const handleCreateAlbum = async () => {
        if (!name || !sdgName || !coverImage) return alert("Please fill details & cover image.");
        setLoading(true);
        try {
            const coverUrl = await uploadFile(coverImage);
            await addDoc(collection(db, 'galleryAlbums'), {
                name, sdgGoal, sdgName, coverImage: coverUrl, createdAt: new Date().toISOString()
            });
            setName(''); setSdgName(''); setCoverImage(null);
            fetchAlbums();
            alert("Album created successfully!");
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handlePhotoUpload = async (e) => {
        if (!selectedAlbum || !e.target.files.length) return;
        setLoading(true);
        const files = Array.from(e.target.files);
        try {
            const urls = await Promise.all(files.map(f => uploadFile(f)));

            const batch = writeBatch(db);
            urls.forEach(url => {
                const ref = doc(collection(db, 'galleryImages'));
                batch.set(ref, { albumId: selectedAlbum.id, imageUrl: url, createdAt: new Date().toISOString() });
            });
            await batch.commit();
            fetchAlbumPhotos();
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
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
            fetchAlbumPhotos();
        } catch (e) { console.error(e); }
    };

    return (
        <>
            <SEO title="Admin Gallery | NCC Dashboard" />
            <CounterLoader isLoading={loading} label="Updating Gallery Database..." />

            <DashboardContainer>
                <Sidebar initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 40, height: 40, background: '#3b82f6', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers color="white" size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Gallery Studio</h2>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Admin Console</span>
                        </div>
                    </div>
                    
                    <BackfillImagesButton />

                    <AnimatePresence mode="wait">
                        {!selectedAlbum ? (
                            <motion.div key="global-controls" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

                                <SidebarCard>
                                    <SidebarMethods><PieChart size={16} /> Overview</SidebarMethods>
                                    <StatGrid>
                                        <StatBox><div className="num">{stats.albums}</div><div className="lbl">Albums</div></StatBox>
                                        <StatBox><div className="num">{stats.photos}</div><div className="lbl">Photos</div></StatBox>
                                    </StatGrid>
                                </SidebarCard>

                                <div style={{ margin: '2rem 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                                <SidebarMethods><FolderPlus size={16} /> Create New Album</SidebarMethods>

                                <InputGroup>
                                    <label>Album Title</label>
                                    <DarkInput placeholder="e.g. Republic Day 2024" value={name} onChange={e => setName(e.target.value)} />
                                </InputGroup>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                                </div>

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
                                        Upload photos to this album. They will be automatically compressed and added to the gallery.
                                    </p>
                                </div>

                                <div style={{ margin: '2rem 0', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                                <SidebarMethods><Upload size={16} /> Batch Upload</SidebarMethods>
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

                <MainContent>
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
                                                <AsyncCachedImage 
                                                    src={album.coverImage} 
                                                    alt={album.name} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                                <SectionHeader>
                                    <div>
                                        <Title>Photos in Album</Title>
                                        <p style={{ color: '#64748b', marginTop: '5px' }}>{albumPhotos.length} items total</p>
                                    </div>
                                </SectionHeader>

                                <PhotoGrid>
                                    {albumPhotos.map((photo, i) => (
                                        <PhotoItem key={photo.id}>
                                            <AsyncCachedImage 
                                                src={photo.imageUrl} 
                                                alt="gallery"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                            <PhotoOverlayBtn onClick={() => handleDeletePhoto(photo.id)}>
                                                <Trash2 size={24} />
                                                <span style={{ marginLeft: '8px' }}>Remove</span>
                                            </PhotoOverlayBtn>
                                        </PhotoItem>
                                    ))}
                                </PhotoGrid>
                                {albumPhotos.length === 0 && !loading && (
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
