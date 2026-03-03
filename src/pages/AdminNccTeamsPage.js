import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, doc, addDoc, deleteDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Trash2, X, ChevronLeft, Home, Zap, ShieldCheck, Edit2 } from 'lucide-react';
import { uploadFile } from '../utils/uploadHelper';
import SEO from '../components/common/SEO';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 120px 2rem 4rem;
  color: #1e293b;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const GlassHeader = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  @media (max-width: 768px) { flex-direction: column; gap: 1.5rem; text-align: center; }
`;

const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const IconPulse = styled.div`
  width: 56px; height: 56px;
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  color: white;
  animation: ${float} 4s ease-in-out infinite;
`;

const MainTitle = styled.h1`
  font-size: 1.8rem; font-weight: 800; color: #0f172a;
  span { color: #2563eb; }
`;

const ActionGroup = styled.div`
  display: flex; gap: 1rem;
`;

const Button = styled(motion.button)`
  background: ${props => props.secondary ? 'white' : '#0f172a'};
  color: ${props => props.secondary ? '#0f172a' : 'white'};
  border: ${props => props.secondary ? '1px solid #e2e8f0' : 'none'};
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  display: flex; align-items: center; gap: 0.5rem;
  cursor: pointer;
  box-shadow: ${props => props.secondary ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'};
  transition: all 0.2s;
  &:hover { opacity: 0.9; transform: translateY(-2px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    border-color: #2563eb;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    transform: translateY(-4px);
  }
`;

const CardHeader = styled.div`
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;
`;

const IconBox = styled.div`
  width: 64px; height: 64px;
  background: #f1f5f9;
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  img { width: 60%; height: 60%; object-fit: contain; }
  color: #64748b;
`;

const DeleteButton = styled.button`
  background: #fee2e2; color: #dc2626; border: none;
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  &:hover { background: #fecaca; }
`;

const EditButton = styled.button`
  background: #eff6ff; color: #2563eb; border: none;
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  margin-right: 0.5rem;
  &:hover { background: #dbeafe; }
`;

const BatchPosterPreview = styled.div`
  width: 100%; aspect-ratio: 4/5;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: center;
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const Modal = styled(motion.div)`
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000; padding: 2rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  width: 100%; max-width: 500px;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  label { display: block; margin-bottom: 0.5rem; font-weight: 600; font-size: 0.9rem; }
  input {
    width: 100%; padding: 0.75rem; border-radius: 12px; border: 1px solid #cbd5e1;
    &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 2px #bfdbfe; }
  }
`;

const FileUpload = styled.div`
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #2563eb; background: #f8fafc; }
`;

const AdminNccTeamsPage = () => {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('teams'); // 'teams' | 'batches'
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [editingBatch, setEditingBatch] = useState(null);

    // Form Data
    const [teamName, setTeamName] = useState('');
    const [teamIcon, setTeamIcon] = useState(null);
    const [batchName, setBatchName] = useState('');

    // Updated state for multiple images
    const [existingImages, setExistingImages] = useState([]); // URLs
    const [newBatchFiles, setNewBatchFiles] = useState([]); // File objects

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'nccTeams'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchBatches = async (teamId) => {
        setLoading(true);
        try {
            const q = query(collection(db, 'nccTeamBatches'), where('teamId', '==', teamId));
            const snapshot = await getDocs(q);
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by year descending (parse from name)
            fetched.sort((a, b) => {
                const yearA = parseInt(a.name.match(/\d{4}/)?.[0] || 0, 10);
                const yearB = parseInt(b.name.match(/\d{4}/)?.[0] || 0, 10);
                return yearB - yearA;
            });
            setBatches(fetched);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAddTeam = async () => {
        if (!teamName) return;
        setIsSubmitting(true);
        try {
            let iconURL = '';
            if (teamIcon) {
                iconURL = await uploadFile(teamIcon);
            }
            await addDoc(collection(db, 'nccTeams'), {
                name: teamName,
                iconURL,
                createdAt: new Date().toISOString()
            });
            setTeamName('');
            setTeamIcon(null);
            setShowTeamModal(false);
            fetchTeams();
        } catch (e) { alert(e.message); }
        finally { setIsSubmitting(false); }
    };

    const handleDeleteTeam = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Deleting a team will delete it from the list. Batches may be orphaned (cleanup manually if needed). Continue?")) return;
        try {
            await deleteDoc(doc(db, 'nccTeams', id));
            fetchTeams();
        } catch (e) { console.error(e); }
    };

    const handleOpenTeam = (team) => {
        setSelectedTeam(team);
        fetchBatches(team.id);
        setViewMode('batches');
    };

    // Helper to upload multiple files
    const uploadMultipleFiles = async (files) => {
        const uploadPromises = files.map(file => uploadFile(file));
        return Promise.all(uploadPromises);
    };

    const handleAddBatch = async () => {
        if (!batchName || !selectedTeam) return;
        setIsSubmitting(true);
        try {
            const uploadedUrls = await uploadMultipleFiles(newBatchFiles);
            const finalPosterURLs = [...existingImages, ...uploadedUrls];
            const mainPosterURL = finalPosterURLs.length > 0 ? finalPosterURLs[0] : '';

            await addDoc(collection(db, 'nccTeamBatches'), {
                teamId: selectedTeam.id,
                name: batchName,
                posterURL: mainPosterURL, // Legacy support / Primary thumbnail
                posterURLs: finalPosterURLs, // Array of all images
                createdAt: new Date().toISOString()
            });

            resetBatchForm();
            fetchBatches(selectedTeam.id);
        } catch (e) { alert(e.message); }
        finally { setIsSubmitting(false); }
    };

    const handleUpdateBatch = async () => {
        if (!batchName || !editingBatch) return;
        setIsSubmitting(true);
        try {
            const uploadedUrls = await uploadMultipleFiles(newBatchFiles);
            const finalPosterURLs = [...existingImages, ...uploadedUrls];
            const mainPosterURL = finalPosterURLs.length > 0 ? finalPosterURLs[0] : '';

            await updateDoc(doc(db, 'nccTeamBatches', editingBatch.id), {
                name: batchName,
                posterURL: mainPosterURL,
                posterURLs: finalPosterURLs,
                updatedAt: new Date().toISOString()
            });

            resetBatchForm();
            setEditingBatch(null);
            fetchBatches(selectedTeam.id);
        } catch (e) { alert(e.message); }
        finally { setIsSubmitting(false); }
    };

    const handleEditBatch = (e, batch) => {
        e.stopPropagation();
        setEditingBatch(batch);
        setBatchName(batch.name);

        // Populate existing images logic
        if (batch.posterURLs && Array.isArray(batch.posterURLs)) {
            setExistingImages(batch.posterURLs);
        } else if (batch.posterURL) {
            setExistingImages([batch.posterURL]);
        } else {
            setExistingImages([]);
        }
        setNewBatchFiles([]);
        setShowBatchModal(true);
    };

    const resetBatchForm = () => {
        setBatchName('');
        setExistingImages([]);
        setNewBatchFiles([]);
        setShowBatchModal(false);
    };

    const handleDeleteBatch = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm("Delete this batch?")) return;
        try {
            await deleteDoc(doc(db, 'nccTeamBatches', id));
            if (selectedTeam) fetchBatches(selectedTeam.id);
        } catch (e) { console.error(e); }
    };

    const handleRemoveExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveNewFile = (index) => {
        setNewBatchFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileSelect = (e) => {
        if (e.target.files) {
            setNewBatchFiles(prev => [...prev, ...Array.from(e.target.files)]);
        }
    };

    return (
        <PageContainer>
            <SEO title="Teams Admin | NCC" noindex={true} />
            <ContentWrapper>
                <GlassHeader>
                    <TitleSection>
                        <IconPulse><Zap size={28} /></IconPulse>
                        <div>
                            <MainTitle>
                                {viewMode === 'teams' ? 'Teams Manager' : <span>{selectedTeam?.name}</span>}
                            </MainTitle>
                            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                {viewMode === 'teams' ? 'Manage NCC Teams & Specialized Wings' : 'Manage Batches & Posters'}
                            </p>
                        </div>
                    </TitleSection>
                    <ActionGroup>
                        {viewMode === 'batches' && (
                            <Button secondary onClick={() => { setViewMode('teams'); setSelectedTeam(null); }}>
                                <ChevronLeft size={18} /> Back
                            </Button>
                        )}
                        <Button onClick={() => viewMode === 'teams' ? setShowTeamModal(true) : setShowBatchModal(true)}>
                            <Plus size={18} /> {viewMode === 'teams' ? 'Add Team' : 'Add Batch'}
                        </Button>
                        <Button secondary onClick={() => navigate('/')}><Home size={18} /></Button>
                    </ActionGroup>
                </GlassHeader>

                {loading && <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p>}

                {!loading && viewMode === 'teams' && (
                    <Grid>
                        {teams.map(team => (
                            <Card key={team.id} onClick={() => handleOpenTeam(team)} whileHover={{ y: -5 }}>
                                <CardHeader>
                                    <IconBox>
                                        {team.iconURL ? <img src={team.iconURL} alt="Icon" loading="lazy" /> : <ShieldCheck size={32} />}
                                    </IconBox>
                                    <DeleteButton onClick={(e) => handleDeleteTeam(e, team.id)}><Trash2 size={16} /></DeleteButton>
                                </CardHeader>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{team.name}</h3>
                                <p style={{ color: '#64748b', marginTop: '0.5rem', fontSize: '0.9rem' }}>Click to manage batches</p>
                            </Card>
                        ))}
                        {teams.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>No teams created yet.</p>}
                    </Grid>
                )}

                {!loading && viewMode === 'batches' && (
                    <Grid>
                        {batches.map(batch => (
                            <Card key={batch.id} style={{ cursor: 'default' }}>
                                <CardHeader>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>{batch.name}</h3>
                                    <div style={{ display: 'flex' }}>
                                        <EditButton onClick={(e) => handleEditBatch(e, batch)}><Edit2 size={16} /></EditButton>
                                        <DeleteButton onClick={(e) => handleDeleteBatch(e, batch.id)}><Trash2 size={16} /></DeleteButton>
                                    </div>
                                </CardHeader>
                                <BatchPosterPreview>
                                    {batch.posterURL ? <img src={batch.posterURL} alt="Poster" loading="lazy" /> : <div style={{ textAlign: 'center' }}><Zap size={32} color="#cbd5e1" /><p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>No Poster</p></div>}
                                    {batch.posterURLs && batch.posterURLs.length > 1 && (
                                        <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem' }}>
                                            +{batch.posterURLs.length - 1} more
                                        </div>
                                    )}
                                </BatchPosterPreview>
                            </Card>
                        ))}
                        {batches.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>No batches found for this team.</p>}
                    </Grid>
                )}

                {/* MODALS */}
                <AnimatePresence>
                    {showTeamModal && (
                        <Modal initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ModalContent initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create New Team</h2>
                                    <button onClick={() => setShowTeamModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                                </div>
                                <InputGroup>
                                    <label>Team Name</label>
                                    <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="e.g. Silent Drill" />
                                </InputGroup>
                                <InputGroup>
                                    <label>Team Icon</label>
                                    <FileUpload onClick={() => document.getElementById('teamIconIn').click()}>
                                        <input id="teamIconIn" type="file" style={{ display: 'none' }} accept="image/*" onChange={e => setTeamIcon(e.target.files[0])} />
                                        {teamIcon ? <p style={{ color: '#2563eb', fontWeight: 600 }}>{teamIcon.name}</p> : <p style={{ color: '#64748b' }}>Click to upload icon</p>}
                                    </FileUpload>
                                </InputGroup>
                                <Button onClick={handleAddTeam} disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center' }}>
                                    {isSubmitting ? 'Creating...' : 'Create Team'}
                                </Button>
                            </ModalContent>
                        </Modal>
                    )}

                    {showBatchModal && (
                        <Modal initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ModalContent initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} style={{ maxWidth: '600px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{editingBatch ? 'Edit Batch' : 'Add Batch'} to {selectedTeam?.name}</h2>
                                    <button onClick={resetBatchForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                                </div>
                                <InputGroup>
                                    <label>Batch Name / Year</label>
                                    <input value={batchName} onChange={e => setBatchName(e.target.value)} placeholder="e.g. 2023-2024" />
                                </InputGroup>
                                <InputGroup>
                                    <label>Batch Posters (Select multiple)</label>
                                    {/* Existing Images List */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                                        {existingImages.map((src, index) => (
                                            <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                                                <img src={src} alt="existing" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    onClick={() => handleRemoveExistingImage(index)}
                                                    style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer', padding: '2px 4px' }}
                                                >✕</button>
                                            </div>
                                        ))}
                                        {newBatchFiles.map((file, index) => (
                                            <div key={`new-${index}`} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2563eb' }}>
                                                <img src={URL.createObjectURL(file)} alt="new" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button
                                                    onClick={() => handleRemoveNewFile(index)}
                                                    style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(255,0,0,0.8)', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer', padding: '2px 4px' }}
                                                >✕</button>
                                            </div>
                                        ))}
                                    </div>
                                    <FileUpload onClick={() => document.getElementById('batchPosterIn').click()}>
                                        <input id="batchPosterIn" type="file" style={{ display: 'none' }} accept="image/*" multiple onChange={handleFileSelect} />
                                        <p style={{ color: '#64748b' }}>Click to add images</p>
                                    </FileUpload>
                                </InputGroup>
                                <Button onClick={editingBatch ? handleUpdateBatch : handleAddBatch} disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center' }}>
                                    {isSubmitting ? (editingBatch ? 'Updating...' : 'Adding...') : (editingBatch ? 'Update Batch' : 'Add Batch')}
                                </Button>
                            </ModalContent>
                        </Modal>
                    )}
                </AnimatePresence>

            </ContentWrapper>
        </PageContainer>
    );
};

export default AdminNccTeamsPage;
