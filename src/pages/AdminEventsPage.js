import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon, Download } from 'lucide-react';
import { downloadImage } from '../utils/downloadHelper';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFileToFirebaseStorage as uploadFile } from '../utils/firebaseStorage';
import { getOptimizedUrl } from '../utils/imageOptimizer';
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
  gap: 1.5rem;
`;

const EventItem = styled.div`
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1.2rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.2rem;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const EventPoster = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  object-fit: cover;
`;

const EventInfo = styled.div`
  h3 {
    font-size: 1.2rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 0.3rem;
  }
  
  p {
    color: #666;
    margin: 0.25rem 0;
  }
`;

const StatusBadge = styled.span`
  display: inline-block;
  padding: 0.3rem 0.8rem;
  background: ${props => props.$upcoming ? '#4CAF50' : '#999'};
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-left: 0.5rem;
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
  
  ${props => props.$variant === 'edit' && `
    background: #4CAF50;
    color: white;
    &:hover { background: #45a049; }
  `}
  
  ${props => props.$variant === 'download' && `
    background: #2563eb;
    color: white;
    &:hover { background: #1d4ed8; }
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

const MultiFileLabel = styled(FileInputLabel)`
  border-color: #4CAF50;
  color: #4CAF50;
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

const generateAcademicYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(`${i}-${i + 1}`);
  }
  return years;
};

const calculateAcademicYear = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth(); 
  if (month >= 5) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    eventType: 'Camp',
    date: '',
    time: '',
    location: '',
    academicYear: '',
    posterUrl: '',
    photos: []
  });
  const [posterFile, setPosterFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const academicYears = generateAcademicYears();

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/admin-login');
      return;
    }
    fetchEvents();
  }, [user, navigate]);

  const fetchEvents = async () => {
    try {
      const eventsCollection = collection(db, 'events');
      const querySnapshot = await getDocs(eventsCollection);

      let eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by date (descending, newest first)
      eventsData.sort((a, b) => new Date(b.date) - new Date(a.date));
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      console.log("Saving Event with Cloudinary...");
      let posterUrl = formData.posterUrl;
      let photos = [...formData.photos];

      // Upload poster
      if (posterFile) {
        console.log("Uploading poster...");
        posterUrl = await uploadFile(posterFile);
      }

      // Upload event photos
      if (photoFiles.length > 0) {
        console.log(`Uploading ${photoFiles.length} event photos...`);
        const uploadPromises = photoFiles.map(file => uploadFile(file));
        const newPhotos = await Promise.all(uploadPromises);
        photos = [...photos, ...newPhotos.filter(url => url)];
      }

      const eventData = {
        ...formData,
        posterUrl,
        photos
      };

      if (editingEvent) {
        await updateDoc(doc(db, 'events', editingEvent.id), eventData);
      } else {
        await addDoc(collection(db, 'events'), eventData);
      }

      setShowModal(false);
      setEditingEvent(null);
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Error saving event: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      eventType: 'Camp',
      date: '',
      time: '',
      location: '',
      academicYear: '',
      posterUrl: '',
      photos: []
    });
    setPosterFile(null);
    setPhotoFiles([]);
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description,
      eventType: event.eventType || 'Camp',
      date: event.date,
      time: event.time || '',
      location: event.location || '',
      academicYear: event.academicYear || calculateAcademicYear(event.date),
      posterUrl: event.posterUrl || '',
      photos: event.photos || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', id));
        fetchEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const isUpcoming = (date) => {
    return new Date(date) >= new Date();
  };

  return (
    <PageContainer>
      <SEO title="Admin - Events" noindex={true} />
      <BackgroundElements>
        <div style={{ top: '10%', left: '10%', width: '400px', height: '400px', background: '#3b82f6' }} />
        <div style={{ bottom: '10%', right: '10%', width: '500px', height: '500px', background: '#fbbf24' }} />
      </BackgroundElements>
      <ContentWrapper>
        <PageTitle>Manage Events</PageTitle>

        <AddButton
          onClick={() => {
            setEditingEvent(null);
            resetForm();
            setShowModal(true);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus size={20} />
          Add New Event
        </AddButton>

        <EventsList>
          {events.map(event => (
            <EventItem key={event.id}>
              {event.posterUrl && (
                <EventPoster 
                  src={getOptimizedUrl(event.posterUrl, 300, 80)} 
                  alt={event.name} 
                  loading="lazy" 
                  onError={(e) => {
                    if (event.posterUrl && e.target.src !== event.posterUrl) {
                      e.target.src = event.posterUrl;
                    }
                  }}
                />
              )}
              <EventInfo>
                <h3>
                  {event.name}
                  <StatusBadge $upcoming={isUpcoming(event.date)}>
                    {isUpcoming(event.date) ? 'Upcoming' : 'Past'}
                  </StatusBadge>
                  {event.academicYear && (
                    <StatusBadge $upcoming={false} style={{ background: '#3b82f6', marginLeft: '0.5rem' }}>
                      {event.academicYear}
                    </StatusBadge>
                  )}
                </h3>
                <p><strong>{event.eventType}</strong></p>
                <p>{new Date(event.date).toLocaleDateString()} {event.time && `• ${event.time}`}</p>
                <p>{event.description}</p>
              </EventInfo>
              <Actions>
                {event.posterUrl && (
                  <ActionButton $variant="download" onClick={() => downloadImage(event.posterUrl, `event_${event.name}`)}>
                    <Download size={16} />
                  </ActionButton>
                )}
                <ActionButton $variant="edit" onClick={() => handleEdit(event)}>
                  <Edit2 size={16} />
                  Edit
                </ActionButton>
                <ActionButton $variant="delete" onClick={() => handleDelete(event.id)}>
                  <Trash2 size={16} />
                  Delete
                </ActionButton>
              </Actions>
            </EventItem>
          ))}
        </EventsList>

        {showModal && createPortal(
          <Modal onClick={() => setShowModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</ModalTitle>
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label>Event Name *</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Annual Training Camp 2024"
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Event Type *</Label>
                  <Select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    required
                  >
                    <option value="Camp">Camp</option>
                    <option value="Parade">Parade</option>
                    <option value="Competition">Competition</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Social Service">Social Service</option>
                    <option value="Other">Other</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Description *</Label>
                  <TextArea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the event..."
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setFormData({ 
                        ...formData, 
                        date: newDate,
                        academicYear: formData.academicYear || calculateAcademicYear(newDate)
                      });
                    }}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Academic Year *</Label>
                  <Select
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Location</Label>
                  <Input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Event location"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Event Poster</Label>
                  {formData.posterUrl && !posterFile && (
                    <div style={{ position: 'relative', width: '150px', marginBottom: '10px' }}>
                      <img 
                        src={getOptimizedUrl(formData.posterUrl, 200, 80)} 
                        alt="Current Poster" 
                        style={{ width: '100%', borderRadius: '8px' }} 
                        onError={(e) => {
                          if (formData.posterUrl && e.target.src !== formData.posterUrl) {
                            e.target.src = formData.posterUrl;
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => setFormData({ ...formData, posterUrl: '' })}
                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '25px', height: '25px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPosterFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="poster-upload"
                  />
                  <FileInputLabel htmlFor="poster-upload">
                    <Upload size={20} />
                    {posterFile ? posterFile.name : (formData.posterUrl ? 'Change Poster' : 'Upload Poster')}
                  </FileInputLabel>
                </FormGroup>

                <FormGroup>
                  <Label>Event Photos (Multiple)</Label>
                  {formData.photos && formData.photos.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                      {formData.photos.map((photoUrl, idx) => (
                        <div key={idx} style={{ position: 'relative', width: '100px', height: '100px' }}>
                          <img 
                            src={getOptimizedUrl(photoUrl, 150, 80)} 
                            alt={`Event Photo ${idx+1}`} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
                            onError={(e) => {
                              if (photoUrl && e.target.src !== photoUrl) {
                                e.target.src = photoUrl;
                              }
                            }}
                          />
                          <button 
                            type="button" 
                            onClick={() => {
                              const newPhotos = [...formData.photos];
                              newPhotos.splice(idx, 1);
                              setFormData({ ...formData, photos: newPhotos });
                            }}
                            style={{ position: 'absolute', top: '5px', right: '5px', background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
                    Upload New Photos
                  </MultiFileLabel>
                  {photoFiles.length > 0 && (
                    <SelectedFiles>
                      {photoFiles.map((file, idx) => (
                        <FileTag key={idx}>{file.name}</FileTag>
                      ))}
                    </SelectedFiles>
                  )}
                </FormGroup>

                <ButtonGroup>
                  <SubmitButton type="submit" disabled={uploading}>
                    <Save size={20} />
                    {uploading ? 'Saving...' : 'Save Event'}
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

export default AdminEventsPage;
