import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, doc, setDoc, query, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, User2, Trash, Upload, Plus, X, Crop as CropIcon, CheckCircle2 } from 'lucide-react';
import { uploadFile } from '../utils/uploadHelper';
import SEO from '../components/common/SEO';
import Cropper from 'react-easy-crop';
import { getCroppedImgBlob } from '../utils/cropImage';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f8fafc;
  padding: 120px 2rem 100px;
  color: #0f172a;
`;

const ContentWrapper = styled.div`
  max-width: 1600px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 2rem 3rem;
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  border: 1px solid #f1f5f9;
`;

const TitleBox = styled.div`
  h1 { font-size: 2.5rem; font-weight: 900; letter-spacing: -1px; margin: 0; }
  span { color: #3b82f6; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 3rem;
  justify-content: center;
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 40px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 15px 40px rgba(0,0,0,0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const CardTop = styled.div`
  padding: 1.5rem 2rem;
  background: #fafbfc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  h3 { font-size: 0.9rem; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; }
`;

const CardBody = styled.div`
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const PhotoFrame = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 40px;
  background: #f1f5f9;
  margin: 0 auto;
  overflow: hidden;
  cursor: pointer;
  border: 6px solid white;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  position: relative;
  img { width: 100%; height: 100%; object-fit: cover; }
  .over {
    position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; 
    align-items: center; justify-content: center; opacity: 0; transition: 0.3s;
    color: white; font-weight: 800; font-size: 0.75rem;
  }
  &:hover .over { opacity: 1; }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  label { font-size: 0.7rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
  input {
    background: #f8fafc;
    border: 2px solid #f1f5f9;
    padding: 1rem 1.25rem;
    border-radius: 18px;
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    &:focus { outline: none; border-color: #3b82f6; background: white; }
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const SaveBtn = styled(motion.button)`
  background: ${props => props.$success ? '#10b981' : '#0f172a'};
  color: white;
  border: none;
  padding: 1.25rem;
  border-radius: 20px;
  font-weight: 900;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1rem;
  &:disabled { opacity: 0.6; }
`;

const Modal = styled(motion.div)`
  position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2rem; backdrop-filter: blur(10px);
`;

const AdminMagicMembersPage = () => {
  const roles = ['Mastermind', 'Advocate', 'Guide', 'Influencer', 'Communicator'];
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [success, setSuccess] = useState({});
  const [fileInputs, setFileInputs] = useState({});
  const [selectedBatch, setSelectedBatch] = useState('');
  const [cropData, setCropData] = useState({ open: false, role: null, image: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'magicMembers')));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllMembers(docs);
      const b = [...new Set(docs.map(m => m.batch).filter(Boolean))].sort((a, b) => b.localeCompare(a));
      if (b.length > 0 && !selectedBatch) setSelectedBatch(b[0]);
      else if (!selectedBatch) setSelectedBatch('2023-2026');
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const batchesList = useMemo(() => {
    const list = [...new Set(allMembers.map(m => m.batch).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    return list.length > 0 ? list : ['2023-2026'];
  }, [allMembers]);

  const activeMems = useMemo(() => {
    const map = {};
    allMembers.filter(m => m.batch === selectedBatch).forEach(m => { map[m.role] = m; });
    return map;
  }, [allMembers, selectedBatch]);

  const onFile = (role, e) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = () => setCropData({ open: true, role, image: reader.result });
    }
  };

  const applyCrop = async () => {
    const b = await getCroppedImgBlob(cropData.image, pixels);
    setFileInputs(p => ({ ...p, [cropData.role]: b }));
    setCropData({ open: false, role: null, image: null });
  };

  const onSave = async (role) => {
    setSaving(p => ({ ...p, [role]: true }));
    try {
      const m = activeMems[role] || { role, batch: selectedBatch };
      let photoURL = m.photoURL || '';
      if (fileInputs[role]) photoURL = await uploadFile(fileInputs[role]);
      const payload = { ...m, photoURL, batch: selectedBatch, role };
      const { id, ...saveData } = payload;
      await setDoc(doc(db, 'magicMembers', id || `${role.toLowerCase()}-${selectedBatch}-${Date.now()}`), saveData);
      setSuccess(p => ({ ...p, [role]: true }));
      setTimeout(() => setSuccess(p => ({ ...p, [role]: false })), 2000);
      fetchData();
    } catch (e) { alert("Save failed"); } finally { setSaving(p => ({ ...p, [role]: false })); setFileInputs(p => ({ ...p, [role]: null })); }
  };

  if (loading && allMembers.length === 0) return null;

  return (
    <PageContainer>
      <SEO title="Admin MAGIC" noindex />
      <AnimatePresence>
        {cropData.open && (
          <Modal initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '30px', width: '100%', maxWidth: '450px' }}>
              <div style={{ position: 'relative', height: '400px', width: '100%', marginBottom: '1.5rem' }}>
                <Cropper image={cropData.image} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, p) => setPixels(p)} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setCropData({ open: false })} style={{ background: 'none', border: 'none', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
                <SaveBtn onClick={applyCrop} style={{ padding: '0.8rem 2rem', borderRadius: '15px' }}>Apply</SaveBtn>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
      <ContentWrapper>
        <Header>
          <TitleBox><h1>MAGIC <span>Admin</span></h1></TitleBox>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <select style={{ padding: '0.8rem 1.5rem', borderRadius: '15px', border: '2px solid #f1f5f9', fontWeight: 800 }} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
              {batchesList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <SaveBtn style={{ margin: 0, padding: '0.8rem 1.5rem', borderRadius: '15px' }} onClick={() => {
              const n = prompt("New Batch Name?");
              if (n) setSelectedBatch(n);
            }}><Plus size={18} /> New</SaveBtn>
          </div>
        </Header>
        <Grid>
          {roles.map(role => {
            const m = activeMems[role] || { name: '', rank: '', department: '', section: '', studentID: '' };
            const photo = fileInputs[role] ? URL.createObjectURL(fileInputs[role]) : m.photoURL;
            return (
              <Card key={role}>
                <CardTop><h3>{role}</h3><Trash size={16} color="#ef4444" cursor="pointer" onClick={async () => {
                  if (m.id && window.confirm("Clear?")) { await deleteDoc(doc(db, 'magicMembers', m.id)); fetchData(); }
                }} /></CardTop>
                <CardBody>
                  <PhotoFrame onClick={() => document.getElementById(`f-${role}`).click()}>
                    {photo ? <img src={photo} alt="" loading="lazy" /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User2 size={50} color="#cbd5e1" /></div>}
                    <div className="over"><Upload size={18} /></div>
                  </PhotoFrame>
                  <input type="file" id={`f-${role}`} hidden onChange={e => onFile(role, e)} accept="image/*" />
                  <InputGroup><label>Full Name</label><input value={m.name} onChange={e => {
                    setAllMembers(prev => {
                      const list = [...prev];
                      const idx = list.findIndex(x => x.role === role && x.batch === selectedBatch);
                      if (idx > -1) list[idx] = { ...list[idx], name: e.target.value };
                      else list.push({ role, batch: selectedBatch, name: e.target.value });
                      return list;
                    });
                  }} placeholder="Cadet Name" /></InputGroup>
                  <Row>
                    <InputGroup><label>Rank</label><input value={m.rank} onChange={e => {
                      setAllMembers(prev => {
                        const list = [...prev];
                        const idx = list.findIndex(x => x.role === role && x.batch === selectedBatch);
                        if (idx > -1) list[idx] = { ...list[idx], rank: e.target.value };
                        else list.push({ role, batch: selectedBatch, rank: e.target.value });
                        return list;
                      });
                    }} /></InputGroup>
                    <InputGroup><label>Dept</label><input value={m.department} onChange={e => {
                      setAllMembers(prev => {
                        const list = [...prev];
                        const idx = list.findIndex(x => x.role === role && x.batch === selectedBatch);
                        if (idx > -1) list[idx] = { ...list[idx], department: e.target.value };
                        else list.push({ role, batch: selectedBatch, department: e.target.value });
                        return list;
                      });
                    }} /></InputGroup>
                  </Row>
                  <Row>
                    <InputGroup><label>Reg No</label><input value={m.studentID} onChange={e => {
                      setAllMembers(prev => {
                        const list = [...prev];
                        const idx = list.findIndex(x => x.role === role && x.batch === selectedBatch);
                        if (idx > -1) list[idx] = { ...list[idx], studentID: e.target.value };
                        else list.push({ role, batch: selectedBatch, studentID: e.target.value });
                        return list;
                      });
                    }} /></InputGroup>
                    <InputGroup><label>Sec</label><input value={m.section} onChange={e => {
                      setAllMembers(prev => {
                        const list = [...prev];
                        const idx = list.findIndex(x => x.role === role && x.batch === selectedBatch);
                        if (idx > -1) list[idx] = { ...list[idx], section: e.target.value };
                        else list.push({ role, batch: selectedBatch, section: e.target.value });
                        return list;
                      });
                    }} /></InputGroup>
                  </Row>
                  <SaveBtn $success={success[role]} onClick={() => onSave(role)} disabled={saving[role]}>{saving[role] ? '...' : success[role] ? 'Saved' : 'Update ' + role.toUpperCase()}</SaveBtn>
                </CardBody>
              </Card>
            );
          })}
        </Grid>
      </ContentWrapper>
    </PageContainer>
  );
};

export default AdminMagicMembersPage;
