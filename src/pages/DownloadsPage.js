import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Search, Folder,
  ChevronDown, ChevronRight, File,
  ArrowRight, ShieldCheck, Info, Calendar, BookOpen
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/common/SEO';

// --- PREMIUM DESIGN TOKENS ---
const NAVY = "#1a2b4c";
const GOLD = "#FFBF00";
const RED = "#d1202f";

const PageContainer = styled.div`
  min-height: 100vh;
  padding-top: 100px;
  background: #f8fafc;
  padding-bottom: 6rem;
`;

const HeaderSection = styled.div`
  background: linear-gradient(135deg, ${NAVY} 0%, #0d1a33 100%);
  color: white;
  padding: 6rem 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-bottom: -4rem;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 191, 0, 0.05) 0%, transparent 60%);
    pointer-events: none;
  }
`;

const Title = styled(motion.h1)`
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 950;
  margin-bottom: 1.5rem;
  letter-spacing: -2px;
  background: linear-gradient(to bottom, #fff 0%, #cbd5e1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 2;
`;

const FloatingTabs = styled.div`
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 4rem;
  background: white;
  padding: 0.8rem;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.06);
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
  border: 1px solid rgba(0,0,0,0.03);
`;

const Tab = styled.button`
  padding: 1.2rem 2.5rem;
  border-radius: 18px;
  border: none;
  background: ${props => props.$active ? NAVY : 'transparent'};
  color: ${props => props.$active ? 'white' : '#64748b'};
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;

  ${props => props.$active && `
    box-shadow: 0 10px 20px -5px rgba(26, 43, 76, 0.4);
    &::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 20%;
      right: 20%;
      height: 4px;
      background: ${GOLD};
      border-radius: 10px;
    }
  `}

  &:hover {
    color: ${props => props.$active ? 'white' : NAVY};
    transform: translateY(-2px);
  }
`;

const SearchContainer = styled.div`
  max-width: 600px;
  margin: 0 auto 4rem;
  position: relative;
`;

const StyledSearch = styled.div`
  background: white;
  padding: 0.5rem 1.5rem;
  border-radius: 100px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.04);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;

  &:focus-within {
    border-color: ${GOLD};
    box-shadow: 0 15px 35px rgba(255, 191, 0, 0.1);
  }

  input {
    border: none;
    outline: none;
    width: 100%;
    padding: 1rem 0;
    font-size: 1.1rem;
    font-family: inherit;
    color: ${NAVY};
    &::placeholder { color: #94a3b8; }
  }

  svg { color: ${GOLD}; }
`;

const FolderWrapper = styled(motion.div)`
  margin-bottom: 2rem;
  background: white;
  border-radius: 24px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.05);
    border-color: #e2e8f0;
  }
`;

const FolderHeader = styled.div`
  padding: 2rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: ${props => props.$isOpen ? '#f8fafc' : 'white'};
  transition: all 0.3s;

  &:hover { background: #f8fafc; }

  @media (max-width: 768px) { padding: 1.5rem; }
`;

const FolderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  color: ${NAVY};
  
  .num-badge {
    background: ${GOLD}20;
    color: ${NAVY};
    padding: 4px 12px;
    border-radius: 10px;
    font-size: 0.8rem;
    font-weight: 800;
  }

  h2 { margin: 0; font-size: 1.5rem; font-weight: 850; letter-spacing: -0.5px; }
  
  .folder-icon {
    width: 54px;
    height: 54px;
    background: white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${GOLD};
    border: 1px solid #f1f5f9;
  }
`;

const FileList = styled(motion.div)`
  border-top: 1px solid #f1f5f9;
  background: #fdfdfe;
`;

const FileItem = styled.div`
  padding: 1.5rem 3rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f8fafc;
  transition: all 0.2s;

  &:last-child { border-bottom: none; }
  &:hover { background: #f8fafc; }

  @media (max-width: 768px) { padding: 1.2rem 1.5rem; flex-direction: column; align-items: flex-start; gap: 1rem; }
`;

const FileDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  .icon {
    width: 42px;
    height: 42px;
    background: #eff6ff;
    color: #3b82f6;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .meta {
    h4 { margin: 0; font-size: 1.05rem; font-weight: 700; color: #334155; }
    p { margin: 2px 0 0; font-size: 0.85rem; color: #94a3b8; display: flex; align-items: center; gap: 8px; }
  }
`;

const DownloadBtn = styled.a`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0.8rem 1.8rem;
  border-radius: 14px;
  background: white;
  color: ${NAVY};
  font-weight: 800;
  font-size: 0.95rem;
  text-decoration: none;
  border: 2px solid #e2e8f0;
  transition: all 0.3s;

  &:hover {
    background: ${NAVY};
    color: white;
    border-color: ${NAVY};
    transform: translateX(5px);
  }

  @media (max-width: 768px) { width: 100%; justify-content: center; }
`;

const SubFolderWrapper = styled.div`
  margin: 1rem 3rem 1rem 5rem;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;

  @media (max-width: 768px) { margin: 1rem; }
`;

const SubFolderHeader = styled.div`
  padding: 1.2rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: ${props => props.$isOpen ? '#eff6ff' : 'white'};
  transition: all 0.2s;

  &:hover { background: #eff6ff; }
`;

const SubFolderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  color: ${NAVY};

  h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }
  
  .sub-folder-icon {
    color: #3b82f6;
  }
`;

const DownloadsPage = () => {
  const [activeTab, setActiveTab] = useState('Parade Schedule');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [openFolders, setOpenFolders] = useState({});
  const [openSubFolders, setOpenSubFolders] = useState({});

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      const q = query(collection(db, 'downloads'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setDocuments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderName) => {
    setOpenFolders(prev => ({
      ...prev,
      [folderName]: !prev[folderName]
    }));
  };

  const toggleSubFolder = (subKey) => {
    setOpenSubFolders(prev => ({
      ...prev,
      [subKey]: !prev[subKey]
    }));
  };

  const filteredDocs = documents.filter(d => {
    const matchesTab = d.category === activeTab;
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.folderName && d.folderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (d.subFolderName && d.subFolderName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const grouped = filteredDocs.reduce((acc, doc) => {
    const folder = doc.folderName || 'General Resources';
    const subFolder = doc.subFolderName || '';

    if (!acc[folder]) acc[folder] = { files: [], subFolders: {} };

    if (subFolder) {
      if (!acc[folder].subFolders[subFolder]) acc[folder].subFolders[subFolder] = [];
      acc[folder].subFolders[subFolder].push(doc);
    } else {
      acc[folder].files.push(doc);
    }
    return acc;
  }, {});

  return (
    <PageContainer>
      <SEO title="Digital Library | SAIRAM NCC" />

      <HeaderSection>
        <Title initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }}>
          Resource Hub
        </Title>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Access official NCC enrollment records and camp documentation through our secured digital repository.
        </p>
      </HeaderSection>

      <ContentWrapper>
        <FloatingTabs>
          <Tab
            $active={activeTab === 'NCC Enrollment'}
            onClick={() => setActiveTab('NCC Enrollment')}
          >
            <ShieldCheck size={22} /> NCC Enrollment
          </Tab>
          <Tab
            $active={activeTab === 'Camp Documents'}
            onClick={() => setActiveTab('Camp Documents')}
          >
            <FileText size={22} /> Camp Documents
          </Tab>
          <Tab
            $active={activeTab === 'Parade Schedule'}
            onClick={() => setActiveTab('Parade Schedule')}
          >
            <Calendar size={22} /> Parade Schedule
          </Tab>
          <Tab
            $active={activeTab === 'Syllabus'}
            onClick={() => setActiveTab('Syllabus')}
          >
            <FileText size={22} /> Syllabus
          </Tab>
          <Tab
            $active={activeTab === 'Study Materials'}
            onClick={() => setActiveTab('Study Materials')}
          >
            <BookOpen size={22} /> Study Materials
          </Tab>
        </FloatingTabs>

        <SearchContainer>
          <StyledSearch>
            <Search size={22} />
            <input
              placeholder="Find records, years, or camp names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </StyledSearch>
        </SearchContainer>

        <AnimatePresence mode="wait">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '10rem 0' }}>
              <div className="skeleton-spinner" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '1.5rem', fontWeight: 700, color: NAVY }}>Opening Archives...</p>
            </div>
          ) : (
            <motion.div
              key={activeTab + searchQuery}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
            >
              {Object.entries(grouped).map(([folderName, folderData], idx) => {
                const totalFiles = folderData.files.length +
                  Object.values(folderData.subFolders).reduce((sum, sub) => sum + sub.length, 0);

                return (
                  <FolderWrapper
                    key={folderName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <FolderHeader
                      $isOpen={openFolders[folderName]}
                      onClick={() => toggleFolder(folderName)}
                    >
                      <FolderTitle>
                        <div className="folder-icon"><Folder size={28} /></div>
                        <div>
                          <h2>{folderName}</h2>
                          <span className="num-badge">{totalFiles} Resources</span>
                        </div>
                      </FolderTitle>
                      <div style={{ width: 40, height: 40, background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: NAVY }}>
                        {openFolders[folderName] ? <ChevronDown /> : <ChevronRight />}
                      </div>
                    </FolderHeader>

                    <AnimatePresence>
                      {openFolders[folderName] && (
                        <FileList
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {/* Direct Files in Folder */}
                          {folderData.files.map(file => (
                            <FileItem key={file.id}>
                              <FileDetails>
                                <div className="icon"><File size={20} /></div>
                                <div className="text">
                                  <h4>{file.title}</h4>
                                  <p><Info size={14} /> {file.size || 'PDF Archive'}</p>
                                </div>
                              </FileDetails>
                              <DownloadBtn href={file.fileUrl} target="_blank">
                                Download <Download size={18} />
                              </DownloadBtn>
                            </FileItem>
                          ))}

                          {/* Sub Folders */}
                          {Object.entries(folderData.subFolders).map(([subName, subFiles]) => (
                            <SubFolderWrapper key={subName}>
                              <SubFolderHeader
                                $isOpen={openSubFolders[`${folderName}-${subName}`]}
                                onClick={() => toggleSubFolder(`${folderName}-${subName}`)}
                              >
                                <SubFolderTitle>
                                  <div className="sub-folder-icon"><Folder size={20} /></div>
                                  <h3>{subName}</h3>
                                </SubFolderTitle>
                                <div style={{ color: '#94a3b8' }}>
                                  {openSubFolders[`${folderName}-${subName}`] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </div>
                              </SubFolderHeader>

                              <AnimatePresence>
                                {openSubFolders[`${folderName}-${subName}`] && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    style={{ background: 'white' }}
                                  >
                                    {subFiles.map(file => (
                                      <FileItem key={file.id} style={{ paddingLeft: '4rem' }}>
                                        <FileDetails>
                                          <div className="icon"><File size={18} /></div>
                                          <div className="text">
                                            <h4>{file.title}</h4>
                                            <p><Info size={12} /> {file.size || 'PDF Archive'}</p>
                                          </div>
                                        </FileDetails>
                                        <DownloadBtn href={file.fileUrl} target="_blank" style={{ transform: 'scale(0.9)' }}>
                                          Download <Download size={16} />
                                        </DownloadBtn>
                                      </FileItem>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </SubFolderWrapper>
                          ))}
                        </FileList>
                      )}
                    </AnimatePresence>
                  </FolderWrapper>
                );
              })}

              {Object.keys(grouped).length === 0 && (
                <div style={{ textAlign: 'center', padding: '8rem 2rem', background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: 80, height: 80, background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <Search size={40} color="#94a3b8" />
                  </div>
                  <h2 style={{ color: NAVY, margin: 0 }}>No records encountered</h2>
                  <p style={{ color: '#64748b', fontSize: '1.1rem', marginTop: '1rem' }}>We couldn't find any resources matching your criteria.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </ContentWrapper>
    </PageContainer >
  );
};

export default DownloadsPage;
