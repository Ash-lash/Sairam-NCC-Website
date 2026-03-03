import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, User, Clock, ChevronLeft,
    Share2, MessageSquare, Heart, Bookmark,
    ArrowRight, Tag, BookOpen, Quote
} from 'lucide-react';
import { collection, getDoc, doc, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useParams, Link, useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 80px;
  background: white;
  padding-bottom: 5rem;
  font-family: 'Plus Jakarta Sans', sans-serif;
`;

const ArticleHeader = styled.div`
  padding: 4rem 0;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 4rem;
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const Breadcrumb = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  text-decoration: none;
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 2rem;
  transition: 0.3s;
  &:hover { color: #1a2b4c; }
`;

const Title = styled(motion.h1)`
  font-size: clamp(2.5rem, 6vw, 3.5rem);
  font-weight: 950;
  color: #1a2b4c;
  letter-spacing: -2px;
  line-height: 1.1;
  margin-bottom: 2rem;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  color: #64748b;
  font-size: 0.95rem;
  flex-wrap: wrap;

  .author-box {
    display: flex;
    align-items: center;
    gap: 12px;
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #FFBF00;
      color: #1a2b4c;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
    }
  }
`;

const FeaturedImageWrapper = styled(motion.div)`
  width: 100%;
  height: 500px;
  border-radius: 32px;
  overflow: hidden;
  margin-bottom: 4rem;
  box-shadow: 0 30px 60px -15px rgba(0,0,0,0.15);
  
  img { width: 100%; height: 100%; object-fit: cover; }
  
  @media (max-width: 768px) { height: 300px; border-radius: 20px; }
`;

const ArticleBody = styled.div`
  font-size: 1.2rem;
  line-height: 1.8;
  color: #334155;
  white-space: pre-wrap;
  
  h2 { font-size: 2rem; font-weight: 800; color: #1a2b4c; margin: 3rem 0 1.5rem; }
  
  blockquote {
    margin: 3rem 0;
    padding: 2.5rem;
    background: #f8fafc;
    border-radius: 24px;
    border-left: 6px solid #FFBF00;
    position: relative;
    font-size: 1.5rem;
    font-weight: 700;
    font-style: italic;
    color: #1a2b4c;

    svg { 
      position: absolute; 
      top: 15px; right: 25px; 
      opacity: 0.1; 
      width: 60px; height: 60px;
    }
  }
`;

const SidebarActions = styled.div`
  position: fixed;
  left: calc(50% - 550px);
  top: 300px;
  display: flex;
  flex-direction: column;
  gap: 15px;

  @media (max-width: 1200px) {
    position: static;
    flex-direction: row;
    justify-content: center;
    margin: 4rem 0;
  }
`;

const ActionIconButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: 0.3s;

  &:hover {
    border-color: #FFBF00;
    color: #1a2b4c;
    transform: translateY(-3px);
  }
`;

const RelatedSection = styled.div`
  margin-top: 8rem;
  padding-top: 5rem;
  border-top: 1px solid #f1f5f9;
`;

const RelatedGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const RelatedCard = styled(Link)`
  display: flex;
  gap: 20px;
  text-decoration: none;
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 20px;
  transition: 0.3s;
  &:hover { transform: translateY(-5px); background: #f1f5f9; }

  .thumb { width: 100px; height: 100px; border-radius: 12px; object-fit: cover; }
  .info h4 { margin: 0; color: #1a2b4c; font-size: 1.1rem; font-weight: 800; }
`;

const BlogPostPage = () => {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [related, setRelated] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBlog = async () => {
            setLoading(true);
            try {
                const docSnap = await getDoc(doc(db, 'blogs', id));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setBlog(data);
                    fetchRelated(data.category);
                } else {
                    navigate('/blog');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const fetchRelated = async (category) => {
            const q = query(
                collection(db, 'blogs'),
                where('category', '==', category),
                where('status', '==', 'approved'),
                limit(2)
            );
            const snap = await getDocs(q);
            setRelated(snap.docs.filter(d => d.id !== id).map(d => ({ id: d.id, ...d.data() })));
        };

        fetchBlog();
        window.scrollTo(0, 0);
    }, [id, navigate]);

    if (loading) {
        return (
            <PageContainer>
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
                    <div className="skeleton-spinner"></div>
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <SEO
                title={blog.title}
                description={blog.content.substring(0, 160)}
                image={blog.imageUrl}
                type="article"
            />

            <ArticleHeader>
                <ContentWrapper>
                    <Breadcrumb to="/blog">
                        <ChevronLeft size={16} /> All Stories
                    </Breadcrumb>
                    <Title
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {blog.title}
                    </Title>
                    <Meta>
                        <div className="author-box">
                            <div className="avatar">{blog.authorName[0]}</div>
                            <div>
                                <div style={{ fontWeight: 800, color: '#1a2b4c' }}>{blog.authorName}</div>
                                <div style={{ fontSize: '0.8rem' }}>Contributor</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={18} /> {new Date(blog.createdAt).toLocaleDateString()}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} /> 5 min read</span>
                        </div>
                    </Meta>
                </ContentWrapper>
            </ArticleHeader>

            <ContentWrapper>
                <SidebarActions>
                    <ActionIconButton title="Like"><Heart size={20} /></ActionIconButton>
                    <ActionIconButton title="Bookmark"><Bookmark size={20} /></ActionIconButton>
                    <ActionIconButton title="Comment"><MessageSquare size={20} /></ActionIconButton>
                    <ActionIconButton title="Share"><Share2 size={20} /></ActionIconButton>
                </SidebarActions>

                <FeaturedImageWrapper
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <img src={blog.imageUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1500'} alt="article" />
                </FeaturedImageWrapper>

                <ArticleBody>
                    {/* Just a mockup of complex structure if it was a real Markdown, here it's plain text */}
                    {blog.content}

                    <blockquote>
                        <Quote />
                        "NCC changed my perspective on leadership. It's not about commanding; it's about serving those you lead."
                    </blockquote>
                </ArticleBody>

                <div style={{ marginTop: '5rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Tag size={18} color="#94a3b8" />
                    {blog.tags?.map(tag => (
                        <span key={tag} style={{ color: '#64748b', fontSize: '0.9rem', fontStyle: 'italic' }}>#{tag}</span>
                    ))}
                </div>

                <RelatedSection>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#1a2b4c', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BookOpen color="#FFBF00" /> Keep Reading
                    </h3>
                    <RelatedGrid>
                        {related.map(r => (
                            <RelatedCard key={r.id} to={`/blog/${r.id}`}>
                                <img src={r.imageUrl} className="thumb" alt="rel" />
                                <div className="info">
                                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#FFBF00' }}>{r.category}</span>
                                    <h4>{r.title}</h4>
                                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>By {r.authorName}</div>
                                </div>
                            </RelatedCard>
                        ))}
                    </RelatedGrid>
                </RelatedSection>
            </ContentWrapper>
        </PageContainer>
    );
};

export default BlogPostPage;
