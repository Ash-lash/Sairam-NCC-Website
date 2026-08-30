// src/components/ui/CadetDetailModal.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { X, ExternalLink, Download } from 'lucide-react';
import { downloadImage } from '../../utils/downloadHelper';
import { getFullRank } from '../../rankStructure';
import { prefetchAndCache } from '../../utils/mediaCache';

// --- STYLES (No Change) ---
const ModalBackdrop = styled(motion.div)`
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.7); display: flex;
  justify-content: center; align-items: center; z-index: 10005;
`;
const ModalContent = styled(motion.div)`
  background: white; width: 90%; height: 90%; max-width: 1000px;
  border-radius: 15px; display: flex; flex-direction: column; overflow: hidden;
`;
const ModalHeader = styled.div`
  padding: 1rem 1.5rem; display: flex; justify-content: space-between;
  align-items: center; border-bottom: 1px solid #eee;
`;
const ModalTitle = styled.h3` margin: 0; font-size: 1.2rem; color: #1A2B4C; `;
const CloseButton = styled.button` background: none; border: none; cursor: pointer; padding: 0.5rem; line-height: 0; `;
const PDFViewer = styled.iframe`
  flex-grow: 1; border: none; width: 100%; height: 100%;
`;
const OpenPDFButton = styled.a`
  background: #1A2B4C;
  color: white;
  padding: 1rem 2rem;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.2s;
  &:hover { background: #111d35; transform: translateY(-2px); }
`;
const EmptyStateContainer = styled.div`
  flex-grow: 1; display: flex; flex-direction: column; justify-content: center;
  align-items: center; padding: 2rem; text-align: center; background-color: #f8f9fa;
`;
const EmptyStateTitle = styled.h3` font-size: 1.5rem; color: #1A2B4C; margin-bottom: 0.5rem; `;
const EmptyStateText = styled.p` color: #555; max-width: 400px; margin-bottom: 2rem; `;
const DetailsContainer = styled.div` padding: 1.5rem; font-family: sans-serif; border: 1px solid #ddd; border-radius: 8px; background: white; `;
const DetailItem = styled.div` margin-bottom: 0.75rem; `;
const DetailLabel = styled.span` font-weight: 700; color: #1A2B4C; margin-right: 0.5rem; `;
const DetailValue = styled.span` color: #555; `;
const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;
const ActionButton = styled.a`
  background: none; border: none; cursor: pointer; padding: 0.5rem;
  line-height: 0; color: #1A2B4C;
  &:hover { color: #007bff; }
`;

const Loader = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 1rem;
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid rgba(26, 43, 76, 0.1);
  border-left-color: #1A2B4C;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;
// ---

const CadetDetailModal = ({ isOpen, onClose, cadet }) => {
  const [cachedUrl, setCachedUrl] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPdfAsync = async () => {
      if (isOpen && cadet && cadet.pdfURL) {
        setIsFetching(true);
        // Using Asynchronous process (JavaScript/Java logic) for fast retrieval
        const url = await prefetchAndCache(cadet.pdfURL);
        if (isMounted) {
          setCachedUrl(url);
          setIsFetching(false);
        }
      }
    };

    if (isOpen) {
      fetchPdfAsync();
    } else {
      setCachedUrl(null);
    }

    return () => { isMounted = false; };
  }, [isOpen, cadet]);

  const pdfUrlToDisplay = cachedUrl || (cadet ? cadet.pdfURL : '');

  return (
    <AnimatePresence>
      {isOpen && cadet && (
        <ModalBackdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ModalContent
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <ModalHeader>
              <ModalTitle>{cadet.Name}'s Dossier</ModalTitle>
              <HeaderActions>
                {cadet.pdfURL && (
                  <>
                    <ActionButton
                      onClick={() => downloadImage(cadet.pdfURL, `dossier_${cadet.Name}.pdf`)}
                      title="Download Dossier"
                    >
                      <Download size={20} />
                    </ActionButton>
                    <ActionButton
                      href={cadet.pdfURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in new tab"
                    >
                      <ExternalLink size={20} />
                    </ActionButton>
                  </>
                )}
                <CloseButton onClick={onClose}><X size={24} /></CloseButton>
              </HeaderActions>
            </ModalHeader>

            {cadet.pdfURL ? (
              <div style={{ flexGrow: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                {isFetching ? (
                  <Loader>
                    <Spinner />
                    <p style={{ color: '#1A2B4C', fontWeight: 600 }}>Optimizing retrieval...</p>
                  </Loader>
                ) : (
                  <>
                    <PDFViewer
                      src={pdfUrlToDisplay}
                      title={`${cadet.Name}'s Details`}
                    />
                    <div style={{
                      padding: '1rem',
                      background: '#f8fafc',
                      display: 'flex',
                      justifyContent: 'center',
                      borderTop: '1px solid #e2e8f0'
                    }}>
                      <OpenPDFButton href={cadet.pdfURL} target="_blank" rel="noopener noreferrer">
                        View Full Dossier in New Tab
                      </OpenPDFButton>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Empty state for cadets with no PDF
              <EmptyStateContainer>
                <EmptyStateTitle>Dossier Not Yet Deployed</EmptyStateTitle>
                <EmptyStateText>
                  This cadet's digital profile is being prepared. Check back soon for their detailed records and achievements!
                </EmptyStateText>
                <DetailsContainer>
                  {cadet.rank && <DetailItem><DetailLabel>Rank:</DetailLabel><DetailValue>{getFullRank(cadet.rank)}</DetailValue></DetailItem>}
                  {cadet.regimentalNo && <DetailItem><DetailLabel>Registration No:</DetailLabel><DetailValue>{cadet.regimentalNo}</DetailValue></DetailItem>}
                  {cadet.secID && <DetailItem><DetailLabel>SEC ID:</DetailLabel><DetailValue>{cadet.secID}</DetailValue></DetailItem>}
                  {cadet.dept && <DetailItem><DetailLabel>Department:</DetailLabel><DetailValue>{cadet.dept}</DetailValue></DetailItem>}
                  {cadet.section && <DetailItem><DetailLabel>Section:</DetailLabel><DetailValue>{cadet.section}</DetailValue></DetailItem>}
                  {cadet.Batch && <DetailItem><DetailLabel>Batch:</DetailLabel><DetailValue>{cadet.Batch}</DetailValue></DetailItem>}
                </DetailsContainer>
              </EmptyStateContainer>
            )}
          </ModalContent>
        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
};

export default CadetDetailModal;