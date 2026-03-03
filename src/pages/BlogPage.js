import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Calendar, User, Clock,
    ArrowRight, PenTool, Sparkles, Filter,
    ArrowUpRight, TrendingUp
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  background: #f8fafc;
  padding-bottom: 5rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const HeroSection = styled.div`
  background: linear-gradient(135deg, #1a2b4c 0%, #0a1120 100%);
  color: white;
  padding: 6rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  border-radius: 0 0 60px 60px;
  margin-bottom: 4rem;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 20% 30%, rgba(255, 191, 0, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 1;
`;

const FeaturedRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 5rem;
  @media (max-width: 1024px) { grid-template-columns: 1fr; }
`;

const FeaturedCard = styled(motion.div)`
  background: white;
  border-radius: 32px;
  overflow: hidden;
  box-shadow: 0 25px 60px -15px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  
  .img-box {
    height: 350px;
    overflow: hidden;
    img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
  }

  .content { padding: 2.5rem; flex: 1; }

  &:hover {
    .img-box img { transform: scale(1.05); }
  }
`;

const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 2.5rem;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`;

const BlogCard = styled(motion(Link))`
  background: white;
  border-radius: 24px;
  overflow: hidden;
  text-decoration: none;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  .img-box {
    height: 240px;
    position: relative;
    overflow: hidden;
    img { width: 100%; height: 100%; object-fit: cover; transition: 0.6s ease; }
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
    }
  }

  .info { padding: 1.5rem; }
  
  &:hover {
    transform: translateY(-10px);
    box-shadow: 0 30px 50px -10px rgba(0,0,0,0.1);
    border-color: #FFBF00;
    .img-box img { transform: scale(1.1); }
  }
`;

const Badge = styled.span`
  background: ${props => props.$bg || '#FFBF0020'};
  color: ${props => props.$color || '#1a2b4c'};
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 12px;
  display: inline-block;
`;

const WriteButton = styled(motion.button)`
  background: #FFBF00;
  color: #1a2b4c;
  padding: 1rem 2rem;
  border-radius: 100px;
  text-decoration: none;
  font-weight: 800;
  border: none;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 20px rgba(255, 191, 0, 0.3);
  transition: 0.3s;
  cursor: pointer;
  
  &:hover { transform: translateY(-2px); box-shadow: 0 15px 30px rgba(255, 191, 0, 0.4); }
`;

const ExplodingPortal = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #FFBF00;
  border-radius: 50%;
  z-index: 20000;
  pointer-events: none;
`;

const SnowEffect = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        let cw = canvas.width = window.innerWidth;
        let ch = canvas.height = canvas.parentElement.offsetHeight;
        let arr = [];
        const numFlakes = 100;

        for (let i = 0; i < numFlakes; i++) {
            arr.push({ i, x: 0, x2: 0, y: 0, s: 0, opacity: Math.random() * 0.5 + 0.3 });
            arr[i].t = gsap
                .timeline({ repeat: -1, repeatRefresh: true, delay: gsap.utils.random(0, 5) })
                .fromTo(
                    arr[i],
                    {
                        x: () => -400 + (cw + 800) * Math.random(),
                        y: -15,
                        s: () => gsap.utils.random(1.8, 7, 0.1),
                        x2: -500,
                    },
                    {
                        duration: () => gsap.utils.random(3, 8),
                        ease: 'none',
                        y: () => ch + 20,
                        x: '+=random(-400, 400, 1)',
                        x2: 500,
                    }
                );
        }

        const render = () => {
            ctx.clearRect(0, 0, cw, ch);
            ctx.fillStyle = 'rgba(255, 255, 255, 1)';
            for (let i = 0; i < numFlakes; i++) {
                const p = arr[i];
                ctx.globalAlpha = p.opacity;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        gsap.ticker.add(render);

        const resize = () => {
            cw = canvas.width = window.innerWidth;
            if (canvas.parentElement) {
                ch = canvas.height = canvas.parentElement.offsetHeight;
            }
        };
        window.addEventListener('resize', resize);

        // initial adjustment
        setTimeout(resize, 100);

        return () => {
            gsap.ticker.remove(render);
            arr.forEach(p => p.t.kill());
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0
            }}
        />
    );
};

const BlogPage = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [isRevealing, setIsRevealing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        try {
            const q = query(
                collection(db, 'blogs'),
                where('status', '==', 'approved'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleShareClick = () => {
        setIsRevealing(true);
        setTimeout(() => {
            navigate('/submit-blog');
        }, 800);
    };

    const categories = ['All', 'Experience', 'Achievements', 'Training', 'Perspective'];
    const filteredBlogs = filter === 'All' ? blogs : blogs.filter(b => b.category === filter);

    return (
        <PageContainer>
            <SEO
                title="Cadet Blogs"
                description="Read stories, experiences, and perspectives from the cadets and alumni of Sairam NCC."
                keywords="NCC Blog, Cadet Stories, Sairam NCC Experiences, Leadership Blogs"
            />

            <AnimatePresence>
                {isRevealing && (
                    <ExplodingPortal
                        initial={{ scale: 0, opacity: 1 }}
                        animate={{ scale: 500, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                    />
                )}
            </AnimatePresence>

            <HeroSection id="hero-section">
                <SnowEffect />
                <ContentWrapper>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Badge $bg="rgba(255,255,255,0.1)" $color="white">Insights & Narratives</Badge>
                        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', fontWeight: 950, letterSpacing: '-3px', margin: '1rem 0' }}>
                            Voices of Valor
                        </h1>
                        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 3rem' }}>
                            A collection of training logs, camp experiences, and leadership lessons direct from our cadets.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <WriteButton onClick={handleShareClick} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <PenTool size={20} /> Share Your Story
                            </WriteButton>
                        </div>
                    </motion.div>
                </ContentWrapper>
            </HeroSection>

            <ContentWrapper>
                {/* CATEGORY FILTER */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '4rem', flexWrap: 'wrap' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            style={{
                                padding: '0.8rem 1.8rem',
                                borderRadius: '100px',
                                border: '1px solid #e2e8f0',
                                background: filter === cat ? '#1a2b4c' : 'white',
                                color: filter === cat ? 'white' : '#64748b',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: '0.3s'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '5rem' }} className="skeleton-spinner"></div>
                ) : (
                    <>
                        {blogs.length > 0 && filter === 'All' && (
                            <FeaturedRow>
                                <FeaturedCard
                                    as="div"
                                    onClick={() => {
                                        setIsRevealing(true);
                                        setTimeout(() => navigate(`/blog/${blogs[0].id}`), 800);
                                    }}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="img-box">
                                        <img src={blogs[0].imageUrl || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=1500'} alt="featured" />
                                    </div>
                                    <div className="content">
                                        <Badge>Featured Post</Badge>
                                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a2b4c', margin: '1rem 0' }}>{blogs[0].title}</h2>
                                        <p style={{ color: '#64748b', lineHeight: '1.8' }}>
                                            {blogs[0].content.substring(0, 180)}...
                                        </p>
                                        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '20px', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><User size={16} />{blogs[0].authorName}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={16} />{new Date(blogs[0].createdAt).toLocaleDateString()}</span>
                                            <ArrowUpRight style={{ marginLeft: 'auto', color: '#FFBF00' }} />
                                        </div>
                                    </div>
                                </FeaturedCard>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div style={{ background: 'white', padding: '2rem', borderRadius: '32px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '20px' }}>
                                        <TrendingUp color="#FFBF00" />
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Impact Metrics</h3>
                                        <span style={{ color: '#94a3b8', marginLeft: 'auto' }}>{blogs.length} Stories Shared</span>
                                    </div>
                                    {blogs.slice(1, 3).map(b => (
                                        <BlogCard
                                            key={b.id}
                                            to="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setIsRevealing(true);
                                                setTimeout(() => navigate(`/blog/${b.id}`), 800);
                                            }}
                                            style={{ display: 'flex', height: '160px' }}
                                        >
                                            <div style={{ width: '160px', flexShrink: 0 }}>
                                                <img src={b.imageUrl} alt="blog" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                <h4 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 800, color: '#1a2b4c' }}>{b.title}</h4>
                                                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>By {b.authorName}</span>
                                            </div>
                                        </BlogCard>
                                    ))}
                                </div>
                            </FeaturedRow>
                        )}

                        <BlogGrid>
                            <AnimatePresence>
                                {filteredBlogs.map((blog, index) => (
                                    <BlogCard
                                        key={blog.id}
                                        to="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setIsRevealing(true);
                                            setTimeout(() => navigate(`/blog/${blog.id}`), 800);
                                        }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="img-box">
                                            <img src={blog.imageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=800'} alt="blog" />
                                        </div>
                                        <div className="info">
                                            <Badge>{blog.category}</Badge>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a2b4c', margin: '0.5rem 0' }}>{blog.title}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1rem' }}>
                                                <span>{blog.authorName}</span>
                                                <span>• {new Date(blog.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </BlogCard>
                                ))}
                            </AnimatePresence>
                        </BlogGrid>

                        {filteredBlogs.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>
                                <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No stories found in this section yet.</p>
                            </div>
                        )}
                    </>
                )}
            </ContentWrapper>
        </PageContainer>
    );
};

export default BlogPage;
