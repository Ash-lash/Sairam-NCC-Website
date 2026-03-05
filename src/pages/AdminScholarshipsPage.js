import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon, FileText, User, Users, UserPlus, XCircle, Award, Download } from 'lucide-react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFileToFirebaseStorage as uploadFile } from '../utils/firebaseStorage';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import { downloadImage } from '../utils/downloadHelper';
import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 100px 2rem 4rem;
  position: relative;
  overflow: hidden;
`;

const BackgroundElements = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  div {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.1;
  }
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2rem;
  color: #1e293b;
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

const EventsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const EventItem = styled(motion.div)`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    border-color: #cbd5e1;
  }
`;

const TopCardSection = styled.div`
  display: flex;
  padding: 1.5rem;
  gap: 1.25rem;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
`;

const EventPoster = styled.div`
  width: 90px;
  height: 90px;
  border-radius: 16px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const EventInfo = styled.div`
  flex: 1;
  h3 {
    font-size: 1.2rem;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 0.4rem;
    line-height: 1.3;
  }
  
  p {
    color: #64748b;
    margin: 0;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
`;

const StatBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  background: \${props => props.$bg || '#f1f5f9'};
  color: \${props => props.$color || '#475569'};
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 0.5rem;
`;

const Actions = styled.div`
  display: flex;
  padding: 1rem 1.5rem;
  gap: 0.75rem;
  background: #f8fafc;
  justify-content: flex-end;
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
  
  ${props => props.$variant === 'download' && `
    background: #2196F3;
    color: white;
    &:hover { background: #1976D2; }
  `}
  
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
  overflow-y: auto;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 700px;
  width: 100%;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  position: relative;
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

const TextArea = styled.textarea`
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
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

const MultiFileLabel = styled(FileInputLabel)`
  border-color: #4CAF50;
  color: #4CAF50;
`;

const PdfFileLabel = styled(FileInputLabel)`
  border-color: #3b82f6;
  color: #3b82f6;
`;

const SelectedFiles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const FileTag = styled.span`
  padding: 0.5rem 1rem;
  background: rgba(255, 191, 0, 0.1);
  border-radius: 20px;
  font-size: 0.9rem;
  color: #FFBF00;
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

const ModeToggle = styled.div`
  display: flex;
  background: #f1f5f9;
  padding: 0.5rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  gap: 0.5rem;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
`;

const ModeOption = styled.button`
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: ${props => props.$active ? '#fff' : 'transparent'};
  color: ${props => props.$active ? '#1A2B4C' : '#64748b'};
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};
  transform: ${props => props.$active ? 'scale(1.02)' : 'scale(1)'};

  &:hover {
    color: ${props => props.$active ? '#1A2B4C' : '#334155'};
  }
`;

const AdminScholarshipsPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    recipient: '',
    amount: '',
    date: '',
    posterUrl: '',
    reportUrl: '',
    photos: [],
    isGroup: false,
    groupMembers: []
  });
  const [posterFile, setPosterFile] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [memberFiles, setMemberFiles] = useState({});
  const [uploading, setUploading] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/admin-login');
      return;
    }
    fetchScholarships();
  }, [user, navigate]);

  const fetchScholarships = async () => {
    try {
      const q = query(collection(db, 'scholarships'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);

      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setScholarships(data);
    } catch (error) {
      console.error('Error fetching scholarships:', error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      let posterUrl = formData.posterUrl;
      let photos = [...formData.photos];

      if (posterFile) {
        posterUrl = await uploadFile(posterFile);
      }

      let reportUrl = formData.reportUrl;
      if (reportFile) {
        reportUrl = await uploadFile(reportFile);
      }

      if (photoFiles.length > 0) {
        const uploadPromises = photoFiles.map(file => uploadFile(file));
        const newPhotos = await Promise.all(uploadPromises);
        photos = [...photos, ...newPhotos.filter(url => url)];
      }

      // Handle Group Member Photos
      let updatedMembers = [...(formData.groupMembers || [])];
      for (let index in memberFiles) {
        if (memberFiles[index]) {
          console.log(`Uploading photo for member ${index}...`);
          const url = await uploadFile(memberFiles[index]);
          if (updatedMembers[index]) {
            updatedMembers[index].photoUrl = url;
          }
        }
      }

      const scholarshipData = {
        ...formData,
        posterUrl,
        reportUrl,
        photos,
        groupMembers: updatedMembers
      };

      if (editingScholarship) {
        await updateDoc(doc(db, 'scholarships', editingScholarship.id), scholarshipData);
      } else {
        await addDoc(collection(db, 'scholarships'), scholarshipData);
      }

      setShowModal(false);
      setEditingScholarship(null);
      resetForm();
      fetchScholarships();
    } catch (error) {
      console.error('Error saving scholarship:', error);
      alert(`Error saving scholarship: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      recipient: '',
      amount: '',
      date: '',
      posterUrl: '',
      reportUrl: '',
      photos: [],
      isGroup: false,
      groupMembers: []
    });
    setPosterFile(null);
    setReportFile(null);
    setPhotoFiles([]);
    setMemberFiles({});
  };

  const handleEdit = (scholarship) => {
    setEditingScholarship(scholarship);
    setFormData({
      name: scholarship.name,
      description: scholarship.description,
      recipient: scholarship.recipient || '',
      amount: scholarship.amount || '',
      date: scholarship.date,
      posterUrl: scholarship.posterUrl || '',
      reportUrl: scholarship.reportUrl || '',
      photos: scholarship.photos || [],
      isGroup: scholarship.isGroup || false,
      groupMembers: scholarship.groupMembers || []
    });
    setReportFile(null);
    setMemberFiles({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this scholarship?')) {
      try {
        await deleteDoc(doc(db, 'scholarships', id));
        fetchScholarships();
      } catch (error) {
        console.error('Error deleting scholarship:', error);
      }
    }
  };

  return (
    <PageContainer>
      <SEO title="Admin - Scholarships" noindex={true} />
      <BackgroundElements>
        <div style={{ top: '10%', left: '10%', width: '400px', height: '400px', background: '#3b82f6' }} />
        <div style={{ bottom: '10%', right: '10%', width: '500px', height: '500px', background: '#fbbf24' }} />
      </BackgroundElements>
      <ContentWrapper>
        <PageTitle>Manage Scholarships</PageTitle>

        <AddButton
          onClick={() => {
            setEditingScholarship(null);
            resetForm();
            setShowModal(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={20} />
          Add New Scholarship
        </AddButton>

        <EventsList>
          {scholarships.map(scholarship => (
            <EventItem
              key={scholarship.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <TopCardSection>
                <EventPoster>
                  {scholarship.posterUrl ? (
                    <img src={getOptimizedUrl(scholarship.posterUrl, 200, 80)} alt={scholarship.name} />
                  ) : (
                    <Award size={40} color="#cbd5e1" />
                  )}
                </EventPoster>
                <EventInfo>
                  <h3>{scholarship.name}</h3>
                  <p>
                    {scholarship.isGroup ? <Users size={14} /> : <User size={14} />}
                    {scholarship.isGroup ? `Squad Award (${scholarship.groupMembers?.length || 0} Members)` : scholarship.recipient}
                  </p>
                  <div>
                    <StatBadge $bg="#FEF3C7" $color="#D97706">
                      🏆 {scholarship.isGroup ? 'Group' : 'Individual'}
                    </StatBadge>
                    <StatBadge>
                      📅 {new Date(scholarship.date).toLocaleDateString()}
                    </StatBadge>
                  </div>
                </EventInfo>
              </TopCardSection>
              <div style={{ padding: '0 1.5rem 1rem', fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {scholarship.description}
              </div>
              <Actions>
                {scholarship.posterUrl && (
                  <ActionButton $variant="download" onClick={() => downloadImage(scholarship.posterUrl, `scholarship_${scholarship.name}`)}>
                    <Download size={16} />
                  </ActionButton>
                )}
                {scholarship.reportUrl && (
                  <ActionButton $variant="download" style={{ background: '#4CAF50' }} onClick={() => downloadImage(scholarship.reportUrl, `report_${scholarship.name}.pdf`)}>
                    <FileText size={16} />
                  </ActionButton>
                )}
                <ActionButton $variant="edit" onClick={() => handleEdit(scholarship)}>
                  <Edit2 size={16} /> Edit
                </ActionButton>
                <ActionButton $variant="delete" onClick={() => handleDelete(scholarship.id)}>
                  <Trash2 size={16} />
                </ActionButton>
              </Actions>
            </EventItem>
          ))}
        </EventsList>

        {showModal && createPortal(
          <Modal onClick={() => setShowModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{editingScholarship ? 'Edit Scholarship' : 'Add New Scholarship'}</ModalTitle>
              <Form onSubmit={handleSubmit}>
                <ModeToggle>
                  <ModeOption
                    type="button"
                    $active={!formData.isGroup}
                    onClick={() => setFormData({ ...formData, isGroup: false })}
                  >
                    <User size={18} /> Individual
                  </ModeOption>
                  <ModeOption
                    type="button"
                    $active={formData.isGroup}
                    onClick={() => setFormData({ ...formData, isGroup: true })}
                  >
                    <Users size={18} /> Group/Squad
                  </ModeOption>
                </ModeToggle>

                <FormGroup>
                  <Label>Scholarship Name *</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Cadet Welfare Society Scholarship"
                    required
                  />
                </FormGroup>

                {!formData.isGroup && (
                  <FormGroup>
                    <Label>Recipient Name *</Label>
                    <Input
                      type="text"
                      value={formData.recipient}
                      onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                      placeholder="e.g., Cdt. Varun"
                      required={!formData.isGroup}
                    />
                  </FormGroup>
                )}

                <FormGroup>
                  <Label>Amount</Label>
                  <Input
                    type="text"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g., ₹6,000"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Description / Report *</Label>
                  <TextArea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide details about the scholarship, achievements, and report..."
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Date Awarded *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Main Award Photo</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPosterFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="poster-upload"
                  />
                  <FileInputLabel htmlFor="poster-upload">
                    <Upload size={20} />
                    {posterFile ? posterFile.name : 'Upload Photo'}
                  </FileInputLabel>
                </FormGroup>

                <FormGroup>
                  <Label>Gallery Photos (Optional)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setPhotoFiles(Array.from(e.target.files))}
                    style={{ display: 'none' }}
                    id="photos-upload"
                  />
                  <MultiFileLabel htmlFor="photos-upload">
                    <ImageIcon size={20} />
                    Upload Additional Event Photos
                  </MultiFileLabel>
                  {photoFiles.length > 0 && (
                    <SelectedFiles>
                      {photoFiles.map((file, idx) => (
                        <FileTag key={idx}>{file.name}</FileTag>
                      ))}
                    </SelectedFiles>
                  )}
                </FormGroup>

                {formData.isGroup && (
                  <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '2px dashed #cbd5e1', marginTop: '1.5rem', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E3A8A', fontSize: '1.2rem', fontWeight: 800 }}>
                        <Users size={24} color="#F59E0B" /> SQUAD COMPOSITION
                      </h4>
                      <AddButton
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          groupMembers: [...formData.groupMembers, { rank: '', name: '', batch: '', department: '', photoUrl: '' }]
                        })}
                        style={{ background: '#F59E0B', color: '#1E3A8A', padding: '0.6rem 1.2rem', margin: 0 }}
                      >
                        <UserPlus size={18} /> Add Member
                      </AddButton>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                      {formData.groupMembers.map((member, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}
                        >
                          <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <input
                                type="file"
                                id={`member-photo-${idx}`}
                                hidden
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    setMemberFiles({ ...memberFiles, [idx]: e.target.files[0] });
                                  }
                                }}
                              />
                              <label htmlFor={`member-photo-${idx}`} style={{ cursor: 'pointer', width: '72px', height: '72px', borderRadius: '16px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', transition: 'all 0.2s' }}>
                                {(member.photoUrl || memberFiles[idx]) ? (
                                  <img
                                    src={memberFiles[idx] ? URL.createObjectURL(memberFiles[idx]) : member.photoUrl}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt="Preview"
                                  />
                                ) : (
                                  <Upload size={24} color="#94a3b8" />
                                )}
                              </label>
                            </div>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <Input
                                value={member.rank}
                                onChange={e => {
                                  const newMembers = [...formData.groupMembers];
                                  newMembers[idx].rank = e.target.value;
                                  setFormData({ ...formData, groupMembers: newMembers });
                                }}
                                placeholder="Rank (e.g. CVO)"
                                style={{ padding: '0.5rem', fontSize: '0.85rem', width: '100%' }}
                              />
                              <Input
                                value={member.name}
                                onChange={e => {
                                  const newMembers = [...formData.groupMembers];
                                  newMembers[idx].name = e.target.value;
                                  setFormData({ ...formData, groupMembers: newMembers });
                                }}
                                placeholder="Full Name"
                                style={{ padding: '0.5rem', fontSize: '0.9rem', fontWeight: 700, width: '100%' }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.75rem' }}>
                            <Input
                              value={member.batch}
                              onChange={e => {
                                const newMembers = [...formData.groupMembers];
                                newMembers[idx].batch = e.target.value;
                                setFormData({ ...formData, groupMembers: newMembers });
                              }}
                              placeholder="Batch (23-26)"
                              style={{ padding: '0.5rem', fontSize: '0.8rem', width: '100%' }}
                            />
                            <Input
                              value={member.department}
                              onChange={e => {
                                const newMembers = [...formData.groupMembers];
                                newMembers[idx].department = e.target.value;
                                setFormData({ ...formData, groupMembers: newMembers });
                              }}
                              placeholder="Department"
                              style={{ padding: '0.5rem', fontSize: '0.8rem', width: '100%' }}
                            />
                          </div>
                          <XCircle
                            size={24}
                            color="#EF4444"
                            style={{ position: 'absolute', top: '-8px', right: '-8px', cursor: 'pointer', background: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                            onClick={() => {
                              const newMembers = formData.groupMembers.filter((_, i) => i !== idx);
                              setFormData({ ...formData, groupMembers: newMembers });
                              const newFiles = { ...memberFiles };
                              delete newFiles[idx];
                              setMemberFiles(newFiles);
                            }}
                          />
                        </motion.div>
                      ))}
                    </div>

                    {formData.groupMembers.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                        <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p style={{ margin: 0, fontWeight: 600 }}>No squad members added yet.</p>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Add cadets who received this scholarship as a group.</p>
                      </div>
                    )}
                  </div>
                )}

                <FormGroup>
                  <Label>Report (PDF)</Label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setReportFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="report-upload"
                  />
                  <PdfFileLabel htmlFor="report-upload">
                    <FileText size={20} />
                    {reportFile ? reportFile.name : 'Upload Report PDF'}
                  </PdfFileLabel>
                </FormGroup>

                <ButtonGroup>
                  <SubmitButton type="submit" disabled={uploading}>
                    <Save size={20} />
                    {uploading ? 'Saving...' : 'Save Scholarship'}
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

export default AdminScholarshipsPage;
