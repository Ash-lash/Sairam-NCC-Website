import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Trash2, Link as LinkIcon, Calendar, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/common/SEO';

const NCC = {
  navy: '#1A2B4C',
  red: '#D22B2B',
  gold: '#FFBF00',
  sky: '#87CEEB',
  bg: '#F8FAFC',
};

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${NCC.bg};
  padding: 100px 2rem 4rem;
`;

const ContentWrapper = styled.div`
  max-width: 1100px;
  margin: 0 auto;
`;

const HeaderSection = styled.div`
  background: white;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  margin-bottom: 3rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid rgba(0,0,0,0.05);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
`;

const HeaderText = styled.div`
  h1 {
    font-size: 2.25rem;
    font-weight: 800;
    color: ${NCC.navy};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    @media (max-width: 768px) { justify-content: center; }
  }
  p {
    color: #64748B;
    margin: 0.5rem 0 0 0;
    font-size: 1rem;
  }
`;

const AddBtn = styled(motion.button)`
  background: ${NCC.navy};
  color: white;
  border: none;
  padding: 0.85rem 1.75rem;
  border-radius: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(26, 43, 76, 0.2);
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 2.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FormCard = styled(motion.div)`
  background: white;
  padding: 2rem;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.02);
  height: fit-content;
  position: sticky;
  top: 100px;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  label {
    display: block;
    font-size: 0.85rem;
    font-weight: 700;
    color: ${NCC.navy};
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.85rem 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  &:focus {
    border-color: ${NCC.gold};
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 191, 0, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.85rem 1rem;
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  font-size: 1rem;
  min-height: 120px;
  resize: vertical;
  transition: all 0.2s;
  font-family: inherit;
  &:focus {
    border-color: ${NCC.gold};
    outline: none;
    box-shadow: 0 0 0 4px rgba(255, 191, 0, 0.1);
  }
`;

const PriorityToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  padding: 1rem;
  background: ${props => props.$active ? 'rgba(210, 43, 43, 0.05)' : '#F1F5F9'};
  border: 2px solid ${props => props.$active ? NCC.red : 'transparent'};
  border-radius: 12px;
  transition: all 0.2s;
  
  span {
    font-weight: 700;
    color: ${props => props.$active ? NCC.red : '#64748B'};
  }
`;

const AnnouncementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Card = styled(motion.div)`
  background: white;
  padding: 1.75rem;
  border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  gap: 1.5rem;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.06);
  }
`;

const StatusIndicator = styled.div`
  width: 4px;
  border-radius: 4px;
  background: ${props => props.$urgent ? NCC.red : NCC.gold};
  flex-shrink: 0;
`;

const CardContent = styled.div`
  flex: 1;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const CardTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${NCC.navy};
  margin: 0;
`;

const Badge = styled.span`
  background: ${NCC.red};
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  text-transform: uppercase;
`;

const CardBody = styled.p`
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0 0 1rem 0;
`;

const CardMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  align-items: center;
  font-size: 0.85rem;
  color: #94A3B8;
  
  a {
    color: ${NCC.navy};
    text-decoration: none;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    &:hover { text-decoration: underline; }
  }
`;

const DeleteBtn = styled(motion.button)`
  background: #FFE4E4;
  color: ${NCC.red};
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 24px;
  border: 2px dashed #E2E8F0;
  color: #94A3B8;
`;

const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', link: '', highPriority: false });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/admin-login');
    fetchAnnouncements();
  }, [user, navigate]);

  const fetchAnnouncements = async () => {
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      setFormData({ title: '', content: '', link: '', highPriority: false });
      setShowForm(false);
      fetchAnnouncements();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    await deleteDoc(doc(db, 'announcements', id));
    fetchAnnouncements();
  };

  return (
    <PageContainer>
      <SEO title="Manage Announcements" noindex />
      <ContentWrapper>
        <HeaderSection>
          <HeaderText>
            <h1><Megaphone size={32} /> Announcements</h1>
            <p>Broadcast important updates to the NCC community.</p>
          </HeaderText>
          <AddBtn
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <><X size={20} /> Close Form</> : <><Plus size={20} /> Create New</>}
          </AddBtn>
        </HeaderSection>

        <DashboardGrid>
          <AnnouncementList>
            {loading ? (
              <p>Loading...</p>
            ) : announcements.length > 0 ? (
              <AnimatePresence>
                {announcements.map((item) => (
                  <Card
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <StatusIndicator $urgent={item.highPriority} />
                    <CardContent>
                      <CardHeader>
                        <CardTitle>{item.title}</CardTitle>
                        {item.highPriority && <Badge>Urgent</Badge>}
                      </CardHeader>
                      <CardBody>{item.content}</CardBody>
                      <CardMeta>
                        <span><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {item.createdAt?.toDate().toLocaleDateString()}</span>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer"><LinkIcon size={14} /> View Link</a>
                        )}
                      </CardMeta>
                    </CardContent>
                    <DeleteBtn
                      whileHover={{ scale: 1.1, background: '#DC2626', color: 'white' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 size={20} />
                    </DeleteBtn>
                  </Card>
                ))}
              </AnimatePresence>
            ) : (
              <EmptyState>
                <Megaphone size={48} strokeWidth={1} style={{ marginBottom: '1rem' }} />
                <p>No announcements found. Stay ahead of the community by posting updates.</p>
              </EmptyState>
            )}
          </AnnouncementList>

          <AnimatePresence>
            {showForm && (
              <FormCard
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: NCC.navy }}>Post Update</h2>
                <form onSubmit={handleSubmit}>
                  <InputGroup>
                    <label>Title</label>
                    <Input
                      placeholder="e.g., Annual Parade 2026"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </InputGroup>
                  <InputGroup>
                    <label>Content</label>
                    <TextArea
                      placeholder="Describe the update in detail..."
                      value={formData.content}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      required
                    />
                  </InputGroup>
                  <InputGroup>
                    <label>Action Link (Optional)</label>
                    <Input
                      placeholder="https://..."
                      value={formData.link}
                      onChange={e => setFormData({ ...formData, link: e.target.value })}
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>Urgency Level</label>
                    <PriorityToggle
                      $active={formData.highPriority}
                      onClick={() => setFormData({ ...formData, highPriority: !formData.highPriority })}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        border: '2px solid #CBD5E1', background: formData.highPriority ? NCC.red : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {formData.highPriority && <CheckCircle size={14} color="white" />}
                      </div>
                      <span>Mark as Urgent Alert</span>
                    </PriorityToggle>
                  </InputGroup>

                  <AddBtn
                    type="submit"
                    style={{ width: '100%', justifyContent: 'center' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Posting...' : 'Post Announcement'}
                  </AddBtn>
                </form>
              </FormCard>
            )}
          </AnimatePresence>
        </DashboardGrid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default AdminAnnouncementsPage;
