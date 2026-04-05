import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, writeBatch, query, where, orderBy } from 'firebase/firestore';
import { GraduationCap, ArrowLeft, Users, Search, Download, GripVertical, Edit, Save, Award } from 'lucide-react';
import { db } from '../firebase';
import SEO from '../components/common/SEO';
import CadetDetailModal from '../components/ui/CadetDetailModal';
import { getFullRank, armyRankOrder, navyRankOrder, airForceRankOrder } from '../rankStructure';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AdminCadetEditor from '../components/admin/AdminCadetEditor';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import OptimizedImage from '../components/common/OptimizedImage';
import { downloadImage } from '../utils/downloadHelper';


const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding: 100px 2rem 4rem;
  color: #1e293b;
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
  max-width: 1600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;

  @media (max-width: 1440px) {
    max-width: 1200px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 4rem;
`;

const PageTitle = styled(motion.h1)`
  font-size: 4rem;
  font-weight: 900;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;

  @media (max-width: 1440px) {
    font-size: 3.2rem;
  }
  @media (max-width: 768px) { font-size: 2.5rem; }
`;

const BackButton = styled(motion.button)`
  position: absolute;
  top: 0;
  left: 0;
  background: white;
  border: 1px solid #e2e8f0;
  width: 45px;
  height: 45px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
`;

const SearchContainer = styled.div`
  position: relative;
  max-width: 500px;
  margin: 0 auto 4rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 10px 25px rgba(0,0,0,0.03);
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  padding: 0.8rem 1rem 0.8rem 3rem;
  color: #1e293b;
  font-size: 1.1rem;
  &:focus { outline: none; }
  &::placeholder { color: #94a3b8; }
`;

const DeptGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;
`;

const DeptCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  padding: 2rem 1.2rem;
  text-align: center;
  backdrop-filter: blur(20px);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    border-color: #3b82f6;
    transform: translateY(-10px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 20px rgba(59, 130, 246, 0.1);
    &::before { opacity: 1; }
  }

  &.active {
    border-color: #3b82f6;
    background: white;
    box-shadow: 0 15px 35px rgba(59, 130, 246, 0.1);
  }
`;

const DeptIcon = styled.div`
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.2rem;
  color: white;
  box-shadow: 0 8px 16px rgba(59, 130, 246, 0.2);
`;

const DeptName = styled.h3`
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.01em;
`;

const CadetCount = styled.p`
  color: #64748b;
  font-size: 0.95rem;
  margin-top: 0.75rem;
  font-weight: 500;
`;

const CadetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 2rem;
  margin-top: 1.5rem;
`;

const CadetCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);

  &:hover {
    transform: translateY(-8px) scale(1.02);
    border-color: #3b82f6;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
  }
`;

const CadetPhoto = styled(OptimizedImage)`
  width: 100%;
  height: 260px;
`;


const CadetInfo = styled.div`
  padding: 1.5rem;
  text-align: center;
`;

const CadetName = styled.h4`
  font-size: 1.2rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.4rem;
`;

const CadetRank = styled.p`
  color: #3b82f6;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const StudentID = styled.p`
  font-size: 0.85rem;
  color: #94a3b8;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05rem;
  margin-top: 0.2rem;
`;

const SectionHeader = styled.h2`
  grid-column: 1 / -1;
  font-size: 1.8rem;
  font-weight: 800;
  color: #1e293b;
  margin: 4rem 0 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  
  .badge {
    font-size: 0.85rem;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .personnel {
    background: #f1f5f9;
    color: #64748b;
  }

  .batch {
    background: #1A2B4C;
    color: white;
    box-shadow: 0 4px 12px rgba(26, 43, 76, 0.2);
  }
`;

const NameListButton = styled(motion.button)`
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: #1a2b4c;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: all 0.2s;
  
  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 6px 12px rgba(0,0,0,0.1);
  }
`;

const AdminActions = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
`;

const ActionButton = styled(motion.button)`
  background: ${props => props.$variant === 'download' ? '#2563eb' : 'white'};
  color: ${props => props.$variant === 'download' ? 'white' : '#1e293b'};
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  border: 1px solid #eee;
  
  &:hover { 
    background: ${props => props.$variant === 'download' ? '#1d4ed8' : '#f8fafc'};
    color: ${props => props.$variant === 'download' ? 'white' : '#3b82f6'};
  }
`;

const DragHandle = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 5px;
  color: #94a3b8;
  cursor: grab;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  
  &:active { cursor: grabbing; }
`;

const SortableCadetCard = ({ cadet, isAdmin, onCadetClick, onAdminEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: cadet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    opacity: isDragging ? 0.6 : 1,
    cursor: 'grabbing'
  };

  return (
    <CadetCard
      ref={setNodeRef}
      style={style}
      whileHover={isDragging ? {} : { y: -8, scale: 1.02 }}
    >
      {isAdmin && (
        <>
          <AdminActions>
            <ActionButton
              $variant="download"
              onPointerDown={e => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const photoUrl = cadet.photoURL || cadet.photoUrl || cadet.imageUrl || cadet.image || cadet.profileUrl;
                if (photoUrl) downloadImage(photoUrl, `cadet_${cadet.Name || cadet.name}`);
              }}
              title="Download Photo"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ width: 'auto', padding: '0 10px', background: '#2563eb', color: 'white' }}
            >
              <Download size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: '800', marginLeft: '4px' }}>Download</span>
            </ActionButton>
            <ActionButton
              onPointerDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onAdminEdit(cadet); }}
              title="Edit Cadet"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Edit size={16} />
            </ActionButton>
          </AdminActions>
          <DragHandle {...attributes} {...listeners}>
            <GripVertical size={20} />
          </DragHandle>
        </>
      )}
      <div onClick={() => onCadetClick(cadet)}>
        {(() => {
          const photoUrl = cadet.photoURL || cadet.photoUrl || cadet.imageUrl || cadet.image || cadet.profileUrl;
          return photoUrl ? (
            <CadetPhoto
              src={photoUrl}
              width={600}
              quality={80}
              alt={cadet.Name || cadet.name}
              objectFit="cover"
              objectPosition="top center"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div style={{ height: 260, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={60} color="#334155" />
            </div>
          );
        })()}
        <CadetInfo>
          <CadetName>{cadet.Name || cadet.name || 'Name Pending'}</CadetName>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <CadetRank>{getFullRank(cadet.rank) || 'Cadet'}</CadetRank>
            {cadet.seniority?.label && (
              <>
                <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>•</span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: cadet.seniority.isPassedOut ? '#94a3b8' : '#10b981',
                  textTransform: 'uppercase'
                }}>
                  {cadet.seniority.label}
                </span>
              </>
            )}
          </div>
          {(cadet.studentID || cadet.secID) && (
            <StudentID>ID: {cadet.studentID || cadet.secID || cadet.regNo}</StudentID>
          )}
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>
            {cadet.Wing} Wing | Batch {cadet.Batch}
          </p>
        </CadetInfo>
      </div>
    </CadetCard>
  );
};

const DepartmentCadetsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = !!user;
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [cadets, setCadets] = useState([]);
  const [alumniInDept, setAlumniInDept] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState('');
  const [selectedCadet, setSelectedCadet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminEditModalOpen, setIsAdminEditModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const showImageWhenReady = useCallback((e) => {
    e.currentTarget.style.opacity = 1;
  }, []);

  const handleImageLoadError = useCallback((e, originalUrl = '') => {
    const currentSrc = e.currentTarget.getAttribute('src') || '';

    if (originalUrl && currentSrc !== originalUrl) {
      e.currentTarget.setAttribute('src', originalUrl);
      return;
    }

    e.currentTarget.style.opacity = 1;
  }, []);

  const getCadetStatus = useCallback((batchValue) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed: 0=Jan, 8=Sep

    // Extract start year from batch (e.g. "2023" or "2023-2026")
    const yearMatch = (batchValue || '').toString().match(/\d{4}/);
    const startYear = yearMatch ? parseInt(yearMatch[0]) : 0;

    if (!startYear) return { isPassedOut: true, yearsIn: 0, label: 'N/A', order: 9 };

    // Passed out after March 31 of startYear + 3
    const passOutDate = new Date(startYear + 3, 2, 31); // March 31
    if (now > passOutDate) {
      return { isPassedOut: true, yearsIn: 0, label: 'Passed Out', order: 4 };
    }

    // Check which NCC year they are in
    // Year 1 starts Sept of startYear, Year 2 starts Sept of startYear+1, etc.
    const pastSeptOf = (y) => currentYear > y || (currentYear === y && currentMonth >= 8);

    let nccYear;
    if (pastSeptOf(startYear + 2)) {
      nccYear = 3; // Senior Cadet
    } else if (pastSeptOf(startYear + 1)) {
      nccYear = 2; // Junior Cadet
    } else if (pastSeptOf(startYear)) {
      nccYear = 1; // Sub-Junior Cadet
    } else {
      nccYear = 1; // Not yet started — treat as Sub-Junior
    }

    switch (nccYear) {
      case 3: return { isPassedOut: false, yearsIn: 3, label: 'Senior Cadet', order: 1 };
      case 2: return { isPassedOut: false, yearsIn: 2, label: 'Junior Cadet', order: 2 };
      default: return { isPassedOut: false, yearsIn: 1, label: 'Sub-Junior Cadet', order: 3 };
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "cadets"));
      const deptMap = {};

      querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.dept) {
          const dept = data.dept.trim().toUpperCase();
          const status = getCadetStatus(data.Batch);

          if (!deptMap[dept]) deptMap[dept] = { total: 0, active: 0 };
          deptMap[dept].total++;
          if (!status.isPassedOut) deptMap[dept].active++;
        }
      });
      const sortedDepts = Object.keys(deptMap).sort().map(name => ({
        name,
        count: deptMap[name].active,
        total: deptMap[name].total
      }));
      setDepartments(sortedDepts);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  }, [getCadetStatus]);

  const fetchCadetsInDept = useCallback(async (deptName) => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "cadets"));
      const fetchedCadets = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(c => c.dept && c.dept.trim().toUpperCase() === deptName.toUpperCase());

      const wingOrder = { 'Air': 1, 'Army': 2, 'Navy': 3 };

      const sortedCadets = fetchedCadets.map(c => ({
        ...c,
        seniority: getCadetStatus(c.Batch)
      })).sort((a, b) => {
        // 1. Seniority Level
        if (a.seniority.order !== b.seniority.order) {
          return a.seniority.order - b.seniority.order;
        }

        // 2. Manual 'order' field
        if (a.order !== undefined && b.order !== undefined) {
          if (a.order !== b.order) return a.order - b.order;
        } else if (a.order !== undefined) {
          return -1;
        } else if (b.order !== undefined) {
          return 1;
        }

        // 3. Rank Order
        const getRankWeight = (cadet) => {
          const rank = cadet.rank || 'Unranked';
          const wing = (cadet.Wing || '').toLowerCase();
          let list = [];
          if (wing.includes('army')) list = armyRankOrder;
          else if (wing.includes('navy')) list = navyRankOrder;
          else if (wing.includes('air')) list = airForceRankOrder;

          const index = list.indexOf(rank);
          return index === -1 ? 999 : index;
        };

        const rankA = getRankWeight(a);
        const rankB = getRankWeight(b);
        if (rankA !== rankB) return rankA - rankB;

        // 4. Batch Year
        const yearA = (a.Batch || '').toString().match(/\d{4}/);
        const yearB = (b.Batch || '').toString().match(/\d{4}/);
        const startA = yearA ? parseInt(yearA[0]) : 0;
        const startB = yearB ? parseInt(yearB[0]) : 0;
        if (startA !== startB) return startB - startA;

        // 5. Wing Order
        const orderA = wingOrder[a.Wing] || 99;
        const orderB = wingOrder[b.Wing] || 99;
        if (orderA !== orderB) return orderA - orderB;

        // 6. Name
        return (a.Name || a.name || '').localeCompare(b.Name || b.name || '');
      });

      setCadets(sortedCadets);

      // Also fetch alumni in this department
      try {
        const alumniSnap = await getDocs(collection(db, 'alumni'));
        const deptAlumni = alumniSnap.docs
          .map(d => ({ id: d.id, ...d.data(), isAlumni: true }))
          .filter(a => {
            const alumDept = (a.department || '').trim().toUpperCase();
            return alumDept === deptName.toUpperCase();
          });
        setAlumniInDept(deptAlumni);
      } catch (err) {
        console.error('Error fetching alumni:', err);
        setAlumniInDept([]);
      }
    } catch (error) {
      console.error("Error fetching cadets:", error);
    } finally {
      setLoading(false);
    }
  }, [getCadetStatus]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDeptClick = (dept) => {
    setSelectedDept(dept);
    fetchCadetsInDept(dept);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCadetClick = (cadet) => {
    setSelectedCadet(cadet);
    setIsModalOpen(true);
  };

  const handleAdminEditClick = (cadet) => {
    setSelectedCadet(cadet);
    setIsAdminEditModalOpen(true);
  };

  const handleDragEnd = (event, seniorityLabel) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const groupCadets = cadets.filter(c => c.seniority.label === seniorityLabel);
    const oldIndex = groupCadets.findIndex(c => c.id === active.id);
    const newIndex = groupCadets.findIndex(c => c.id === over.id);

    const reorderedGroup = arrayMove(groupCadets, oldIndex, newIndex);

    // Update local state by correctly splicing the reordered group into the main list
    const newCadetsState = [...cadets];
    const startIndex = newCadetsState.findIndex(c => c.seniority.label === seniorityLabel);
    newCadetsState.splice(startIndex, reorderedGroup.length, ...reorderedGroup);

    // Update local state to reflect new manual order
    const finalizedState = newCadetsState.map((c, i) => {
      if (c.seniority.label === seniorityLabel) {
        const groupIndex = reorderedGroup.findIndex(gc => gc.id === c.id);
        return { ...c, order: groupIndex };
      }
      return c;
    });

    setCadets(finalizedState);
    setHasUnsavedChanges(true);
  };

  const saveReordering = async () => {
    if (!hasUnsavedChanges) return;
    setLoading(true);
    try {
      const batchOp = writeBatch(db);
      ['Senior Cadet', 'Cadet', 'NCC Passed Out Cadet'].forEach(label => {
        const group = cadets.filter(c => c.seniority.label === label);
        group.forEach((cadet, index) => {
          const ref = doc(db, 'cadets', cadet.id);
          batchOp.update(ref, { order: index });
        });
      });
      await batchOp.commit();
      setHasUnsavedChanges(false);
      alert("Custom order saved successfully!");
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Failed to save order.");
    } finally {
      setLoading(false);
    }
  };

  const generateDeptNameList = (passedOutOnly = false) => {
    if (!selectedDept) return;
    try {
      const filteredCadets = cadets.filter(c =>
        passedOutOnly ? c.seniority.label === 'NCC Passed Out Cadet' : c.seniority.label !== 'NCC Passed Out Cadet'
      );

      if (filteredCadets.length === 0) {
        alert(`No ${passedOutOnly ? 'passed out' : 'active'} cadets found to generate Excel.`);
        return;
      }

      const excelData = filteredCadets.map(cadet => ({
        'Department': selectedDept,
        'Seniority': cadet.seniority.label,
        'Rank': cadet.rank,
        'Name': cadet.Name || cadet.name || 'N/A',
        'Regimental Number': cadet.regimentalNo || 'N/A',
        'Student ID': cadet.studentID || cadet.secID || 'N/A',
        'Batch': cadet.Batch || 'N/A',
        'Wing': cadet.Wing || 'N/A',
        'Section': cadet.section || 'N/A',
        'Dossier': cadet.pdfURL || 'N/A',
        'Photo Link': cadet.photoURL || 'N/A'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, passedOutOnly ? "Passed Out List" : "Active List");

      const wscols = [
        { wch: 15 }, // Dept
        { wch: 20 }, // Seniority
        { wch: 20 }, // Rank
        { wch: 30 }, // Name
        { wch: 40 }, // Regimental No
        { wch: 20 }, // Student ID
        { wch: 15 }, // Batch
        { wch: 10 }, // Wing
        { wch: 60 }, // Dossier
      ];
      worksheet['!cols'] = wscols;

      const fileName = `${selectedDept}_${passedOutOnly ? 'PassedOut' : 'Cadet'}_List.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Error generating Excel:", err);
      alert("Failed to generate Excel file.");
    }
  };

  const filteredDepts = departments.filter(d =>
    d.name.toLowerCase().includes(searching.toLowerCase())
  );

  return (
    <PageContainer>
      <SEO title="Department Wise Cadet List" description="View NCC cadets from various departments of Sri Sairam Engineering College." />

      <BackgroundElements>
        <div style={{ top: '10%', right: '10%', width: '400px', height: '400px', background: '#3b82f6' }} />
        <div style={{ bottom: '10%', left: '10%', width: '500px', height: '500px', background: '#fbbf24' }} />
      </BackgroundElements>

      <ContentWrapper>
        <BackButton
          whileHover={{ scale: 1.1, background: 'rgba(255, 255, 255, 0.1)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => selectedDept ? setSelectedDept(null) : navigate('/')}
        >
          <ArrowLeft size={24} />
        </BackButton>

        <Header>
          <PageTitle
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            {selectedDept ? selectedDept : 'Architects of Future'}
          </PageTitle>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>
              {selectedDept ? `The elite cadets of ${selectedDept} Department` : 'Select a department to explore its NCC strength'}
            </p>
            {selectedDept && (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <NameListButton
                  onClick={() => generateDeptNameList(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={20} /> Download Name List
                </NameListButton>
                <NameListButton
                  onClick={() => generateDeptNameList(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ background: '#f8fafc', color: '#64748b' }}
                >
                  <Download size={20} /> Download Passed Out List
                </NameListButton>
                {isAdmin && hasUnsavedChanges && (
                  <NameListButton
                    onClick={saveReordering}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ background: '#10b981', color: 'white', borderColor: '#059669' }}
                  >
                    <Save size={20} /> Save Custom Order
                  </NameListButton>
                )}
              </div>
            )}
          </div>
        </Header>

        {!selectedDept && (
          <SearchContainer>
            <Search style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} size={22} />
            <SearchInput
              type="text"
              placeholder="Filter by Department..."
              value={searching}
              onChange={(e) => setSearching(e.target.value)}
            />
          </SearchContainer>
        )}

        <AnimatePresence mode="wait">
          {loading ? (
            <div key="loading" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Syncing with records...</div>
          ) : !selectedDept ? (
            <DeptGrid key="depts">
              {filteredDepts.map((dept, index) => (
                <DeptCard
                  key={dept.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleDeptClick(dept.name)}
                >
                  <DeptIcon><GraduationCap size={35} /></DeptIcon>
                  <DeptName>{dept.name}</DeptName>
                  <CadetCount>{dept.count} Active Cadets</CadetCount>
                  {dept.total > dept.count && <CadetCount style={{ marginTop: 0, fontSize: '0.8rem', color: '#94a3b8' }}>{dept.total} Total</CadetCount>}
                </DeptCard>
              ))}
            </DeptGrid>
          ) : (
            <div key="cadets-list">
              {/* ─── Present Cadets ─── */}
              {['Senior Cadet', 'Junior Cadet', 'Sub-Junior Cadet'].map(seniorityLabel => {
                const groupCadets = cadets.filter(c => c.seniority.label === seniorityLabel);
                if (groupCadets.length === 0) return null;

                const pluralLabel = seniorityLabel + (groupCadets.length > 1 ? 's' : '');

                // Extract common batch
                const commonBatch = groupCadets[0]?.Batch || '';

                return (
                  <div key={seniorityLabel} style={{ marginBottom: '4rem' }}>
                    <SectionHeader>
                      {pluralLabel}
                      {commonBatch && <span className="badge batch">Batch {commonBatch}</span>}
                      <span className="badge personnel">{groupCadets.length} Personnel</span>
                    </SectionHeader>

                    {isAdmin ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, seniorityLabel)}
                      >
                        <SortableContext
                          items={groupCadets.map(c => c.id)}
                          strategy={rectSortingStrategy}
                        >
                          <CadetGrid>
                            {groupCadets.map((cadet) => (
                              <SortableCadetCard
                                key={cadet.id}
                                cadet={cadet}
                                isAdmin={isAdmin}
                                onCadetClick={handleCadetClick}
                                onAdminEdit={handleAdminEditClick}
                              />
                            ))}
                          </CadetGrid>
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <CadetGrid>
                        {groupCadets.map((cadet) => (
                          <CadetCard
                            key={cadet.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => handleCadetClick(cadet)}
                          >
                            {(() => {
                              const photoUrl = cadet.photoURL || cadet.photoUrl || cadet.imageUrl || cadet.image || cadet.profileUrl;
                              return photoUrl ? (
                                <CadetPhoto
                                  src={getOptimizedUrl(photoUrl, 400, 80)}
                                  alt={cadet.Name || cadet.name}
                                  objectFit="cover"
                                  objectPosition="center 10%"
                                />
                              ) : (
                                <div style={{ height: 260, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users size={60} color="#334155" />
                                </div>
                              );
                            })()}
                            <CadetInfo>
                              <CadetName>{cadet.Name || cadet.name || 'Name Pending'}</CadetName>
                              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                                <CadetRank>{getFullRank(cadet.rank) || 'Cadet'}</CadetRank>
                                <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>•</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>{cadet.seniority?.label || 'Cadet'}</span>
                              </div>
                              {(cadet.studentID || cadet.secID) && (
                                <StudentID>ID: {cadet.studentID || cadet.secID || cadet.regNo}</StudentID>
                              )}
                              <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>
                                {cadet.Wing} Wing | Batch {cadet.Batch}
                              </p>
                            </CadetInfo>
                          </CadetCard>
                        ))}
                      </CadetGrid>
                    )}
                  </div>
                );
              })}

              {/* ─── Passed Out Cadets — Grouped by Batch ─── */}
              {(() => {
                const passedOutCadets = cadets.filter(c => c.seniority.isPassedOut);
                // Group by batch
                const batchMap = {};
                passedOutCadets.forEach(c => {
                  const batch = c.Batch || 'Unknown';
                  if (!batchMap[batch]) batchMap[batch] = [];
                  batchMap[batch].push(c);
                });

                // Improved name matching logic (handles initials/spacing/word order)
                const isSimilarName = (name1, name2) => {
                  if (!name1 || !name2) return false;

                  const normalize = (nm) => nm.toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
                    .split(/\s+/)
                    .filter(w => w.length > 0)
                    .sort(); // Sort words for order-independent comparison

                  const words1 = normalize(name1);
                  const words2 = normalize(name2);

                  // Exact match after normalization and sorting
                  if (words1.join(' ') === words2.join(' ')) return true;

                  // Significant word match (ignore 1-letter initials)
                  const sig1 = words1.filter(w => w.length > 1);
                  const sig2 = words2.filter(w => w.length > 1);

                  if (sig1.length > 0 && sig2.length > 0) {
                    const matchCount = sig1.filter(w => sig2.includes(w)).length;
                    const maxLen = Math.max(sig1.length, sig2.length);
                    // Match if majority of significant words match
                    if (matchCount / maxLen >= 0.6) return true;
                  }

                  // Fallback for initials/short names: check if one is a subset of the other
                  const raw1 = words1.join('');
                  const raw2 = words2.join('');
                  return raw1.includes(raw2) || raw2.includes(raw1);
                };

                // Merge alumni: if alumni matches a cadet (by email or name), MERGE them
                alumniInDept.forEach(a => {
                  const batch = a.batch || 'Unknown';
                  if (!batchMap[batch]) batchMap[batch] = [];

                  const mergeData = (cadet, alumni) => {
                    const alumniPhoto = alumni.photoUrl || alumni.photoURL || alumni.imageUrl || alumni.image;
                    const cadetPhoto = cadet.photoURL || cadet.photoUrl || cadet.imageUrl || cadet.image;

                    return {
                      ...cadet,
                      ...alumni,
                      isAlumni: true,
                      hasMerged: true, // Internal flag
                      photoURL: alumniPhoto || cadetPhoto,
                      name: alumni.name || cadet.Name || cadet.name,
                      rank: cadet.rank || alumni.rank,
                      studentID: cadet.studentID || alumni.studentID || cadet.secID || cadet.regNo,
                      Batch: alumni.batch || cadet.Batch,
                      Wing: alumni.wing || cadet.Wing
                    };
                  };

                  // Check if a matching cadet exists in this batch (Fuzzy logic)
                  const matchIdx = batchMap[batch].findIndex(c =>
                    !c.hasMerged && (
                      (c.email && a.email && c.email.toLowerCase() === a.email.toLowerCase()) ||
                      isSimilarName(c.Name || c.name, a.name)
                    )
                  );

                  if (matchIdx !== -1) {
                    batchMap[batch][matchIdx] = mergeData(batchMap[batch][matchIdx], a);
                  } else {
                    // Check other batches
                    let foundElsewhere = false;
                    for (const b of Object.keys(batchMap)) {
                      const idx = batchMap[b].findIndex(c =>
                        !c.hasMerged && (
                          (c.email && a.email && c.email.toLowerCase() === a.email.toLowerCase()) ||
                          isSimilarName(c.Name || c.name, a.name)
                        )
                      );
                      if (idx !== -1) {
                        batchMap[b][idx] = mergeData(batchMap[b][idx], a);
                        foundElsewhere = true;
                        break;
                      }
                    }
                    if (!foundElsewhere) {
                      batchMap[batch].push({ ...a, isAlumni: true, hasMerged: true });
                    }
                  }
                });

                // Sort batches in descending order
                const sortedBatches = Object.keys(batchMap).sort((a, b) => {
                  const yearA = a.match(/\d{4}/);
                  const yearB = b.match(/\d{4}/);
                  return (yearB ? parseInt(yearB[0]) : 0) - (yearA ? parseInt(yearA[0]) : 0);
                });

                if (sortedBatches.length === 0) return null;

                return sortedBatches.map(batch => {
                  const members = batchMap[batch];
                  return (
                    <div key={batch}>
                      <SectionHeader>
                        Batch {batch} <span className="badge personnel">{members.length} {members.length === 1 ? 'Member' : 'Members'}</span>
                      </SectionHeader>
                      <CadetGrid>
                        {members.map((member) => (
                          <CadetCard
                            key={member.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => !member.isAlumni && handleCadetClick(member)}
                            style={{ cursor: member.isAlumni ? 'default' : 'pointer' }}
                          >
                            {(() => {
                              const photoUrl = member.photoURL || member.photoUrl || member.imageUrl || member.image || member.profileUrl;

                              if (member.isAlumni) {
                                return photoUrl ? (
                                  <CadetPhoto
                                    src={getOptimizedUrl(photoUrl, 600, 85)}
                                    alt={member.name}
                                    objectFit="cover"
                                    objectPosition="center 15%"
                                    style={{ background: '#f8fafc' }}
                                  />
                                ) : (
                                  <div style={{ height: 260, background: 'linear-gradient(135deg, #1A2B4C, #2D4A7C)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={60} color="rgba(255,255,255,0.3)" />
                                  </div>
                                );
                              }

                              return photoUrl ? (
                                <CadetPhoto
                                  src={getOptimizedUrl(photoUrl, 600, 85)}
                                  alt={member.Name || member.name}
                                  objectFit="cover"
                                  objectPosition="center 15%"
                                />
                              ) : (
                                <div style={{ height: 260, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Users size={60} color="#334155" />
                                </div>
                              );
                            })()}
                            <CadetInfo>
                              <CadetName>{member.isAlumni ? (member.name || member.Name) : (member.Name || member.name || 'Name Pending')}</CadetName>
                              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                                {member.isAlumni ? (
                                  <>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFBF00', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                      <Award size={14} /> Alumni
                                    </span>
                                    {member.rank && <CadetRank>{getFullRank(member.rank)}</CadetRank>}
                                  </>
                                ) : (
                                  <>
                                    <CadetRank>{getFullRank(member.rank) || 'Cadet'}</CadetRank>
                                    <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>•</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Passed Out</span>
                                  </>
                                )}
                              </div>
                              {member.isAlumni ? (
                                <>
                                  {member.currentPosition && <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>{member.currentPosition}</p>}
                                  {member.company && <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>{member.company}</p>}
                                  {(member.studentID || member.secID || member.regNo) && (
                                    <StudentID>ID: {member.studentID || member.secID || member.regNo}</StudentID>
                                  )}
                                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>
                                    {member.wing || member.Wing} Wing | {member.batch || member.Batch}
                                  </p>
                                </>
                              ) : (
                                <>
                                  {(member.studentID || member.secID) && (
                                    <StudentID>ID: {member.studentID || member.secID || member.regNo}</StudentID>
                                  )}
                                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.4rem', fontWeight: 500 }}>
                                    {member.Wing} Wing | Batch {member.Batch}
                                  </p>
                                </>
                              )}
                            </CadetInfo>
                          </CadetCard>
                        ))}
                      </CadetGrid>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </AnimatePresence>
      </ContentWrapper>

      <CadetDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        cadet={selectedCadet}
      />

      <AdminCadetEditor
        isOpen={isAdminEditModalOpen}
        onClose={() => setIsAdminEditModalOpen(false)}
        cadet={selectedCadet}
        onComplete={() => fetchCadetsInDept(selectedDept)}
      />
    </PageContainer >
  );
};

export default DepartmentCadetsPage;
