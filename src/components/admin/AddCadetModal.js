// src/components/admin/AddCadetModal.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled, { css } from 'styled-components';
import { X, CheckCircle } from 'lucide-react';
import { db } from '../../firebase'; // Still using Firestore for data
import { uploadFileToFirebaseStorage } from '../../utils/firebaseStorage';
import { collection, addDoc } from 'firebase/firestore';
import { toCanonicalWing } from '../../utils/wingUtils';
import ImageCropper from './ImageCropper';

// --- STYLES ---
const ModalBackdrop = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled(motion.div)`
  background: white;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  background: #fcfcfd;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: #1A2B4C;
`;

const CloseButton = styled.button`
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover { background: #e2e8f0; color: #0f172a; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Form = styled.form`
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem 2rem;
  overflow-y: auto;
  max-height: 100%;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  ${props => props.fullWidth && css` grid-column: 1 / -1; `}
`;

const Label = styled.label`
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
  margin-left: 0.2rem;
`;

const Input = styled.input`
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 0.75rem 1rem;
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.2s;
  background: #f8fafc;
  &:focus {
    outline: none;
    border-color: #1A2B4C;
    background: white;
    box-shadow: 0 0 0 4px rgba(26, 43, 76, 0.1);
  }
`;

const FileInput = styled.input`
  border: 1px dashed #cbd5e1;
  border-radius: 10px;
  padding: 1rem;
  font-family: inherit;
  font-size: 0.9rem;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { border-color: #94a3b8; background: #f1f5f9; }
`;

const SaveButton = styled.button`
  background: #1A2B4C;
  color: white;
  border: none;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  grid-column: 1 / -1;
  margin-top: 1rem;
  transition: all 0.2s;
  &:hover { background: #111d35; transform: translateY(-1px); }
  &:active { transform: translateY(0); }
  &:disabled { background: #94a3b8; cursor: not-allowed; transform: none; }
`;

const Message = styled.p`
  text-align: center;
  font-weight: 500;
  min-height: 1.2rem;
  color: ${props => props.error ? '#dc2626' : '#1A2B4C'};
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.95rem;
`;

const UploadSuccess = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #10b981;
  font-size: 0.85rem;
  margin-top: 0.4rem;
  font-weight: 500;
`;
// ---

// --- existing code ---

const AddCadetModal = ({ isOpen, onClose, wing, batch, onComplete }) => {
  const [name, setName] = useState('');
  const [rank, setRank] = useState('');
  const [secID, setSecID] = useState('');
  const [regimentalNo, setRegimentalNo] = useState('');
  const [dept, setDept] = useState('');
  const [section, setSection] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Cropper State
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setName(''); setRank(''); setSecID('');
      setRegimentalNo('');
      setDept(''); setSection(''); setPhotoFile(null); setPdfFile(null);
      setMessage(''); setIsSubmitting(false);
      setShowCropper(false);
      setTempImageSrc(null);
    }
  }, [isOpen]);

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Enable crop only for 2022-2025 batch and army/airforce wings
      const isTargetBatch = batch && batch.includes('2022-2025');
      const isTargetWing = wing === 'army' || wing === 'airforce';

      if (isTargetBatch && isTargetWing) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setTempImageSrc(reader.result);
          setShowCropper(true);
        });
        reader.readAsDataURL(file);
      } else {
        // Direct assignment for other batches
        setPhotoFile(file);
      }
    }
  };

  const handleCropComplete = (croppedFile) => {
    if (!croppedFile) {
      setMessage('Unable to crop image. Please try another photo.');
      return;
    }

    // Convert Blob to File to ensure it has a 'name' property (required by uploadHelper)
    const file = new File([croppedFile], "cropped-image.jpg", { type: "image/jpeg" });
    setPhotoFile(file);
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc(null);
    // Optionally clear the file input if needed, but it's tricky with controlled inputs
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !rank || !secID || !regimentalNo || !dept || !section) {
      setMessage('All text fields are required.');
      return;
    }
    setIsSubmitting(true);

    try {
      const uploadFileToFirebase = async (file, folderPath) => {
        if (!file) return '';
        setMessage(`Uploading ${file.name}...`);
        return uploadFileToFirebaseStorage(file, folderPath);
      };

      const photoURL = await uploadFileToFirebase(photoFile, 'photos');
      const pdfURL = await uploadFileToFirebase(pdfFile, 'dossiers');

      setMessage('Finalizing record in Firestore...');
      const formattedWing = toCanonicalWing(wing);

      const newCadetData = {
        Name: name, rank: rank.toUpperCase(), Wing: formattedWing, Batch: batch,
        secID,
        regimentalNo,
        dept, section, photoURL, pdfURL
      };

      await addDoc(collection(db, 'cadets'), newCadetData);

      setMessage('Cadet added successfully!');
      onComplete();
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error("Error adding cadet:", error);
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
              <ModalTitle>Add New Cadet to {batch}</ModalTitle>
              <CloseButton onClick={onClose} disabled={isSubmitting}><X size={24} /></CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
              <FormGroup fullWidth><Label>Full Name</Label><Input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></FormGroup>
              <FormGroup><Label>SEC ID</Label><Input type="text" value={secID} onChange={(e) => setSecID(e.target.value)} required /></FormGroup>

              <FormGroup>
                <Label>Registration No</Label>
                <Input type="text" value={regimentalNo} onChange={(e) => setRegimentalNo(e.target.value)} required />
              </FormGroup>

              <FormGroup><Label>Rank</Label><Input type="text" value={rank} onChange={(e) => setRank(e.target.value)} required /></FormGroup>
              <FormGroup><Label>Dept</Label><Input type="text" value={dept} onChange={(e) => setDept(e.target.value)} required /></FormGroup>
              <FormGroup><Label>Section</Label><Input type="text" value={section} onChange={(e) => setSection(e.target.value)} required /></FormGroup>

              {/* File Inputs */}
              <FormGroup fullWidth>
                <Label>Cadet Photo (Optional)</Label>
                <FileInput type="file" accept="image/png, image/jpeg" onChange={handlePhotoSelect} />
                {photoFile && <UploadSuccess><CheckCircle size={16} /> Ready to upload: {photoFile.name}</UploadSuccess>}
              </FormGroup>
              <FormGroup fullWidth>
                <Label>Details PDF (Optional)</Label>
                <FileInput type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files ? e.target.files[0] : null)} />
                {pdfFile && <UploadSuccess><CheckCircle size={16} /> Selected: {pdfFile.name}</UploadSuccess>}
              </FormGroup>

              <Message error={message.toLowerCase().includes('error')}>{message}</Message>
              <SaveButton type="submit" disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Add Cadet'}</SaveButton>
            </Form>
          </ModalContent>

          {/* Render Cropper Modal if active */}
          {showCropper && tempImageSrc && (
            <ImageCropper
              image={tempImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          )}

        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
};
export default AddCadetModal;
