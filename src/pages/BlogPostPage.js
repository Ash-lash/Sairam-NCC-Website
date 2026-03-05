import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, User, Clock, ChevronLeft,
  Share2, MessageSquare, Heart, Bookmark,
  ArrowRight, Tag, BookOpen, Quote, Eye
} from 'lucide-react';
import { collection, getDoc, doc, query, where, limit, getDocs, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserIp } from '../utils/deviceInfo';
import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f0f2f5;
  padding-bottom: 8rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const ArticleHero = styled.div`
  height: 60vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  background: #1a2b4c;
  display: flex;
  align-items: center;
  justify-content: center;

  .bg-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.4;
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(26,43,76,0.2) 0%, rgba(26,43,76,0.8) 100%);
  }
`;

const HeroContent = styled(ContentWrapper)`
  position: relative;
  z-index: 10;
  color: white;
  text-align: center;

  .category {
    background: #FFBF00;
    color: #1a2b4c;
    padding: 8px 20px;
    border-radius: 100px;
    font-weight: 900;
    text-transform: uppercase;
    font-size: 0.85rem;
    letter-spacing: 2px;
    margin-bottom: 2rem;
    display: inline-block;
  }

  h1 {
    font-size: clamp(2.5rem, 6vw, 4.5rem);
    font-weight: 950;
    line-height: 1.1;
    letter-spacing: -3px;
    max-width: 900px;
    margin: 0 auto;
  }
`;

const ReadingArea = styled.div`
  max-width: 800px;
  margin: -80px auto 0;
  background: white;
  position: relative;
  z-index: 20;
  padding: 0;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;

  @media (max-width: 768px) {
    margin-top: -40px;
    width: 95%;
  }
`;

const ArticleContent = styled.div`
  padding: 3rem 4rem;
  
  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 1.5rem;
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    background: #f1f5f9;
  }

  .info {
    font-size: 0.85rem;
    .unit { font-weight: 800; color: #1a2b4c; margin-right: 6px; }
    .author { color: #64748b; margin-right: 6px; }
    .time { color: #94a3b8; }
  }
`;

const InteractionBar = styled.div`
  display: flex;
  gap: 8px;
  padding: 1rem 1.25rem;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
`;

const InteractionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e2e8f0;
    color: #1a2b4c;
  }

  svg { width: 18px; height: 18px; }
`;

const RichText = styled.div`
  font-size: 1.15rem;
  line-height: 1.8;
  color: #1f2937;
  white-space: pre-wrap;

  p { margin-bottom: 1.5rem; }
  
  blockquote {
    margin: 2.5rem 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: #1a2b4c;
    font-style: italic;
    line-height: 1.4;
    padding-left: 2rem;
    border-left: 5px solid #FFBF00;
  }
`;

const SidebarNav = styled.div`
  position: fixed;
  left: 4rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;

  @media (max-width: 1400px) { display: none; }
`;

const NavIcon = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);

  &:hover {
    border-color: #cbd5e1;
    color: #1a2b4c;
    transform: scale(1.1);
  }
`;

const BlogPostPage = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [userIp, setUserIp] = useState('');
  const [hasLiked, setHasLiked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const blogRef = doc(db, 'blogs', id);
        const snap = await getDoc(blogRef);
        if (snap.exists()) {
          const data = snap.data();
          setBlog({ id: snap.id, ...data });

          // Handle Unique View
          const ip = await getUserIp();
          setUserIp(ip);

          const interactionId = `${id}_${ip.replace(/\./g, '_')}`;
          const interactionRef = doc(db, 'blog_interactions', interactionId);
          const interactionSnap = await getDoc(interactionRef);

          if (!interactionSnap.exists() || !interactionSnap.data().viewed) {
            await updateDoc(blogRef, { views: increment(1) });
            await setDoc(interactionRef, { viewed: true, blogId: id, ip }, { merge: true });
            setBlog(prev => prev ? { ...prev, views: (prev.views || 0) + 1 } : null);
          }

          if (interactionSnap.exists() && interactionSnap.data().liked) {
            setHasLiked(true);
          }

          const q = query(
            collection(db, 'blogs'),
            where('category', '==', data.category),
            where('status', '==', 'approved'),
            limit(4)
          );
          const relSnap = await getDocs(q);
          setRelated(relSnap.docs.filter(d => d.id !== id).map(d => ({ id: d.id, ...d.data() })));
        } else navigate('/blog');
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchContent();
    window.scrollTo(0, 0);
  }, [id]);

  const handleLike = async () => {
    if (hasLiked || !blog) return;
    try {
      const interactionId = `${id}_${userIp.replace(/\./g, '_')}`;
      const interactionRef = doc(db, 'blog_interactions', interactionId);

      await updateDoc(doc(db, 'blogs', id), { likes: increment(1) });
      await setDoc(interactionRef, { liked: true, blogId: id, ip: userIp }, { merge: true });

      setBlog({ ...blog, likes: (blog.likes || 0) + 1 });
      setHasLiked(true);
    } catch (e) {
      console.error("Like failed:", e);
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} style={{ width: 40, height: 40, border: '4px solid #f1f5f9', borderTopColor: '#FFBF00', borderRadius: '50%' }} />
    </div>
  );

  return (
    <PageContainer>
      <SEO title={blog.title} description={blog.content.substring(0, 160)} image={blog.imageUrl} />

      <SidebarNav>
        <NavIcon onClick={() => navigate('/blog')} title="Back to Feed"><ChevronLeft size={22} /></NavIcon>
        <NavIcon
          onClick={handleLike}
          style={{ color: hasLiked ? '#ef4444' : '#64748b' }}
          title={hasLiked ? "Post Liked" : "Like Post"}
        >
          <Heart size={22} fill={hasLiked ? "#ef4444" : "none"} />
        </NavIcon>
        <NavIcon onClick={() => {
          navigator.share({ title: blog.title, url: window.location.href });
        }} title="Share"><Share2 size={22} /></NavIcon>
      </SidebarNav>

      <ArticleHero>
        {blog.imageUrl && <img src={blog.imageUrl} className="bg-img" alt="Hero" />}
        <div className="overlay" />
        <HeroContent>
          <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="category">{blog.category}</motion.span>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>{blog.title}</motion.h1>
        </HeroContent>
      </ArticleHero>

      <ReadingArea>
        <ArticleContent>
          <PostMeta>
            {blog.authorPhotoUrl ? (
              <img src={blog.authorPhotoUrl} className="avatar" alt="Author" />
            ) : (
              <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#94a3b8" />
              </div>
            )}
            <div className="info">
              <span className="unit">{blog.category}</span>
              <span className="author">• Posted by {blog.authorName}</span>
              <span className="time">{new Date(blog.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Eye size={14} /> Read by {blog.views || 0}
            </div>
          </PostMeta>

          <RichText>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '1.5rem', color: '#1a2b4c' }}>{blog.title}</h2>
            {blog.content}
          </RichText>

          <div style={{ marginTop: '3rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {blog.tags?.map(t => (
              <span key={t} style={{ padding: '6px 14px', borderRadius: '4px', background: '#f1f5f9', fontWeight: 800, color: '#64748b', fontSize: '0.75rem' }}>#{t}</span>
            ))}
          </div>
        </ArticleContent>

        <InteractionBar>
          <InteractionButton onClick={handleLike} style={{ color: hasLiked ? '#ef4444' : '#64748b' }}>
            <Heart size={18} fill={hasLiked ? "#ef4444" : "none"} color={hasLiked ? "#ef4444" : "currentColor"} />
            {blog.likes || 0} Likes
          </InteractionButton>
          <InteractionButton style={{ marginLeft: 'auto' }} onClick={() => {
            navigator.share({ title: blog.title, url: window.location.href });
          }}><Share2 size={18} /> Share Post</InteractionButton>
        </InteractionBar>
      </ReadingArea>

      {related.length > 0 && (
        <ContentWrapper style={{ marginTop: '10rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h3 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-2px', color: '#1a2b4c' }}>Keep Reading.</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '3rem' }}>
            {related.map(r => (
              <Link key={r.id} to={`/blog/${r.id}`} style={{ textDecoration: 'none' }}>
                <motion.div whileHover={{ y: -5 }} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '100%' }}>
                  <div style={{ height: 200 }}>
                    <img src={r.imageUrl} alt="Rel" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ color: '#FFBF00', fontWeight: 900, fontSize: '0.75rem', marginBottom: '8px', textTransform: 'uppercase' }}>{r.category}</div>
                    <h4 style={{ color: '#1a2b4c', fontSize: '1.2rem', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{r.title}</h4>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </ContentWrapper>
      )}
    </PageContainer>
  );
};

export default BlogPostPage;
