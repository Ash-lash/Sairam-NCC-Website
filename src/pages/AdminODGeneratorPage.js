import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Upload, Search, CheckSquare, Square,
  CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Users,
  Calendar, MapPin, Clock, ShieldCheck, Filter, ChevronDown,
  Sparkles, Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import SEO from '../components/common/SEO';
import { generateAndDownloadODDocx } from '../utils/odDocxGenerator';

const NAVY = "#1a2b4c";
const GOLD = "#FFBF00";
const ACCENT = "#2563eb";

// --- STYLES ---
const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding-top: 96px;
  padding-bottom: 5rem;
`;

const ContentWrapper = styled.div`
  max-width: 1520px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const TopNav = styled.div`
  background: white;
  padding: 1.25rem 2rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04);
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
  grid-template-columns: 460px 1fr;
  gap: 1.75rem;
  align-items: start;

  @media (max-width: 1180px) {
    grid-template-columns: 1fr;
  }
`;

const PanelCard = styled.div`
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 1.75rem;
  position: relative;
`;

const CardHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid #f1f5f9;

  h2 {
    font-size: 1.15rem;
    font-weight: 800;
    color: ${NAVY};
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 1.1rem;

  label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  input, select, textarea {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #cbd5e1;
    font-size: 0.9rem;
    font-family: inherit;
    color: #1e293b;
    outline: none;
    transition: all 0.2s;

    &:focus {
      border-color: ${ACCENT};
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
  }

  textarea {
    resize: vertical;
    font-size: 0.85rem;
    line-height: 1.5;
  }
`;

const TwoCols = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const ActionButton = styled(motion.button)`
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  color: white;
  border: none;
  width: 100%;
  padding: 15px 20px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 16px rgba(29, 78, 216, 0.28);
  transition: all 0.2s;
  margin-top: 1.25rem;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    box-shadow: 0 8px 20px rgba(29, 78, 216, 0.38);
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
  border-radius: 12px;
  gap: 4px;
  margin-bottom: 1.25rem;
`;

const DataSourceTab = styled.button`
  flex: 1;
  padding: 8px 14px;
  border: none;
  border-radius: 9px;
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? NAVY : '#64748b'};
  font-weight: 700;
  font-size: 0.85rem;
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
  border-radius: 12px;
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
  border-radius: 14px;
  overflow: hidden;
  max-height: 580px;
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
    background: #eff6ff;
  }
`;

const WingPill = styled.span`
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
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

const ExcelUploadBox = styled.div`
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  padding: 1.75rem 1rem;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  margin-bottom: 1.25rem;
  transition: all 0.2s;

  &:hover {
    border-color: ${ACCENT};
    background: #eff6ff;
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

// Helper: Calculate engineering year from batch (matches junior's logic)
const calculateYear = (batch) => {
  if (!batch) return 'II Year';
  const str = String(batch).trim();
  if (/^I$|^1$/i.test(str)) return 'I Year';
  if (/^II$|^2$/i.test(str)) return 'II Year';
  if (/^III$|^3$/i.test(str)) return 'III Year';
  if (/^IV$|^4$/i.test(str)) return 'IV Year';
  if (str.includes('Year')) return str;

  // Extract start year from batch like "2024-2027" or "2024"
  const match = str.match(/\d{4}/);
  if (match) {
    const startYear = parseInt(match[0], 10);
    const refYear = 2026; // Reference academic year
    const diff = refYear - startYear;
    const yrNum = diff + 1;
    if (yrNum === 1) return 'I Year';
    if (yrNum === 2) return 'II Year';
    if (yrNum === 3) return 'III Year';
    if (yrNum === 4) return 'IV Year';
    if (yrNum > 4) return 'Passed Out';
    return `${yrNum} Year`;
  }
  return 'II Year';
};

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

  // Form State
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState('');
  const [programLocation, setProgramLocation] = useState('Sri Sairam Engineering College');
  const [programDetails, setProgramDetails] = useState('');
  const [programTime, setProgramTime] = useState('09:00 AM to 04:00 PM');
  const [academicYearOverride, setAcademicYearOverride] = useState('');
  const [sincerelyName, setSincerelyName] = useState('Associate NCC Officer');
  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const [customLetterContent, setCustomLetterContent] = useState('');

  // Generation status
  const [generating, setGenerating] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch cadets directly from the website's Firebase Firestore database
  const loadDatabaseCadets = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const snap = await getDocs(collection(db, 'cadets'));
      const cadets = snap.docs.map(doc => {
        const d = doc.data();
        const computedYear = calculateYear(d.Batch || d.year || d.Year);
        return {
          id: doc.id,
          secID: d.secID || d.regimentalNo || d.registrationNo || d.regNo || d.id || doc.id,
          student_id: d.secID || d.regimentalNo || d.regNo || doc.id,
          name: d.Name || d.name || 'Cadet',
          dept: (d.dept || d.department || '').toUpperCase(),
          department: (d.dept || d.department || '').toUpperCase(),
          wing: d.Wing || d.wing || 'Army',
          year: computedYear,
          yearDisplay: computedYear,
          batch: d.Batch || '',
          rank: d.rank || 'CDT'
        };
      });

      // Sort alphabetically by name
      cadets.sort((a, b) => a.name.localeCompare(b.name));
      setDbCadets(cadets);
    } catch (err) {
      console.error("Error fetching cadets from Firestore:", err);
      setErrorMessage("Could not load cadets from website database. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseCadets();
  }, []);

  // 2. Active list based on source
  const activeCadets = source === 'firestore' ? dbCadets : excelCadets;

  // 3. Dynamic Departments list
  const departments = useMemo(() => {
    const list = activeCadets.map(c => c.dept || c.department).filter(Boolean);
    return Array.from(new Set(list)).sort();
  }, [activeCadets]);

  // 4. Filtered cadets
  const filteredCadets = useMemo(() => {
    return activeCadets.filter(c => {
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
        const y = (c.year || '').toUpperCase();
        if (!y.includes(yearFilter.toUpperCase())) return false;
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
  }, [activeCadets, wingFilter, deptFilter, yearFilter, searchQuery]);

  // 5. Cadet Selection Handlers
  const handleToggleCadet = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredCadets.length && filteredCadets.length > 0) {
      // Clear selection
      setSelectedIds(new Set());
    } else {
      // Select all visible filtered cadets
      setSelectedIds(new Set(filteredCadets.map(c => c.id)));
    }
  };

  // 6. Excel Upload Handler
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
          const computedYr = calculateYear(rawYear);
          return {
            id: `excel_${idx}`,
            secID: row['SEC ID'] || row['ID'] || row['Reg No'] || row['Regiment No'] || `CADET_${idx + 1}`,
            student_id: row['SEC ID'] || row['ID'] || row['Reg No'] || row['Regiment No'] || `CADET_${idx + 1}`,
            name: row['Name'] || row['NAME'] || row['Cadet Name'] || 'Cadet',
            dept: (row['Dept'] || row['Department'] || row['DEPT'] || '').toUpperCase(),
            department: (row['Dept'] || row['Department'] || row['DEPT'] || '').toUpperCase(),
            year: computedYr,
            yearDisplay: computedYr,
            wing: row['Wing'] || row['WING'] || 'Army',
            rank: row['Rank'] || 'CDT'
          };
        });

        setExcelCadets(parsed);
        setSource('excel');
        setSelectedIds(new Set(parsed.map(c => c.id)));
        setSuccessNotice(`Imported ${parsed.length} cadets from Excel sheet!`);
        setTimeout(() => setSuccessNotice(''), 4000);
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure it has valid columns (SEC ID, Name, Dept, Year, Wing).");
      }
    };
    reader.readAsBinaryString(file);
  };

  // 7. Generate & Download Microsoft Word (.docx) Letter
  const handleGenerate = async () => {
    const selectedList = activeCadets.filter(c => selectedIds.has(c.id));

    if (selectedList.length === 0) {
      alert("Please select at least one cadet from the list.");
      return;
    }
    if (!fromDate) {
      alert("Please enter the From Date.");
      return;
    }
    if (!programLocation.trim()) {
      alert("Please enter the Programme Venue/Location.");
      return;
    }

    setGenerating(true);
    setErrorMessage('');
    try {
      await generateAndDownloadODDocx({
        selectedCadets: selectedList,
        fromDate,
        toDate,
        fromAddress,
        toAddress,
        programLocation: programLocation.trim(),
        programDetails: programDetails.trim(),
        programTime: programTime.trim(),
        academicYear: academicYearOverride,
        sincerelyName: sincerelyName.trim(),
        letterContent: customLetterContent
      });

      setSuccessNotice(`Official OD Letter for ${selectedList.length} cadets has been downloaded!`);
      setTimeout(() => setSuccessNotice(''), 5000);
    } catch (err) {
      console.error("Error generating OD letter:", err);
      setErrorMessage("Failed to generate Word document. Please verify the cadet details.");
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
              {activeCadets.length} Cadets Available
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

        {/* MAIN 2-PANEL LAYOUT */}
        <LayoutGrid>
          {/* LEFT PANEL: PROGRAMME DETAILS & GENERATION FORM */}
          <PanelCard>
            <CardHeading>
              <h2>
                <Calendar size={18} color={ACCENT} />
                Letter & Programme Details
              </h2>
            </CardHeading>

            <TwoCols>
              <FormGroup>
                <label>From Date *</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <label>To Date (Optional)</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  placeholder="Leave empty for 1 day"
                />
              </FormGroup>
            </TwoCols>

            <FormGroup>
              <label>Programme Venue / Location *</label>
              <input
                type="text"
                value={programLocation}
                onChange={e => setProgramLocation(e.target.value)}
                placeholder="e.g. Sri Sairam Engineering College / Marina Beach"
              />
            </FormGroup>

            <FormGroup>
              <label>Purpose / Event Details</label>
              <input
                type="text"
                value={programDetails}
                onChange={e => setProgramDetails(e.target.value)}
                placeholder="e.g. CATC Camp / Republic Day Parade Practice"
              />
            </FormGroup>

            <TwoCols>
              <FormGroup>
                <label>Programme Timings</label>
                <input
                  type="text"
                  value={programTime}
                  onChange={e => setProgramTime(e.target.value)}
                  placeholder="e.g. 09:00 AM to 04:00 PM"
                />
              </FormGroup>
              <FormGroup>
                <label>Cadet Academic Year</label>
                <select
                  value={academicYearOverride}
                  onChange={e => setAcademicYearOverride(e.target.value)}
                >
                  <option value="">Auto (From Cadets)</option>
                  <option value="I">I Year</option>
                  <option value="II">II Year</option>
                  <option value="III">III Year</option>
                  <option value="IV">IV Year</option>
                </select>
              </FormGroup>
            </TwoCols>

            <FormGroup>
              <label>Signatory ANO Name</label>
              <input
                type="text"
                value={sincerelyName}
                onChange={e => setSincerelyName(e.target.value)}
                placeholder="e.g. Associate NCC Officer or Officer Name"
              />
            </FormGroup>

            {/* ADVANCED ADDRESS BLOCK TOGGLE */}
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: '0.8rem', fontWeight: 700, color: ACCENT,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
                }}
              >
                <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                {showAdvanced ? "Hide Official Address Blocks" : "Edit Official Address Blocks (From / To)"}
              </button>

              {showAdvanced && (
                <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <FormGroup>
                    <label>From Address</label>
                    <textarea
                      rows={3}
                      value={fromAddress}
                      onChange={e => setFromAddress(e.target.value)}
                    />
                  </FormGroup>
                  <FormGroup style={{ margin: 0 }}>
                    <label>To Address</label>
                    <textarea
                      rows={3}
                      value={toAddress}
                      onChange={e => setToAddress(e.target.value)}
                    />
                  </FormGroup>
                </div>
              )}
            </div>

            {/* GENERATE BUTTON */}
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
                  Download OD Letter (.docx) ({selectedIds.size} Selected)
                </>
              )}
            </ActionButton>

            <p style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', marginTop: 10, marginBottom: 0 }}>
              Generates an official Microsoft Word file with table, formatted headers, and ANO signature block.
            </p>
          </PanelCard>

          {/* RIGHT PANEL: CADETS SELECTION FROM DATABASE */}
          <PanelCard>
            <CardHeading>
              <h2>
                <Users size={18} color={ACCENT} />
                Select Cadets from Database
              </h2>

              <DataSourceTabs style={{ margin: 0 }}>
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
                <label>Year</label>
                <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                  <option value="ALL">All Years</option>
                  <option value="I Year">I Year</option>
                  <option value="II Year">II Year</option>
                  <option value="III Year">III Year</option>
                  <option value="IV Year">IV Year</option>
                </select>
              </FormGroup>
            </FilterGrid>

            {/* SELECTION TOOLBAR */}
            <SelectionBar style={{ marginTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SelectAllBtn onClick={handleSelectAllFiltered}>
                  {selectedIds.size === filteredCadets.length && filteredCadets.length > 0 ? (
                    <CheckSquare size={16} color={ACCENT} />
                  ) : (
                    <Square size={16} color="#94a3b8" />
                  )}
                  {selectedIds.size === filteredCadets.length && filteredCadets.length > 0
                    ? "Deselect All Filtered"
                    : `Select All Filtered (${filteredCadets.length})`}
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

            {/* CADETS TABLE */}
            <TableWrapper>
              <StyledTable>
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredCadets.length > 0 && selectedIds.size === filteredCadets.length}
                        onChange={handleSelectAllFiltered}
                        title="Select/Deselect All"
                      />
                    </th>
                    <th style={{ width: 50 }}>S.No</th>
                    <th>SEC ID / Regt No</th>
                    <th>Cadet Name</th>
                    <th>Dept</th>
                    <th>Year</th>
                    <th>Wing</th>
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
                  ) : filteredCadets.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                        No cadets found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCadets.map((cadet, index) => {
                      const isSelected = selectedIds.has(cadet.id);
                      return (
                        <tr
                          key={cadet.id}
                          className={isSelected ? 'selected' : ''}
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
                          <td style={{ color: '#475569' }}>{cadet.year || '—'}</td>
                          <td>
                            <WingPill $wing={cadet.wing}>
                              {cadet.wing || 'Army'}
                            </WingPill>
                          </td>
                        </tr>
                      );
                    })
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
