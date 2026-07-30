// src/pages/WingPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { ArrowLeft, Users, Target, Trophy, Calendar, ChevronLeft, Edit, Edit2, Plus, Trash2, ChevronRight, GripVertical, Download, CheckSquare, Square, CheckCircle2, RotateCcw, X as CloseIcon } from 'lucide-react';
import { armyRankOrder, navyRankOrder, airForceRankOrder, getFullRank, normalizeRank } from '../rankStructure';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove, arrayUnion, deleteDoc, writeBatch, orderBy, limit } from 'firebase/firestore';
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
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { uploadFileToFirebaseStorage } from '../utils/firebaseStorage';
import CadetDetailModal from '../components/ui/CadetDetailModal';
import AdminCadetEditor from '../components/admin/AdminCadetEditor';
import AddCadetModal from '../components/admin/AddCadetModal';
import AddBatchModal from '../components/admin/AddBatchModal';
import EditBatchModal from '../components/admin/EditBatchModal';
import OptimizedImage from '../components/common/OptimizedImage';
import SEO from '../components/common/SEO';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import { prefetchList } from '../utils/mediaCache';
import { getWingCandidates, toCanonicalWing } from '../utils/wingUtils';
import * as XLSX from 'xlsx';
import { downloadImage } from '../utils/downloadHelper';


// --- STYLES (Unchanged) ---
const PageContainer = styled(motion.div)`
  min-height: 100vh;
  padding-top: 72px;
  background-color: #F0F2F5;
`;
const NavStack = styled.div`
  position: fixed;
  top: 100px;
  left: 2rem;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none; /* Container itself shouldn't block */

  @media (max-width: 768px) {
    top: 20px;
    left: 1rem;
    gap: 8px;
  }
`;

const PremiumNavButton = styled(motion.button)`
  pointer-events: auto;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.25rem;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #1A2B4C;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  width: fit-content;
  border-left: 4px solid ${props => props.$accent || '#1A2B4C'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 8px;
    background: ${props => props.$accent + '15' || '#f0f2f5'};
    color: ${props => props.$accent || '#1A2B4C'};
  }

  span {
    white-space: nowrap;
    opacity: 0.8;
  }

  &:hover {
    background: white;
    transform: translateX(10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.12);
    border-left-width: 8px;
    span { opacity: 1; }
  }

  @media (max-width: 768px) {
    padding: 0.6rem 1rem;
    font-size: 0.8rem;
    span { display: ${props => props.$hideOnMobile ? 'none' : 'block'}; }
  }
`;

const HeroSection = styled.div`
  height: 88vh;
  position: relative;
  display: flex;
  align-items: flex-start; /* Move text to the top */
  justify-content: center;
  margin-bottom: 4rem;
  overflow: hidden;
  background: #1A2B4C;
`;
const HeroOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom, 
    rgba(10, 21, 41, 0.8) 0%, 
    transparent 30%, 
    transparent 70%, 
    rgba(10, 21, 41, 0.8) 100%
  );
  z-index: 2;
  pointer-events: none;
`;
const HeroContent = styled(motion.div)`
  position: absolute;
  top: 100px;
  left: 2rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  padding: 1rem 1.5rem;
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  z-index: 20;
  max-width: 450px;
  pointer-events: none;
  border-left: 8px solid ${props => props.$wingColor || '#1A2B4C'};
  transform-origin: left;

  @media (max-width: 768px) {
    top: 90px;
    left: 1rem;
    right: 1rem;
    max-width: unset;
    text-align: center;
    border-left: none;
    border-top: 6px solid ${props => props.$wingColor || '#1A2B4C'};
    padding: 1.25rem;
    transform-origin: center;
  }
`;
const WingTitle = styled(motion.h1)`
  font-size: clamp(1.8rem, 4vw, 2.5rem);
  font-weight: 900;
  margin: 0;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1;
  text-transform: uppercase;
`;
const WingMotto = styled(motion.p)`
  font-size: 1.1rem;
  color: #475569;
  font-style: italic;
  margin-top: 0.4rem;
  font-weight: 500;
  opacity: 0.9;
`;
const CarouselWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;
const SlideContainer = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
`;
const BlurredBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$bgImage});
  background-size: cover;
  background-position: center;
  filter: blur(20px) brightness(0.8);
  transform: scale(1.1);
`;
const MainImage = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$bgImage});
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
`;
const NavArrow = styled(motion.button)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 4;
  backdrop-filter: blur(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  color: #1A2B4C;
  &.prev { left: 2rem; }
  &.next { right: 2rem; }
`;
const DotsContainer = styled.div`
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 10px;
  z-index: 4;
`;
const Dot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1px solid white;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.3s ease;
  &.active {
    background: #FFFFFF;
  }
`;
const ContentSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem 4rem;
`;

const UnitSwitcher = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin: 2rem auto 3rem; /* CHANGED FROM negative margin to positive */
  position: relative;
  z-index: 100;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    margin-top: 1rem;
    gap: 1rem;
  }
`;

const UnitButton = styled(motion.button)`
  background: white;
  border: 2px solid ${props => props.$active ? props.$color : '#e2e8f0'};
  padding: 1rem 2rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
  font-weight: 700;
  color: ${props => props.$active ? props.$color : '#64748b'};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0,0,0,0.1);
    border-color: ${props => props.$color};
  }

  svg {
    color: ${props => props.$active ? props.$color : '#94a3b8'};
  }
`;
const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
`;
const InfoCard = styled(motion.div)`
  background: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
`;
const CardIcon = styled.div`
  width: 50px;
  height: 50px;
  background: #F0F2F5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1A2B4C;
  margin-bottom: 1rem;
`;
const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  color: #1A2B4C;
  margin-bottom: 1rem;
`;
const CardDescription = styled.p`
  color: #555;
  line-height: 1.6;
`;
const SelectionGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
`;
const SelectionCardContainer = styled(motion.div)`
  position: relative;
`;
const SelectionCard = styled.button`
  height: 150px;
  width: 100%;
  border-radius: 25px;
  cursor: pointer;
  background: #FFFFFF;
  color: #1A2B4C;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  font-size: 1.8rem;
  font-weight: 700;
`;
const AddBatchCard = styled(SelectionCard)`
  border-style: dashed;
  color: #6c757d;
`;
const DeleteBatchButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #fbebeb;
  color: #c53030;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  &:hover {
    background: #c53030;
    color: white;
  }
`;

const EditBatchButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 3.5rem;
  background: #f0f7ff;
  color: #2563eb;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
  &:hover {
    background: #2563eb;
    color: white;
    transform: scale(1.1);
  }
`;

const UndoToast = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  left: 2rem;
  background: #1A2B4C;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  z-index: 2500;
  border: 1px solid rgba(255,255,255,0.1);
`;
const DetailsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
`;
// Removed BackToBatchButton as it's replaced by PremiumNavButton in the NavStack

const AddNewCadetButton = styled(motion.button)`
  background: #FFFFFF;
  border: 1px solid #1A2B4C;
  color: #1A2B4C;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  
  &:hover {
    background: #1A2B4C;
    color: white;
  }
`;
const RankSection = styled.div`
  margin-bottom: 3rem;
`;
const RankTitle = styled.h3`
  font-size: 1.5rem;
  color: #1A2B4C;
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 600;
  letter-spacing: 1px;
`;
const CadetGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem;
`;
const CadetCard = styled(motion.div)`
  text-align: center;
  width: 200px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  user-select: none;
`;
const CadetPhotoContainer = styled.div`
  height: ${props => props.$rounded ? '150px' : '250px'};
  width: ${props => props.$rounded ? '150px' : '100%'};
  margin: ${props => props.$rounded ? '1.5rem auto 1rem' : '0'};
  border-radius: ${props => props.$rounded ? '50%' : '0'};
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #adb5bd;
  cursor: pointer;
  overflow: hidden;
  ${props => props.$rounded && `
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    border: 3px solid white;
  `}
`;
// CadetPhoto is now handled by OptimizedImage component directly for caching
const CadetName = styled.p`
  font-weight: 700;
  font-size: 1.1rem;
  padding: 0.75rem 0.5rem 0.25rem;
  margin: 0;
  color: #1A2B4C;
  cursor: pointer;
`;
const NoCadetsMessage = styled.p`
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 2rem;
`;
const LoadingText = styled.p`
  text-align: center;
  font-size: 1.2rem;
  color: #555;
  padding: 3rem;
`;
const AdminEditButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(26, 43, 76, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(5px);
  z-index: 10;
  transition: background 0.2s;
  &:hover {
    background: #1A2B4C;
  }
`;

const AdminDownloadButton = styled.button`
  position: absolute;
  top: 52px;
  right: 8px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0 12px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  font-weight: 700;
  font-size: 0.75rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: all 0.2s;
  
  &:hover {
    background: #1d4ed8;
    transform: scale(1.05);
  }
  &:active { transform: scale(0.95); }
`;

const AdminDeleteButton = styled.button`
  position: absolute;
  top: 8px;
  right: 52px;
  background: rgba(220, 38, 38, 0.8);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(5px);
  z-index: 10;
  transition: all 0.2s;
  &:hover {
    background: #dc2626;
    transform: scale(1.1);
  }
`;

const DragHandle = styled.div`
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #1A2B4C;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  backdrop-filter: blur(5px);
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  &:active { cursor: grabbing; }
`;
// ✨ Updated CadetInfo style
const CadetInfo = styled.p`
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
  padding: 0 0.5rem 0.25rem; /* Reduced bottom padding slightly */
  line-height: 1.4;
  white-space: nowrap; /* Prevent wrapping */
  overflow: hidden; /* Hide overflow */
  text-overflow: ellipsis; /* Add ellipsis (...) for overflow */
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  border-bottom: 2px solid rgba(0,0,0,0.05);
  padding-bottom: 1rem;
`;

const TabButton = styled.button`
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.$active ? '#1A2B4C' : '#64748b'};
  background: ${props => props.$active ? 'rgba(26, 43, 76, 0.05)' : 'transparent'};
  border: none;
  border-bottom: 3px solid ${props => props.$active ? '#1A2B4C' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px 8px 0 0;

  &:hover {
    color: #1A2B4C;
    background: rgba(26, 43, 76, 0.02);
  }

  @media (max-width: 600px) {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
`;

const TabContent = styled(motion.div)`
  width: 100%;
`;

const PDFViewerContainer = styled.div`
  width: 100%;
  height: 800px;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const EmptyPDFState = styled.div`
  text-align: center;
  padding: 4rem;
  color: #64748b;
  
  h3 { margin-bottom: 1rem; color: #1A2B4C; }
`;

const AdminUploadTools = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: white;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const NameListButton = styled(motion.button)`
  background: #2D4A7C;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(45, 74, 124, 0.2);
  
  &:hover { background: #1A2B4C; }
`;

const MaterialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
`;

const MaterialCard = styled(motion.div)`
  background: white;
  padding: 1.25rem;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  box-shadow: 0 4px 6px rgba(0,0,0,0.02);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #1A2B4C;
    transform: translateY(-3px);
    box-shadow: 0 12px 20px rgba(0,0,0,0.08);
  }
`;

const MaterialIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1A2B4C;
  flex-shrink: 0;
`;

const MaterialMeta = styled.div`
  flex: 1;
  min-width: 0;
  h4 {
    font-size: 0.95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  p {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.2rem;
  }
`;

const DeleteMaterialBtn = styled.button`
  background: #fee2e2;
  color: #ef4444;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #ef4444;
    color: white;
  }
`;

const BulkActionToolbar = styled(motion.div)`
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1A2B4C;
  padding: 1rem 2rem;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 2rem;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  z-index: 1000;
  color: white;
  border: 1px solid rgba(255,255,255,0.1);
`;

const SelectionCount = styled.div`
  font-weight: 700;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-right: 1.5rem;
  border-right: 1px solid rgba(255,255,255,0.2);
`;

const ToolbarButton = styled.button`
  background: ${props => props.$variant === 'danger' ? '#ef4444' : 'transparent'};
  color: white;
  border: none;
  padding: 0.6rem 1.25rem;
  border-radius: 50px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$variant === 'danger' ? '#dc2626' : 'rgba(255,255,255,0.1)'};
    transform: translateY(-2px);
  }
`;

const SelectionBox = styled.div`
  position: absolute;
  top: 8px;
  left: ${props => props.$isAdmin ? '48px' : '8px'};
  z-index: 20;
  cursor: pointer;
  color: ${props => props.$selected ? '#2563eb' : 'rgba(255,255,255,0.8)'};
  background: ${props => props.$selected ? 'white' : 'rgba(0,0,0,0.2)'};
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
    background: white;
    color: #2563eb;
  }
`;
// ---

const Skeleton = styled.div`
  width: 100%;
  height: 100%;
  background: #f1f5f9;
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: ${keyframes`0%{transform:translateX(-100%)}100%{transform:translateX(100%)}`} 1.5s infinite linear;
  }
`;

const SortableCadetCard = ({ cadet, isAdmin, onCadetClick, onAdminEdit, onDeleteCadet, useRoundedFrames, isSelected, onToggleSelect }) => {
  // Simple: just track if the image failed — no hiding, no timers
  const [imgFailed, setImgFailed] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cadet.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const handleImageError = () => setImgFailed(true);



  return (
    <CadetCard
      ref={setNodeRef}
      style={style}
      whileHover={isDragging ? {} : { y: -5 }}
    >
      {isAdmin && (
        <SelectionBox 
          $isAdmin={isAdmin} 
          $selected={isSelected} 
          onClick={(e) => { e.stopPropagation(); onToggleSelect(cadet.id); }}
        >
          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
        </SelectionBox>
      )}
      {isAdmin && (
        <>
          <DragHandle {...attributes} {...listeners}>
            <GripVertical size={16} />
          </DragHandle>
          <AdminDownloadButton onClick={(e) => {
            e.stopPropagation();
            const photoUrl = cadet.photoURL || cadet.photoUrl || cadet.imageUrl || cadet.image || cadet.profileUrl;
            if (photoUrl) downloadImage(photoUrl, `cadet_${cadet.Name || cadet.name}`);
          }}>
            <Download size={14} />
          </AdminDownloadButton>
          <AdminDeleteButton onClick={(e) => {
            e.stopPropagation();
            onDeleteCadet(cadet);
          }}>
            <Trash2 size={16} />
          </AdminDeleteButton>
          <AdminEditButton onClick={(e) => { e.stopPropagation(); onAdminEdit(cadet); }}>
            <Edit size={16} />
          </AdminEditButton>
        </>
      )}
      <CadetPhotoContainer
        $rounded={useRoundedFrames}
        onClick={() => onCadetClick(cadet)}
      >
        {cadet.photoURL && !imgFailed ? (
          <OptimizedImage
            src={cadet.photoURL}
            alt={cadet.Name}
            width={300}
            quality={85}
            objectFit={useRoundedFrames ? 'cover' : 'contain'}
            objectPosition="top center"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: useRoundedFrames ? '50%' : '0'
            }}
            onError={handleImageError}
          />
        ) : (
          <Users size={useRoundedFrames ? 64 : 48} />
        )}
      </CadetPhotoContainer>
      <div onClick={() => onCadetClick(cadet)} style={{ paddingBottom: '0.75rem', cursor: 'pointer' }}>
        <CadetName>{cadet.Name}</CadetName>
        <CadetInfo>{cadet.secID}</CadetInfo>
        {cadet.regimentalNo && <CadetInfo>{cadet.regimentalNo}</CadetInfo>}
        <CadetInfo>{`${cadet.dept}, Sec ${cadet.section} `}</CadetInfo>
      </div>
    </CadetCard>
  );
};

// BatchDetails Component
const BatchDetails = ({ wing, cadetsByRank, loading, onCadetClick, onAdminEdit, onDeleteCadet, onDragEnd, useRoundedFrames, selectedIds, onToggleSelect }) => {
  const { isAdmin } = useAuth();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getRankOrder = () => {
    const w = wing?.toLowerCase();
    if (w === 'army' || w === 'army-bn' || w === 'army-med' || w === 'army bty') {
      return armyRankOrder;
    }
    switch (w) {
      case 'navy': return navyRankOrder;
      case 'air':
      case 'airforce':
      case 'air-force': return airForceRankOrder;
      default: return [];
    }
  };
  const rankOrder = getRankOrder();

  if (loading) return <LoadingText>Loading batch details...</LoadingText>;
  if (Object.keys(cadetsByRank).length === 0 && !loading) return <NoCadetsMessage>No cadets found for this batch.</NoCadetsMessage>;

  // Build the final list: known rank order first, then any leftover ranks not in the order
  const knownRanksToShow = rankOrder.filter(r => (cadetsByRank[r] || []).length > 0);
  const unknownRanks = Object.keys(cadetsByRank).filter(r => !rankOrder.includes(r) && cadetsByRank[r].length > 0);
  const allRanksToRender = [...knownRanksToShow, ...unknownRanks];

  return (
    <>
      {allRanksToRender.map(rank => {
        const cadets = cadetsByRank[rank] || [];
        if (cadets.length === 0) return null;

        return (
          <RankSection key={rank}>
            <RankTitle>{getFullRank(rank)}</RankTitle>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => onDragEnd(event, rank)}
            >
              <SortableContext
                items={cadets.map(c => c.id)}
                strategy={rectSortingStrategy}
              >
                <CadetGrid>
                  {cadets.map((cadet) => (
                    <SortableCadetCard
                      key={cadet.id}
                      cadet={cadet}
                      isAdmin={isAdmin}
                      onCadetClick={onCadetClick}
                      onAdminEdit={onAdminEdit}
                      onDeleteCadet={onDeleteCadet}
                      useRoundedFrames={useRoundedFrames}
                      isSelected={selectedIds.includes(cadet.id)}
                      onToggleSelect={onToggleSelect}
                    />
                  ))}
                </CadetGrid>
              </SortableContext>
            </DndContext>
          </RankSection>
        );
      })}
    </>
  );
};

// --- wingData (Unchanged) ---
const wingData = {
  army: {
    title: 'Army (BTY)', motto: 'Service Before Self',
    color: '#D22B2B',
    info: [
      { icon: Users, title: 'BTY Operations', description: 'Primary focus on field artillery and battery-level military leadership.' },
      { icon: Target, title: 'Combat Excellence', description: 'Advanced weapons training and tactical maneuvers for the Army Battery.' },
      { icon: Trophy, title: 'Legacy of Valor', description: 'Maintaining the rich tradition and discipline of the 1 (TN) BTY NCC.' }
    ],
  },
  'army-bn': {
    title: 'Army (BN)', motto: 'Unity and Discipline',
    color: '#8b0000',
    info: [
      { icon: Users, title: 'Battalion Leadership', description: 'Developing organizational leadership and large-scale coordination skills.' },
      { icon: Target, title: 'Drill & Ceremony', description: 'Mastering the art of precise drill and ceremonial traditions unique to the Battalion.' },
      { icon: Trophy, title: 'Collective Strength', description: 'Fostering esprit de corps through large-scale team building and coordination.' }
    ],
  },
  'army-med': {
    title: 'Army (MED)', motto: 'Service with Care',
    color: '#006400',
    info: [
      { icon: Trophy, title: 'Combat Medic Training', description: 'Life-saving first aid, casualty evacuation, and medical support in field conditions.' },
      { icon: Users, title: 'Healthcare Service', description: 'Community medical service and health awareness training for dedicated medical cadets.' },
      { icon: Target, title: 'Technical Proficiency', description: 'Advanced knowledge of anatomy, physiology, and emergency medical procedures.' }
    ],
  },
  navy: {
    title: 'Navy', motto: 'Victory on Sea',
    color: '#000080',
    info: [{ icon: Users, title: 'Naval Operations', description: 'Training in ship handling, navigation, and maritime operations for future naval officers.' }, { icon: Trophy, title: 'Seamanship', description: 'Comprehensive knowledge of naval traditions, marine engineering, and oceanography.' }, { icon: Calendar, title: 'Sea Training', description: 'Practical experience aboard naval vessels and coastal training facilities.' }],
  },
  airforce: {
    title: 'Air', motto: 'Touch the Sky With Glory',
    color: '#87CEEB',
    info: [{ icon: Users, title: 'Aviation Training', description: 'Introduction to aircraft systems, flight principles, and aerospace technology.' }, { icon: Target, title: 'Air Power Studies', description: 'Understanding of air warfare tactics, strategic operations, and military aviation.' }, { icon: Trophy, title: 'Technical Skills', description: 'Advanced training in electronics, radar systems, and aircraft maintenance.' }],
  }
};

// WingPage Component
const WingPage = () => {
  const { wingType } = useParams();
  const navigate = useNavigate();
  const [slides, setSlides] = useState([]);
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batches, setBatches] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddCadetModalOpen, setIsAddCadetModalOpen] = useState(false);
  const [isAddBatchModalOpen, setIsAddBatchModalOpen] = useState(false);
  const [isEditBatchModalOpen, setIsEditBatchModalOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [undoData, setUndoData] = useState(null);
  const [selectedCadet, setSelectedCadet] = useState(null);
  const [cadetsByRank, setCadetsByRank] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger re-fetches
  const { isAdmin } = useAuth(); // Get auth state

  // Determine the correct string for Firestore queries
  const wingCategoryForQuery = wingType === 'airforce' ? 'air' :
    wingType === 'army-bn' ? 'armyBN' :
      wingType === 'army-med' ? 'armyMED' :
        wingType;

  // Fetch slideshow images based on wing
  useEffect(() => {
    const fetchSlides = async () => {
      if (!wingCategoryForQuery) return;
      try {
        const q = query(
          collection(db, `${wingCategoryForQuery}SlideshowImages`),
          orderBy("order", "asc"),
          limit(20) // Limit to 20 slides for performance
        );
        const querySnapshot = await getDocs(q);
        const fetchedSlides = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Pre-optimize background images
            optimizedBg: getOptimizedUrl(data.imageUrl, 1920, 80)
          };
        });
        setSlides(fetchedSlides);
      } catch (error) {
        console.error("Error fetching slideshow images:", error);
      } finally {
        setSlidesLoaded(true); // Mark as loaded whether empty or not
      }
    };
    fetchSlides();
  }, [wingCategoryForQuery]); // Re-fetch if wing changes

  // Warm the SW cache for every slide (main + blur variants) so switching
  // between slides is instant even on the first visit.
  useEffect(() => {
    if (!slides.length) return;
    const urls = [];
    slides.forEach((s) => {
      if (!s.imageUrl) return;
      urls.push(getOptimizedUrl(s.imageUrl, 1200, 70));
      urls.push(getOptimizedUrl(s.imageUrl, 400, 20));
      urls.push(getOptimizedUrl(s.imageUrl, 1920, 80));
    });
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 400));
    const handle = schedule(() => prefetchList(urls));
    return () => { if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle); };
  }, [slides]);



  // Slideshow next/prev logic
  const nextSlide = useCallback(() => {
    if (slides.length > 0) setCurrentSlide(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    if (slides.length > 0) setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Auto-advance slideshow
  useEffect(() => {
    if (slides.length <= 1) return; // Don't auto-advance if only 0 or 1 slide
    const slideshowTimer = setTimeout(nextSlide, 5000); // Change slide every 5 seconds
    return () => clearTimeout(slideshowTimer); // Clear timer on unmount or slide change
  }, [currentSlide, slides.length, nextSlide]);

  // Function to trigger data refresh
  const handleDataChange = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Fetch available batches for the current wing
  const fetchBatches = useCallback(async () => {
    if (!wingType) return;
    try {
      const docRef = doc(db, "config", "batches");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const batchData = docSnap.data();
        // Try multiple possible key variants since Firestore key may differ from URL param
        // e.g. wingType='army-med' but key might be 'armyMED', 'Army MED', 'armymed', etc.
        const keyVariants = [
          wingType,                                              // 'army-med'
          wingType.replace(/-/g, ''),                           // 'armymed'
          wingCategoryForQuery,                                  // 'armyMED'
          wingType.replace(/-/g, ' '),                          // 'army med'
          wingType.toUpperCase().replace(/-/g, '_'),            // 'ARMY_MED'
          toCanonicalWing(wingType),                            // 'Army MED'
        ];
        console.log('[Batches] Available keys in Firestore:', Object.keys(batchData));
        console.log('[Batches] Trying key variants:', keyVariants);

        let rawBatches = [];
        for (const key of keyVariants) {
          if (batchData[key] && batchData[key].length > 0) {
            rawBatches = batchData[key];
            console.log('[Batches] Found batches with key:', key, rawBatches);
            break;
          }
        }

        const sortedBatches = rawBatches.sort((a, b) => {
          const yearA = parseInt(a.match(/\d{4}/)?.[0] || 0, 10);
          const yearB = parseInt(b.match(/\d{4}/)?.[0] || 0, 10);
          return yearB - yearA;
        });
        setBatches(sortedBatches);
      } else {
        setBatches([]);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
    }
  }, [wingType, wingCategoryForQuery]); // Re-fetch if wing changes

  // Fetch cadets for the selected batch and wing
  const fetchCadets = useCallback(async () => {
    if (!wingType || !selectedBatch) return;

    // Extract only the batch year range (e.g., "2022-2025") for the query
    const cleanBatchName = selectedBatch.includes('.') ? selectedBatch.substring(selectedBatch.indexOf(' ') + 1) : selectedBatch;
    if (!cleanBatchName) return;

    setLoading(true);
    const wingCandidates = getWingCandidates(wingType);
    console.log('[Cadets] Querying Wing candidates:', wingCandidates, 'Batch:', cleanBatchName);

    try {
      const querySnapshots = await Promise.all(
        wingCandidates.map((wingValue) =>
          getDocs(
            query(
              collection(db, "cadets"),
              where("Wing", "==", wingValue),
              where("Batch", "==", cleanBatchName)
            )
          )
        )
      );

      const cadetMap = new Map();
      querySnapshots.forEach((snapshot, i) => {
        console.log(`[Cadets] Wing="${wingCandidates[i]}" returned ${snapshot.docs.length} docs`);
        snapshot.docs.forEach((docSnap) => {
          cadetMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      });
      const fetchedCadets = Array.from(cadetMap.values());
      console.log('[Cadets] Total fetched:', fetchedCadets.length);

      // Group and sort
      const grouped = fetchedCadets.reduce((acc, cadet) => {
        const rawRank = cadet.rank || cadet.Rank || "Unranked";
        const rank = normalizeRank(rawRank);
        if (!acc[rank]) acc[rank] = [];
        acc[rank].push(cadet);
        return acc;
      }, {});

      // Sort inside each rank
      Object.keys(grouped).forEach(rank => {
        grouped[rank].sort((a, b) => (a.order || 0) - (b.order || 0));
      });

      console.log('[Cadets] Grouped by rank:', Object.keys(grouped), grouped);
      setCadetsByRank(grouped);
    } catch (error) {
      console.error("Error fetching cadets:", error);
    } finally {
      setLoading(false);
    }
  }, [wingType, selectedBatch]); // Dependencies for fetching cadets

  // Fetch batches on initial load and when wingType or refreshKey changes
  useEffect(() => {
    fetchBatches();
  }, [wingType, refreshKey, fetchBatches]);

  // Fetch cadets when selectedBatch changes or refreshKey changes
  useEffect(() => {
    if (selectedBatch) {
      fetchCadets();
    } else {
      setCadetsByRank({}); // Clear cadets when no batch is selected
    }
  }, [selectedBatch, fetchCadets, refreshKey]);

  // Warm the service-worker image cache for all cadet photos in the background.
  useEffect(() => {
    const allCadets = Object.values(cadetsByRank).flat();
    if (!allCadets.length) return;
    const urls = allCadets
      .map(c => c.photoURL || c.photoUrl || c.imageUrl || c.image || c.profileUrl)
      .filter(Boolean)
      .map(u => getOptimizedUrl(u, 400, 75));
    const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 400));
    const handle = schedule(() => prefetchList(urls));
    return () => { if (window.cancelIdleCallback && typeof handle === 'number') window.cancelIdleCallback(handle); };
  }, [cadetsByRank]);

  // Reset selectedBatch and scroll to top when wingType changes
  useEffect(() => {
    window.scrollTo(0, 0);
    setSelectedBatch(null);
    setSelectedIds([]);
  }, [wingType]);

  // Function to handle deleting a batch (requires admin)
  const handleDeleteBatch = async (batchToDelete) => {
    // Extract clean batch name for cadet query
    const cleanBatchNameToDelete = batchToDelete.includes('.') ? batchToDelete.substring(batchToDelete.indexOf(' ') + 1) : batchToDelete;
    if (!window.confirm(`Are you sure you want to delete the "${cleanBatchNameToDelete}" batch and ALL its cadets ? This cannot be undone.`)) return;

    try {
      setLoading(true);
      const wingCandidates = getWingCandidates(wingType);

      const querySnapshots = await Promise.all(
        wingCandidates.map((wingValue) =>
          getDocs(
            query(
              collection(db, "cadets"),
              where("Wing", "==", wingValue),
              where("Batch", "==", cleanBatchNameToDelete)
            )
          )
        )
      );

      // Delete all cadets in the batch using Firestore Batch
      const firestoreBatchOp = writeBatch(db);
      const refsToDelete = new Map();
      const deletedCadets = [];
      querySnapshots.forEach((snapshot) => {
        snapshot.forEach((docSnap) => {
          refsToDelete.set(docSnap.id, docSnap.ref);
          deletedCadets.push({ id: docSnap.id, ...docSnap.data() });
        });
      });
      refsToDelete.forEach((docRef) => firestoreBatchOp.delete(docRef));
      await firestoreBatchOp.commit();

      // Remove the batch name from the config document
      const batchDocRef = doc(db, 'config', 'batches');
      await updateDoc(batchDocRef, {
        [wingType]: arrayRemove(batchToDelete)
      });

      // Save for Undo
      setUndoData({
        type: 'batch',
        batchName: batchToDelete,
        cadets: deletedCadets,
        wing: wingType
      });

      handleDataChange();
    } catch (error) {
      console.error("Error deleting batch:", error);
      alert("Failed to delete batch.");
    } finally {
      setLoading(false);
    }
  };

  // Open cadet detail modal
  const handleCadetClick = (cadet) => {
    setSelectedCadet(cadet);
    setIsDetailModalOpen(true);
  };

  // Open cadet edit modal (for admin)
  const handleAdminEditClick = (cadet) => {
    setSelectedCadet(cadet);
    setIsEditModalOpen(true);
  };

  const handleDragEnd = async (event, rank) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const rankCadets = Array.from(cadetsByRank[rank]);
    const oldIndex = rankCadets.findIndex(c => c.id === active.id);
    const newIndex = rankCadets.findIndex(c => c.id === over.id);

    const newOrder = arrayMove(rankCadets, oldIndex, newIndex);

    const updatedGrouped = { ...cadetsByRank, [rank]: newOrder };
    setCadetsByRank(updatedGrouped);

    try {
      const batchOp = writeBatch(db);
      newOrder.forEach((cadet, index) => {
        const ref = doc(db, 'cadets', cadet.id);
        batchOp.update(ref, { order: index });
      });
      await batchOp.commit();
    } catch (error) {
      console.error("Error saving reorder:", error);
      fetchCadets();
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSingleDelete = async (cadet) => {
    if (!cadet || !window.confirm(`Are you sure you want to delete ${cadet.Name}? This cannot be undone.`)) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'cadets', cadet.id));
      setUndoData({ type: 'selection', cadets: [cadet] });
      handleDataChange();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete cadet.");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !window.confirm(`Are you sure you want to delete ${selectedIds.length} selected cadets? This cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const firestoreBatchOp = writeBatch(db);
      const deletedCadets = [];
      selectedIds.forEach(id => {
        const cadet = Object.values(cadetsByRank).flat().find(c => c.id === id);
        if (cadet) deletedCadets.push(cadet);
        firestoreBatchOp.delete(doc(db, 'cadets', id));
      });
      await firestoreBatchOp.commit();
      
      setUndoData({ type: 'selection', cadets: deletedCadets });
      setSelectedIds([]);
      handleDataChange();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      alert("Failed to delete selected cadets.");
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!undoData) return;
    setLoading(true);
    try {
      if (undoData.type === 'batch') {
        const firestoreBatchOp = writeBatch(db);
        undoData.cadets.forEach(cadetData => {
          const { id, ...data } = cadetData;
          firestoreBatchOp.set(doc(db, 'cadets', id), data);
        });

        const batchDocRef = doc(db, 'config', 'batches');
        firestoreBatchOp.update(batchDocRef, {
          [undoData.wing]: arrayUnion(undoData.batchName)
        });

        await firestoreBatchOp.commit();
      } else { // This handles 'selection' type
        const firestoreBatchOp = writeBatch(db);
        undoData.cadets.forEach(cadetData => {
          const { id, ...data } = cadetData;
          firestoreBatchOp.set(doc(db, 'cadets', id), data);
        });
        await firestoreBatchOp.commit();
      }
      setUndoData(null);
      handleDataChange();
      alert("Restore successful!");
    } catch (err) {
      console.error("Undo failed:", err);
      alert("Could not restore data.");
    } finally {
      setLoading(false);
    }
  };

  // Generate Name List Excel
  const generateNameList = () => {
    console.log("Generating Name List Excel...");
    if (!selectedBatch) {
      console.warn("No batch selected");
      return;
    }

    try {
      const cleanBatchName = selectedBatch.includes('.') ? selectedBatch.substring(selectedBatch.indexOf(' ') + 1) : selectedBatch;

      const getRankOrder = () => {
        switch (wingType) {
          case 'army': return armyRankOrder;
          case 'navy': return navyRankOrder;
          case 'airforce': return airForceRankOrder;
          default: return [];
        }
      };

      const rankOrder = getRankOrder();
      const excelData = [];

      rankOrder.forEach(rank => {
        if (cadetsByRank[rank]) {
          cadetsByRank[rank].forEach(cadet => {
            excelData.push({
              'Batch': cleanBatchName,
              'Rank': rank,
              'Name': cadet.Name || 'N/A',
              'Regimental Number': cadet.regimentalNo || 'N/A',
              'Department': cadet.dept || 'N/A',
              'Section': cadet.section || 'N/A',
              'Student ID': cadet.secID || 'N/A',
              'Dossier': cadet.pdfURL || 'N/A',
              'Photo Link': cadet.photoURL || 'N/A'
            });
          });
        }
      });

      if (excelData.length === 0) {
        alert("No cadet data found to generate Excel.");
        return;
      }

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Create Workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Cadet List");

      // Set column widths for better readability
      const wscols = [
        { wch: 15 }, // Batch
        { wch: 15 }, // Rank
        { wch: 30 }, // Name
        { wch: 25 }, // Regimental No
        { wch: 20 }, // Dept
        { wch: 10 }, // Section
        { wch: 15 }, // Student ID
        { wch: 50 }, // Dossier
        { wch: 50 }  // Photo
      ];
      worksheet['!cols'] = wscols;

      // Download File
      const fileName = `${wingType.charAt(0).toUpperCase() + wingType.slice(1)}_${cleanBatchName.replace(' ', '_')}_NameList.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log("Excel generated successfully");
    } catch (err) {
      console.error("Error generating Excel:", err);
      alert("Failed to generate Excel file.");
    }
  };

  // Generate Whole Wing Name List Excel
  const generateWholeWingNameList = async () => {
    console.log("Generating Whole Wing Name List Excel...");

    try {
      const wingCandidates = getWingCandidates(wingType);
      const querySnapshots = await Promise.all(
        wingCandidates.map((wingValue) =>
          getDocs(query(collection(db, "cadets"), where("Wing", "==", wingValue)))
        )
      );

      const cadetMap = new Map();
      querySnapshots.forEach((snapshot) => {
        snapshot.docs.forEach((docSnap) => {
          cadetMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        });
      });

      const allCadets = Array.from(cadetMap.values());

      const getRankOrder = () => {
        switch (wingType) {
          case 'army': return armyRankOrder;
          case 'navy': return navyRankOrder;
          case 'airforce': return airForceRankOrder;
          default: return [];
        }
      };

      const rankOrder = getRankOrder();

      // Sort cadets by batch (newer first) and then by rank order
      allCadets.sort((a, b) => {
        if (a.Batch !== b.Batch) {
          return b.Batch.localeCompare(a.Batch);
        }
        const rankA = rankOrder.indexOf(a.rank);
        const rankB = rankOrder.indexOf(b.rank);
        return (rankA === -1 ? 999 : rankA) - (rankB === -1 ? 999 : rankB);
      });

      const excelData = allCadets.map(cadet => ({
        'Batch': cadet.Batch || 'N/A',
        'Rank': cadet.rank || 'N/A',
        'Name': cadet.Name || 'N/A',
        'Regimental Number': cadet.regimentalNo || 'N/A',
        'Department': cadet.dept || 'N/A',
        'Section': cadet.section || 'N/A',
        'Student ID': cadet.secID || 'N/A',
        'Dossier': cadet.pdfURL || 'N/A',
        'Photo Link': cadet.photoURL || 'N/A'
      }));

      if (excelData.length === 0) {
        alert("No cadet data found for this wing.");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Whole Wing List");

      const wscols = [
        { wch: 15 }, // Batch
        { wch: 15 }, // Rank
        { wch: 30 }, // Name
        { wch: 25 }, // Regimental No
        { wch: 20 }, // Dept
        { wch: 10 }, // Section
        { wch: 15 }, // Student ID
        { wch: 50 }, // Dossier
        { wch: 50 }  // Photo
      ];
      worksheet['!cols'] = wscols;

      const fileName = `${wingType.charAt(0).toUpperCase() + wingType.slice(1)}_Wing_Full_NameList.xlsx`;
      XLSX.writeFile(workbook, fileName);

      console.log("Whole wing Excel generated successfully");
    } catch (err) {
      console.error("Error generating whole wing Excel:", err);
      alert("Failed to generate whole wing Excel file.");
    }
  };



  // Handle case where wingType is invalid
  if (!wingType || !wingData[wingType]) {
    // You might want to navigate back or show a 404 page here
    console.error("Invalid wing type:", wingType);
    return <PageContainer><div>Invalid Wing Type</div></PageContainer>; // Simple fallback
  }
  const wing = wingData[wingType]; // Get data for the current wing

  // --- JSX Rendering ---
  return (
    <PageContainer>
      <SEO
        title={`${wingData[wingType].title} Wing`}
        description={`Explore the ${wingData[wingType].title} Wing of NCC at Sri Sairam Engineering College.Motto: ${wingData[wingType].motto} `}
      />
      <NavStack>
        <PremiumNavButton
          $accent={wing.color}
          onClick={() => navigate('/')}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="icon-wrapper"><ArrowLeft size={18} /></div>
          <span>Back to Home</span>
        </PremiumNavButton>

        <AnimatePresence>
          {selectedBatch && (
            <PremiumNavButton
              $accent="#FFBF00"
              onClick={() => setSelectedBatch(null)}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="icon-wrapper"><ChevronLeft size={18} /></div>
              <span>Batch Selection</span>
            </PremiumNavButton>
          )}
        </AnimatePresence>
      </NavStack>

      {/* Hero Section */}
      <HeroSection>
        {/* Slideshow */}
        <CarouselWrapper>
          <AnimatePresence mode="wait">
            {slides.length > 0 ? (
              <SlideContainer
                key={currentSlide}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <BlurredBackground $bgImage={getOptimizedUrl(slides[currentSlide].imageUrl, 400, 20)} />
                <MainImage $bgImage={getOptimizedUrl(slides[currentSlide].imageUrl, 1200, 70)} />
                {slides[currentSlide].description && (
                  <div style={{
                    position: 'absolute',
                    bottom: '80px',
                    left: 0,
                    width: '100%',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '1rem',
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    fontWeight: '500',
                    zIndex: 5
                  }}>
                    {slides[currentSlide].description}
                  </div>
                )}
              </SlideContainer>
            ) : (
              <motion.div
                style={{ width: '100%', height: '100%', background: '#0a1529' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                  textAlign: 'center',
                  padding: '2rem'
                }}>
                  {slidesLoaded ? (
                    // Loaded but empty — show a clear message
                    <>
                      <div style={{ fontSize: '3rem' }}>📷</div>
                      <p style={{ opacity: 0.7, fontSize: '1.1rem', fontWeight: '600' }}>No photos added yet</p>
                      <p style={{ opacity: 0.4, fontSize: '0.9rem' }}>Photos will appear here once uploaded by an admin.</p>
                    </>
                  ) : (
                    // Still loading
                    <>
                      <div className="hero-skeleton-spinner"></div>
                      <p style={{ opacity: 0.5 }}>Loading Glimpses...</p>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CarouselWrapper>
        {/* Slideshow Navigation */}
        {slides.length > 1 && (
          <>
            <NavArrow className="prev" onClick={prevSlide} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ChevronLeft size={24} /></NavArrow>
            <NavArrow className="next" onClick={nextSlide} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}><ChevronRight size={24} /></NavArrow>
            <DotsContainer>
              {slides.map((_, index) => (
                <Dot key={index} className={index === currentSlide ? 'active' : ''} onClick={() => setCurrentSlide(index)} />
              ))}
            </DotsContainer>
          </>
        )}
        <HeroOverlay />
        <HeroContent
          $wingColor={wingType === 'army' ? '#D22B2B' : wingType === 'navy' ? '#000080' : '#87CEEB'}
          initial={{ opacity: 0, x: -50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', damping: 20 }}
        >
          <WingTitle>{wing.title}</WingTitle>
          <WingMotto>"{wing.motto}"</WingMotto>
        </HeroContent>
      </HeroSection>

      {/* Main Content Area */}
      <ContentSection>
        {/* Unit Selector for Army Wings */}
        {(wingType.startsWith('army')) && (
          <UnitSwitcher>
            <UnitButton
              $color="#D22B2B"
              $active={wingType === 'army'}
              onClick={() => navigate('/wing/army')}
            >
              <Target size={20} /> Battery (BTY)
            </UnitButton>
            <UnitButton
              $color="#006400"
              $active={wingType === 'army-med'}
              onClick={() => navigate('/wing/army-med')}
            >
              <Trophy size={20} /> Medical (MED)
            </UnitButton>
            <UnitButton
              $color="#8b0000"
              $active={wingType === 'army-bn'}
              onClick={() => navigate('/wing/army-bn')}
            >
              <Users size={20} /> Battalion (BN)
            </UnitButton>
          </UnitSwitcher>
        )}

        {/* Wing Info Cards */}
        <SectionGrid>
          {wing.info.map((item, index) => (
            <InfoCard
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <CardIcon>
                <item.icon size={24} />
              </CardIcon>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </InfoCard>
          ))}
        </SectionGrid>

        <div style={{ marginTop: '2rem' }}>
          {!selectedBatch ? (
            <motion.div key="batch-selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DetailsHeader style={{ justifyContent: 'flex-end', marginBottom: '2rem' }}>
                <NameListButton onClick={generateWholeWingNameList} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Download size={20} /> Whole Wing Name List
                </NameListButton>
              </DetailsHeader>
              <SelectionGrid>
                {batches.map((batchName) => (
                  <SelectionCardContainer key={batchName} whileHover={{ scale: 1.03 }}>
                    {isAdmin && (
                      <>
                        <EditBatchButton onClick={(e) => { e.stopPropagation(); setBatchToEdit(batchName); setIsEditBatchModalOpen(true); }}>
                          <Edit2 size={16} />
                        </EditBatchButton>
                        <DeleteBatchButton onClick={(e) => { e.stopPropagation(); handleDeleteBatch(batchName); }}>
                          <Trash2 size={16} />
                        </DeleteBatchButton>
                      </>
                    )}
                    <SelectionCard onClick={() => setSelectedBatch(batchName)}>
                      {batchName.includes('.') ? batchName.substring(batchName.indexOf(' ') + 1) : batchName}
                    </SelectionCard>
                  </SelectionCardContainer>
                ))}
                {isAdmin && (
                  <SelectionCardContainer whileHover={{ scale: 1.03 }}>
                    <AddBatchCard onClick={() => setIsAddBatchModalOpen(true)}>
                      <Plus size={32} /> Add Batch
                    </AddBatchCard>
                  </SelectionCardContainer>
                )}
              </SelectionGrid>
            </motion.div>
          ) : (
            <div>
              <DetailsHeader>
                <div style={{ visibility: 'hidden', padding: '0.75rem 1.5rem' }}>Spacer</div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <NameListButton onClick={generateNameList} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Download size={20} /> Name List
                  </NameListButton>
                  {isAdmin && (
                    <AddNewCadetButton onClick={() => setIsAddCadetModalOpen(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Plus size={20} /> Add New Cadet
                    </AddNewCadetButton>
                  )}
                </div>
              </DetailsHeader>
              <BatchDetails
                wing={wingType}
                cadetsByRank={cadetsByRank}
                loading={loading}
                onCadetClick={handleCadetClick}
                onAdminEdit={handleAdminEditClick}
                onDeleteCadet={handleSingleDelete}
                onDragEnd={handleDragEnd}
                useRoundedFrames={selectedBatch && selectedBatch.includes('2022-2025') && (wingType === 'army' || wingType === 'airforce')}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
              />
            </div>
          )}
        </div>
      </ContentSection>

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <BulkActionToolbar
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: 100, x: '-50%', opacity: 0 }}
          >
            <SelectionCount>
              <CheckCircle2 size={20} color="#10b981" />
              {selectedIds.length} Selected
            </SelectionCount>
            
            <ToolbarButton onClick={() => setSelectedIds([])}>
              <CloseIcon size={18} /> Deselect All
            </ToolbarButton>

            <ToolbarButton $variant="danger" onClick={handleBulkDelete}>
              <Trash2 size={18} /> Delete Selected
            </ToolbarButton>
          </BulkActionToolbar>
        )}
      </AnimatePresence>

      {/* Undo Toast */}
      <AnimatePresence>
        {undoData && (
          <UndoToast
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <RotateCcw size={20} color="#60a5fa" />
              <span>{undoData.type === 'batch' ? `Batch "${undoData.batchName}" deleted` : `${undoData.cadets.length} cadets deleted`}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <ToolbarButton onClick={handleUndo} style={{ background: '#2563eb', padding: '0.4rem 1rem' }}>Undo</ToolbarButton>
              <ToolbarButton onClick={() => setUndoData(null)} style={{ padding: '0.4rem' }}><CloseIcon size={18} /></ToolbarButton>
            </div>
          </UndoToast>
        )}
      </AnimatePresence>

      {/* Modals */}
      <CadetDetailModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} cadet={selectedCadet} />
      {isAdmin && ( // Render admin modals only if admin is logged in
        <>
          <AdminCadetEditor
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            cadet={selectedCadet}
            onComplete={handleDataChange} // Refresh data on complete
            onDelete={(cadet) => setUndoData({ type: 'selection', cadets: [cadet] })}
          />
          <AddCadetModal
            isOpen={isAddCadetModalOpen}
            onClose={() => setIsAddCadetModalOpen(false)}
            wing={wingType}
            batch={selectedBatch ? (selectedBatch.includes('.') ? selectedBatch.substring(selectedBatch.indexOf(' ') + 1) : selectedBatch) : ''}
            onComplete={handleDataChange} // Refresh data on complete
          />
          <AddBatchModal
            isOpen={isAddBatchModalOpen}
            onClose={() => setIsAddBatchModalOpen(false)}
            wing={wingType}
            onComplete={handleDataChange} // Refresh data on complete
          />
          <EditBatchModal
            isOpen={isEditBatchModalOpen}
            onClose={() => { setIsEditBatchModalOpen(false); setBatchToEdit(null); }}
            wing={wingType}
            oldBatchName={batchToEdit}
            onComplete={handleDataChange}
          />
        </>
      )}
    </PageContainer>
  );
};
export default WingPage;
