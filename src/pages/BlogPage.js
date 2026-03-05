import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  Clock,
  Trophy,
  MessageSquare,
  Plus,
  ShieldAlert,
  ChevronRight,
  User,
  Sparkles,
  Share2, Bookmark, Heart,
  ArrowBigUp, ArrowBigDown,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import nccLogo from '../assets/ncc-logo.svg';
import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 8rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
  color: #1e293b;
  overflow-x: hidden;
`;

const ShutterOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: #1a2b4c;
  z-index: 10000;
  transform-origin: top;
`;

const HeroSection = styled.div`
  padding: 160px 2rem 120px;
  background: linear-gradient(135deg, #0a1120 0%, #1a2b4c 100%);
  text-align: center;
  position: relative;
  overflow: hidden;
  border-bottom: none;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(255,191,0,0.05) 0%, transparent 60%);
    pointer-events: none;
  }
`;



const BlogEntry = styled(motion.div)`
  background: white;
  border-radius: 32px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
  cursor: pointer;
  margin-bottom: 2.5rem;
  box-shadow: 0 4px 30px rgba(0,0,0,0.02);

  &:hover {
    transform: translateY(-12px) scale(1.005);
    box-shadow: 0 40px 80px rgba(0,0,0,0.06);
    border-color: #cbd5e1;
  }
`;

const EntryContent = styled.div`
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const EntryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .author-group {
    display: flex;
    align-items: center;
    gap: 12px;
    
    img {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      object-fit: cover;
      background: #f1f5f9;
    }
    
    .text {
      display: flex;
      flex-direction: column;
      .name { font-weight: 800; font-size: 0.95rem; color: #1e293b; }
      .date { font-size: 0.8rem; color: #94a3b8; font-weight: 600; }
    }
  }

  .category-pill {
    background: #f1f5f9;
    color: #475569;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 0.75rem;
    font-weight: 900;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
`;

const EntryBody = styled.div`
  h2 {
    font-size: 1.85rem;
    font-weight: 950;
    color: #0f172a;
    line-height: 1.25;
    margin-bottom: 1rem;
    letter-spacing: -1px;
    transition: color 0.3s;
  }

  .excerpt {
    font-size: 1.15rem;
    line-height: 1.7;
    color: #475569;
    font-weight: 500;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const EntryFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
  
  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-weight: 800;
    font-size: 0.9rem;
    transition: all 0.2s;
    
    &:hover { color: #1a2b4c; }
  }
`;


const MainContent = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 4rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
    max-width: 800px;
  }
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  position: sticky;
  top: 120px;
  height: fit-content;
`;

const SidebarCard = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
`;

const PrimaryAction = styled(motion.button)`
  background: #1a2b4c;
  color: white;
  width: 100%;
  padding: 1.2rem;
  border-radius: 18px;
  font-weight: 900;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(26,43,76,0.1);
  transition: all 0.3s;

  &:hover {
    background: #000;
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  }
`;

const FilterStrip = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 3.5rem;
  flex-wrap: wrap;
`;

const FilterButton = styled.button`
  padding: 0.8rem 1.8rem;
  border-radius: 100px;
  border: 1px solid ${props => props.$active ? '#1a2b4c' : '#e2e8f0'};
  background: ${props => props.$active ? '#1a2b4c' : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #1a2b4c;
    color: #1a2b4c;
  }
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
      for (let i = 0; i < 150; i++) { // Increase count
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1, // Larger dots
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.6 + 0.2, // Higher opacity
          drift: Math.random() * 1 - 0.5 // Add drift
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
        p.x += p.drift; // Add horizontal movement

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width) p.x = 0;
        if (p.x < 0) p.x = canvas.width;
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

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, opacity: 0.8 }} />;
};

const BlogPage = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [sortBy, setSortBy] = useState('New');
  const [isRevealing, setIsRevealing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const q = query(collection(db, 'blogs'), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBlogs(fetched);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const categories = ['All', 'Experience', 'Achievements', 'Training', 'Perspective'];

  const getFilteredBlogs = () => {
    let result = filter === 'All' ? [...blogs] : blogs.filter(b => b.category === filter);
    if (sortBy === 'New') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'Top') result.sort((a, b) => (b.views || 0) - (a.views || 0));
    else if (sortBy === 'Hot') result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return result;
  };

  const filteredBlogs = getFilteredBlogs();

  const handleEntryClick = (blogId) => {
    setIsRevealing(true);
    setTimeout(() => navigate(`/blog/${blogId}`), 800);
  };

  return (
    <PageContainer>
      <SEO title="Editorial | Sairam NCC" description="The official editorial board of Sri Sairam Engineering College NCC." />

      <AnimatePresence>
        {isRevealing && (
          <ShutterOverlay
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            exit={{ scaleY: 0 }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          />
        )}
      </AnimatePresence>

      <HeroSection>
        <Particles />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <motion.span style={{ background: 'rgba(255,191,0,0.15)', color: '#FFBF00', padding: '8px 20px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
            The Editorial Board
          </motion.span>
          <h1 style={{ fontSize: 'clamp(3.5rem, 10vw, 7.5rem)', fontWeight: 1000, color: '#ffffff', marginTop: '1.5rem', marginBottom: '1.5rem', letterSpacing: '-6px', lineHeight: 0.85 }}>
            Voices of <span style={{ color: '#FFBF00' }}>Valor.</span>
          </h1>
          <p style={{ maxWidth: '650px', margin: '0 auto', fontSize: '1.35rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500, lineHeight: 1.6 }}>
            Archive of stories, triumphs, and the eternal spirit of Sairam NCC.
          </p>

          <FilterStrip>
            {categories.map(cat => (
              <FilterButton key={cat} $active={filter === cat} onClick={() => setFilter(cat)}>{cat}</FilterButton>
            ))}
          </FilterStrip>
        </motion.div>
      </HeroSection>

      <MainContent style={{ marginTop: '5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            [1, 2, 3].map(i => <div key={i} style={{ height: '400px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '32px', marginBottom: '2rem' }} />)
          ) : (
            filteredBlogs.map((blog, idx) => (
              <BlogEntry
                key={blog.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.8, ease: "easeOut" }}
                onClick={() => handleEntryClick(blog.id)}
              >
                {blog.imageUrl && (
                  <div style={{ width: '100%', borderBottom: '1px solid #f1f5f9' }}>
                    <img src={blog.imageUrl} alt="Cover" style={{ width: '100%', height: 'auto', maxHeight: '500px', objectFit: 'cover', display: 'block' }} />
                  </div>
                )}
                <EntryContent>
                  <EntryHeader>
                    <div className="author-group">
                      <img src={blog.authorPhotoUrl || 'https://api.dicebear.com/7.x/initials/svg?seed=' + blog.authorName} alt="Author" />
                      <div className="text">
                        <div className="name">By {blog.authorName}</div>
                        <div className="date">{new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                      </div>
                    </div>
                    <span className="category-pill">{blog.category}</span>
                  </EntryHeader>

                  <EntryBody>
                    <h2>{blog.title}</h2>
                    <p className="excerpt">{blog.content}</p>
                  </EntryBody>

                  <EntryFooter>
                    <div className="stat"><TrendingUp size={18} /> Read by {blog.views || 0}</div>
                    <div className="stat" style={{ color: '#ef4444' }}>
                      <motion.div whileHover={{ scale: 1.2 }}>
                        <Heart size={18} fill={blog.likes > 0 ? "#ef4444" : "none"} />
                      </motion.div>
                      {blog.likes || 0} Likes
                    </div>
                    <div className="stat" style={{ marginLeft: 'auto' }} onClick={(e) => {
                      e.stopPropagation();
                      navigator.share({ title: blog.title, url: `${window.location.origin}/blog/${blog.id}` });
                    }}>
                      <Share2 size={18} />
                    </div>
                  </EntryFooter>
                </EntryContent>
              </BlogEntry>
            ))
          )}
        </div>

        <Sidebar>
          <PrimaryAction
            onClick={() => {
              setIsRevealing(true);
              setTimeout(() => navigate('/submit-blog'), 800);
            }}
          >
            <Plus size={24} /> Write Story
          </PrimaryAction>

          <SidebarCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '1.5rem' }}>
              <div style={{ background: '#FFBF0020', padding: '12px', borderRadius: '14px' }}>
                <ShieldAlert color="#1a2b4c" size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: '#1a2b4c' }}>Editorial Guide</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                "Preserve Institutional Honor",
                "Authentic Service Narrative",
                "High Quality Media Only"
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FFBF00' }} />
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>{text}</span>
                </div>
              ))}
            </div>
          </SidebarCard>

          <SidebarCard style={{ background: '#1a2b4c', color: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 950, marginBottom: '0.75rem' }}>Eternal Legacy</h3>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontWeight: 500 }}>
              The Sairam NCC archive is proof that character is built in the field. Your story is the blueprint for future cadets.
            </p>
          </SidebarCard>
        </Sidebar>
      </MainContent>
    </PageContainer>
  );
};

export default BlogPage;
