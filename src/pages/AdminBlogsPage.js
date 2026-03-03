import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, X, Eye, Clock, Trash2,
    Search, ShieldCheck, AlertCircle,
    ChevronRight, Calendar, User
} from 'lucide-react';
import { collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';

const AdminContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  background: #f8fafc;
  padding-bottom: 5rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const TitleSection = styled.div`
  margin-bottom: 3rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;

  @media (max-width: 768px) { flex-direction: column; align-items: flex-start; gap: 1rem; }

  h1 { font-size: 2.5rem; font-weight: 950; color: #1a2b4c; letter-spacing: -2px; margin: 0; }
  p { color: #64748b; font-size: 1.1rem; margin-top: 5px; }
`;

const TabGroup = styled.div`
  display: flex;
  gap: 1rem;
  background: white;
  padding: 0.5rem;
  border-radius: 100px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
`;

const TabButton = styled.button`
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 100px;
  background: ${props => props.$active ? '#1a2b4c' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover { color: ${props => props.$active ? 'white' : '#1a2b4c'}; }
`;

const BlogGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const BlogCard = styled(motion.div)`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  transition: all 0.3s ease;

  &:hover {
    transform: translateX(10px);
    border-color: #FFBF00;
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05);
  }

  @media (max-width: 900px) { flex-direction: column; align-items: flex-start; gap: 2rem; }
`;

const BlogMeta = styled.div`
  display: flex;
  gap: 2rem;
  flex: 1;

  .thumb {
    width: 120px;
    height: 120px;
    border-radius: 16px;
    object-fit: cover;
    background: #f1f5f9;
  }

  .info {
    h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0 0 10px; }
    .tags { display: flex; gap: 10px; margin-bottom: 12px; }
    .detail { display: flex; align-items: center; gap: 15px; color: #64748b; font-size: 0.85rem; }
  }

  @media (max-width: 600px) { flex-direction: column; .thumb { width: 100%; height: 200px; } }
`;

const Badge = styled.span`
  background: #f1f5f9;
  color: #475569;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const RoundButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: ${props => props.$color || '#64748b'};

  &:hover {
    background: ${props => props.$color || '#64748b'};
    color: white;
    border-color: ${props => props.$color || '#64748b'};
    transform: translateY(-3px);
  }
`;

const ModalOverlay = styled(motion.div)`
    position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000;
    display: flex; align-items: center; justify-content: center; padding: 2rem;
`;

const ModalContent = styled(motion.div)`
    background: white; width: 100%; max-width: 800px; max-height: 90vh;
    border-radius: 32px; overflow-y: auto; padding: 3rem; position: relative;
    font-family: 'Plus Jakarta Sans', sans-serif;
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
            const blogRef = doc(db, 'blogs', id);
            await updateDoc(blogRef, {
                status,
                approvedAt: status === 'approved' ? new Date().toISOString() : null
            });
            fetchBlogs();
            setSelectedBlog(null);
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Permanently delete this blog?")) return;
        try {
            await deleteDoc(doc(db, 'blogs', id));
            fetchBlogs();
        } catch (e) { console.error(e); }
    };

    const filteredBlogs = blogs.filter(b => b.status === activeTab);

    return (
        <AdminContainer>
            <SEO title="Blog Moderation" noindex={true} />
            <ContentWrapper>
                <TitleSection>
                    <div>
                        <h1>Editorial Control</h1>
                        <p>Moderating the voices of Sairam NCC.</p>
                    </div>
                    <TabGroup>
                        <TabButton $active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>
                            <Clock size={18} /> Pending ({blogs.filter(b => b.status === 'pending').length})
                        </TabButton>
                        <TabButton $active={activeTab === 'approved'} onClick={() => setActiveTab('approved')}>
                            <Check size={18} /> Published
                        </TabButton>
                        <TabButton $active={activeTab === 'declined'} onClick={() => setActiveTab('declined')}>
                            <X size={18} /> Declined
                        </TabButton>
                    </TabGroup>
                </TitleSection>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }} className="skeleton-spinner"></div>
                ) : (
                    <BlogGrid>
                        <AnimatePresence mode="popLayout">
                            {filteredBlogs.map((blog, idx) => (
                                <BlogCard
                                    key={blog.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.05 }}
                                >
                                    <BlogMeta>
                                        {blog.imageUrl && <img src={blog.imageUrl} className="thumb" alt="blog" />}
                                        <div className="info">
                                            <h3>{blog.title}</h3>
                                            <div className="tags">
                                                <Badge>{blog.category}</Badge>
                                                {blog.tags?.slice(0, 2).map((t, i) => (
                                                    <Badge key={i} style={{ background: '#FFBF0020', color: '#1a2b4c' }}>#{t}</Badge>
                                                ))}
                                            </div>
                                            <div className="detail">
                                                <span><User size={14} /> {blog.authorName}</span>
                                                <span><Calendar size={14} /> {new Date(blog.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </BlogMeta>

                                    <ActionGroup>
                                        <RoundButton onClick={() => setSelectedBlog(blog)} $color="#3b82f6" title="Preview">
                                            <Eye size={20} />
                                        </RoundButton>
                                        {activeTab === 'pending' && (
                                            <>
                                                <RoundButton onClick={() => handleStatusUpdate(blog.id, 'approved')} $color="#10b981" title="Approve">
                                                    <Check size={20} />
                                                </RoundButton>
                                                <RoundButton onClick={() => handleStatusUpdate(blog.id, 'declined')} $color="#ef4444" title="Decline">
                                                    <X size={20} />
                                                </RoundButton>
                                            </>
                                        )}
                                        {activeTab !== 'pending' && (
                                            <RoundButton onClick={() => handleDelete(blog.id)} $color="#ef4444" title="Delete">
                                                <Trash2 size={20} />
                                            </RoundButton>
                                        )}
                                    </ActionGroup>
                                </BlogCard>
                            ))}
                        </AnimatePresence>

                        {filteredBlogs.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '10rem 0', color: '#94a3b8' }}>
                                <AlertCircle size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <h3>Empty Queue</h3>
                                <p>No blogs match this criteria right now.</p>
                            </div>
                        )}
                    </BlogGrid>
                )}
            </ContentWrapper>

            {/* PREVIEW MODAL */}
            <AnimatePresence>
                {selectedBlog && (
                    <ModalOverlay
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <ModalContent
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                        >
                            <button
                                onClick={() => setSelectedBlog(null)}
                                style={{ position: 'absolute', top: 30, right: 30, border: 'none', background: '#f1f5f9', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                            {selectedBlog.imageUrl && (
                                <img src={selectedBlog.imageUrl} alt="preview" style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '20px', marginBottom: '2rem' }} />
                            )}
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem', color: '#1a2b4c' }}>{selectedBlog.title}</h2>
                            <div style={{ display: 'flex', gap: '20px', color: '#64748b', marginBottom: '2rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                                <span><User size={16} /> {selectedBlog.authorName}</span>
                                <span><Calendar size={16} /> {new Date(selectedBlog.createdAt).toLocaleDateString()}</span>
                                <span><ShieldCheck size={16} /> {selectedBlog.category}</span>
                            </div>
                            <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#334155', whiteSpace: 'pre-wrap' }}>
                                {selectedBlog.content}
                            </div>

                            {activeTab === 'pending' && (
                                <div style={{ display: 'flex', gap: '15px', marginTop: '3rem' }}>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedBlog.id, 'approved')}
                                        style={{ flex: 1, padding: '1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Approve & Publish
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedBlog.id, 'declined')}
                                        style={{ flex: 1, padding: '1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                                    >
                                        Decline
                                    </button>
                                </div>
                            )}
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </AdminContainer>
    );
};

export default AdminBlogsPage;
