import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, Eye, Trash2,
    Search, ShieldCheck,
    Calendar, User, ExternalLink, Download
} from 'lucide-react';
import { downloadImage } from '../utils/downloadHelper';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';

const AdminContainer = styled.div`
  min-height: 100vh;
  background: #f0f2f5;
  color: #1a2b4c;
  padding-top: 120px;
  padding-bottom: 80px;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const DashboardWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 4rem;
  
  @media (max-width: 1024px) { grid-template-columns: 1fr 1fr; }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const StatCard = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  
  .label { color: #64748b; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem; }
  .value { font-size: 1.75rem; font-weight: 800; color: #1a2b4c; }
`;

const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  background: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);

  @media (max-width: 768px) { flex-direction: column; gap: 1.5rem; }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 6px;
`;

const FilterTab = styled.button`
  padding: 0.8rem 1.8rem;
  border-radius: 12px;
  border: none;
  background: ${props => props.$active ? '#1a2b4c' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-weight: 800;
  cursor: pointer;
  transition: 0.3s;
  font-size: 0.9rem;

  &:hover { background: ${props => props.$active ? '#1a2b4c' : '#f1f5f9'}; }
`;

const SubmissionTable = styled.div`
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const TableRow = styled(motion.div)`
  display: grid;
  grid-template-columns: 100px 1fr 200px 150px 200px;
  padding: 1.5rem 2.5rem;
  border-bottom: 1px solid #f1f5f9;
  align-items: center;
  transition: 0.3s;

  &:hover { background: #f8fafc; }

  @media (max-width: 1024px) { grid-template-columns: 1fr 1fr; gap: 1.5rem; }
`;

const ActionBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: ${props => props.$bg || 'white'};
  color: ${props => props.$color || '#1a2b4c'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;

  &:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
`;

const AdminBlogsPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedBlog, setSelectedBlog] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) navigate('/admin-login');
        fetchBlogs();
    }, [user]);

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await updateDoc(doc(db, 'blogs', id), {
                status,
                approvedAt: status === 'approved' ? new Date().toISOString() : null
            });
            fetchBlogs();
            setSelectedBlog(null);
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this entry?")) return;
        try {
            await deleteDoc(doc(db, 'blogs', id));
            fetchBlogs();
        } catch (e) { console.error(e); }
    };

    const filtered = blogs.filter(b => b.status === activeTab);

    return (
        <AdminContainer>
            <SEO title="Journal Moderation | Admin" noindex={true} />
            <DashboardWrapper>
                <div style={{ marginBottom: '4rem' }}>
                    <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-2px', color: '#1a2b4c' }}>Journal Moderation.</h1>
                    <p style={{ fontSize: '1.2rem', color: '#64748b', fontWeight: 600 }}>Curating the collective memory of Sairam NCC.</p>
                </div>

                <StatsGrid>
                    <StatCard>
                        <div className="label">Total Stories</div>
                        <div className="value">{blogs.length}</div>
                    </StatCard>
                    <StatCard>
                        <div className="label">Pending Review</div>
                        <div className="value" style={{ color: '#FFBF00' }}>{blogs.filter(b => b.status === 'pending').length}</div>
                    </StatCard>
                    <StatCard>
                        <div className="label">Cumulative Views</div>
                        <div className="value">{blogs.reduce((acc, b) => acc + (b.views || 0), 0)}</div>
                    </StatCard>
                    <StatCard>
                        <div className="label">Approved Posts</div>
                        <div className="value">{blogs.filter(b => b.status === 'approved').length}</div>
                    </StatCard>
                </StatsGrid>

                <ControlsBar>
                    <FilterGroup>
                        <FilterTab $active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>Inbox ({blogs.filter(b => b.status === 'pending').length})</FilterTab>
                        <FilterTab $active={activeTab === 'approved'} onClick={() => setActiveTab('approved')}>Published</FilterTab>
                        <FilterTab $active={activeTab === 'declined'} onClick={() => setActiveTab('declined')}>Archive</FilterTab>
                    </FilterGroup>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            placeholder="Search journals..."
                            style={{ padding: '0.8rem 1rem 0.8rem 3rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', color: '#1a2b4c', width: '300px', fontWeight: 600 }}
                        />
                    </div>
                </ControlsBar>

                <SubmissionTable>
                    {loading ? (
                        <div style={{ padding: '5rem', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>Fetching records...</div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map((blog, idx) => (
                                <TableRow key={blog.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                    <div style={{ width: 70, height: 70, borderRadius: '16px', overflow: 'hidden', background: '#f1f5f9' }}>
                                        <img src={blog.imageUrl} alt="post" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1a2b4c', marginBottom: '4px' }}>{blog.title}</div>
                                        <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>{blog.authorName} • {blog.category}</div>
                                    </div>
                                    <div style={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                        <Calendar size={14} style={{ marginRight: 8 }} />
                                        {new Date(blog.createdAt).toLocaleDateString()}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', color: '#1a2b4c', fontWeight: 900, fontSize: '0.9rem' }}>
                                        <Eye size={16} color="#FFBF00" /> {blog.views || 0}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        {blog.imageUrl && (
                                            <ActionBtn onClick={() => downloadImage(blog.imageUrl, `blog_${blog.title}`)} title="Download Cover"><Download size={18} /></ActionBtn>
                                        )}
                                        <ActionBtn onClick={() => setSelectedBlog(blog)} title="View Detail"><ExternalLink size={18} /></ActionBtn>
                                        {activeTab === 'pending' && (
                                            <>
                                                <ActionBtn $bg="#10b98115" $color="#10b981" onClick={() => handleStatusUpdate(blog.id, 'approved')} title="Publish"><Check size={20} /></ActionBtn>
                                                <ActionBtn $bg="#ef444415" $color="#ef4444" onClick={() => handleStatusUpdate(blog.id, 'declined')} title="Decline"><X size={20} /></ActionBtn>
                                            </>
                                        )}
                                        {activeTab !== 'pending' && (
                                            <ActionBtn $bg="#ef444415" $color="#ef4444" onClick={() => handleDelete(blog.id)} title="Delete"><Trash2 size={18} /></ActionBtn>
                                        )}
                                    </div>
                                </TableRow>
                            ))}
                        </AnimatePresence>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div style={{ padding: '8rem', textAlign: 'center', color: '#94a3b8' }}>
                            <ShieldCheck size={48} strokeWidth={1} style={{ marginBottom: '1.5rem', opacity: 0.3 }} />
                            <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>Inbox is empty. All journals processed.</p>
                        </div>
                    )}
                </SubmissionTable>
            </DashboardWrapper>

            {/* PREVIEW MODAL */}
            <AnimatePresence mode="wait">
                {selectedBlog && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(10,17,32,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} style={{ background: 'white', width: '100%', maxWidth: '900px', maxHeight: '90vh', borderRadius: '16px', overflowY: 'auto', padding: '2.5rem', border: '1px solid #e2e8f0', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.2)' }}>
                            <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: '8px' }}>
                                {selectedBlog.imageUrl && (
                                    <ActionBtn onClick={() => downloadImage(selectedBlog.imageUrl, `blog_${selectedBlog.title}`)} title="Download Cover" style={{ borderRadius: '50%' }}><Download size={20} /></ActionBtn>
                                )}
                                <ActionBtn onClick={() => setSelectedBlog(null)} style={{ borderRadius: '50%' }}><X size={20} /></ActionBtn>
                            </div>
                            <img src={selectedBlog.imageUrl} alt="Cover" style={{ width: '100%', height: '350px', objectFit: 'cover', borderRadius: '8px', marginBottom: '2rem' }} />
                            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '1rem', color: '#1a2b4c' }}>{selectedBlog.title}</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', color: '#64748b', fontWeight: 700, marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem', fontSize: '0.9rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} color="#FFBF00" /> {selectedBlog.authorName}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} color="#FFBF00" /> {new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} color="#FFBF00" /> {selectedBlog.category}</span>
                            </div>
                            <div style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#475569', whiteSpace: 'pre-wrap' }}>{selectedBlog.content}</div>

                            {activeTab === 'pending' && (
                                <div style={{ marginTop: '3.5rem', display: 'flex', gap: '1rem' }}>
                                    <button style={{ flex: 1, height: '54px', background: '#1a2b4c', color: 'white', fontWeight: 800, borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem' }} onClick={() => handleStatusUpdate(selectedBlog.id, 'approved')}>Approve Post</button>
                                    <button style={{ flex: 1, height: '54px', background: '#fef2f2', color: '#ef4444', fontWeight: 700, borderRadius: '8px', border: '1px solid #fee2e2', cursor: 'pointer', fontSize: '1rem' }} onClick={() => handleStatusUpdate(selectedBlog.id, 'declined')}>Decline Submission</button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AdminContainer>
    );
};

export default AdminBlogsPage;
