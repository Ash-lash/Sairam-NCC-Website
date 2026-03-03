import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Upload, GripVertical } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFileToFirebaseStorage as uploadFile } from '../utils/firebaseStorage';
import { getOptimizedUrl } from '../utils/imageOptimizer';

import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2b4c 0%, #2d4a7c 100%);
  padding: 100px 2rem 4rem;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2rem;
  color: white;
`;

const AddButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #FFBF00 0%, #FFD700 100%);
  color: #1a2b4c;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 2rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 191, 0, 0.4);
  }
`;

const ANOsList = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const ANOItem = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.5rem;
  align-items: center;
  align-items: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
  cursor: grab;
  padding: 0.5rem;
  
  &:hover {
    color: #4a5568;
  }
  
  &:active {
    cursor: grabbing;
  }
`;

const ANOPhoto = styled.img`
  width: 100px;
  height: 130px;
  border-radius: 12px;
  object-fit: contain;
  border: 2px solid #eee;
  background: #f8fafc;
`;

const ANOInfo = styled.div`
  h3 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #1a2b4c;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #666;
    margin: 0.25rem 0;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  
  ${props => props.$variant === 'edit' && `
    background: #4CAF50;
    color: white;
    &:hover { background: #45a049; }
  `}
  
  ${props => props.$variant === 'delete' && `
    background: #f44336;
    color: white;
    &:hover { background: #da190b; }
  `}
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 2rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a2b4c;
  margin-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #1a2b4c;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #FFBF00;
  }
`;

const Select = styled.select`
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #FFBF00;
  }
`;

const FileInputLabel = styled.label`
  padding: 0.8rem;
  border: 2px dashed #FFBF00;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #FFBF00;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 191, 0, 0.1);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const SubmitButton = styled.button`
  flex: 1;
  padding: 1rem;
  background: linear-gradient(135deg, #FFBF00 0%, #FFD700 100%);
  color: #1a2b4c;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 191, 0, 0.4);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: #da190b;
  }
`;

const AdminANOsPage = () => {
  const [anos, setAnos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingANO, setEditingANO] = useState(null);
  const [formData, setFormData] = useState({
    wing: 'Army',
    rank: '',
    name: '',
    phone: '',
    email: '',
    photoUrl: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/admin-login');
      return;
    }
    fetchANOs();
  }, [user, navigate]);



  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(anos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setAnos(items);

    // Batch update order in Firestore
    try {
      const batch = writeBatch(db);
      items.forEach((item, index) => {
        const docRef = doc(db, 'anos', item.id);
        batch.update(docRef, { order: index });
      });
      await batch.commit();
    } catch (error) {
      console.error("Error updating order:", error);
      fetchANOs(); // Revert on error
    }
  };

  const fetchANOs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'anos'));
      const anosData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by order
      anosData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setAnos(anosData);
    } catch (error) {
      console.error('Error fetching ANOs:', error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      console.log("Starting save process...");
      let photoUrl = formData.photoUrl;
      let pdfUrl = formData.pdfUrl;

      // Upload photo
      if (photoFile) {
        photoUrl = await uploadFile(photoFile, (msg) => console.log(msg));
        console.log("Photo URL obtained:", photoUrl);
      }

      // Upload Report PDF
      if (pdfFile) {
        pdfUrl = await uploadFile(pdfFile, (msg) => console.log(msg));
        console.log("PDF URL obtained:", pdfUrl);
      }

      console.log("Saving ANO data to Firestore...");
      const anoData = {
        ...formData,
        photoUrl,
        pdfUrl,
        order: editingANO ? (formData.order || 0) : (anos.length > 0 ? Math.max(...anos.map(a => a.order || 0)) + 1 : 0)
      };

      if (editingANO) {
        await updateDoc(doc(db, 'anos', editingANO.id), anoData);
      } else {
        await addDoc(collection(db, 'anos'), anoData);
      }

      setShowModal(false);
      setEditingANO(null);
      setFormData({ wing: 'Army', rank: '', name: '', phone: '', email: '', photoUrl: '', pdfUrl: '' });
      setPhotoFile(null);
      setPdfFile(null);
      fetchANOs();
    } catch (error) {
      console.error('Error saving ANO:', error);
      alert(`Error saving ANO: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (ano) => {
    setEditingANO(ano);
    setFormData({
      wing: ano.wing,
      rank: ano.rank,
      name: ano.name,
      phone: ano.phone,
      email: ano.email,
      photoUrl: ano.photoUrl || '',
      pdfUrl: ano.pdfUrl || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this ANO?')) {
      try {
        await deleteDoc(doc(db, 'anos', id));
        fetchANOs();
      } catch (error) {
        console.error('Error deleting ANO:', error);
      }
    }
  };

  return (
    <PageContainer>
      <SEO title="Admin - ANOs" noindex={true} />
      <ContentWrapper>
        <PageTitle>Manage ANOs</PageTitle>

        <AddButton
          onClick={() => {
            setEditingANO(null);
            setFormData({ wing: 'Army', rank: '', name: '', phone: '', email: '', photoUrl: '', pdfUrl: '' });
            setPhotoFile(null);
            setPdfFile(null);
            setShowModal(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={20} />
          Add New ANO
        </AddButton>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="anos-list">
            {(provided) => (
              <ANOsList {...provided.droppableProps} ref={provided.innerRef}>
                {anos.map((ano, index) => (
                  <Draggable key={ano.id} draggableId={ano.id} index={index}>
                    {(provided, snapshot) => (
                      <ANOItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={{
                          ...provided.draggableProps.style,
                          transform: snapshot.isDragging ? provided.draggableProps.style.transform : 'none',
                          boxShadow: snapshot.isDragging ? '0 12px 24px rgba(0, 0, 0, 0.2)' : '0 4px 6px rgba(0,0,0,0.1)',
                          zIndex: snapshot.isDragging ? 9999 : 'auto',
                          opacity: snapshot.isDragging ? 0.9 : 1,
                          background: '#ffffff'
                        }}
                      >
                        <DragHandle {...provided.dragHandleProps}>
                          <GripVertical size={24} />
                        </DragHandle>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          {ano.photoUrl && <ANOPhoto src={getOptimizedUrl(ano.photoUrl, 300, 80)} alt={ano.name} />}
                          <ANOInfo>
                            <h3>{ano.rank} {ano.name}</h3>
                            <p><strong>{ano.wing} Wing</strong></p>
                            <p>{ano.phone} • {ano.email}</p>
                          </ANOInfo>
                        </div>
                        <Actions>
                          <ActionButton $variant="edit" onClick={() => handleEdit(ano)}>
                            <Edit2 size={16} />
                            Edit
                          </ActionButton>
                          <ActionButton $variant="delete" onClick={() => handleDelete(ano.id)}>
                            <Trash2 size={16} />
                            Delete
                          </ActionButton>
                        </Actions>
                      </ANOItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ANOsList>
            )}
          </Droppable>
        </DragDropContext>

        {showModal && createPortal(
          <Modal onClick={() => setShowModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{editingANO ? 'Edit ANO' : 'Add New ANO'}</ModalTitle>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Wing *</Label>
                  <Select
                    value={formData.wing}
                    onChange={(e) => setFormData({ ...formData, wing: e.target.value })}
                    required
                  >
                    <option value="Army">Army</option>
                    <option value="Navy">Navy</option>
                    <option value="Air">Air Force</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Rank *</Label>
                  <Input
                    type="text"
                    value={formData.rank}
                    onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                    placeholder="e.g., Lt., Flt. Lt., Sub. Lt."
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Name *</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full Name"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Phone *</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone Number"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email Address"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Photo</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPhotoFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="photo-upload"
                  />
                  <FileInputLabel htmlFor="photo-upload">
                    <Upload size={20} />
                    {photoFile ? photoFile.name : 'Upload Photo'}
                  </FileInputLabel>
                </FormGroup>

                <FormGroup>
                  <Label>Report PDF</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="pdf-upload"
                  />
                  <FileInputLabel htmlFor="pdf-upload" style={{ borderColor: '#4CAF50', color: '#4CAF50' }}>
                    <Upload size={20} />
                    {pdfFile ? pdfFile.name : (formData.pdfUrl ? 'Update Report' : 'Upload Report')}
                  </FileInputLabel>
                  {formData.pdfUrl && <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '-0.5rem' }}>Current: {formData.pdfUrl.split('/').pop()}</p>}
                </FormGroup>

                <ButtonGroup>
                  <SubmitButton type="submit" disabled={uploading}>
                    <Save size={20} />
                    {uploading ? 'Saving...' : 'Save ANO'}
                  </SubmitButton>
                  <CancelButton type="button" onClick={() => setShowModal(false)}>
                    <X size={20} />
                    Cancel
                  </CancelButton>
                </ButtonGroup>
              </Form>
            </ModalContent>
          </Modal>,
          document.body
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default AdminANOsPage;
