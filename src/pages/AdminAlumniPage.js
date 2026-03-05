import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Upload, Search, Download } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFileToFirebaseStorage as uploadFile } from '../utils/firebaseStorage';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import { downloadImage } from '../utils/downloadHelper';
import SEO from '../components/common/SEO';

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a2b4c 0%, #2d4a7c 100%);
  padding: 100px 2rem 4rem;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
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

const AlumniList = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const AlumniItem = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.5rem;
  align-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AlumniPhoto = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
`;

const AlumniInfo = styled.div`
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
  
  @media (max-width: 768px) {
    justify-content: flex-end;
  }
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
    background: #2563eb;
    color: white;
    border-radius: 20px;
    padding: 0.5rem 1.2rem;
    &:hover { 
      background: #1d4ed8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(37,99,235,0.2);
    }
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

const TextArea = styled.textarea`
  padding: 0.8rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  
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

const FilterContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #FFBF00;
    border-radius: 3px;
  }
`;

const FilterChip = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 1px solid ${props => props.$active ? '#FFBF00' : '#ddd'};
  background: ${props => props.$active ? '#FFBF00' : 'white'};
  color: ${props => props.$active ? '#1a2b4c' : '#666'};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? '#FFBF00' : '#fff9e6'};
  }
`;

const SearchInputWrapper = styled.div`
  position: relative;
  margin-bottom: 2rem;
  
  svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
  }
  
  input {
    width: 100%;
    padding: 1rem 1rem 1rem 3rem;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-size: 1rem;
    transition: all 0.3s;
    
    &:focus {
      outline: none;
      border-color: #FFBF00;
      box-shadow: 0 0 0 4px rgba(255, 191, 0, 0.1);
    }
  }
`;

const AdminAlumniPage = () => {
  const [alumni, setAlumni] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedWing, setSelectedWing] = useState('All');
  const [selectedBatch, setSelectedBatch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isCustomDept, setIsCustomDept] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'cadets'));
        const uniqueDepts = new Set();
        querySnapshot.forEach(doc => {
          if (doc.data().dept) {
            uniqueDepts.add(doc.data().dept.trim().toUpperCase());
          }
        });
        setDepartments(Array.from(uniqueDepts).sort());
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    batch: '',
    department: '',
    wing: 'Army',
    currentPosition: '',
    company: '',
    achievements: '',
    email: '',
    linkedin: '',
    photoUrl: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Extract unique batches when alumni data changes
  useEffect(() => {
    if (alumni.length > 0) {
      const uniqueBatches = [...new Set(alumni.map(a => a.batch).filter(Boolean))].sort().reverse();
      setBatches(uniqueBatches);
    }
  }, [alumni]);

  const filteredAlumni = alumni.filter(alum => {
    const matchesDept = selectedDepartment === 'All' || alum.department === selectedDepartment;
    const matchesWing = selectedWing === 'All' || alum.wing === selectedWing;
    const matchesBatch = selectedBatch === 'All' || alum.batch === selectedBatch;
    const matchesSearch = !searchQuery ||
      alum.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alum.company?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDept && matchesWing && matchesBatch && matchesSearch;
  });

  useEffect(() => {
    // ... existing useEffect
    if (!user) {
      navigate('/admin-login');
      return;
    }
    fetchAlumni();
  }, [user, navigate]);

  // ... existing methods

  const fetchAlumni = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'alumni'));
      const alumniData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAlumni(alumniData);
    } catch (error) {
      console.error('Error fetching alumni:', error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      console.log("Starting save process for Alumni...");
      let photoUrl = formData.photoUrl;

      // Upload photo to secure storage
      if (photoFile) {
        console.log("Uploading alumni photo...");
        photoUrl = await uploadFile(photoFile);
        console.log("Alumni photo uploaded:", photoUrl);
      }

      const alumniData = {
        ...formData,
        photoUrl
      };

      if (editingAlumni) {
        await updateDoc(doc(db, 'alumni', editingAlumni.id), alumniData);
      } else {
        await addDoc(collection(db, 'alumni'), alumniData);
      }

      setShowModal(false);
      setEditingAlumni(null);
      resetForm();
      fetchAlumni();

      alert('Alumni saved successfully!');
      // Stay on the same page
      // navigate('/alumni');

    } catch (error) {
      console.error('Error saving alumni:', error);
      alert(`Error saving alumni: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      batch: '',
      department: '',
      wing: 'Army',
      currentPosition: '',
      company: '',
      achievements: '',
      email: '',
      linkedin: '',
      photoUrl: ''
    });
    setPhotoFile(null);
    setIsCustomDept(false);
  };

  const handleEdit = (alum) => {
    setEditingAlumni(alum);
    setFormData({
      name: alum.name,
      batch: alum.batch,
      department: alum.department || '',
      wing: alum.wing,
      currentPosition: alum.currentPosition || '',
      company: alum.company || '',
      achievements: alum.achievements || '',
      email: alum.email || '',
      linkedin: alum.linkedin || '',
      photoUrl: alum.photoUrl || ''
    });

    // Check if dept is custom
    if (alum.department) {
      const isKnown = departments.includes(alum.department);
      setIsCustomDept(!isKnown && departments.length > 0);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this alumni?')) {
      try {
        await deleteDoc(doc(db, 'alumni', id));
        fetchAlumni();
      } catch (error) {
        console.error('Error deleting alumni:', error);
      }
    }
  };

  return (
    <PageContainer>
      <SEO title="Admin - Alumni" noindex={true} />
      <ContentWrapper>
        <PageTitle>Manage Alumni</PageTitle>

        <AddButton
          onClick={() => {
            setEditingAlumni(null);
            resetForm();
            setIsCustomDept(false);
            setShowModal(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={20} />
          Add New Alumni
        </AddButton>

        <SearchInputWrapper>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search alumni by name, company, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchInputWrapper>

        {/* Filter Section */}
        <FilterContainer>
          {/* Wing Filters */}
          <FilterChip $active={selectedWing === 'All'} onClick={() => setSelectedWing('All')}>All Wings</FilterChip>
          <FilterChip $active={selectedWing === 'Army'} onClick={() => setSelectedWing('Army')}>Army</FilterChip>
          <FilterChip $active={selectedWing === 'Navy'} onClick={() => setSelectedWing('Navy')}>Navy</FilterChip>
          <FilterChip $active={selectedWing === 'Air'} onClick={() => setSelectedWing('Air')}>Air</FilterChip>

          <div style={{ width: '1px', background: '#ddd', height: '24px', margin: '0 0.5rem' }}></div>

          {/* Batch Filters */}
          <FilterChip $active={selectedBatch === 'All'} onClick={() => setSelectedBatch('All')}>All Batches</FilterChip>
          {batches.map(batch => (
            <FilterChip key={batch} $active={selectedBatch === batch} onClick={() => setSelectedBatch(batch)}>{batch}</FilterChip>
          ))}

          <div style={{ width: '1px', background: '#ddd', height: '24px', margin: '0 0.5rem' }}></div>

          {/* Department Filters */}
          <FilterChip $active={selectedDepartment === 'All'} onClick={() => setSelectedDepartment('All')}>All Departments</FilterChip>
          {departments.map(dept => (
            <FilterChip
              key={dept}
              $active={selectedDepartment === dept}
              onClick={() => setSelectedDepartment(dept)}
            >
              {dept}
            </FilterChip>
          ))}
        </FilterContainer>

        <AlumniList>
          {filteredAlumni.map(alum => (
            <AlumniItem key={alum.id}>
              {alum.photoUrl && <AlumniPhoto src={getOptimizedUrl(alum.photoUrl, 200, 80)} alt={alum.name} loading="lazy" />}
              <AlumniInfo>
                <h3>{alum.name}</h3>
                <p><strong>{alum.batch} • {alum.wing} Wing</strong></p>
                {alum.currentPosition && <p>{alum.currentPosition}</p>}
                {alum.company && <p>{alum.company}</p>}
                {alum.department && <p style={{ color: '#FFBF00', fontSize: '0.9rem', fontWeight: 'bold' }}>{alum.department}</p>}
              </AlumniInfo>
              <Actions>
                {alum.photoUrl && (
                  <ActionButton $variant="download" onClick={() => downloadImage(alum.photoUrl, `alumni_${alum.name}`)}>
                    <Download size={16} />
                    Download
                  </ActionButton>
                )}
                <ActionButton $variant="edit" onClick={() => handleEdit(alum)}>
                  <Edit2 size={16} />
                  Edit
                </ActionButton>
                {isAdmin && (
                  <ActionButton $variant="delete" onClick={() => handleDelete(alum.id)}>
                    <Trash2 size={16} />
                    Delete
                  </ActionButton>
                )}
              </Actions>
            </AlumniItem>
          ))}
        </AlumniList>

        {/* ... Modal ... */}

        {showModal && createPortal(
          <Modal onClick={() => setShowModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{editingAlumni ? 'Edit Alumni' : 'Add New Alumni'}</ModalTitle>
              <Form onSubmit={handleSubmit}>
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
                  <Label>Batch *</Label>
                  <Input
                    type="text"
                    value={formData.batch}
                    onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                    placeholder="e.g., 2020-2024"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Department *</Label>
                  <Select
                    value={isCustomDept ? 'Other' : formData.department}
                    onChange={(e) => {
                      if (e.target.value === 'Other') {
                        setIsCustomDept(true);
                        setFormData({ ...formData, department: '' });
                      } else {
                        setIsCustomDept(false);
                        setFormData({ ...formData, department: e.target.value });
                      }
                    }}
                    required={!isCustomDept}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                    <option value="Other">Other (Enter Manually)</option>
                  </Select>
                  {isCustomDept && (
                    <Input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Enter Department Name"
                      style={{ marginTop: '0.5rem' }}
                      required
                    />
                  )}
                </FormGroup>

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
                  <Label>Current Position</Label>
                  <Input
                    type="text"
                    value={formData.currentPosition}
                    onChange={(e) => setFormData({ ...formData, currentPosition: e.target.value })}
                    placeholder="e.g., Software Engineer"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Company</Label>
                  <Input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Company Name"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Achievements</Label>
                  <TextArea
                    value={formData.achievements}
                    onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                    placeholder="Notable achievements during NCC..."
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Email Address"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>LinkedIn Profile</Label>
                  <Input
                    type="url"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/..."
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

                <ButtonGroup>
                  <SubmitButton type="submit" disabled={uploading}>
                    <Save size={20} />
                    {uploading ? 'Saving...' : 'Save Alumni'}
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

export default AdminAlumniPage;
