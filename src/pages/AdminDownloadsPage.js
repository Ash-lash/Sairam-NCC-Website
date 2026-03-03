import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText, Plus, Trash2, X, Eye, FileUp,
    FolderOpen, Layers, Search, CheckCircle2,
    ChevronRight, ArrowLeft, Download, ShieldCheck
} from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';
import CounterLoader from '../components/common/CounterLoader';

// --- PREMIUM ADMIN STYLES ---

const AdminContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding-top: 80px;
`;

const Sidebar = styled(motion.div)`
  width: 400px;
  background: linear-gradient(180deg, #1a2b4c 0%, #0d1a33 100%);
  color: white;
  padding: 2.5rem;
  height: calc(100vh - 80px);
  position: sticky;
  top: 80px;
  overflow-y: auto;
  border-right: 4px solid #FFBF00;
  z-index: 10;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #d1202f 0%, #FFBF00 100%);
  }

  @media (max-width: 1024px) { width: 340px; padding: 1.5rem; }
  @media (max-width: 768px) { display: none; }
`;

const MainContent = styled.div`
  flex: 1;
  padding: 3rem;
  background: #fdfdfe;
  
  @media (max-width: 768px) { padding: 1.5rem; }
`;

const StudioHeader = styled.div`
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 15px;

  .icon-box {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #FFBF00, #d1202f);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(255, 191, 0, 0.3);
  }

  h2 { margin: 0; font-size: 1.25rem; font-weight: 800; letter-spacing: -0.5px; }
`;

const SidebarCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  backdrop-filter: blur(10px);
`;

const FormTitle = styled.h3`
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #94a3b8;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  label {
    display: block;
    font-size: 0.8rem;
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
  
  &:focus { outline: none; border-color: #FFBF00; background: rgba(0,0,0,0.4); }
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
  cursor: pointer;
  appearance: none;
  
  option { background: #1e293b; color: white; }
`;

const UploadZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  border: 2px dashed rgba(255,191,0,0.3);
  border-radius: 16px;
  cursor: pointer;
  background: rgba(255,191,0,0.02);
  text-align: center;
  transition: all 0.2s;

  &:hover { background: rgba(255,191,0,0.05); border-color: #FFBF00; }
  p { margin: 8px 0 0; font-size: 0.85rem; color: #cbd5e1; }
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 16px;
  background: #FFBF00;
  color: #1a2b4c;
  border: none;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(255, 191, 0, 0.2);
  
  &:disabled { opacity: 0.5; cursor: wait; }
`;

const DocCard = styled(motion.div)`
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(10px);
    border-color: #FFBF00;
    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
  }
`;

const DocInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  .icon {
    width: 48px;
    height: 48px;
    background: #f8fafc;
    color: #1a2b4c;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e2e8f0;
  }

  .text {
    h4 { margin: 0; font-size: 1.1rem; color: #1e293b; font-weight: 700; }
    p { margin: 4px 0 0; font-size: 0.85rem; color: #64748b; display: flex; align-items: center; gap: 8px; }
  }
`;

const CategoryBadge = styled.span`
  background: ${props => props.$cat === 'NCC Enrollment' ? '#eff6ff' : '#fff7ed'};
  color: ${props => props.$cat === 'NCC Enrollment' ? '#3b82f6' : '#f59e0b'};
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const AdminDownloadsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        category: 'NCC Enrollment',
        folderName: '',
        file: null
    });

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) navigate('/admin-login');
        fetchDocuments();
    }, [user]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'downloads'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Extract unique folders for the current category
    const existingFolders = useMemo(() => {
        const folders = documents
            .filter(doc => doc.category === formData.category)
            .map(doc => doc.folderName)
            .filter(Boolean);
        return Array.from(new Set(folders)).sort();
    }, [documents, formData.category]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.file || !formData.title) return alert("Title and File are mandatory.");

        setUploading(true);
        try {
            const fileRef = ref(storage, `downloads/${Date.now()}_${formData.file.name}`);
            await uploadBytes(fileRef, formData.file);
            const url = await getDownloadURL(fileRef);

            await addDoc(collection(db, 'downloads'), {
                title: formData.title,
                category: formData.category,
                folderName: formData.folderName.trim() || 'General Resources',
                fileUrl: url,
                createdAt: new Date().toISOString(),
                size: (formData.file.size / 1024 / 1024).toFixed(2) + ' MB'
            });

            setFormData({ title: '', category: 'NCC Enrollment', folderName: '', file: null });
            fetchDocuments();
        } catch (error) {
            console.error(error);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Remove this document permanently?")) return;
        try {
            await deleteDoc(doc(db, 'downloads', id));
            fetchDocuments();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <SEO title="Digital Desk | Admin Downloads" />
            <CounterLoader isLoading={uploading} label="Broadcasting Document..." />

            <AdminContainer>
                <Sidebar initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                    <StudioHeader>
                        <div className="icon-box"><FileText color="white" size={24} /></div>
                        <div>
                            <h2>Digital Desk</h2>
                            <div style={{ fontSize: '0.7rem', color: '#FFBF00', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Resources Admin</div>
                        </div>
                    </StudioHeader>

                    <SidebarCard>
                        <FormTitle><Plus size={16} /> Add New Resource</FormTitle>
                        <form onSubmit={handleSubmit}>
                            <InputGroup>
                                <label>Document Title</label>
                                <DarkInput
                                    placeholder="e.g. Enrollment Form 2024"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </InputGroup>

                            <InputGroup>
                                <label>Primary Group</label>
                                <DarkSelect
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value, folderName: '' })}
                                >
                                    <option value="NCC Enrollment">NCC Enrollment</option>
                                    <option value="Camp Documents">Camp Documents</option>
                                    <option value="Parade Schedule">Parade Schedule</option>
                                    <option value="Syllabus">Syllabus</option>
                                    <option value="Study Materials">Study Materials</option>
                                </DarkSelect>
                            </InputGroup>

                            <InputGroup>
                                <label>Folder Name</label>
                                <DarkInput
                                    list="folder-options"
                                    placeholder="Select or type new folder..."
                                    value={formData.folderName}
                                    onChange={e => setFormData({ ...formData, folderName: e.target.value })}
                                />
                                <datalist id="folder-options">
                                    {existingFolders.map(folder => (
                                        <option key={folder} value={folder} />
                                    ))}
                                </datalist>
                                <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '5px', display: 'block' }}>
                                    {existingFolders.length > 0 ? "Type to add a new folder or select from list" : "Type to create first folder"}
                                </span>
                            </InputGroup>

                            <InputGroup>
                                <label>File Upload (PDF/DOC)</label>
                                <UploadZone>
                                    {formData.file ? (
                                        <div style={{ color: '#FFBF00' }}>
                                            <CheckCircle2 size={32} />
                                            <p>{formData.file.name}</p>
                                        </div>
                                    ) : (
                                        <>
                                            <FileUp color="rgba(255,191,0,0.5)" size={32} />
                                            <p>Click to browse files</p>
                                        </>
                                    )}
                                    <input type="file" hidden accept=".pdf,.doc,.docx" onChange={e => setFormData({ ...formData, file: e.target.files[0] })} />
                                </UploadZone>
                            </InputGroup>

                            <ActionButton disabled={uploading}>
                                <Plus size={20} /> Save Document
                            </ActionButton>
                        </form>
                    </SidebarCard>
                </Sidebar>

                <MainContent>
                    <div style={{ marginBottom: '3rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1a2b4c', letterSpacing: '-1.5px' }}>File Repository</h1>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Manage all downloadable content and student resources.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {loading ? (
                            <div style={{ padding: '5rem', textAlign: 'center' }}>
                                <div className="skeleton-spinner" style={{ margin: '0 auto' }} />
                            </div>
                        ) : (
                            <div>
                                {documents.map((doc, i) => (
                                    <DocCard
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <DocInfo>
                                            <div className="icon"><FileText size={22} /></div>
                                            <div className="text">
                                                <h4>{doc.title}</h4>
                                                <p>
                                                    <FolderOpen size={14} /> {doc.folderName}
                                                    <CategoryBadge $cat={doc.category}>{doc.category}</CategoryBadge>
                                                    <span style={{ color: '#94a3b8' }}>• {doc.size}</span>
                                                </p>
                                            </div>
                                        </DocInfo>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ width: 40, height: 40, background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                <Eye size={18} />
                                            </a>
                                            <button onClick={() => handleDelete(doc.id)} style={{ width: 40, height: 40, background: '#fff1f2', borderRadius: '10px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </DocCard>
                                ))}
                                {documents.length === 0 && (
                                    <div style={{ padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                        <ShieldCheck size={48} color="#cbd5e1" />
                                        <h3 style={{ color: '#94a3b8', marginTop: '1rem' }}>Repository is currently empty</h3>
                                    </div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </MainContent>
            </AdminContainer>
        </>
    );
};

export default AdminDownloadsPage;
