import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  orderBy, 
  deleteDoc,
  writeBatch,
  updateDoc,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';
import { toCanonicalWing } from '../utils/wingUtils';
import { normalizeRank } from '../rankStructure';
import { 
  Download, 
  Trash2, 
  RefreshCw, 
  FileText,
  CheckSquare,
  Square,
  AlertCircle,
  BrainCircuit,
  CheckCircle2,
  Table as TableIcon,
  HelpCircle,
  Copy,
  Info,
  Users,
  Database,
  ShieldCheck,
  ChevronDown,
  Link as LinkIcon,
  Settings,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';

const PageContainer = styled.div`
  padding: 8rem 2rem 4rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 80vh;
  background: #fcfdfe;
  
  @media (max-width: 768px) {
    padding-top: 6rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #f1f5f9;
  
  h1 {
    color: #1a2b4c;
    font-size: 2.5rem;
    font-weight: 900;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
    letter-spacing: -1px;
  }
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2.5rem;
  margin-bottom: 3rem;
  
  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: white;
  border-radius: 32px;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(26, 43, 76, 0.04);
  border: 1px solid #edf2f7;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 20px 50px rgba(26, 43, 76, 0.08);
    transform: translateY(-4px);
  }
`;

const OptionTag = styled.div`
  background: ${props => props.color || '#1a2b4c'};
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  width: fit-content;
  margin-bottom: 1.5rem;
`;

const Title = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #1a2b4c;
  font-size: 1.8rem;
  font-weight: 800;
`;

const Description = styled.p`
  font-size: 1rem;
  color: #64748b;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    margin-bottom: 0.6rem;
    font-weight: 700;
    color: #1a2b4c;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
`;

const UrlInput = styled.input`
  width: 100%;
  padding: 1.1rem 1.25rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 18px;
  font-size: 1rem;
  color: #1a2b4c;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: #1a2b4c;
    background: white;
    box-shadow: 0 0 0 4px rgba(26, 43, 76, 0.05);
  }
`;

const SelectWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  svg {
    position: absolute;
    right: 1.25rem;
    pointer-events: none;
    color: #64748b;
  }
`;

const SelectInput = styled.select`
  width: 100%;
  padding: 1.1rem 1.25rem;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 18px;
  font-size: 1rem;
  color: #1a2b4c;
  cursor: pointer;
  appearance: none;
  
  &:focus {
    outline: none;
    border-color: #1a2b4c;
  }
`;

const TableCard = styled(Card)`
  margin-top: 1rem;
  &:hover { transform: none; box-shadow: 0 10px 40px rgba(26, 43, 76, 0.04); }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 20px;
  border: 1px solid #edf2f7;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    text-align: left;
    padding: 1.5rem 1.25rem;
    background: #f8fafc;
    color: #64748b;
    font-weight: 800;
    font-size: 0.85rem;
    border-bottom: 2px solid #f1f5f9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  td {
    padding: 1.5rem 1.25rem;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
    font-size: 1rem;
  }
  
  tr:hover td {
    background: #fcfdfe;
  }
`;

const ActionButton = styled.button`
  background: ${props => props.variant === 'danger' ? '#fee2e2' : '#f1f5f9'};
  color: ${props => props.variant === 'danger' ? '#ef4444' : '#64748b'};
  border: none;
  padding: 0.8rem;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.variant === 'danger' ? '#fecaca' : '#e2e8f0'};
    color: ${props => props.variant === 'danger' ? '#dc2626' : '#1a2b4c'};
    transform: scale(1.1);
  }
`;

const PrimaryButton = styled.button`
  background: ${props => {
    if (props.variant === 'danger') return '#e11d48';
    if (props.variant === 'success') return '#059669';
    if (props.variant === 'ai') return 'linear-gradient(135deg, #1a2b4c 0%, #111d35 100%)';
    return '#1a2b4c';
  }};
  color: white;
  border: none;
  padding: 1.2rem 2rem;
  border-radius: 20px;
  font-weight: 800;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  justify-content: center;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(26, 43, 76, 0.2);
    filter: brightness(1.1);
  }
  
  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
    transform: none;
  }
`;

const CardTag = styled.span`
  background: ${props => props.color || '#1a2b4c'}15;
  color: ${props => props.color || '#1a2b4c'};
  padding: 0.4rem 0.8rem;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  display: inline-flex;
  margin-bottom: 1rem;
`;

const GhostButton = styled.button`
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
  padding: 1.1rem 1.8rem;
  border-radius: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #1a2b4c;
  }
`;

const Checkbox = styled.div`
  cursor: pointer;
  color: ${props => props.checked ? '#1a2b4c' : '#cbd5e1'};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 40px;
  padding: 3rem;
  max-width: 700px;
  width: 90%;
  box-shadow: 0 40px 100px rgba(0,0,0,0.3);
  max-height: 90vh;
  overflow-y: auto;
`;

const AdminRegistrationManager = () => {
  // Option 1: Sairam NCC Join Page Configuration
  const [sheetUrl, setSheetUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);

  // Option 2: Mass Cadet Import Configuration
  const [importing, setImporting] = useState(false);
  const [selectedWing, setSelectedWing] = useState('Army');
  const [batchStart, setBatchStart] = useState('2023');
  const [batchEnd, setBatchEnd] = useState('2026');
  const [formHeaders, setFormHeaders] = useState([]);
  
  // Data State
  const [registrations, setRegistrations] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // Processing States
  const [isProcessing, setIsProcessing] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [matchKey, setMatchKey] = useState('');
  const [conflicts, setConflicts] = useState(null);

  const years = Array.from({length: 12}, (_, i) => String(2020 + i));
  const wings = ['Army', 'Air', 'Navy'];

  useEffect(() => {
    fetchConfig();
    fetchCadets();
    fetchRegistrations();
  }, []);

  const [cadets, setCadets] = useState([]);

  const fetchCadets = async () => {
    try {
      const q = query(collection(db, 'cadets'), orderBy('Name', 'asc'));
      const querySnapshot = await getDocs(q);
      setCadets(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
  };

  const fetchConfig = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'config', 'registration'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSheetUrl(data.sheetUrl || '');
        setWebhookUrl(data.webhookUrl || '');
        setFormHeaders(data.headers || []);
      }
    } catch (err) { console.error(err); }
  };

  const fetchRegistrations = async () => {
    try {
      const q = query(collection(db, 'registrations'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      setRegistrations(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
  };

  const handleSaveOption1 = async () => {
    try {
      setSyncing(true);
      await setDoc(doc(db, 'config', 'registration'), {
        sheetUrl,
        webhookUrl,
        headers: formHeaders,
        updatedAt: serverTimestamp()
      }, { merge: true });
      alert("Registration Configuration Saved!\nYour form has been updated with " + formHeaders.length + " fields.");
    } catch (err) { alert("Error saving configuration."); }
    finally { setSyncing(false); }
  };

  const handleHeaderUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const headerRow = XLSX.utils.sheet_to_json(ws, { header: 1 })[0];
        
        if (!headerRow || !headerRow.length) return alert("Excel file appears to be empty or corrupted.");
        
        const cleanHeaders = headerRow
          .map(h => String(h).trim())
          .filter(h => {
             const lower = h.toLowerCase();
             return h && h !== 'undefined' && lower !== 's.no.' && lower !== 's.no' && lower !== 'sl.no' && lower !== 'sl.no.';
          });
        setFormHeaders(cleanHeaders);
        alert(`Detected ${cleanHeaders.length} fields: ${cleanHeaders.join(', ')}\n\nClick 'Confirm & Set Link' to save these to the website form.`);
      } catch (err) { alert("Error reading Excel file."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleImportUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);
        const headers = XLSX.utils.sheet_to_json(ws, { header: 1 })[0];

        if (!data.length) return alert("File is empty.");

        setExcelData(data);
        setExcelHeaders(headers);
        setMatchKey(headers[0]);
        setIsProcessing(true);
      } catch (err) { alert("Error reading Excel file."); }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const analyzeForConflicts = () => {
    const dupes = [];
    const batchName = `${batchStart}-${batchEnd}`;
    const canonicalWing = toCanonicalWing(selectedWing.toLowerCase());

    const CADET_SCHEMA = {
      Name: ['Name', 'Cadet Name', 'Full Name', 'Name of Cadet'],
      rank: ['Rank', 'Cdt Rank', 'Designation'],
      regimentalNo: ['Regimental No', 'Reg No', 'Registration No', 'Regimental Number'],
      secID: ['SEC ID', 'Student ID', 'Roll No', 'College ID'],
      dept: ['Dept', 'Department', 'Branch'],
      section: ['Section', 'Sec', 'Class Section'],
      pdfURL: ['Dossier', 'Dossier Link', 'PDF URL', 'Dossier URL'],
      photoURL: ['Photo', 'Photo Link', 'Image URL', 'Photo URL']
    };

    const getMappedKey = (header) => {
      for (const [sKey, aliases] of Object.entries(CADET_SCHEMA)) {
        if (aliases.some(a => a.toLowerCase() === header.trim().toLowerCase())) return sKey;
      }
      return header;
    };

    const matchSchemaKey = getMappedKey(matchKey);

    const processed = excelData.map(row => {

      // Smart Mapping
      const mapped = {
        Wing: canonicalWing,
        Batch: batchName,
        source: 'Mass Import'
      };

      Object.entries(CADET_SCHEMA).forEach(([key, aliases]) => {
        const foundKey = excelHeaders.find(h => 
          aliases.some(a => a.toLowerCase() === h.trim().toLowerCase())
        );
        if (foundKey) mapped[key] = String(row[foundKey] || '').trim();
        else if (row[key]) mapped[key] = String(row[key] || '').trim();
        else mapped[key] = '';
      });

      // Special case for rank normalization
      if (mapped.rank) mapped.rank = normalizeRank(mapped.rank);

      mapped._matchSchemaKey = matchSchemaKey;

      // Add the mapped comparison value to the row so we can find it easily
      mapped._matchVal = mapped[matchSchemaKey] || '';
      
      return mapped;
    });

    processed.forEach(row => {
      const val = String(row._matchVal || '').trim().toLowerCase();
      if (!val) return;
      // Check in main cadets collection
      const match = cadets.find(c => {
        const existingVal = String(c[matchKey] || c[getMappedKey(matchKey)] || '').trim().toLowerCase();
        return existingVal === val;
      });
      if (match) dupes.push({ incoming: row, existingId: match.id, label: val });
    });

    if (dupes.length > 0) {
      setConflicts({ dupes, processed });
    } else {
      finalizeMassImport(processed, 'skip');
    }
  };

  const finalizeMassImport = async (data = excelData, resolution = 'skip') => {
    setImporting(true);
    setIsProcessing(false);
    try {
      const batch = writeBatch(db);
      const batchName = `${batchStart}-${batchEnd}`;
      const canonicalWing = toCanonicalWing(selectedWing.toLowerCase());
      
      let countAdded = 0;
      let countUpdated = 0;

      data.forEach(row => {
        const val = String(row._matchVal || '').trim().toLowerCase();
        const existing = val ? cadets.find(c => {
          const existingVal = String(c[matchKey] || c[row._matchSchemaKey] || '').trim().toLowerCase();
          return existingVal === val;
        }) : null;

        if (existing) {
          if (resolution === 'overwrite') {
            // Remove helper keys before saving
            const { _matchVal, _matchSchemaKey, ...saveData } = row;
            batch.set(doc(db, 'cadets', existing.id), { ...saveData, updatedAt: serverTimestamp() }, { merge: true });
            countUpdated++;
          }
        } else {
          const { _matchVal, _matchSchemaKey, ...saveData } = row;
          batch.set(doc(collection(db, 'cadets')), { ...saveData, createdAt: serverTimestamp() });
          countAdded++;
        }
      });

      // Sync the Batch to config/batches
      const batchDocRef = doc(db, 'config', 'batches');
      const wingKey = selectedWing.toLowerCase(); // Use lower case for key as per wingUtils mapping
      await updateDoc(batchDocRef, {
        [wingKey]: arrayUnion(batchName)
      }).catch(async (e) => {
        // If doc doesn't exist, create it
        await setDoc(batchDocRef, { [wingKey]: [batchName] }, { merge: true });
      });

      await batch.commit();
      alert(`Mass Import Complete!\n\n🆕 Added: ${countAdded}\n🔄 Overwritten: ${countUpdated}\n✅ Batch "${batchName}" synced to ${selectedWing} Wing.`);
      fetchCadets();
    } catch (err) { 
      console.error(err);
      alert("Failed to save data. Please check if your Match Key column exists in all rows."); 
    }
    finally {
      setImporting(false);
      setConflicts(null);
      setExcelData([]);
    }
  };

  return (
    <PageContainer>
      <Header>
        <h1><ShieldCheck size={40} color="#1a2b4c" /> Registration Control Center</h1>
        <PrimaryButton onClick={() => {
          const exportData = cadets.map(cadet => ({
            'Wing': cadet.Wing || 'N/A',
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
          const ws = XLSX.utils.json_to_sheet(exportData);
          XLSX.writeFile(XLSX.utils.book_new(XLSX.utils.book_append_sheet(null, ws, "NCC")), "NCC_Cadet_Database_Complete.xlsx");
        }}>
          <Download size={20} /> Export Website Data
        </PrimaryButton>
      </Header>

      <SectionGrid>
        {/* OPTION ONE: JOIN SAIRAM NCC ADMIN (LINK UPLOAD) */}
        <Card>
          <OptionTag>Option One</OptionTag>
          <Title><LinkIcon size={28} color="#1a2b4c" /> Join Sairam NCC Form Link</Title>
          <Description>
            Whenever a user enters details in the registration form, it has to save in your Excel sheet. Set your Google Sheet link here.
          </Description>

          <InputGroup>
            <label>Public Form Sync (Google Sheet URL)</label>
            <UrlInput value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/..." />
          </InputGroup>

          <InputGroup>
            <label>Direct Save Hook (Web App Script)</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <UrlInput value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://script.google.com/..." />
              <ActionButton onClick={() => setShowScriptModal(true)} title="Setup Help">
                <Settings size={20} />
              </ActionButton>
            </div>
          </InputGroup>

          <InputGroup>
            <label>Define Form Fields (Upload Excel Template)</label>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.8rem' }}>
              Upload an Excel sheet (can be blank). The <b>Column Headers</b> will become the questions on your "Join" form.
            </p>
            <input type="file" id="header-upload" accept=".xlsx, .xls" onChange={handleHeaderUpload} style={{ display: 'none' }} />
            <GhostButton onClick={() => document.getElementById('header-upload').click()}>
              <FileSpreadsheet size={18} /> Upload Field Template
            </GhostButton>
            {formHeaders.length > 0 && (
              <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {formHeaders.map((h, i) => <CardTag key={i} style={{ margin: 0, fontSize: '0.7rem' }}>{h}</CardTag>)}
              </div>
            )}
          </InputGroup>

          <PrimaryButton onClick={handleSaveOption1} variant="success" disabled={syncing} style={{ marginTop: 'auto' }}>
            {syncing ? <RefreshCw className="animate-spin" /> : <ShieldCheck />} Confirm & Set Link
          </PrimaryButton>
        </Card>

        {/* OPTION TWO: MASS DATA IMPORT */}
        <Card>
          <OptionTag color="#6366f1">Option Two</OptionTag>
          <Title><Database size={28} color="#6366f1" /> Mass Cadet Data Import</Title>
          <Description>
            Extract massive amounts of data from an Excel sheet and save them into the website. Choose wing and batch details.
          </Description>

          <InputGroup>
            <label>Which Wing?</label>
            <SelectWrapper>
              <SelectInput value={selectedWing} onChange={(e) => setSelectedWing(e.target.value)}>
                {wings.map(w => <option key={w} value={w}>{w} Wing</option>)}
              </SelectInput>
              <ChevronDown size={18} />
            </SelectWrapper>
          </InputGroup>

          <InputRow>
            <InputGroup>
              <label>Starting Batch</label>
              <SelectWrapper>
                <SelectInput value={batchStart} onChange={(e) => setBatchStart(e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </SelectInput>
                <ChevronDown size={18} />
              </SelectWrapper>
            </InputGroup>
            <InputGroup>
              <label>Ending Batch</label>
              <SelectWrapper>
                <SelectInput value={batchEnd} onChange={(e) => setBatchEnd(e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </SelectInput>
                <ChevronDown size={18} />
              </SelectWrapper>
            </InputGroup>
          </InputRow>

          <input type="file" id="mass-import-file" accept=".xlsx, .xls" onChange={handleImportUpload} style={{ display: 'none' }} />
          <PrimaryButton variant="ai" onClick={() => document.getElementById('mass-import-file').click()} disabled={importing} style={{ marginTop: 'auto' }}>
            <PlusCircle size={20} /> {importing ? 'Processing...' : 'Upload Excel & Extract Values'}
          </PrimaryButton>
        </Card>
      </SectionGrid>

      {/* DATABASE VIEW */}
      <TableCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <Title style={{ marginBottom: '0.5rem' }}><Users size={28} /> Website Cadet Database</Title>
            <p style={{ color: '#64748b' }}>Total Cadets Count: <b>{cadets.length}</b></p>
          </div>
          {selectedIds.length > 0 && (
            <PrimaryButton variant="danger" onClick={async () => {
              if (window.confirm(`Delete ${selectedIds.length} cadets permanently from all wings?`)) {
                const b = writeBatch(db);
                selectedIds.forEach(id => b.delete(doc(db, 'cadets', id)));
                await b.commit();
                fetchCadets();
                setSelectedIds([]);
              }
            }}>Delete Selected ({selectedIds.length})</PrimaryButton>
          )}
        </div>

        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th style={{ width: '40px' }}><Checkbox onClick={() => setSelectedIds(selectedIds.length === cadets.length ? [] : cadets.map(r => r.id))} checked={selectedIds.length === cadets.length && cadets.length > 0}>{selectedIds.length === cadets.length && cadets.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}</Checkbox></th>
                <th>Wing</th>
                <th>Batch</th>
                <th>Name</th>
                <th>Regimental No</th>
                <th>College ID</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cadets.length > 0 ? cadets.map((reg) => (
                <tr key={reg.id}>
                  <td><Checkbox onClick={() => setSelectedIds(p => p.includes(reg.id) ? p.filter(i => i !== reg.id) : [...p, reg.id])} checked={selectedIds.includes(reg.id)}>{selectedIds.includes(reg.id) ? <CheckSquare size={18} /> : <Square size={18} />}</Checkbox></td>
                  <td><CardTag color="#1a2b4c" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', margin: 0, background: '#f1f5f9' }}>{reg.Wing || '-'}</CardTag></td>
                  <td>{reg.Batch || '-'}</td>
                  <td>{reg.Name || '-'}</td>
                  <td>{reg.regimentalNo || '-'}</td>
                  <td>{reg.secID || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <ActionButton variant="danger" onClick={async () => {
                      if(window.confirm('Delete this cadet permanently?')) {
                        await deleteDoc(doc(db, 'cadets', reg.id));
                        fetchCadets();
                      }
                    }}>
                      <Trash2 size={16} />
                    </ActionButton>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '5rem', color: '#94a3b8' }}>No records in database.</td></tr>
              )}
            </tbody>
          </Table>
        </TableContainer>
      </TableCard>

      {/* MATCH KEY & EXTRACTION MODAL */}
      {isProcessing && (
        <ModalOverlay>
          <ModalContent>
            <Title><BrainCircuit color="#1a2b4c" /> Finalize Extraction</Title>
            <Description>
              Excel loaded! Choose which column I should use to detect **Duplicates** (Match Key).
            </Description>
            <InputGroup>
              <label>Match Key (Unique ID)</label>
              <SelectWrapper>
                <SelectInput value={matchKey} onChange={(e) => setMatchKey(e.target.value)}>
                  {excelHeaders.map((h, i) => <option key={i} value={h}>{h}</option>)}
                </SelectInput>
                <ChevronDown size={18} />
              </SelectWrapper>
            </InputGroup>
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '24px', marginBottom: '2rem' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a2b4c', marginBottom: '0.5rem' }}>Columns detected:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {excelHeaders.map((h, i) => <CardTag key={i} style={{ margin: 0, fontSize: '0.7rem', background: '#e2e8f0' }}>{h}</CardTag>)}
              </div>
            </div>
            <PrimaryButton onClick={analyzeForConflicts} style={{ width: '100%' }}>Scan & Save To Website</PrimaryButton>
            <GhostButton onClick={() => setIsProcessing(false)} style={{ marginTop: '1rem' }}>Cancel</GhostButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* WINDOWS EXPLORER DIALOG */}
      {conflicts && (
        <ModalOverlay>
          <ModalContent>
            <Title><AlertCircle color="#f59e0b" /> Overwrite or Ignore?</Title>
            <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', padding: '1.5rem', borderRadius: '24px', display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              <Info color="#d97706" size={32} />
              <p style={{ margin: 0, color: '#92400e', fontSize: '0.95rem' }}>
                <b>{conflicts.length} cadets</b> in this sheet already exist in the website database.
              </p>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #edf2f7', marginBottom: '2rem' }}>
              {conflicts.dupes.slice(0, 10).map((c, i) => <div key={i} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', fontSize: '0.9rem' }}>{c.label}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <PrimaryButton variant="success" onClick={() => finalizeMassImport(conflicts.processed, 'overwrite')}>Overwrite All</PrimaryButton>
              <PrimaryButton onClick={() => finalizeMassImport(conflicts.processed, 'skip')}>Ignore & Add New</PrimaryButton>
            </div>
            <GhostButton onClick={() => { setConflicts(null); setIsProcessing(false); }} style={{ marginTop: '1rem' }}>Cancel</GhostButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* SCRIPT SETUP MODAL */}
      {showScriptModal && (
        <ModalOverlay onClick={() => setShowScriptModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <Title>Connect Form to Excel</Title>
            <p style={{ fontSize: '0.9rem', color: '#64748b', mb: '1rem' }}>Paste this code into Google Apps Script in your Sheet:</p>
            <div style={{ background: '#0f172a', padding: '1.5rem', borderRadius: '20px', position: 'relative' }}>
              <code id="apps-script-code" style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{`function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Robust Mapping: Matches headers even if case or spaces differ
  var newRow = headers.map(function(h) {
    var searchKey = String(h).trim().toLowerCase();
    for (var key in data) {
      if (key.toLowerCase().trim() === searchKey) return data[key];
    }
    return "";
  });
  
  sheet.appendRow(newRow);
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}`}</code>
              <ActionButton 
                onClick={() => {
                  const code = document.getElementById('apps-script-code').innerText;
                  navigator.clipboard.writeText(code); 
                  alert("Full Code Copied! Paste this into your Google Apps Script editor.");
                }} 
                style={{ position: 'absolute', top: '10px', right: '10px' }}
              >
                <Copy size={16} />
              </ActionButton>
            </div>
            <PrimaryButton onClick={() => setShowScriptModal(false)} style={{ width: '100%', marginTop: '2rem' }}>Done</PrimaryButton>
          </ModalContent>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default AdminRegistrationManager;
