import React, { useState, useEffect, useMemo, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Upload, Search, CheckSquare, Square,
  CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Users,
  Calendar, MapPin, Clock, ShieldCheck, ExternalLink, Terminal,
  SlidersHorizontal, Sparkles, Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import SEO from '../components/common/SEO';
import { generateAndDownloadODDocx } from '../utils/odDocxGenerator';

const GOLD = "#FFBF00";
const NAVY = "#1a2b4c";
const ACCENT = "#3b82f6";

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  padding-top: 100px;
  padding-bottom: 4rem;
`;

const ContentWrapper = styled.div`
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 1.5rem;
`;

const HeaderCard = styled.div`
  background: white;
  padding: 1.5rem 2rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.25rem;
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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
  &:hover { background: #e2e8f0; }
`;

const TabBar = styled.div`
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
`;

const TabBtn = styled.button`
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? NAVY : '#64748b'};
  border: none;
  padding: 8px 18px;
  border-radius: 9px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: ${props => props.$active ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'};
  transition: all 0.2s;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 1.5rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  padding: 1.75rem;
  margin-bottom: 1.5rem;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
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
  margin-bottom: 1rem;

  label {
    font-size: 0.8rem;
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
    transition: border 0.2s;

    &:focus {
      border-color: ${ACCENT};
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  textarea {
    resize: vertical;
    font-family: inherit;
    font-size: 0.85rem;
  }
`;

const TwoCols = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const SourceToggle = styled.div`
  display: flex;
  gap: 8px;
  background: #f8fafc;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 1.25rem;
`;

const SourceBtn = styled.button`
  flex: 1;
  padding: 9px;
  border: none;
  border-radius: 9px;
  background: ${props => props.$active ? NAVY : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s;
`;

const FilterBar = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 1.25rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TableWrap = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  max-height: 520px;
  overflow-y: auto;
`;

const CadetTable = styled.table`
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
    padding: 11px 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
  }

  tr:hover td {
    background: #f8fafc;
  }

  tr.selected td {
    background: #eff6ff;
  }
`;

const CheckboxCell = styled.td`
  width: 40px;
  text-align: center;
  cursor: pointer;
`;

const PrimaryBtn = styled(motion.button)`
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  width: 100%;
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
  transition: all 0.2s;

  &:disabled {
    background: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const FileUploadArea = styled.div`
  border: 2px dashed #cbd5e1;
  border-radius: 14px;
  padding: 2rem 1rem;
  text-align: center;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${ACCENT};
    background: #eff6ff;
  }
`;

const AdminODGeneratorPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('native'); // 'native' | 'python'

  // Cadet Data State
  const [cadetSource, setCadetSource] = useState('firestore'); // 'firestore' | 'excel'
  const [firestoreCadets, setFirestoreCadets] = useState([]);
  const [excelCadets, setExcelCadets] = useState([]);
  const [loadingCadets, setLoadingCadets] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [wingFilter, setWingFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');

  // Selected Cadet IDs
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Letter Form State
  const [fromDate, setFromDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState('');
  const [programLocation, setProgramLocation] = useState('');
  const [programDetails, setProgramDetails] = useState('');
  const [programTime, setProgramTime] = useState('09:00 AM to 04:00 PM');
  const [academicYear, setAcademicYear] = useState('');
  const [sincerelyName, setSincerelyName] = useState('Associate NCC Officer');
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
  const [generating, setGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Python server state for Tab 2
  const [pyOnline, setPyOnline] = useState(false);

  // Fetch Firestore Cadets
  useEffect(() => {
    const loadCadets = async () => {
      try {
        const snap = await getDocs(collection(db, 'cadets'));
        const list = snap.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            student_id: d.regNo || d.regimentNo || d.id || doc.id,
            name: d.Name || d.name || 'Unnamed',
            department: d.dept || d.department || '',
            wing: d.Wing || d.wing || 'Army',
            year: d.year || d.Year || (d.Batch ? d.Batch.toString().slice(0, 4) : ''),
            section: d.section || d.Section || 'A',
            rank: d.rank || 'CDT'
          };
        });
        setFirestoreCadets(list);
      } catch (err) {
        console.error("Error loading cadets from Firestore:", err);
      } finally {
        setLoadingCadets(false);
      }
    };
    loadCadets();
  }, []);

  // Probe local Python Flask app
  useEffect(() => {
    const probe = async () => {
      try {
        await fetch('http://127.0.0.1:5000', { mode: 'no-cors' });
        setPyOnline(true);
      } catch (_) {
        setPyOnline(false);
      }
    };
    probe();
    const interval = setInterval(probe, 6000);
    return () => clearInterval(interval);
  }, []);

  // Current active list
  const activeCadetsList = cadetSource === 'firestore' ? firestoreCadets : excelCadets;

  // Filtered cadets
  const filteredCadets = useMemo(() => {
    return activeCadetsList.filter(c => {
      if (wingFilter !== 'ALL' && (!c.wing || !c.wing.toLowerCase().includes(wingFilter.toLowerCase()))) {
        return false;
      }
      if (deptFilter !== 'ALL' && (!c.department || c.department.toUpperCase() !== deptFilter.toUpperCase())) {
        return false;
      }
      if (yearFilter !== 'ALL' && (!c.year || !c.year.toString().includes(yearFilter))) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const n = (c.name || '').toLowerCase();
        const reg = (c.student_id || '').toLowerCase();
        const d = (c.department || '').toLowerCase();
        if (!n.includes(q) && !reg.includes(q) && !d.includes(q)) return false;
      }
      return true;
    });
  }, [activeCadetsList, wingFilter, deptFilter, yearFilter, searchQuery]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const s = new Set(activeCadetsList.map(c => c.department).filter(Boolean));
    return Array.from(s).sort();
  }, [activeCadetsList]);

  // Selection handlers
  const handleSelectCadet = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCadets.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCadets.map(c => c.id)));
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

        const parsed = data.map((row, idx) => ({
          id: `excel_${idx}`,
          student_id: row['SEC ID'] || row['ID'] || row['Reg No'] || row['Regiment No'] || `CADET_${idx + 1}`,
          name: row['Name'] || row['NAME'] || row['Cadet Name'] || 'Cadet',
          department: row['Dept'] || row['Department'] || row['DEPT'] || '',
          year: row['Year'] || row['YEAR'] || '',
          wing: row['Wing'] || row['WING'] || 'Army',
          section: row['Sec'] || row['Section'] || 'A'
        }));

        setExcelCadets(parsed);
        setCadetSource('excel');
        setSelectedIds(new Set(parsed.map(c => c.id)));
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure it has valid columns.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Generate Word Document
  const handleGenerate = async () => {
    const chosenCadets = activeCadetsList.filter(c => selectedIds.has(c.id));
    if (chosenCadets.length === 0) {
      alert("Please select at least one cadet from the list.");
      return;
    }
    if (!fromDate) {
      alert("Please specify the From Date.");
      return;
    }
    if (!programLocation) {
      alert("Please enter the Programme Venue/Location.");
      return;
    }

    setGenerating(true);
    try {
      await generateAndDownloadODDocx({
        selectedCadets: chosenCadets,
        fromDate,
        toDate,
        fromAddress,
        toAddress,
        programLocation,
        programDetails,
        programTime,
        academicYear,
        sincerelyName,
        letterContent: customLetterContent
      });

      setSuccessMessage(`Word OD letter generated for ${chosenCadets.length} cadets!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error("Docx generation failed:", err);
      alert("Failed to generate Word document. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <PageContainer>
      <SEO title="OD Letter Generator | Admin Portal" />
      <ContentWrapper>
        <HeaderCard>
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
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: NAVY, display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={26} color="#d97706" />
                OD Generator
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8' }}>
                  Cloud Ready • Client Side
                </span>
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Generate official On Duty Word letters (.docx) and manage cadet participation lists
              </p>
            </div>
          </TitleArea>

          <TabBar>
            <TabBtn
              $active={activeTab === 'native'}
              onClick={() => setActiveTab('native')}
            >
              <Sparkles size={16} color="#d97706" />
              Generator Workspace
            </TabBtn>

            <TabBtn
              $active={activeTab === 'python'}
              onClick={() => setActiveTab('python')}
            >
              <Terminal size={16} />
              Python Server Engine
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: pyOnline ? '#22c55e' : '#f59e0b'
              }} />
            </TabBtn>
          </TabBar>
        </HeaderCard>

        {activeTab === 'native' ? (
          <Grid>
            {/* LEFT COLUMN: LETTER CONFIGURATION */}
            <div>
              <Card>
                <CardHeader>
                  <h2><Calendar size={18} color="#2563eb" /> Programme Details</h2>
                </CardHeader>

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
                    />
                  </FormGroup>
                </TwoCols>

                <FormGroup>
                  <label>Programme Venue / Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Marina Beach / OTA Chennai"
                    value={programLocation}
                    onChange={e => setProgramLocation(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Programme Purpose / Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Republic Day Camp Selection Trials"
                    value={programDetails}
                    onChange={e => setProgramDetails(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Timings</label>
                  <input
                    type="text"
                    placeholder="e.g. 09:00 AM to 04:00 PM"
                    value={programTime}
                    onChange={e => setProgramTime(e.target.value)}
                  />
                </FormGroup>

                <TwoCols>
                  <FormGroup>
                    <label>Academic Year</label>
                    <select
                      value={academicYear}
                      onChange={e => setAcademicYear(e.target.value)}
                    >
                      <option value="">Auto / Mixed</option>
                      <option value="I">I Year</option>
                      <option value="II">II Year</option>
                      <option value="III">III Year</option>
                      <option value="IV">IV Year</option>
                    </select>
                  </FormGroup>

                  <FormGroup>
                    <label>ANO Signatory Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Capt. Dr. A. Arun"
                      value={sincerelyName}
                      onChange={e => setSincerelyName(e.target.value)}
                    />
                  </FormGroup>
                </TwoCols>

                <FormGroup>
                  <label>From Address</label>
                  <textarea
                    rows={3}
                    value={fromAddress}
                    onChange={e => setFromAddress(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <label>To Address</label>
                  <textarea
                    rows={3}
                    value={toAddress}
                    onChange={e => setToAddress(e.target.value)}
                  />
                </FormGroup>

                <FormGroup>
                  <label>Custom Body (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Leave blank to use standard official On Duty request format"
                    value={customLetterContent}
                    onChange={e => setCustomLetterContent(e.target.value)}
                  />
                </FormGroup>

                {successMessage && (
                  <div style={{ padding: '10px 14px', borderRadius: 10, background: '#dcfce7', color: '#166534', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                    <CheckCircle2 size={16} /> {successMessage}
                  </div>
                )}

                <PrimaryBtn
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={generating || selectedIds.size === 0}
                  onClick={handleGenerate}
                >
                  <Download size={18} />
                  {generating ? "Creating Word Document..." : `Download Word Letter (${selectedIds.size} Cadets)`}
                </PrimaryBtn>
              </Card>
            </div>

            {/* RIGHT COLUMN: CADET SELECTOR & MASTER LIST */}
            <div>
              <Card>
                <CardHeader>
                  <h2><Users size={18} color="#059669" /> Select Cadets</h2>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '4px 10px', borderRadius: 8 }}>
                    {selectedIds.size} / {filteredCadets.length} Selected
                  </span>
                </CardHeader>

                <SourceToggle>
                  <SourceBtn
                    $active={cadetSource === 'firestore'}
                    onClick={() => setCadetSource('firestore')}
                  >
                    <Users size={15} /> Database Cadets ({firestoreCadets.length})
                  </SourceBtn>

                  <SourceBtn
                    $active={cadetSource === 'excel'}
                    onClick={() => setCadetSource('excel')}
                  >
                    <Upload size={15} /> Excel Upload ({excelCadets.length})
                  </SourceBtn>
                </SourceToggle>

                {cadetSource === 'excel' && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block' }}>
                      <FileUploadArea>
                        <Upload size={28} color="#3b82f6" style={{ margin: '0 auto 8px' }} />
                        <p style={{ margin: 0, fontWeight: 700, color: NAVY }}>Click to Upload Cadet Excel Sheet (.xlsx / .xls)</p>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Supports SEC ID, Name, Department, Year, Wing, Section columns</p>
                      </FileUploadArea>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                        onChange={handleExcelUpload}
                      />
                    </label>
                  </div>
                )}

                <FilterBar>
                  <FormGroup style={{ margin: 0 }}>
                    <input
                      type="text"
                      placeholder="Search Name or Regt No..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </FormGroup>

                  <FormGroup style={{ margin: 0 }}>
                    <select
                      value={wingFilter}
                      onChange={e => setWingFilter(e.target.value)}
                    >
                      <option value="ALL">All Wings</option>
                      <option value="Army">Army Wing</option>
                      <option value="Navy">Navy Wing</option>
                      <option value="Air">Air Wing</option>
                    </select>
                  </FormGroup>

                  <FormGroup style={{ margin: 0 }}>
                    <select
                      value={deptFilter}
                      onChange={e => setDeptFilter(e.target.value)}
                    >
                      <option value="ALL">All Depts</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </FormGroup>
                </FilterBar>

                <TableWrap>
                  <CadetTable>
                    <thead>
                      <tr>
                        <th style={{ width: 40, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={filteredCadets.length > 0 && selectedIds.size === filteredCadets.length}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th>S.No</th>
                        <th>ID / Regt No</th>
                        <th>Name</th>
                        <th>Dept</th>
                        <th>Year</th>
                        <th>Wing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCadets.map((c, idx) => {
                        const isSelected = selectedIds.has(c.id);
                        return (
                          <tr
                            key={c.id}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => handleSelectCadet(c.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <CheckboxCell onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleSelectCadet(c.id)}
                              />
                            </CheckboxCell>
                            <td>{idx + 1}</td>
                            <td style={{ fontWeight: 700, color: NAVY }}>{c.student_id}</td>
                            <td style={{ fontWeight: 600 }}>{c.name}</td>
                            <td>{c.department}</td>
                            <td>{c.year}</td>
                            <td>
                              <span style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800,
                                background: c.wing?.toLowerCase().includes('air') ? '#e0f2fe' : c.wing?.toLowerCase().includes('navy') ? '#e0e7ff' : '#fee2e2',
                                color: c.wing?.toLowerCase().includes('air') ? '#0369a1' : c.wing?.toLowerCase().includes('navy') ? '#4338ca' : '#b91c1c'
                              }}>
                                {c.wing || 'Army'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredCadets.length === 0 && (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                            No cadets found matching your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </CadetTable>
                </TableWrap>
              </Card>
            </div>
          </Grid>
        ) : (
          /* TAB 2: PYTHON FLASK ENGINE */
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.75rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Terminal size={20} color={NAVY} />
                <span style={{ fontWeight: 700, color: NAVY, fontSize: '0.95rem' }}>Python Flask Workspace</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: pyOnline ? '#dcfce7' : '#fef3c7', color: pyOnline ? '#166534' : '#b45309' }}>
                  {pyOnline ? "Online (127.0.0.1:5000)" : "Offline (Not Running)"}
                </span>
              </div>
              {pyOnline && (
                <button
                  onClick={() => window.open('http://127.0.0.1:5000/generate', '_blank')}
                  style={{ background: 'white', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ExternalLink size={14} /> Open in New Tab
                </button>
              )}
            </div>

            {pyOnline ? (
              <iframe
                src="http://127.0.0.1:5000/generate"
                style={{ width: '100%', height: '82vh', border: 'none' }}
                title="Python OD Generator"
              />
            ) : (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
                <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', background: '#fef3c7', color: '#d97706', marginBottom: '1.5rem' }}>
                  <Terminal size={40} />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: NAVY, margin: '0 0 0.5rem' }}>
                  Python Server Offline
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  To run the junior's original Python Flask app locally, double-click <code style={{ fontWeight: 700, color: NAVY }}>run_od_generator.bat</code> in the project root or run:
                </p>
                <div style={{ background: '#0f172a', color: '#38bdf8', padding: '10px 18px', borderRadius: 10, fontFamily: 'monospace', margin: '1.25rem 0', display: 'inline-block' }}>
                  npm run od-generator
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Note: The <strong>Generator Workspace</strong> tab works 100% in the cloud without needing any Python server!
                </p>
              </div>
            )}
          </Card>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default AdminODGeneratorPage;
