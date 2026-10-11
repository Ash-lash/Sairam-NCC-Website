import React, { useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  FileText, Download, Upload, Search, CheckSquare, Square,
  CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Users,
  Calendar, ShieldCheck, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import SEO from '../components/common/SEO';
import { generateAndDownloadODDocx } from '../utils/odDocxGenerator';

const NAVY = "#1a2b4c";
const ACCENT = "#0284c7";

// --- STYLES ---
const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  padding-top: 96px;
  padding-bottom: 5rem;
`;

const ContentWrapper = styled.div`
  max-width: 1560px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const TopNav = styled.div`
  background: white;
  padding: 1.25rem 2rem;
  border-radius: 18px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  margin-bottom: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 1.25rem;
`;

const BackBtn = styled(motion.button)`
  background: #f1f5f9;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${NAVY};
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #e2e8f0; }
`;

const Title = styled.h1`
  font-size: 1.35rem;
  font-weight: 800;
  color: ${NAVY};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Badge = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  background: ${props => props.$success ? '#dcfce7' : '#e0f2fe'};
  color: ${props => props.$success ? '#15803d' : '#0369a1'};
  display: inline-flex;
  align-items: center;
  gap: 5px;
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 560px 1fr;
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 1280px) {
    grid-template-columns: 1fr;
  }
`;

const PanelCard = styled.div`
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 1.75rem 2rem;
  position: relative;
`;

const CardHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f1f5f9;

  h2 {
    font-size: 1.25rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 1.15rem;

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
  }

  input, select, textarea {
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    font-size: 0.92rem;
    font-family: inherit;
    color: #1e293b;
    outline: none;
    background: #ffffff;
    transition: all 0.2s;

    &:focus {
      border-color: ${ACCENT};
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
    }

    &::placeholder {
      color: #94a3b8;
    }
  }

  textarea {
    resize: vertical;
    font-size: 0.88rem;
    line-height: 1.5;
  }
`;

const TwoCols = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ActionButton = styled(motion.button)`
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  color: white;
  border: none;
  width: 100%;
  padding: 15px 20px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
  transition: all 0.2s;
  margin-top: 1.25rem;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #0369a1 0%, #075985 100%);
    box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
  }

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const DataSourceTabs = styled.div`
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
`;

const DataSourceTab = styled.button`
  padding: 7px 14px;
  border: none;
  border-radius: 7px;
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? NAVY : '#64748b'};
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  box-shadow: ${props => props.$active ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'};
  transition: all 0.2s;
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 1.25rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const SelectionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 8px;
`;

const SelectAllBtn = styled.button`
  background: white;
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${NAVY};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  &:hover { background: #f1f5f9; }
`;

const TableWrapper = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  max-height: 640px;
  overflow-y: auto;
  background: white;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;

  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 700;
    text-align: left;
    padding: 12px 14px;
    position: sticky;
    top: 0;
    z-index: 2;
    border-bottom: 1px solid #e2e8f0;
    user-select: none;

    &.sortable {
      cursor: pointer;
      &:hover {
        background: #f1f5f9;
        color: ${NAVY};
      }
    }
  }

  td {
    padding: 10px 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }

  tr:hover td {
    background: #f8fafc;
  }

  tr.selected td {
    background: #f0f9ff;
  }

  tr.passed-out td {
    background: #fafafa;
    color: #64748b;
  }

  tr.passed-out.selected td {
    background: #f1f5f9;
  }
`;

const WingPill = styled.span`
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 800;
  background: ${props => {
    const w = (props.$wing || '').toLowerCase();
    if (w.includes('air')) return '#e0f2fe';
    if (w.includes('navy')) return '#e0e7ff';
    return '#fee2e2';
  }};
  color: ${props => {
    const w = (props.$wing || '').toLowerCase();
    if (w.includes('air')) return '#0369a1';
    if (w.includes('navy')) return '#4338ca';
    return '#b91c1c';
  }};
`;

const YearPill = styled.span`
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.74rem;
  font-weight: 700;
  background: ${props => props.$isPassedOut ? '#f1f5f9' : '#e0f2fe'};
  color: ${props => props.$isPassedOut ? '#64748b' : '#0369a1'};
  border: 1px solid ${props => props.$isPassedOut ? '#e2e8f0' : '#bae6fd'};
`;

const ExcelUploadBox = styled.div`
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  margin-bottom: 1.25rem;
  transition: all 0.2s;

  &:hover {
    border-color: ${ACCENT};
    background: #f0f9ff;
  }
`;

const NoticeAlert = styled.div`
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.85rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DividerRow = styled.tr`
  td {
    background: #f1f5f9 !important;
    color: #475569 !important;
    font-size: 0.75rem !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    padding: 8px 14px !important;
    border-top: 1px solid #e2e8f0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
`;

// ============================================================
// CADET SENIORITY / YEAR HELPER
// ============================================================
const getCadetSeniority = (data) => {
  // If explicitly flagged as passed out or alumni
  if (data.isPassedOut === true || data.isAlumni === true || data.status === 'alumni' || data.status === 'passed_out') {
    return { isPassedOut: true, yearLabel: 'Passed Out', yearOrder: 99 };
  }

  const batchStr = String(data.Batch || data.batch || data.year || data.Year || '').trim();

  if (/passed\s*out/i.test(batchStr)) {
    return { isPassedOut: true, yearLabel: 'Passed Out', yearOrder: 99 };
  }

  // Extract 4-digit start year
  const match = batchStr.match(/\d{4}/);
  if (!match) {
    if (/^I$|^1$|I Year/i.test(batchStr)) return { isPassedOut: false, yearLabel: 'I Year', yearOrder: 1 };
    if (/^II$|^2$|II Year/i.test(batchStr)) return { isPassedOut: false, yearLabel: 'II Year', yearOrder: 2 };
    if (/^III$|^3$|III Year/i.test(batchStr)) return { isPassedOut: false, yearLabel: 'III Year', yearOrder: 3 };
    if (/^IV$|^4$|IV Year/i.test(batchStr)) return { isPassedOut: false, yearLabel: 'IV Year', yearOrder: 4 };
    return { isPassedOut: false, yearLabel: 'Active', yearOrder: 2 };
  }

  const startYear = parseInt(match[0], 10);
  const now = new Date();
  const currentYear = now.getFullYear();

  // In Sri Sairam NCC / Engineering, batches after startYear + 3 pass out
  const passOutDate = new Date(startYear + 3, 2, 31);
  if (now > passOutDate || startYear <= 2022) {
    return { isPassedOut: true, yearLabel: 'Passed Out', yearOrder: 99 };
  }

  // Engineering reference mapping:
  // 2024 -> III Year
  // 2025 -> II Year
  // 2026 -> I Year
  // 2023 -> IV Year
  const diff = currentYear - startYear;
  const yrNum = diff + 1;

  if (yrNum === 1) return { isPassedOut: false, yearLabel: 'I Year', yearOrder: 1 };
  if (yrNum === 2) return { isPassedOut: false, yearLabel: 'II Year', yearOrder: 2 };
  if (yrNum === 3) return { isPassedOut: false, yearLabel: 'III Year', yearOrder: 3 };
  if (yrNum === 4) return { isPassedOut: false, yearLabel: 'IV Year', yearOrder: 4 };

  return { isPassedOut: true, yearLabel: 'Passed Out', yearOrder: 99 };
};

// ============================================================
// MAIN COMPONENT
// ============================================================
const AdminODGeneratorPage = () => {
  const navigate = useNavigate();

  // Cadet Data
  const [source, setSource] = useState('firestore'); // 'firestore' | 'excel'
  const [dbCadets, setDbCadets] = useState([]);
  const [excelCadets, setExcelCadets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [wingFilter, setWingFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  // Selected Cadet IDs
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Sorting State
  // Columns: 'sno', 'secID', 'name', 'dept', 'year', 'wing'
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });

  // OD Letter Form State (Exact matching user screenshot)
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState('');
  const [programLocation, setProgramLocation] = useState('');
  const [programDetails, setProgramDetails] = useState('');
  const [programTime, setProgramTime] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [sincerelyName, setSincerelyName] = useState('');
  const [fromAddress, setFromAddress] = useState(
`The Commanding Officer / ANO
Sri Sairam Engineering College
Chennai`
  );
  const [toAddress, setToAddress] = useState(
`The Principal
Sri Sairam Engineering College
Chennai`
  );
  const [letterContent, setLetterContent] = useState('');

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch cadets from Firestore database
  const loadDatabaseCadets = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const snap = await getDocs(collection(db, 'cadets'));
      const cadets = snap.docs.map((doc, idx) => {
        const d = doc.data();
        const seniority = getCadetSeniority(d);
        return {
          id: doc.id,
          originalIndex: idx + 1,
          secID: d.secID || d.regimentalNo || d.registrationNo || d.regNo || d.id || doc.id,
          student_id: d.secID || d.regimentalNo || d.regNo || doc.id,
          name: d.Name || d.name || 'Cadet',
          dept: (d.dept || d.department || '').toUpperCase(),
          department: (d.dept || d.department || '').toUpperCase(),
          wing: d.Wing || d.wing || 'Army',
          year: seniority.yearLabel,
          yearDisplay: seniority.yearLabel,
          yearOrder: seniority.yearOrder,
          isPassedOut: seniority.isPassedOut,
          rank: d.rank || 'CDT'
        };
      });

      setDbCadets(cadets);
    } catch (err) {
      console.error("Error fetching cadets:", err);
      setErrorMessage("Could not load cadets from website database. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseCadets();
  }, []);

  // Active dataset
  const activeDataset = source === 'firestore' ? dbCadets : excelCadets;

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    const list = activeDataset.map(c => c.dept || c.department).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [activeDataset]);

  // Handle column header click for sorting
  const handleSort = (columnKey) => {
    setSortConfig(prev => {
      if (prev.key === columnKey) {
        return {
          key: columnKey,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return {
        key: columnKey,
        direction: 'asc'
      };
    });
  };

  // Render sort icon next to header
  const renderSortIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown size={13} style={{ marginLeft: 4, opacity: 0.35, verticalAlign: 'middle' }} />;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp size={13} style={{ marginLeft: 4, color: ACCENT, verticalAlign: 'middle' }} />
    ) : (
      <ArrowDown size={13} style={{ marginLeft: 4, color: ACCENT, verticalAlign: 'middle' }} />
    );
  };

  // Filtered & Sorted Cadets
  // CRITICAL RULE: Passed out cadets must ALWAYS be at the end, regardless of sorting column!
  const sortedAndFilteredCadets = useMemo(() => {
    // 1. Filter
    const filtered = activeDataset.filter(c => {
      // Wing filter
      if (wingFilter !== 'ALL') {
        const w = (c.wing || '').toLowerCase();
        if (!w.includes(wingFilter.toLowerCase())) return false;
      }
      // Dept filter
      if (deptFilter !== 'ALL') {
        const d = (c.dept || c.department || '').toUpperCase();
        if (d !== deptFilter.toUpperCase()) return false;
      }
      // Year filter
      if (yearFilter !== 'ALL') {
        if (yearFilter === 'ACTIVE_ONLY') {
          if (c.isPassedOut) return false;
        } else if (yearFilter === 'PASSED_OUT') {
          if (!c.isPassedOut) return false;
        } else {
          const y = (c.year || '').toUpperCase();
          if (!y.includes(yearFilter.toUpperCase())) return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const n = (c.name || '').toLowerCase();
        const id = (c.secID || c.student_id || '').toLowerCase();
        const d = (c.dept || c.department || '').toLowerCase();
        if (!n.includes(q) && !id.includes(q) && !d.includes(q)) return false;
      }
      return true;
    });

    // 2. Separate into Active Cadets and Passed Out Cadets
    const active = [];
    const passedOut = [];

    for (const cadet of filtered) {
      if (cadet.isPassedOut) {
        passedOut.push(cadet);
      } else {
        active.push(cadet);
      }
    }

    // 3. Comparison function based on sortConfig
    const comparator = (a, b) => {
      let valA, valB;
      switch (sortConfig.key) {
        case 'sno':
          valA = a.originalIndex || 0;
          valB = b.originalIndex || 0;
          break;
        case 'secID':
          valA = (a.secID || a.student_id || '').toLowerCase();
          valB = (b.secID || b.student_id || '').toLowerCase();
          break;
        case 'name':
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
          break;
        case 'dept':
          valA = (a.dept || a.department || '').toLowerCase();
          valB = (b.dept || b.department || '').toLowerCase();
          break;
        case 'year':
          valA = a.yearOrder || 0;
          valB = b.yearOrder || 0;
          break;
        case 'wing':
          valA = (a.wing || '').toLowerCase();
          valB = (b.wing || '').toLowerCase();
          break;
        default:
          valA = (a.name || '').toLowerCase();
          valB = (b.name || '').toLowerCase();
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    };

    // 4. Sort each group independently by the chosen column
    active.sort(comparator);
    passedOut.sort(comparator);

    // 5. Concatenate: Active cadets first, Passed Out cadets ALWAYS at the end!
    return [...active, ...passedOut];
  }, [activeDataset, wingFilter, deptFilter, yearFilter, searchQuery, sortConfig]);

  // Cadet Selection Handlers
  const handleToggleCadet = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === sortedAndFilteredCadets.length && sortedAndFilteredCadets.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAndFilteredCadets.map(c => c.id)));
    }
  };

  // Excel Bulk Upload Handler
  const handleExcelUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const parsed = data.map((row, idx) => {
          const rawYear = row['Year'] || row['YEAR'] || row['Batch'] || '';
          const seniority = getCadetSeniority({ Batch: rawYear });
          return {
            id: `excel_${idx}`,
            originalIndex: idx + 1,
            secID: row['SEC ID'] || row['ID'] || row['Reg No'] || row['Regiment No'] || `CADET_${idx + 1}`,
            student_id: row['SEC ID'] || row['ID'] || row['Reg No'] || row['Regiment No'] || `CADET_${idx + 1}`,
            name: row['Name'] || row['NAME'] || row['Cadet Name'] || 'Cadet',
            dept: (row['Dept'] || row['Department'] || row['DEPT'] || '').toUpperCase(),
            department: (row['Dept'] || row['Department'] || row['DEPT'] || '').toUpperCase(),
            year: seniority.yearLabel,
            yearDisplay: seniority.yearLabel,
            yearOrder: seniority.yearOrder,
            isPassedOut: seniority.isPassedOut,
            wing: row['Wing'] || row['WING'] || 'Army',
            rank: row['Rank'] || 'CDT'
          };
        });

        setExcelCadets(parsed);
        setSource('excel');
        setSelectedIds(new Set(parsed.map(c => c.id)));
        setSuccessNotice(`Imported ${parsed.length} cadets from Excel file.`);
        setTimeout(() => setSuccessNotice(''), 4000);
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure it has valid columns (SEC ID, Name, Dept, Year, Wing).");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Generate & Download Word Document
  const handleGenerate = async () => {
    const selectedList = activeDataset.filter(c => selectedIds.has(c.id));

    if (selectedList.length === 0) {
      alert("Please select at least one cadet from the list.");
      return;
    }
    if (!fromDate) {
      alert("Please enter From Date.");
      return;
    }
    if (!programLocation.trim()) {
      alert("Please enter Program Location.");
      return;
    }

    setGenerating(true);
    setErrorMessage('');
    try {
      await generateAndDownloadODDocx({
        selectedCadets: selectedList,
        fromDate,
        toDate,
        fromAddress: fromAddress.trim(),
        toAddress: toAddress.trim(),
        programLocation: programLocation.trim(),
        programDetails: programDetails.trim(),
        programTime: programTime.trim(),
        academicYear: academicYear.trim(),
        sincerelyName: sincerelyName.trim() || 'Associate NCC Officer',
        letterContent: letterContent.trim()
      });

      setSuccessNotice(`Official OD Letter for ${selectedList.length} cadets generated & downloaded successfully!`);
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      console.error("Error generating OD letter:", err);
      setErrorMessage("Failed to generate Word document. Please verify the input fields.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageContainer>
      <SEO title="OD Letter Generator | Admin Portal" />

      <ContentWrapper>
        {/* TOP BAR */}
        <TopNav>
          <TitleArea>
            <BackBtn
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/admin/slideshow')}
              title="Return to Admin"
            >
              <ArrowLeft size={20} />
            </BackBtn>
            <div>
              <Title>
                <FileText size={24} color="#ef5b4d" />
                OD Letter Generator
                <Badge $success>
                  <ShieldCheck size={14} />
                  Website Cadets Database Active
                </Badge>
              </Title>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 3 }}>
                Generate official On Duty (OD) Microsoft Word letters directly in your browser. 100% cloud-ready.
              </div>
            </div>
          </TitleArea>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge>
              <Users size={14} />
              {activeDataset.length} Cadets in Database
            </Badge>
            <button
              onClick={loadDatabaseCadets}
              style={{
                background: '#f8fafc', border: '1px solid #cbd5e1', padding: '7px 12px',
                borderRadius: 9, fontSize: '0.8rem', fontWeight: 700, color: NAVY,
                display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
              }}
              title="Refresh cadet data from database"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Refresh Database
            </button>
          </div>
        </TopNav>

        {/* FEEDBACK BANNERS */}
        {successNotice && (
          <NoticeAlert>
            <CheckCircle2 size={18} color="#059669" />
            <span><strong>Success!</strong> {successNotice}</span>
          </NoticeAlert>
        )}

        {errorMessage && (
          <NoticeAlert style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
            <AlertCircle size={18} color="#dc2626" />
            <span>{errorMessage}</span>
          </NoticeAlert>
        )}

        {/* 2-COLUMN WORKSPACE */}
        <LayoutGrid>
          {/* ======================================================== */}
          {/* LEFT PANEL: OD LETTER DETAILS (MATCHING SCREENSHOT)      */}
          {/* ======================================================== */}
          <PanelCard>
            <CardHeading>
              <h2>OD Letter Details</h2>
            </CardHeading>

            {/* Row 1: From Date & To Date */}
            <TwoCols>
              <FormGroup>
                <label>From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  placeholder="dd-mm-yyyy"
                />
              </FormGroup>
              <FormGroup>
                <label>To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  placeholder="dd-mm-yyyy"
                />
              </FormGroup>
            </TwoCols>

            {/* Row 2: Program Location & Program Details */}
            <TwoCols>
              <FormGroup>
                <label>Program Location</label>
                <input
                  type="text"
                  value={programLocation}
                  onChange={e => setProgramLocation(e.target.value)}
                  placeholder="Enter program location"
                />
              </FormGroup>
              <FormGroup>
                <label>Program Details (Optional)</label>
                <input
                  type="text"
                  value={programDetails}
                  onChange={e => setProgramDetails(e.target.value)}
                  placeholder="Example: Annual Training Camp"
                />
              </FormGroup>
            </TwoCols>

            {/* Row 3: Time & Academic Year */}
            <TwoCols>
              <FormGroup>
                <label>Time</label>
                <input
                  type="text"
                  value={programTime}
                  onChange={e => setProgramTime(e.target.value)}
                  placeholder="Example: 10:00 AM to 04:00 PM"
                />
              </FormGroup>
              <FormGroup>
                <label>Academic Year</label>
                <select
                  value={academicYear}
                  onChange={e => setAcademicYear(e.target.value)}
                >
                  <option value="">Auto / Optional</option>
                  <option value="I">I Year</option>
                  <option value="II">II Year</option>
                  <option value="III">III Year</option>
                  <option value="IV">IV Year</option>
                </select>
              </FormGroup>
            </TwoCols>

            {/* Row 4: Yours Sincerely Name */}
            <FormGroup>
              <label>Yours Sincerely Name</label>
              <input
                type="text"
                value={sincerelyName}
                onChange={e => setSincerelyName(e.target.value)}
                placeholder="ANO / Officer Name"
              />
            </FormGroup>

            {/* Row 5: From Address */}
            <FormGroup>
              <label>From Address</label>
              <textarea
                rows={3}
                value={fromAddress}
                onChange={e => setFromAddress(e.target.value)}
              />
            </FormGroup>

            {/* Row 6: To Address */}
            <FormGroup>
              <label>To Address</label>
              <textarea
                rows={3}
                value={toAddress}
                onChange={e => setToAddress(e.target.value)}
              />
            </FormGroup>

            {/* Row 7: Letter Content (Optional) */}
            <FormGroup>
              <label>Letter Content (Optional)</label>
              <textarea
                rows={4}
                value={letterContent}
                onChange={e => setLetterContent(e.target.value)}
                placeholder="Leave blank to use the standard letter content."
              />
            </FormGroup>

            {/* ACTION BUTTON */}
            <ActionButton
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleGenerate}
              disabled={generating || selectedIds.size === 0}
            >
              {generating ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Generating Document...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Download OD Letter (.docx) ({selectedIds.size} Cadets Selected)
                </>
              )}
            </ActionButton>

            <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
              Generates an official Word document with formatted table, borders, margins, and ANO signature block.
            </p>
          </PanelCard>

          {/* ======================================================== */}
          {/* RIGHT PANEL: SELECT CADETS WITH COLUMN SORTING           */}
          {/* ======================================================== */}
          <PanelCard>
            <CardHeading>
              <h2>Select Cadets from Database</h2>

              <DataSourceTabs>
                <DataSourceTab
                  $active={source === 'firestore'}
                  onClick={() => setSource('firestore')}
                >
                  <ShieldCheck size={14} />
                  Website Cadets
                </DataSourceTab>
                <DataSourceTab
                  $active={source === 'excel'}
                  onClick={() => setSource('excel')}
                >
                  <Upload size={14} />
                  Excel Upload
                </DataSourceTab>
              </DataSourceTabs>
            </CardHeading>

            {/* EXCEL UPLOAD BOX IF SOURCE IS EXCEL */}
            {source === 'excel' && (
              <div>
                <label>
                  <ExcelUploadBox>
                    <Upload size={28} color={ACCENT} style={{ margin: '0 auto 8px', display: 'block' }} />
                    <strong style={{ color: NAVY, fontSize: '0.95rem' }}>Upload Excel (.xlsx / .xls) File</strong>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      Auto-detects columns: SEC ID, Name, Department, Year, Wing
                    </p>
                  </ExcelUploadBox>
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                    onChange={handleExcelUpload}
                  />
                </label>
              </div>
            )}

            {/* FILTER CONTROLS */}
            <FilterGrid>
              <FormGroup style={{ margin: 0 }}>
                <label>Search</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search Name, Regt No, SEC ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 34 }}
                  />
                  <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
                </div>
              </FormGroup>

              <FormGroup style={{ margin: 0 }}>
                <label>Wing</label>
                <select value={wingFilter} onChange={e => setWingFilter(e.target.value)}>
                  <option value="ALL">All Wings</option>
                  <option value="Army">Army Wing</option>
                  <option value="Navy">Navy Wing</option>
                  <option value="Air">Air Wing</option>
                </select>
              </FormGroup>

              <FormGroup style={{ margin: 0 }}>
                <label>Department</label>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                  <option value="ALL">All Depts</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </FormGroup>

              <FormGroup style={{ margin: 0 }}>
                <label>Year / Status</label>
                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                  <option value="ALL">All Cadets</option>
                  <option value="ACTIVE_ONLY">Active Only (Excl. Passed Out)</option>
                  <option value="I Year">I Year</option>
                  <option value="II Year">II Year</option>
                  <option value="III Year">III Year</option>
                  <option value="IV Year">IV Year</option>
                  <option value="PASSED_OUT">Passed Out Only</option>
                </select>
              </FormGroup>
            </FilterGrid>

            {/* SELECTION TOOLBAR */}
            <SelectionBar style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SelectAllBtn onClick={handleSelectAllFiltered}>
                  {selectedIds.size === sortedAndFilteredCadets.length && sortedAndFilteredCadets.length > 0 ? (
                    <CheckSquare size={16} color={ACCENT} />
                  ) : (
                    <Square size={16} color="#94a3b8" />
                  )}
                  {selectedIds.size === sortedAndFilteredCadets.length && sortedAndFilteredCadets.length > 0
                    ? "Deselect All Filtered"
                    : `Select All Filtered (${sortedAndFilteredCadets.length})`}
                </SelectAllBtn>

                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    style={{ background: 'none', border: 'none', fontSize: '0.8rem', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: NAVY }}>
                <span style={{ color: ACCENT, fontSize: '1rem', fontWeight: 800 }}>{selectedIds.size}</span> cadets selected
              </div>
            </SelectionBar>

            {/* CADETS TABLE WITH COLUMN SORTING */}
            <TableWrapper>
              <StyledTable>
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={sortedAndFilteredCadets.length > 0 && selectedIds.size === sortedAndFilteredCadets.length}
                        onChange={handleSelectAllFiltered}
                        title="Select/Deselect All"
                      />
                    </th>
                    <th
                      className="sortable"
                      style={{ width: 65 }}
                      onClick={() => handleSort('sno')}
                      title="Sort by S.No"
                    >
                      S.No {renderSortIndicator('sno')}
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('secID')}
                      title="Sort by SEC ID / Regt No"
                    >
                      SEC ID / Regt No {renderSortIndicator('secID')}
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('name')}
                      title="Sort by Cadet Name"
                    >
                      Cadet Name {renderSortIndicator('name')}
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('dept')}
                      title="Sort by Department"
                    >
                      Dept {renderSortIndicator('dept')}
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('year')}
                      title="Sort by Year"
                    >
                      Year {renderSortIndicator('year')}
                    </th>
                    <th
                      className="sortable"
                      onClick={() => handleSort('wing')}
                      title="Sort by Wing"
                    >
                      Wing {renderSortIndicator('wing')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748b' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block', color: ACCENT }} />
                        Loading Cadets from Website Database...
                      </td>
                    </tr>
                  ) : sortedAndFilteredCadets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                        No cadets found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      let passedOutDividerShown = false;

                      return sortedAndFilteredCadets.map((cadet, index) => {
                        const isSelected = selectedIds.has(cadet.id);
                        const isFirstPassedOut = cadet.isPassedOut && !passedOutDividerShown;
                        if (isFirstPassedOut) {
                          passedOutDividerShown = true;
                        }

                        return (
                          <React.Fragment key={cadet.id}>
                            {/* Passed out separator banner */}
                            {isFirstPassedOut && (
                              <DividerRow>
                                <td colSpan={7}>
                                  Passed Out Cadets (Listed at the bottom)
                                </td>
                              </DividerRow>
                            )}

                            <tr
                              className={`${isSelected ? 'selected' : ''} ${cadet.isPassedOut ? 'passed-out' : ''}`}
                              onClick={() => handleToggleCadet(cadet.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleCadet(cadet.id)}
                                />
                              </td>
                              <td style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</td>
                              <td style={{ fontWeight: 700, color: NAVY }}>{cadet.secID}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ fontWeight: 700 }}>{cadet.name}</span>
                                  {cadet.rank && cadet.rank !== 'CDT' && (
                                    <span style={{
                                      fontSize: '0.7rem', padding: '1px 5px', borderRadius: 4,
                                      background: '#fef3c7', color: '#92400e', fontWeight: 800
                                    }}>
                                      {cadet.rank}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{ fontWeight: 600 }}>{cadet.dept || '—'}</td>
                              <td>
                                <YearPill $isPassedOut={cadet.isPassedOut}>
                                  {cadet.year || '—'}
                                </YearPill>
                              </td>
                              <td>
                                <WingPill $wing={cadet.wing}>
                                  {cadet.wing || 'Army'}
                                </WingPill>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      });
                    })()
                  )}
                </tbody>
              </StyledTable>
            </TableWrapper>
          </PanelCard>
        </LayoutGrid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default AdminODGeneratorPage;
