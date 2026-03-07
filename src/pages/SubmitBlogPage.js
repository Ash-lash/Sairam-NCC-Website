import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Image as ImageIcon, User,
    Sparkles, CheckCircle2,
    ChevronLeft, Save,
    Plus
} from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFileToFirebaseStorage } from '../utils/firebaseStorage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  color: #1e293b;
  padding-bottom: 8rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  overflow-x: hidden;
`;

const DarkHeader = styled.div`
  background: linear-gradient(135deg, #0a1120 0%, #1a2b4c 100%);
  padding: 120px 2rem 100px;
  text-align: center;
  position: relative;
  overflow: hidden;
  color: white;

  .nav-back {
    position: absolute;
    top: 40px;
    left: 40px;
    z-index: 10;
  }
`;

const EditorGrid = styled.div`
  max-width: 1400px;
  margin: -60px auto 0;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 3rem;
  padding: 0 2rem;
  position: relative;
  z-index: 20;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    margin-top: 2rem;
  }
`;

const MainPane = styled(motion.div)`
  background: white;
  border-radius: 32px;
  padding: 3rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 20px 50px rgba(0,0,0,0.04);
`;

const SidePane = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const InputField = styled.div`
  margin-bottom: 2rem;
  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 800;
    color: #64748b;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  
  input, textarea, select {
    width: 100%;
    padding: 1.25rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    color: #0f172a;
    font-weight: 700;
    font-size: 1rem;
    outline: none;
    transition: all 0.2s;
    font-family: inherit;

    &:focus {
      background: white;
      border-color: #1a2b4c;
      box-shadow: 0 0 0 4px rgba(26,43,76,0.05);
    }
  }

  textarea {
    min-height: 400px;
    resize: vertical;
    line-height: 1.7;
    font-weight: 500;
  }
`;

const ImageUpload = styled.label`
  display: block;
  width: 100%;
  aspect-ratio: 21/9;
  background: #f8fafc;
  border: 2px dashed #e2e8f0;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  margin-bottom: 3rem;
  transition: all 0.3s;
  position: relative;

  &:hover {
    border-color: #1a2b4c;
    background: #f1f5f9;
  }

  .placeholder {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    color: #94a3b8;
    font-weight: 800;
  }

  img { width: 100%; height: 100%; object-fit: cover; }
`;

const SidebarCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
`;

const ActionButton = styled(motion.button)`
  width: 100%;
  padding: 1.2rem;
  border-radius: 20px;
  font-weight: 950;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  transition: all 0.3s;

  ${props => props.$primary ? `
    background: #1a2b4c;
    color: white;
    box-shadow: 0 10px 40px rgba(26,43,76,0.1);
    &:hover { background: #000; transform: translateY(-2px); }
  ` : `
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
    &:hover { color: #1a2b4c; border-color: #1a2b4c; }
  `}

  &:disabled { opacity: 0.5; cursor: wait; }
`;

const Particles = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particles = [];
        const createParticles = () => {
            particles = [];
            for (let i = 0; i < 100; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 0.5,
                    speed: Math.random() * 0.4 + 0.1,
                    opacity: Math.random() * 0.4 + 0.1,
                    drift: Math.random() * 0.5 - 0.25
                });
            }
        };
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                p.y += p.speed * 2;
                p.x += p.drift;
                if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
            });
            animationFrameId = requestAnimationFrame(draw);
        };
        const handleResize = () => {
            if (canvas.parentElement) {
                canvas.width = canvas.parentElement.offsetWidth;
                canvas.height = canvas.parentElement.offsetHeight;
                createParticles();
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        draw();
        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.6 }} />;
};

const SubmitBlogPage = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        authorName: user?.displayName || '',
        content: '',
        category: 'Experience',
        tags: '',
        image: null,
        authorPhoto: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const [authorPreview, setAuthorPreview] = useState(user?.photoURL || null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    // Sync author name if user becomes available
    useEffect(() => {
        if (user && !formData.authorName) {
            setFormData(prev => ({ ...prev, authorName: user.displayName || '' }));
            setAuthorPreview(user.photoURL || null);
        }
    }, [user]);

    if (loading) {
        return (
            <PageContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                <div className="skeleton-spinner" />
            </PageContainer>
        );
    }

    if (!user) {
        return (
            <PageContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
                    <div style={{ background: '#fef2f2', width: '100px', height: '100px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                        <User size={50} color="#ef4444" />
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: '#1a2b4c', marginBottom: '1rem' }}>Identity Required.</h1>
                    <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '3rem', lineHeight: 1.6 }}>
                        To maintain the integrity of our editorial board and ensure your legacy is properly attributed, you must be logged in to submit a story.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <ActionButton $primary onClick={() => navigate('/alumni-login')} style={{ width: 'auto', padding: '1rem 2rem' }}>Login to Continue</ActionButton>
                        <ActionButton onClick={() => navigate('/blog')} style={{ width: 'auto', padding: '1rem 2rem' }}>Return to Feed</ActionButton>
                    </div>
                </motion.div>
            </PageContainer>
        );
    }

    const handleFileChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, [field]: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                if (field === 'image') setImagePreview(reader.result);
                else setAuthorPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.content) return alert("Title and Content are required.");
        setSubmitting(true);
        try {
            // Parallel uploads for better performance
            const [imageUrl, authorPhotoUrl] = await Promise.all([
                formData.image ? uploadFileToFirebaseStorage(formData.image, 'blogs') : Promise.resolve(''),
                formData.authorPhoto ? uploadFileToFirebaseStorage(formData.authorPhoto, 'authors') : (user?.photoURL ? Promise.resolve(user.photoURL) : Promise.resolve(''))
            ]);

            const cleanFormData = { ...formData };
            delete cleanFormData.image;
            delete cleanFormData.authorPhoto;

            await addDoc(collection(db, 'blogs'), {
                ...cleanFormData,
                userId: user?.uid || 'guest',
                imageUrl,
                authorPhotoUrl,
                tags: formData.tags.split(',').map(t => t.trim()),
                status: 'pending',
                createdAt: new Date().toISOString(),
                views: 0,
                likes: 0,
                shares: 0,
                // These will be used for tracking interactions
                viewedIPs: [], // Optional: for simple tracking
                likedIPs: []   // Optional: for simple tracking
            });
            setSuccess(true);
        } catch (e) {
            console.error("Submission error details:", e);
            if (e.code === 'storage/unauthorized') {
                alert("Permission Denied (403): You don't have permission to upload images. Please check if you are logged in or contact an administrator.");
            } else {
                alert(`Failed to submit journal: ${e.message || "Please try again."}`);
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (success) return (
        <PageContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center' }}>
                <CheckCircle2 size={100} color="#FFBF00" strokeWidth={1} style={{ marginBottom: '2rem' }} />
                <h1 style={{ fontSize: '3.5rem', fontWeight: 950, color: '#1a2b4c' }}>Legacy Recorded.</h1>
                <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '3rem' }}>Your story is now in review with our editorial board.</p>
                <ActionButton $primary onClick={() => navigate('/blog')} style={{ width: 'auto', padding: '1rem 3rem', margin: '0 auto' }}><ChevronLeft size={18} /> Community Feed</ActionButton>
            </motion.div>
        </PageContainer>
    );

    return (
        <PageContainer>
            <SEO title="Editorial Draft | Sairam NCC" description="Draft your NCC journal entry." />

            <DarkHeader>
                <Particles />
                <div className="nav-back">
                    <ActionButton onClick={() => navigate('/blog')} style={{ width: 'auto', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }}>
                        <ChevronLeft size={20} /> Editorial Board
                    </ActionButton>
                </div>
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#FFBF00', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>
                    New Entry Journal
                </motion.span>
                <h1 style={{ fontSize: '5rem', fontWeight: 1000, margin: '1rem 0', letterSpacing: '-4px' }}>Share Your Story.</h1>
                <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '600px', margin: '0 auto', fontSize: '1.2rem', fontWeight: 500 }}>
                    Contribute to the voices of Sri Sairam Engineering College NCC.
                </p>
            </DarkHeader>

            <EditorGrid>
                <MainPane initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    <ImageUpload>
                        <input type="file" hidden accept="image/*" onChange={e => handleFileChange(e, 'image')} />
                        {imagePreview ? (
                            <img src={imagePreview} alt="Hero" />
                        ) : (
                            <div className="placeholder">
                                <ImageIcon size={48} strokeWidth={1} />
                                <div>Click to select capture or cover image</div>
                                <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Full resolution recommended</span>
                            </div>
                        )}
                    </ImageUpload>

                    <InputField>
                        <label>Journal Title</label>
                        <input
                            placeholder="Enter a compelling headline..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </InputField>

                    <InputField>
                        <label>Journal Narrative</label>
                        <textarea
                            placeholder="Write your story here... Your trials, triumphs, and transformations."
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                        />
                    </InputField>
                </MainPane>

                <SidePane>
                    <SidebarCard>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '2rem', color: '#1a2b4c' }}>Editorial Details</h4>

                        <InputField>
                            <label>Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="Experience">Experience</option>
                                <option value="Achievements">Achievements</option>
                                <option value="Training">Training</option>
                                <option value="Perspective">Perspective</option>
                            </select>
                        </InputField>

                        <InputField>
                            <label>Context Tags</label>
                            <input
                                placeholder="e.g. RDC, Drill, TSC..."
                                value={formData.tags}
                                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                            />
                        </InputField>
                    </SidebarCard>

                    <SidebarCard>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 950, marginBottom: '2rem', color: '#1a2b4c' }}>Contributor Identity</h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '1.5rem' }}>
                            <label style={{ cursor: 'pointer', position: 'relative' }}>
                                <input type="file" hidden accept="image/*" onChange={e => handleFileChange(e, 'authorPhoto')} />
                                {authorPreview ? (
                                    <img src={authorPreview} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '24px', objectFit: 'cover', border: '3px solid #f8fafc' }} />
                                ) : (
                                    <div style={{ width: 80, height: 80, borderRadius: '24px', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={32} color="#cbd5e1" />
                                    </div>
                                )}
                                <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#1a2b4c', color: 'white', borderRadius: '50%', p: '5px' }}>
                                    <Plus size={14} />
                                </div>
                            </label>
                            <div style={{ flex: 1 }}>
                                <input
                                    placeholder="Your Full Name"
                                    value={formData.authorName}
                                    onChange={e => setFormData({ ...formData, authorName: e.target.value })}
                                    style={{ width: '100%', background: 'transparent', border: 'none', color: '#0f172a', fontSize: '1.2rem', fontWeight: 900, outline: 'none' }}
                                />
                                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700 }}>Cadet / Alumni</div>
                            </div>
                        </div>
                    </SidebarCard>

                    <ActionButton
                        $primary
                        disabled={submitting}
                        onClick={handleSubmit}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Send size={20} /> {submitting ? 'Submitting...' : 'Record Legacy'}
                    </ActionButton>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', justifyContent: 'center' }}>
                        <Sparkles size={16} color="#FFBF00" /> Editorial board review follows submission.
                    </div>
                </SidePane>
            </EditorGrid>
        </PageContainer>
    );
};

export default SubmitBlogPage;
