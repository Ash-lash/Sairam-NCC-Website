// src/components/admin/AddReportModal.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { X, CheckCircle } from 'lucide-react';
import { db } from '../../firebase'; // Still using Firestore for data
import { uploadFileToFirebaseStorage } from '../../utils/firebaseStorage';
import { collection, addDoc } from 'firebase/firestore';

// --- STYLES (No Change) ---
const ModalBackdrop = styled(motion.div)` position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; justify-content: center; align-items: center; z-index: 3000; `;
const ModalContent = styled(motion.div)` background: white; width: 90%; max-width: 500px; border-radius: 15px; display: flex; flex-direction: column; overflow: hidden; `;
const ModalHeader = styled.div` padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; `;
const ModalTitle = styled.h3` margin: 0; font-size: 1.2rem; color: #1A2B4C; `;
const CloseButton = styled.button` background: none; border: none; cursor: pointer; padding: 0.5rem; line-height: 0; `;
const Form = styled.form` padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; `;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 0.5rem; `;
const Label = styled.label` font-weight: 600; color: #1A2B4C; `;
const Input = styled.input` border: 1px solid #ddd; border-radius: 8px; padding: 0.75rem; font-family: inherit; font-size: 1rem; `;
const FileInput = styled.input` border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem; font-family: inherit; font-size: 0.9rem; `;
const SaveButton = styled.button` background: #1A2B4C; color: white; border: none; padding: 0.8rem; font-size: 1rem; font-weight: 600; border-radius: 8px; cursor: pointer; &:disabled { background: #ccc; } `;
const Message = styled.p` text-align: center; font-weight: 500; min-height: 1.2rem; color: #1A2B4C; `;
// New style for success message
const UploadSuccess = styled.div` display: flex; align-items: center; gap: 0.5rem; color: #28a745; font-size: 0.9rem; margin-top: 0.5rem; `;
// --- END STYLES ---

const AddReportModal = ({ isOpen, onClose, onComplete }) => {
  const [title, setTitle] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setPdfFile(null);
      setMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !pdfFile) {
      setMessage('Title and a PDF file are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadFileToFirebase = async (file, folderPath) => {
        if (!file) return '';
        setMessage(`Uploading ${file.name}...`);
        return uploadFileToFirebaseStorage(file, folderPath);
      };

      // 3. Upload PDF to Firebase Storage (via shared utility)
      const pdfURL = await uploadFileToFirebase(pdfFile, 'yearly-reports');

      setMessage('Saving report to database...');

      // 4. Save the new Firebase URL to Firestore
      await addDoc(collection(db, 'yearlyReports'), {
        title: title,
        pdfURL: pdfURL,
        order: Date.now(),
      });

      setMessage('Report added successfully!');
      onComplete();
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error("Error adding report:", error);
      setMessage(`Error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalBackdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ModalContent initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
            <ModalHeader>
              <ModalTitle>Add New Yearly Report</ModalTitle>
              <CloseButton onClick={onClose} disabled={isSubmitting}><X size={24} /></CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label>Report Title (e.g., 2023-2024)</Label>
                <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </FormGroup>
              <FormGroup>
                <Label>Report PDF</Label>
                <FileInput type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)} required />
                {pdfFile && <UploadSuccess><CheckCircle size={16} /> Selected: {pdfFile.name}</UploadSuccess>}
              </FormGroup>
              <Message>{message}</Message>
              <SaveButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Report'}
              </SaveButton>
            </Form>
          </ModalContent>
        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
};

export default AddReportModal;