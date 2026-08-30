import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Edit2, Trash2, Save, X, Upload, Image as ImageIcon, Calendar, Award, FileText, GripVertical, Grid as GridIcon, Users, UserPlus, XCircle, User, Download } from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { uploadFileToFirebaseStorage as uploadFile } from '../utils/firebaseStorage';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import { downloadImage } from '../utils/downloadHelper';
import SEO from '../components/common/SEO';
import ImageCropper from '../components/admin/ImageCropper';

// Theme Constants
const PRIMARY_BLUE = '#1E3A8A';
const ACCENT_GOLD = '#F59E0B';
const LIGHT_BG = '#F8FAFC';
const WHITE = '#FFFFFF';
const DANGER_RED = '#DC2626';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${LIGHT_BG};
  padding: 100px 2rem 4rem;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 2.2rem;
  font-weight: 800;
  color: ${PRIMARY_BLUE};
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Subtitle = styled.p`
  color: #64748B;
  font-size: 1rem;
  margin-top: 0.25rem;
`;

const AddButton = styled(motion.button)`
  background: ${PRIMARY_BLUE};
  color: ${WHITE};
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(30, 58, 138, 0.2);
  
  &:hover {
    background: #1e40af;
    box-shadow: 0 8px 12px rgba(30, 58, 138, 0.3);
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
    background: #cbd5e1;
    border-radius: 3px;
  }
`;

const FilterChip = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  border: 1px solid ${props => props.$active ? PRIMARY_BLUE : '#cbd5e1'};
  background: ${props => props.$active ? PRIMARY_BLUE : 'white'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$active ? PRIMARY_BLUE : '#f1f5f9'};
  }
`;

const TypeFilterTabs = styled.div`
  display: flex;
  background: white;
  border-radius: 16px;
  padding: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
  gap: 0.5rem;
  width: fit-content;
  flex-wrap: wrap;
`;

const TypeTab = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  background: ${props => props.$active ? '#1A2B4C' : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748B'};
  
  &:hover {
    color: ${props => props.$active ? 'white' : '#1A2B4C'};
    background: ${props => props.$active ? '#1A2B4C' : '#F1F5F9'};
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 2rem;
`;

const AchievementCard = styled(motion.div)`
  background: ${WHITE};
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  }
`;

const GroupBadge = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: ${props => props.$isGroup ? ACCENT_GOLD : PRIMARY_BLUE};
  color: ${props => props.$isGroup ? PRIMARY_BLUE : WHITE};
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  align-items: start;
  gap: 1rem;
  border-bottom: 1px solid #F1F5F9;
`;

const Avatar = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  background: #E2E8F0;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CardInfo = styled.div`
  flex: 1;
`;

const CadetName = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${PRIMARY_BLUE};
  margin-bottom: 0.25rem;
`;

const Badge = styled.span`
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  background: ${props => props.$type === 'Camp' ? '#ECFDF5' : props.$type === 'Event' ? '#EFF6FF' : '#FFF7ED'};
  color: ${props => props.$type === 'Camp' ? '#059669' : props.$type === 'Event' ? '#1D4ED8' : '#D97706'};
  border-radius: 999px;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 0.5rem;
`;

const CardBody = styled.div`
  padding: 1.5rem;
  flex: 1;
`;

const DetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748B;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const Description = styled.p`
  color: #334155;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-top: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const CardFooter = styled.div`
  padding: 1rem 1.5rem;
  background: #F8FAFC;
  border-top: 1px solid #F1F5F9;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const IconButton = styled.button`
  padding: 0.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$variant === 'delete' ? '#FEF2F2' : '#EFF6FF'};
  color: ${props => props.$variant === 'delete' ? DANGER_RED : PRIMARY_BLUE};

  &:hover {
    background: ${props => props.$variant === 'delete' ? '#FEE2E2' : '#DBEAFE'};
  }
`;
const DownloadActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  background: ${props => props.$variant === 'report' ? '#ecfdf5' : '#eff6ff'};
  color: ${props => props.$variant === 'report' ? '#059669' : '#2563eb'};
  font-weight: 700;
  font-size: 0.75rem;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  }
`;

// Modal Styles
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  overflow-y: auto;
`;

const ModalContainer = styled(motion.div)`
  background: ${WHITE};
  width: 100%;
  max-width: 1000px;
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  margin: auto;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #E2E8F0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${PRIMARY_BLUE};
  color: ${WHITE};
`;

const ModalContent = styled.div`
  padding: 2rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  font-weight: 600;
  font-size: 0.9rem;
  color: #334155;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  width: 100%;
  box-sizing: border-box;
  transition: all 0.2s;
  
  &:focus {
    border-color: ${PRIMARY_BLUE};
    box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.05);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  background: white;
  width: 100%;
  box-sizing: border-box;
  
  &:focus {
    border-color: ${PRIMARY_BLUE};
  }
`;

const ModeToggle = styled.div`
  display: flex;
  background: #f1f5f9;
  padding: 0.5rem;
  border-radius: 16px;
  margin-bottom: 2.5rem;
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
  background: ${props => props.$active ? WHITE : 'transparent'};
  color: ${props => props.$active ? PRIMARY_BLUE : '#64748b'};
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};
  transform: ${props => props.$active ? 'scale(1.02)' : 'scale(1)'};

  &:hover {
    color: ${props => props.$active ? PRIMARY_BLUE : '#334155'};
  }
`;

const TextArea = styled.textarea`
  padding: 1rem;
  border: 1.5px solid #E2E8F0;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  min-height: 120px;
  resize: vertical;
  transition: all 0.2s;
  
  &:focus {
    border-color: ${PRIMARY_BLUE};
    box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.05);
  }
`;

const FileUploadBox = styled.label`
  border: 2px dashed #CBD5E1;
  border-radius: 16px;
  padding: 2.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #F8FAFC;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #64748B;
  
  &:hover {
    border-color: ${ACCENT_GOLD};
    background: #FFFBEB;
    color: ${PRIMARY_BLUE};
    transform: translateY(-2px);
  }

  svg {
    transition: transform 0.3s;
  }
  &:hover svg {
    transform: scale(1.1);
    color: ${ACCENT_GOLD};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1.25rem;
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #E2E8F0;
`;

const GhostButton = styled.button`
  padding: 0.85rem 1.75rem;
  background: #F4F4F5;
  color: #52525B;
  border: none;
  font-weight: 700;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s;
  
  &:hover {
    background: #E4E4E7;
    color: #18181B;
  }
`;

const PrimaryButton = styled.button`
  padding: 0.85rem 2.5rem;
  background: linear-gradient(135deg, ${PRIMARY_BLUE} 0%, #1e40af 100%);
  color: white;
  border: none;
  font-weight: 700;
  cursor: pointer;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3);
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(30, 58, 138, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: wait;
    transform: none;
  }
`;

const AdminAchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [filterMode, setFilterMode] = useState('Individual'); // 'Individual', 'Group'
  const [isReorderMode, setIsReorderMode] = useState(false); // New state for reorder mode

  const [departments, setDepartments] = useState([]);

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
        // Fallback or empty if fail
      }
    };
    fetchDepartments();
  }, []);

  const [formData, setFormData] = useState({
    cadetName: '',
    rank: '',
    achievementType: 'Camp',
    campName: '',
    eventName: '',
    description: '',
    batch: '',
    department: '',
    wing: 'Army',
    date: '',
    cadetPhotoUrl: '',
    groupPhotoUrl: '', // New field for group thumbnail
    campPhotos: [],
    reportUrl: '',
    isGroup: false,
    participants: '',
    groupMembers: [], // structured array: { rank, name, batch, department, photoUrl, wing }
    cadetCount: 0
  });
  const [cadetPhotoFile, setCadetPhotoFile] = useState(null);
  const [groupPhotoFile, setGroupPhotoFile] = useState(null); // New state
  const [reportFile, setReportFile] = useState(null);
  const [memberFiles, setMemberFiles] = useState({}); // { index: File }
  const [campPhotosFiles, setCampPhotosFiles] = useState([]);

  const { user } = useAuth();
  const navigate = useNavigate();

  const filteredAchievementsItems = achievements.filter(a => {
    const typeMatch = filterMode === 'All' ? true : (filterMode === 'Group' ? a.isGroup : !a.isGroup);
    let deptMatch = selectedDepartment === 'All';
    if (!deptMatch) {
      if (a.isGroup) {
        deptMatch = a.groupMembers?.some(m => m.department === selectedDepartment);
      } else {
        deptMatch = a.department === selectedDepartment;
      }
    }
    return typeMatch && deptMatch;
  });

  useEffect(() => {
    if (!user) {
      navigate('/admin-login');
      return;
    }
    fetchAchievements();
  }, [user, navigate]);

  const fetchAchievements = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'achievements'));
      let achievementsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by order if exists, otherwise by date
      achievementsData.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        // Items without order go to the end, sorted by date
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return new Date(b.date) - new Date(a.date);
      });

      setAchievements(achievementsData);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const handleReorder = (newOrder) => {
    setAchievements(newOrder); // Update local state immediately for drag feel
  };

  const saveOrder = async () => {
    setUploading(true);
    try {
      const batchPromises = achievements.map((item, index) =>
        updateDoc(doc(db, 'achievements', item.id), { order: index })
      );
      await Promise.all(batchPromises);
      alert('Order saved successfully!');
      setIsReorderMode(false);
    } catch (error) {
      console.error('Error saving order:', error);
      alert('Failed to save order.');
    } finally {
      setUploading(false);
    }
  };


  const resetForm = () => {
    setFormData({
      cadetName: '',
      rank: '',
      achievementType: 'Camp',
      campName: '',
      eventName: '',
      description: '',
      batch: '',
      department: '',
      wing: 'Army',
      date: '',
      cadetPhotoUrl: '',
      campPhotos: [],
      reportUrl: '',
      isGroup: false,
      participants: '',
      groupMembers: [],
      cadetCount: 0
    });
    setCadetPhotoFile(null);
    setGroupPhotoFile(null);
    setReportFile(null);
    setMemberFiles({});
    setCampPhotosFiles([]);
    setShowCropper(false);
    setCroppingImage(null);
    setPendingCropField(null);
  };

  const [showCropper, setShowCropper] = useState(false);
  const [croppingImage, setCroppingImage] = useState(null);
  const [cropAspect, setCropAspect] = useState(1);
  const [cropShape, setCropShape] = useState('rect'); // 'rect' or 'round'
  const [pendingCropField, setPendingCropField] = useState(null); // 'cadet', 'group', or 'member-index'

  const handleFileSelect = (event, field, index = null) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCroppingImage(reader.result);
        setShowCropper(true);
        if (field === 'member') {
          setPendingCropField(`member-${index}`);
          setCropAspect(1); // Square for member portraits
          setCropShape('rect');
        } else if (field === 'group') {
          setPendingCropField('group');
          setCropAspect(0.8); // Tall portrait for group tiles
          setCropShape('rect');
        } else {
          setPendingCropField('cadet');
          setCropAspect(1); // Square for cadet portraits
          setCropShape('round'); // Round for individual profile
        }
      });
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob) => {
    // Convert Blob to File to ensure it has a name property for upload
    const fileName = `cropped_${Date.now()}.jpg`;
    const croppedFile = new File([croppedBlob], fileName, { type: 'image/jpeg' });

    if (pendingCropField === 'cadet') {
      setCadetPhotoFile(croppedFile);
    } else if (pendingCropField === 'group') {
      setGroupPhotoFile(croppedFile);
    } else if (pendingCropField && pendingCropField.startsWith('member-')) {
      const index = pendingCropField.split('-')[1];
      setMemberFiles({ ...memberFiles, [index]: croppedFile });
    }
    setShowCropper(false);
    setCroppingImage(null);
    setPendingCropField(null);
  };

  const handleEdit = (achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      cadetName: achievement.cadetName,
      rank: achievement.rank || '',
      achievementType: achievement.achievementType || 'Camp',
      campName: achievement.campName || '',
      eventName: achievement.eventName || '',
      description: achievement.description,
      batch: achievement.batch,
      department: achievement.department || '',
      wing: achievement.wing,
      date: achievement.date,
      cadetPhotoUrl: achievement.cadetPhotoUrl || '',
      groupPhotoUrl: achievement.groupPhotoUrl || '',
      campPhotos: achievement.campPhotos || [],
      reportUrl: achievement.reportUrl || '',
      isGroup: achievement.isGroup || false,
      participants: achievement.participants || '',
      groupMembers: achievement.groupMembers || [],
      cadetCount: achievement.cadetCount || (achievement.groupMembers ? achievement.groupMembers.length : 0),
      campPhotos: achievement.campPhotos || []
    });
    setMemberFiles({});
    setCampPhotosFiles([]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      console.log("Saving Achievement to Firebase...");
      let cadetPhotoUrl = formData.cadetPhotoUrl;

      if (cadetPhotoFile) {
        console.log("Uploading cadet photo...");
        cadetPhotoUrl = await uploadFile(cadetPhotoFile);
      }

      let groupPhotoUrl = formData.groupPhotoUrl;
      if (groupPhotoFile) {
        console.log("Uploading group photo...");
        groupPhotoUrl = await uploadFile(groupPhotoFile);
      }

      let reportUrl = formData.reportUrl;
      if (reportFile) {
        console.log("Uploading report...");
        reportUrl = await uploadFile(reportFile);
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

      let campPhotos = [...(formData.campPhotos || [])];
      if (campPhotosFiles.length > 0) {
        console.log("Uploading camp photos...");
        for (let file of campPhotosFiles) {
           const url = await uploadFile(file);
           campPhotos.push(url);
        }
      }

      const achievementData = {
        ...formData,
        cadetPhotoUrl: cadetPhotoUrl || '',
        groupPhotoUrl: groupPhotoUrl || '',
        reportUrl: reportUrl || '',
        groupMembers: updatedMembers,
        campPhotos: campPhotos,
        cadetCount: formData.isGroup ? updatedMembers.length : 1,
        updatedAt: new Date(),
      };

      if (editingAchievement) {
        await updateDoc(doc(db, 'achievements', editingAchievement.id), achievementData);
      } else {
        await addDoc(collection(db, 'achievements'), achievementData);
      }

      setShowModal(false);
      setEditingAchievement(null);
      resetForm();
      fetchAchievements();
    } catch (error) {
      console.error('Error saving achievement:', error);
      alert(`Error saving achievement: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this achievement?')) {
      try {
        await deleteDoc(doc(db, 'achievements', id));
        fetchAchievements();
      } catch (error) {
        console.error('Error deleting achievement:', error);
      }
    }
  };

  return (
    <PageContainer>
      <SEO title="Admin - Manage Achievements" noindex={true} />
      <ContentWrapper>
        <HeaderSection>
          <div>
            <PageTitle>
              <Award size={32} color={ACCENT_GOLD} />
              Manage Achievements
            </PageTitle>
            <Subtitle>Add, edit, or remove cadet achievements and accolades.</Subtitle>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <AddButton
              onClick={() => {
                if (isReorderMode) {
                  saveOrder();
                } else {
                  if (selectedDepartment !== 'All') {
                    if (window.confirm("Reorder mode requires viewing 'All' departments. Switch to 'All'?")) {
                      setSelectedDepartment('All');
                      setIsReorderMode(true);
                    }
                  } else {
                    setIsReorderMode(true);
                  }
                }
              }}
              style={{ background: isReorderMode ? '#10b981' : '#64748b' }} // Green for Save, Gray for Reorder
            >
              {isReorderMode ? <Save size={20} /> : <GridIcon size={20} />}
              {isReorderMode ? 'Save Order' : 'Rearrange'}
            </AddButton>
            {!isReorderMode && (
              <AddButton
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setEditingAchievement(null);
                  resetForm();
                  setShowModal(true);
                }}
              >
                <Plus size={20} />
                Add New Achievement
              </AddButton>
            )}
          </div>
        </HeaderSection>

        {/* Type Filters (Individual vs Group) */}
        {!isReorderMode && (
          <TypeFilterTabs>
            <TypeTab $active={filterMode === 'Individual'} onClick={() => setFilterMode('Individual')}>
              <User size={18} /> Individual
            </TypeTab>
            <TypeTab $active={filterMode === 'Group'} onClick={() => setFilterMode('Group')}>
              <Users size={18} /> Group
            </TypeTab>
          </TypeFilterTabs>
        )}

        {/* Department Filters */}
        <FilterContainer>
          <FilterChip

            $active={selectedDepartment === 'All'}
            onClick={() => !isReorderMode && setSelectedDepartment('All')} // Disable filter in reorder mode
            style={{ opacity: isReorderMode ? 0.5 : 1, cursor: isReorderMode ? 'not-allowed' : 'pointer' }}
          >
            All Departments
          </FilterChip>
          {departments.map(dept => (
            <FilterChip
              key={dept}
              $active={selectedDepartment === dept}
              onClick={() => !isReorderMode && setSelectedDepartment(dept)}
              style={{ opacity: isReorderMode ? 0.5 : 1, cursor: isReorderMode ? 'not-allowed' : 'pointer' }}
            >
              {dept}
            </FilterChip>
          ))}
        </FilterContainer>

        {isReorderMode ? (
          <Reorder.Group axis="y" values={achievements} onReorder={handleReorder} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {achievements.map((item) => (
              <Reorder.Item key={item.id} value={item} style={{ listStyle: 'none' }}>
                <AchievementCard style={{ flexDirection: 'row', alignItems: 'center', padding: '0.5rem 1rem', maxHeight: '80px' }}>
                  <div style={{ cursor: 'grab', marginRight: '1rem', color: '#94a3b8' }}>
                    <GripVertical size={20} />
                  </div>
                  <img
                    src={getOptimizedUrl(item.cadetPhotoUrl, 100, 70) || 'https://via.placeholder.com/50'}
                    alt={item.cadetName}
                    loading="lazy"
                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', marginRight: '1rem' }}
                    onError={(e) => {
                      if (item.cadetPhotoUrl && e.target.src !== item.cadetPhotoUrl) {
                        e.target.src = item.cadetPhotoUrl;
                      }
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>{item.rank} {item.cadetName}</h4>
                    <small style={{ color: '#64748b' }}>{item.campName || item.eventName}</small>
                  </div>
                </AchievementCard>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : filteredAchievementsItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94A3B8' }}>
            <Award size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No achievements found</h3>
            <p>Click "Add New Achievement" to get started.</p>
          </div>
        ) : (
          <Grid>
            <AnimatePresence>
              {filteredAchievementsItems.map((item) => (
                <AchievementCard
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <GroupBadge $isGroup={item.isGroup}>
                    {item.isGroup ? <Users size={14} /> : <User size={14} />}
                    {item.isGroup ? 'Squad' : 'Individual'}
                  </GroupBadge>
                  <CardHeader>
                    <Avatar style={{ borderRadius: item.isGroup ? '8px' : '50%' }}>
                      {(item.isGroup ? item.groupPhotoUrl : item.cadetPhotoUrl) ? (
                        <img 
                          src={getOptimizedUrl(item.isGroup ? item.groupPhotoUrl : item.cadetPhotoUrl, 160, 80)} 
                          alt="Preview" 
                          loading="lazy" 
                          onError={(e) => {
                            const fallbackUrl = item.isGroup ? item.groupPhotoUrl : item.cadetPhotoUrl;
                            if (fallbackUrl && e.target.src !== fallbackUrl) {
                              e.target.src = fallbackUrl;
                            }
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </Avatar>
                    <CardInfo>
                      <Badge $type={item.achievementType}>{item.achievementType || 'Camp'}</Badge>
                      <CadetName>
                        {item.isGroup ? (item.campName || item.eventName) : `${item.rank ? `${item.rank} ` : ''}${item.cadetName}`}
                      </CadetName>
                      <div style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>
                        {item.wing} Wing • {item.batch}
                      </div>
                    </CardInfo>
                  </CardHeader>

                  <CardBody>
                    <DetailRow>
                      <Award />
                      <strong>{item.campName || item.eventName || 'Unnamed Event'}</strong>
                    </DetailRow>
                    <DetailRow>
                      <Calendar />
                      {item.date}
                    </DetailRow>
                    <Description>{item.description}</Description>
                  </CardBody>

                  <CardFooter>
                    {(item.isGroup ? item.groupPhotoUrl : item.cadetPhotoUrl) && (
                      <DownloadActionButton
                        onClick={() => downloadImage(item.isGroup ? item.groupPhotoUrl : item.cadetPhotoUrl, `achievement_${item.cadetName || (item.campName || item.eventName)}`)}
                        title="Download Photo"
                      >
                        <Download size={14} />
                        Photo
                      </DownloadActionButton>
                    )}
                    {item.reportUrl && (
                      <DownloadActionButton
                        $variant="report"
                        onClick={() => downloadImage(item.reportUrl, `report_${item.cadetName || (item.campName || item.eventName)}.pdf`)}
                        title="Download Report"
                      >
                        <FileText size={14} />
                        Report
                      </DownloadActionButton>
                    )}
                    <IconButton onClick={() => handleEdit(item)} title="Edit">
                      <Edit2 size={18} />
                    </IconButton>
                    <IconButton $variant="delete" onClick={() => handleDelete(item.id)} title="Delete">
                      <Trash2 size={18} />
                    </IconButton>
                  </CardFooter>
                </AchievementCard>
              ))}
            </AnimatePresence>
          </Grid>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <ModalContainer
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                onClick={e => e.stopPropagation()}
              >
                <ModalHeader>
                  <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
                    {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
                  </h2>
                  <GhostButton onClick={() => setShowModal(false)} style={{ color: 'white', padding: '0.5rem' }}>
                    <X size={24} />
                  </GhostButton>
                </ModalHeader>

                <Form onSubmit={handleSubmit}>
                  <ModalContent>
                    <ModeToggle>
                      <ModeOption
                        type="button"
                        $active={!formData.isGroup}
                        onClick={() => setFormData({ ...formData, isGroup: false })}
                      >
                        <User size={18} /> Individual Achievement
                      </ModeOption>
                      <ModeOption
                        type="button"
                        $active={formData.isGroup}
                        onClick={() => setFormData({ ...formData, isGroup: true })}
                      >
                        <Users size={18} /> Group Achievement
                      </ModeOption>
                    </ModeToggle>

                    <FormGrid>
                      {/* Common Fields Top */}
                      <FormGroup style={{ gridColumn: '1 / -1' }}>
                        <Label>Achievement / Event Name</Label>
                        <Input
                          required
                          value={formData.achievementType === 'Camp' ? formData.campName : formData.eventName}
                          onChange={(e) => setFormData({
                            ...formData,
                            [formData.achievementType === 'Camp' ? 'campName' : 'eventName']: e.target.value
                          })}
                          placeholder="e.g. Republic Day Camp 2024"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Type</Label>
                        <Select
                          value={formData.achievementType}
                          onChange={e => setFormData({ ...formData, achievementType: e.target.value })}
                        >
                          <option value="Camp">Camp</option>
                          <option value="Event">Event</option>
                          <option value="Competition">Competition</option>
                        </Select>
                      </FormGroup>

                      <FormGroup>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          required
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Date</Label>
                        <Input
                          type="date"
                          required
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                      </FormGroup>

                      {!formData.isGroup && (
                        <FormGroup>
                          <Label>Wing</Label>
                          <Select
                            value={formData.wing}
                            onChange={e => setFormData({ ...formData, wing: e.target.value })}
                          >
                            <option value="Army">Army</option>
                            <option value="Navy">Navy</option>
                            <option value="Air">Air</option>
                          </Select>
                        </FormGroup>
                      )}

                      {!formData.isGroup && (
                        <FormGroup>
                          <Label>Batch</Label>
                          <Input
                            required
                            value={formData.batch}
                            onChange={e => setFormData({ ...formData, batch: e.target.value })}
                            placeholder="e.g. 2021-2025"
                          />
                        </FormGroup>
                      )}

                      {!formData.isGroup && (
                        <FormGroup>
                          <Label>Department</Label>
                          <Select
                            value={formData.department}
                            onChange={e => setFormData({ ...formData, department: e.target.value })}
                          >
                            <option value="">Select Department</option>
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </Select>
                        </FormGroup>
                      )}

                      <FormGroup className="full-width">
                        <Label>Description / Citation</Label>
                        <TextArea
                          required
                          value={formData.description}
                          onChange={e => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Details about the honor achieved..."
                        />
                      </FormGroup>

                      {/* Mode Specific Sections */}
                      {!formData.isGroup ? (
                        <>
                          <FormGroup>
                            <Label>Cadet Name</Label>
                            <Input
                              required
                              value={formData.cadetName}
                              onChange={e => setFormData({ ...formData, cadetName: e.target.value })}
                              placeholder="Full Name"
                            />
                          </FormGroup>
                          <FormGroup>
                            <Label>Rank</Label>
                            <Input
                              required
                              value={formData.rank}
                              onChange={e => setFormData({ ...formData, rank: e.target.value })}
                              placeholder="e.g. Cdt / Sgt"
                            />
                          </FormGroup>
                          <FormGroup className="full-width">
                            <Label>Cadet Portrait</Label>
                            <input
                              type="file"
                              id="cadet-photo"
                              hidden
                              accept="image/*"
                              onChange={e => handleFileSelect(e, 'cadet')}
                            />
                            <FileUploadBox htmlFor="cadet-photo">
                              <Upload size={24} />
                              <span>{cadetPhotoFile ? cadetPhotoFile.name : (formData.cadetPhotoUrl ? 'Update Photo' : 'Upload Cadet Photo')}</span>
                            </FileUploadBox>
                          </FormGroup>
                        </>
                      ) : (
                        <FormGroup className="full-width">
                          <Label>Group Photo (Main Thumbnail)</Label>
                          <input
                            type="file"
                            id="group-photo"
                            hidden
                            accept="image/*"
                            onChange={e => handleFileSelect(e, 'group')}
                          />
                          <FileUploadBox htmlFor="group-photo" style={{ borderColor: ACCENT_GOLD }}>
                            <ImageIcon size={24} color={ACCENT_GOLD} />
                            <span>{groupPhotoFile ? groupPhotoFile.name : (formData.groupPhotoUrl ? 'Update Group Photo' : 'Upload Group Photo')}</span>
                            <small style={{ color: '#64748B', marginTop: '0.5rem', fontSize: '0.75rem' }}>
                              Tip: Crop image to a tall portrait aspect ratio to fit the card tile perfectly.
                            </small>
                          </FileUploadBox>
                        </FormGroup>
                      )}

                      {formData.isGroup && (
                        <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', border: '2px dashed #cbd5e1', marginTop: '1.5rem', position: 'relative' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: PRIMARY_BLUE, fontSize: '1.2rem', fontWeight: 800 }}>
                              <Users size={24} color={ACCENT_GOLD} /> SQUAD COMPOSITION
                            </h4>
                            <AddButton
                              type="button"
                              onClick={() => setFormData({
                                ...formData,
                                groupMembers: [...formData.groupMembers, { rank: '', name: '', batch: '', department: '', photoUrl: '', wing: 'Army' }]
                              })}
                              style={{ background: ACCENT_GOLD, color: PRIMARY_BLUE, padding: '0.6rem 1.2rem' }}
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
                                      onChange={e => handleFileSelect(e, 'member', idx)}
                                    />
                                    <label htmlFor={`member-photo-${idx}`} style={{ cursor: 'pointer', width: '72px', height: '72px', borderRadius: '16px', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', transition: 'all 0.2s' }}>
                                      {(member.photoUrl || memberFiles[idx]) ? (
                                        <img
                                          src={memberFiles[idx] ? URL.createObjectURL(memberFiles[idx]) : member.photoUrl}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                          alt="Preview"
                                          loading="lazy"
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
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)', gap: '0.75rem' }}>
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
                                  <Select
                                    value={member.department}
                                    onChange={e => {
                                      const newMembers = [...formData.groupMembers];
                                      newMembers[idx].department = e.target.value;
                                      setFormData({ ...formData, groupMembers: newMembers });
                                    }}
                                    style={{ padding: '0.5rem', fontSize: '0.8rem', width: '100%' }}
                                  >
                                    <option value="">Department</option>
                                    {departments.map(dept => (
                                      <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                  </Select>
                                  <Select
                                    value={member.wing || 'Army'}
                                    onChange={e => {
                                      const newMembers = [...formData.groupMembers];
                                      newMembers[idx].wing = e.target.value;
                                      setFormData({ ...formData, groupMembers: newMembers });
                                    }}
                                    style={{ padding: '0.5rem', fontSize: '0.8rem', width: '100%' }}
                                  >
                                    <option value="Army">Army</option>
                                    <option value="Navy">Navy</option>
                                    <option value="Air">Air</option>
                                  </Select>
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
                              <p style={{ margin: 0, fontSize: '0.85rem' }}>Add cadets who participated in this group achievement.</p>
                            </div>
                          )}
                        </div>
                      )}

                      <FormGroup className="full-width">
                        <Label>Report (PDF/Document)</Label>
                        <input
                          type="file"
                          id="achievement-report"
                          hidden
                          accept=".pdf,.doc,.docx"
                          onChange={e => setReportFile(e.target.files[0])}
                        />
                        <FileUploadBox htmlFor="achievement-report">
                          <FileText size={24} />
                          <span>
                            {reportFile ? reportFile.name : (formData.reportUrl ? 'Change Report' : 'Upload Achievement Report (PDF)')}
                          </span>
                        </FileUploadBox>
                      </FormGroup>
                      <FormGroup style={{ gridColumn: '1 / -1' }}>
                        <Label>Camp Photos (Optional Slideshow)</Label>
                        
                        {formData.campPhotos && formData.campPhotos.length > 0 && (
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {formData.campPhotos.map((url, i) => (
                              <div key={i} style={{ position: 'relative' }}>
                                <img src={url} alt={`Camp ${i}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                                <button type="button" onClick={() => {
                                  const newPhotos = formData.campPhotos.filter((_, idx) => idx !== i);
                                  setFormData({ ...formData, campPhotos: newPhotos });
                                }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>&times;</button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {campPhotosFiles.length > 0 && (
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {Array.from(campPhotosFiles).map((file, i) => (
                              <div key={i} style={{ position: 'relative' }}>
                                <div style={{ width: '100px', height: '100px', background: '#e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem', color: '#475569' }}>
                                  {file.name}
                                </div>
                                <button type="button" onClick={() => {
                                  const newFiles = Array.from(campPhotosFiles).filter((_, idx) => idx !== i);
                                  setCampPhotosFiles(newFiles);
                                }} style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>&times;</button>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <input
                          type="file"
                          id="camp-photos"
                          multiple
                          accept="image/*"
                          onChange={(e) => setCampPhotosFiles([...campPhotosFiles, ...Array.from(e.target.files)])}
                          style={{ display: 'none' }}
                        />
                        <FileUploadBox htmlFor="camp-photos">
                          <ImageIcon size={24} />
                          <span>Select Camp Photos to Add</span>
                        </FileUploadBox>
                      </FormGroup>
                    </FormGrid>

                    <ButtonRow>
                      <GhostButton type="button" onClick={() => setShowModal(false)}>Cancel</GhostButton>
                      <PrimaryButton type="submit" disabled={uploading}>
                        <Save size={18} />
                        {uploading ? 'Saving...' : 'Save Achievement'}
                      </PrimaryButton>
                    </ButtonRow>
                  </ModalContent>
                </Form>
              </ModalContainer>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* Image Cropper Modal */}
        <AnimatePresence>
          {showCropper && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100000 }}>
              <ImageCropper
                imageSrc={croppingImage}
                aspect={cropAspect}
                cropShape={cropShape}
                onCropComplete={handleCropComplete}
                onCancel={() => {
                  setShowCropper(false);
                  setCroppingImage(null);
                  setPendingCropField(null);
                }}
              />
            </div>
          )}
        </AnimatePresence>
      </ContentWrapper>
    </PageContainer >
  );
};

export default AdminAchievementsPage;
