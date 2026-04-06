import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Save, Layout, BookOpen, User2, Globe, Command, Upload, Download } from 'lucide-react';
import { downloadImage } from '../utils/downloadHelper';
import { uploadFileToFirebaseStorage as uploadFile } from '../utils/firebaseStorage';
import OptimizedImage from '../components/common/OptimizedImage';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #f1f5f9;
  padding: 120px 2.5rem 4rem;
  font-family: inherit;
`;

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  padding: 1rem 0 2rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #e2e8f0;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
    padding: 1rem;
  }
`;

const TitleSection = styled.div`
  h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  p {
    color: #64748b;
    margin-top: 0.5rem;
    font-size: 0.95rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled(motion.button)`
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.95rem;

  &.primary {
    background: #2563eb;
    color: white;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    &:hover { background: #1d4ed8; }
  }

  &.success {
    background: #10b981;
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    &:hover { background: #059669; }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: #f1f5f9;
  padding: 0.5rem;
  border-radius: 14px;
  width: fit-content;
`;

const Tab = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: none;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active ? 'white' : 'transparent'};
  color: ${props => props.$active ? '#2563eb' : '#64748b'};
  box-shadow: ${props => props.$active ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'};

  &:hover {
    color: #2563eb;
  }
`;

const SectionHeader = styled.div`
  margin: 4rem 0 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  
  h2 {
    font-size: 1.1rem;
    font-weight: 800;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    white-space: nowrap;
  }

  &::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(to right, #e2e8f0, transparent);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
  }
`;

const CardBody = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  input, select, textarea {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    font-size: 0.95rem;
    color: #0f172a;
    transition: all 0.2s;
    background: #fcfdfe;

    &:hover { border-color: #cbd5e1; }
    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
      background: white;
    }
  }

  p.hint {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.25rem;
  }
`;

const CompactGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const UploadButton = styled.label`
  padding: 0.75rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #64748b;

  &:hover {
    background: #e2e8f0;
    color: #2563eb;
    border-color: #2563eb;
  }

  &.loading {
    opacity: 0.5;
    cursor: wait;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  z-index: 1000;
  color: #2563eb;
  font-weight: 700;
`;

const PhotoPreview = styled.div`
  width: 100%;
  height: 150px;
  background: #f1f5f9;
  border-radius: 12px;
  margin-bottom: 1rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  svg {
    color: #cbd5e1;
  }
`;

const AdminOrganizationPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [personnel, setPersonnel] = useState({});

  const baselineGroups = useMemo(() => ({
    'Leadership': ['dg', 'ddg'],
    'Group Commanders': ['group_a', 'group_b'],
    'Army Wing (BTY)': ['unit_army', 'ano_army'],
    'Army Wing (MED)': ['unit_med', 'ano_med'],
    'Air Wing': ['unit_air', 'ano_air'],
    'Navy Wing': ['unit_navy', 'ano_navy']
  }), []);

  const positionLabels = {
    dg: 'Director General NCC',
    ddg: 'Deputy Director General',
    group_a: "Chennai 'A' Group Commander",
    group_b: "Chennai 'B' Group Commander",
    unit_army: '1(TN) BTY (Army Unit)',
    ano_army: 'ANO - Army Wing',
    unit_med: '1(TN) MED NCC (Army Unit)',
    ano_med: 'ANO - Army Wing',
    unit_air: '1(TN) AIR SQN (Air Unit)',
    ano_air: 'ANO - Air Wing',
    unit_navy: '4(TN) NAVAL TECH (Navy Unit)',
    ano_navy: 'ANO - Navy Wing'
  };

  const fetchData = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'organization'));
      const data = {};
      const baselineIds = Object.values(baselineGroups).flat();

      querySnapshot.forEach(doc => {
        if (baselineIds.includes(doc.id)) {
          data[doc.id] = doc.data();
        }
      });
      setPersonnel(data);
    } catch (error) {
      console.error(error);
      alert('Load failure');
    } finally {
      setLoading(false);
    }
  }, [baselineGroups]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (id, field, value) => {
    setPersonnel(p => ({ ...p, [id]: { ...p[id], [field]: value } }));
  };

  const handlePhotoUpload = async (id, file) => {
    if (!file) return;
    setSaving(true);
    try {
      const url = await uploadFile(file, 'organization');
      handleChange(id, 'imageUrl', url);
    } catch (error) {
      alert("Upload failed: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(personnel).map(([id, data]) =>
        setDoc(doc(db, 'organization', id), data)
      );
      await Promise.all(promises);
      alert('Organization Saved!');
    } catch (e) { alert('Save error'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <LoadingOverlay>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
        <Command size={40} />
      </motion.div>
      Loading System Data...
    </LoadingOverlay>
  );

  return (
    <PageContainer>
      <ContentWrapper>
        <Header>
          <TitleSection>
            <h1><Layout size={32} color="#2563eb" /> Chart Architecture</h1>
            <p>Configure hierarchy, personnel, and structural visual logic</p>
          </TitleSection>
          <ButtonGroup>
            <ActionButton className="success" onClick={handleSave} disabled={saving} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              <Save size={20} /> {saving ? 'Saving...' : 'Publish Changes'}
            </ActionButton>
          </ButtonGroup>
        </Header>

        <TabContainer>
          <Tab $active={true}>Core Architecture</Tab>
        </TabContainer>

        <AnimatePresence mode="wait">
          <motion.div key="baseline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {Object.entries(baselineGroups).map(([groupName, ids]) => (
              <React.Fragment key={groupName}>
                <SectionHeader><h2>{groupName}</h2></SectionHeader>
                <Grid>
                  {ids.map(id => (
                    <Card key={id}>
                      <CardHeader><h3>{positionLabels[id]}</h3><BookOpen size={18} color="#94a3b8" /></CardHeader>
                      <CardBody>
                        <FormGroup>
                          <label><Command size={16} /> Box Heading (Top Title)</label>
                          <input value={personnel[id]?.rank || ''} onChange={e => handleChange(id, 'rank', e.target.value)} placeholder="e.g. DG NCC / 1(TN) BTY" />
                          <p className="hint">This appears at the very top of the box</p>
                        </FormGroup>

                        <CompactGrid>
                          <FormGroup>
                            <label>🎖️ Officer Rank</label>
                            <input value={personnel[id]?.officerRank || ''} onChange={e => handleChange(id, 'officerRank', e.target.value)} placeholder="e.g. LT GENERAL" />
                          </FormGroup>
                          <FormGroup>
                            <label><User2 size={16} /> Officer Name</label>
                            <input value={personnel[id]?.name || ''} onChange={e => handleChange(id, 'name', e.target.value)} placeholder="e.g. GURBIRPAL SINGH" />
                          </FormGroup>
                        </CompactGrid>

                        <FormGroup>
                          <label>✍️ Appointment / Subtitle</label>
                          <input value={personnel[id]?.subtitle || ''} onChange={e => handleChange(id, 'subtitle', e.target.value)} placeholder="e.g. Director General / OC" />
                          <p className="hint">This appears at the very bottom of the box</p>
                        </FormGroup>

                        <FormGroup>
                          <label><Globe size={16} /> Photo Management</label>

                          <PhotoPreview>
                            {personnel[id]?.imageUrl ? (
                              <OptimizedImage
                                src={personnel[id].imageUrl}
                                alt="Preview"
                                width={300}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <User2 size={40} />
                            )}
                          </PhotoPreview>

                          <InputRow>
                            <input
                              style={{ flex: 1 }}
                              value={personnel[id]?.imageUrl || ''}
                              onChange={e => handleChange(id, 'imageUrl', e.target.value)}
                              placeholder="Photo URL or Paste Imgur Direct Link"
                            />
                            <UploadButton className={saving ? 'loading' : ''}>
                              <Upload size={18} />
                              <input
                                type="file"
                                hidden
                                accept="image/*"
                                onChange={(e) => handlePhotoUpload(id, e.target.files[0])}
                                disabled={saving}
                              />
                            </UploadButton>
                            {personnel[id]?.imageUrl && (
                              <UploadButton
                                onClick={() => downloadImage(personnel[id].imageUrl, `org_${id}`)}
                                title="Download Photo"
                                style={{ color: '#2563eb' }}
                              >
                                <Download size={18} />
                              </UploadButton>
                            )}
                          </InputRow>
                          <p className="hint">Directly upload below OR paste a direct image link (ends in .jpg/.png)</p>
                        </FormGroup>

                        <CompactGrid>
                          <FormGroup>
                            <label>🎖️ Decorations</label>
                            <input value={personnel[id]?.decorations || ''} onChange={e => handleChange(id, 'decorations', e.target.value)} placeholder="AVSM, VSM" />
                          </FormGroup>
                          <FormGroup>
                            <label>🎨 Node Color</label>
                            <input type="color" style={{ height: '42px', padding: '2px' }} value={personnel[id]?.color || '#3b82f6'} onChange={e => handleChange(id, 'color', e.target.value)} />
                          </FormGroup>
                        </CompactGrid>
                      </CardBody>
                    </Card>
                  ))}
                </Grid>
              </React.Fragment>
            ))}
          </motion.div>
        </AnimatePresence>
      </ContentWrapper>
    </PageContainer>
  );
};

export default AdminOrganizationPage;
