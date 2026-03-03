import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { collection, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, ArrowLeft, Eye } from 'lucide-react';
import AddReportModal from '../components/admin/AddReportModal';
import AddWingReportModal from '../components/admin/AddWingReportModal';
import CadetDetailModal from '../components/ui/CadetDetailModal';
import SEO from '../components/common/SEO';

const PageContainer = styled.div` padding: 100px 2rem 4rem; max-width: 1200px; margin: 0 auto; `;
const Header = styled(motion.div)` text-align: center; margin-bottom: 2rem; `;
const Title = styled.h1` font-size: 3.5rem; font-weight: 800; color: #1A2B4C; `;
const ViewSwitcher = styled.div` display: flex; justify-content: center; margin-bottom: 4rem; `;
const SwitchButton = styled.button` background: #FFFFFF; border: 1px solid #ddd; color: #1A2B4C; padding: 0.75rem 1.5rem; border-radius: 50px; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; font-family: inherit; font-size: 1rem; `;
const ReportGrid = styled(motion.div)` display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; `;
const ReportCardContainer = styled(motion.div)` position: relative; `;
const ReportCard = styled.button` height: 150px; width: 100%; border-radius: 25px; cursor: pointer; background: #FFFFFF; color: #1A2B4C; border: 1px solid rgba(0, 0, 0, 0.1); box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem; font-size: 1.8rem; font-weight: 700; transition: transform 0.2s, box-shadow 0.2s; &:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1); } `;
const AddReportCard = styled(ReportCard)` border-style: dashed; color: #6c757d; `;
const DeleteButton = styled.button` position: absolute; top: 1rem; right: 1rem; background: #fbebeb; color: #c53030; border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; &:hover { background: #c53030; color: white; } `;

const ReportsPage = () => {
  const [yearlyReports, setYearlyReports] = useState([]);
  const [wingReports, setWingReports] = useState([]);
  const [view, setView] = useState('yearly');
  const [selectedWing, setSelectedWing] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddWingModalOpen, setIsAddWingModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  const fetchYearlyReports = useCallback(async () => {
    const q = query(collection(db, "yearlyReports"), orderBy("order", "desc"));
    const querySnapshot = await getDocs(q);
    const fetchedReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setYearlyReports(fetchedReports);
  }, []);

  const fetchWingReports = useCallback(async () => {
    if (!selectedWing) return;
    const targetCollection = `${selectedWing}Reports`;
    const q = query(collection(db, targetCollection), orderBy("order", "desc"));
    const querySnapshot = await getDocs(q);
    const fetchedReports = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setWingReports(fetchedReports);
  }, [selectedWing]);

  useEffect(() => {
    if (view === 'yearly') {
      fetchYearlyReports();
    } else if (view === 'wingDetails') {
      fetchWingReports();
    }
  }, [view, fetchYearlyReports, fetchWingReports, refreshKey]);

  const handleDataChange = () => setRefreshKey(prev => prev + 1);

  const handleDelete = async (reportId, collectionName) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await deleteDoc(doc(db, collectionName, reportId));
      handleDataChange();
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete report.");
    }
  };

  const openPdf = (report) => {
    setSelectedReport({ Name: `Report ${report.title}`, pdfURL: report.pdfURL });
    setIsPdfModalOpen(true);
  };

  const renderContent = () => {
    if (view === 'wingSelection') {
      return (
        <>
          <SwitchButton onClick={() => setView('yearly')}><ArrowLeft size={20} /> Back to Yearly Reports</SwitchButton>
          <ReportGrid>
            {/* ✨ "Add Wing Report" button is REMOVED from this view */}
            {['army', 'navy', 'air'].map(wing => (
              <ReportCardContainer key={wing}>
                <ReportCard onClick={() => { setSelectedWing(wing); setView('wingDetails'); }}>
                  {wing.charAt(0).toUpperCase() + wing.slice(1)} Wing
                </ReportCard>
              </ReportCardContainer>
            ))}
          </ReportGrid>
        </>
      );
    }

    if (view === 'wingDetails') {
      return (
        <>
          <SwitchButton onClick={() => { setView('wingSelection'); setSelectedWing(null); }}><ArrowLeft size={20} /> Back to Wing Selection</SwitchButton>
          <ReportGrid>
            {/* ✨ "Add Report" button is MOVED here */}
            {user && (
              <ReportCardContainer>
                <AddReportCard onClick={() => setIsAddWingModalOpen(true)}>
                  <Plus size={32} /> Add Report
                </AddReportCard>
              </ReportCardContainer>
            )}
            {wingReports.map(report => (
              <ReportCardContainer key={report.id}>
                {user && <DeleteButton onClick={() => handleDelete(report.id, `${selectedWing}Reports`)}><Trash2 size={16} /></DeleteButton>}
                <ReportCard onClick={() => openPdf(report)}>Report {report.title}</ReportCard>
              </ReportCardContainer>
            ))}
          </ReportGrid>
        </>
      );
    }

    // Default view: 'yearly'
    return (
      <ReportGrid>
        {user && (
          <ReportCardContainer>
            <AddReportCard onClick={() => setIsAddModalOpen(true)}>
              <Plus size={32} /> Add Yearly Report
            </AddReportCard>
          </ReportCardContainer>
        )}
        {yearlyReports.map(report => (
          <ReportCardContainer key={report.id}>
            {user && <DeleteButton onClick={() => handleDelete(report.id, 'yearlyReports')}><Trash2 size={16} /></DeleteButton>}
            <ReportCard onClick={() => openPdf(report)}>Report {report.title}</ReportCard>
          </ReportCardContainer>
        ))}
      </ReportGrid>
    );
  };

  return (
    <PageContainer>
      <SEO
        title="Reports"
        description="Access annual reports, event summaries, and other official documents of NCC Sri Sairam Engineering College."
      />
      <Header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Title>
          {view === 'yearly' && 'Yearly Reports'}
          {view === 'wingSelection' && 'Wing Wise Reports'}
          {view === 'wingDetails' && `${selectedWing.charAt(0).toUpperCase() + selectedWing.slice(1)} Wing Reports`}
        </Title>
      </Header>

      {view === 'yearly' && (
        <ViewSwitcher>
          <SwitchButton onClick={() => setView('wingSelection')}>
            <Eye size={20} /> View Wing Wise Reports
          </SwitchButton>
        </ViewSwitcher>
      )}

      {renderContent()}

      <CadetDetailModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} cadet={selectedReport} />
      <AddReportModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onComplete={handleDataChange} />
      <AddWingReportModal isOpen={isAddWingModalOpen} onClose={() => setIsAddWingModalOpen(false)} onComplete={handleDataChange} />
    </PageContainer>
  );
};

export default ReportsPage;