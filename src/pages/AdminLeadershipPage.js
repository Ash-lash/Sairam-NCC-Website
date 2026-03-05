import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, doc, setDoc, onSnapshot, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { uploadFileToFirebaseStorage as uploadFile } from '../utils/firebaseStorage';
import { Save, Upload, User, Quote, Loader2, Plus, Trash2, ArrowUp, ArrowDown, Download } from 'lucide-react';
import { downloadImage } from '../utils/downloadHelper';
import ImageCropper from '../components/admin/ImageCropper';
import { getOptimizedUrl } from '../utils/imageOptimizer';

const NCC = {
  navy: '#1A2B4C',
  red: '#D22B2B',
  gold: '#FFBF00',
  sky: '#87CEEB',
  bg: '#F8FAFC',
};

const PageContainer = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at 100% 100%, #eff6ff 0%, #ffffff 100%);
  padding: 120px 2rem 4rem;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; height: 400px;
    background: linear-gradient(180deg, #1A2B4C 0%, transparent 100%);
    opacity: 0.03;
    pointer-events: none;
  }
`;

const Content = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const TitleGroup = styled.div`
  h1 {
    font-size: 3rem;
    font-weight: 900;
    color: #1A2B4C;
    margin: 0;
    letter-spacing: -0.02em;
    font-family: 'Outfit', sans-serif;
  }
  p {
    color: #64748b;
    font-size: 1.1rem;
    margin: 0.5rem 0 0 0;
    font-weight: 500;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 3rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const AdminCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 32px;
  padding: 2.5rem;
  box-shadow: 
    0 4px 6px -1px rgba(0,0,0,0.02),
    0 20px 40px -20px rgba(0,0,0,0.05);
  border: 1px solid rgba(255, 255, 255, 0.8);
  position: relative;
  transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);

  &:hover {
    transform: translateY(-5px);
    background: white;
    box-shadow: 0 40px 80px -30px rgba(26, 43, 76, 0.08);
    border-color: rgba(255, 191, 0, 0.3);
  }
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 32px;
    padding: 2px;
    background: linear-gradient(135deg, rgba(255,191,0,0.4), transparent, rgba(26,43,76,0.1));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.4s;
  }

  &:hover::before { opacity: 1; }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
`;

const CardTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.1rem;
  font-weight: 800;
  color: #1A2B4C;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  
  svg { color: #FFBF00; }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  background: #f1f5f9;
  padding: 0.4rem;
  border-radius: 14px;
`;

const IconButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: ${props => props.$danger ? NCC.red : '#64748b'};

  &:hover {
    background: ${props => props.$danger ? NCC.red : '#1A2B4C'};
    color: white;
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 2rem;
  
  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 800;
    color: #94a3b8;
    margin-bottom: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  border: 2px solid #f1f5f9;
  background: #fff;
  font-weight: 600;
  font-size: 1rem;
  color: #1A2B4C;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    border-color: #FFBF00;
    background: white;
    box-shadow: 0 0 0 5px rgba(255, 191, 0, 0.1);
  }
  
  &::placeholder { color: #cbd5e1; }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 1.25rem;
  border-radius: 16px;
  border: 2px solid #f1f5f9;
  background: #fff;
  font-weight: 500;
  font-size: 0.95rem;
  min-height: 160px;
  max-height: 400px;
  line-height: 1.6;
  resize: vertical;
  transition: all 0.3s;
  
  &:focus {
    outline: none;
    border-color: #FFBF00;
    box-shadow: 0 0 0 5px rgba(255, 191, 0, 0.1);
  }
`;

const ImageContainer = styled.div`
  margin-bottom: 2.5rem;
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const ImagePreview = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 24px;
  background: #f8fafc;
  overflow: hidden;
  position: relative;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.05);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
  }
`;

const UploadBtn = styled.label`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1.25rem;
  background: #f1f5f9;
  color: #1A2B4C;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #FFBF00;
    color: #1A2B4C;
    transform: translateX(5px);
  }
  
  input { display: none; }
`;

const PrimaryBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: ${props => props.$variant === 'gold' ? '#FFBF00' : '#1A2B4C'};
  color: ${props => props.$variant === 'gold' ? '#1A2B4C' : 'white'};
  border: none;
  border-radius: 18px;
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1);
  
  &:hover:not(:disabled) {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const AdminLeadershipPage = () => {
  const [loading, setLoading] = useState(false);
  const [leaders, setLeaders] = useState([]);
  const [cropImage, setCropImage] = useState(null);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'leadership'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setLeaders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleAddNew = async () => {
    try {
      setLoading(true);
      await addDoc(collection(db, 'leadership'), {
        name: '',
        title: 'Designation',
        quote: '',
        imageUrl: '',
        order: leaders.length
      });
    } catch (error) {
      console.error('Add failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this leadership entry?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'leadership', id));
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e, id) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
      setActiveId(id);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob) => {
    if (!croppedBlob || !activeId) return;

    setLoading(true);
    setCropImage(null);
    try {
      const url = await uploadFile(croppedBlob, (msg) => console.log(msg));
      await setDoc(doc(db, 'leadership', activeId), { imageUrl: url }, { merge: true });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setLoading(false);
      setActiveId(null);
    }
  };

  const handleUpdate = async (id, updatedFields) => {
    try {
      await setDoc(doc(db, 'leadership', id), updatedFields, { merge: true });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleMove = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === leaders.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const l1 = leaders[index];
    const l2 = leaders[newIndex];

    try {
      await setDoc(doc(db, 'leadership', l1.id), { order: newIndex }, { merge: true });
      await setDoc(doc(db, 'leadership', l2.id), { order: index }, { merge: true });
    } catch (error) {
      console.error('Reorder failed:', error);
    }
  };

  return (
    <PageContainer>
      <Content>
        <Header>
          <TitleGroup>
            <h1>Command Leadership</h1>
            <p>Institutional Messaging & Governance Board</p>
          </TitleGroup>
          <PrimaryBtn $variant="gold" onClick={handleAddNew} disabled={loading}>
            <Plus size={20} /> ADD COMMANDER
          </PrimaryBtn>
        </Header>

        <FormGrid>
          <AnimatePresence>
            {leaders.map((leader, index) => (
              <AdminCard
                key={leader.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <CardHeader>
                  <CardTitle><User size={20} /> {leader.title || 'Command Profile'}</CardTitle>
                  <ActionButtons>
                    <IconButton onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                      <ArrowUp size={16} />
                    </IconButton>
                    <IconButton onClick={() => handleMove(index, 'down')} disabled={index === leaders.length - 1}>
                      <ArrowDown size={16} />
                    </IconButton>
                    {leader.imageUrl && (
                      <IconButton onClick={() => downloadImage(leader.imageUrl, `leader_${leader.name}`)} title="Download Photo">
                        <Download size={16} />
                      </IconButton>
                    )}
                    <IconButton $danger onClick={() => handleDelete(leader.id)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </ActionButtons>
                </CardHeader>

                <ImageContainer>
                  <ImagePreview>
                    {leader.imageUrl ? (
                      <img src={getOptimizedUrl(leader.imageUrl, 300)} alt="Preview" loading="lazy" />
                    ) : (
                      <div className="empty"><Upload size={32} /></div>
                    )}
                  </ImagePreview>
                  <UploadBtn>
                    <Upload size={16} /> REPLACE PORTRAIT
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, leader.id)} />
                  </UploadBtn>
                </ImageContainer>

                <FormGroup>
                  <label>Full Command Name</label>
                  <Input
                    value={leader.name}
                    onChange={(e) => handleUpdate(leader.id, { name: e.target.value })}
                    placeholder="e.g. Dr. Sai Prakash LeoMuthu"
                  />
                </FormGroup>

                <FormGroup>
                  <label>Officer Designation</label>
                  <Input
                    value={leader.title}
                    onChange={(e) => handleUpdate(leader.id, { title: e.target.value })}
                    placeholder="e.g. Chief Executive Officer"
                  />
                </FormGroup>

                <FormGroup>
                  <label>Inspirational Brief (Citation)</label>
                  <TextArea
                    value={leader.quote}
                    onChange={(e) => handleUpdate(leader.id, { quote: e.target.value })}
                    placeholder="Preserve spacing and line breaks for exact citation look..."
                  />
                </FormGroup>
              </AdminCard>
            ))}
          </AnimatePresence>
        </FormGrid>
      </Content>

      <AnimatePresence>
        {cropImage && (
          <ImageCropper
            image={cropImage}
            onCropComplete={handleCropComplete}
            onCancel={() => {
              setCropImage(null);
              setActiveId(null);
            }}
          />
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default AdminLeadershipPage;

