// src/components/admin/AdminCadetEditor.js
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { X, CheckCircle, Trash2 } from 'lucide-react';
import { db } from '../../firebase'; // Still using Firestore for data
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { uploadFileToFirebaseStorage } from '../../utils/firebaseStorage';
import ImageCropper from './ImageCropper';
import { getOptimizedUrl } from '../../utils/imageOptimizer';

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
  max-width: 600px;
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
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  max-height: 100%;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #334155;
  font-size: 0.95rem;
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
  margin-top: 0.5rem;
  transition: all 0.2s;
  &:hover { border-color: #94a3b8; background: #f1f5f9; }
`;

const SaveButton = styled.button`
  flex: 1;
  background: #1A2B4C;
  color: white;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #111d35; transform: translateY(-1px); }
  &:disabled { background: #94a3b8; cursor: not-allowed; }
`;

const DeleteButton = styled.button`
  flex: 1;
  background: white;
  color: #dc2626;
  border: 1px solid #fee2e2;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  &:hover { background: #fef2f2; border-color: #fca5a5; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Message = styled.p`
  text-align: center;
  font-weight: 500;
  min-height: 1.2rem;
  color: #1A2B4C;
  margin: 0;
  font-size: 0.95rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const PhotoPreviewContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fcfcfd;
`;

const PhotoPreview = styled.img`
  width: 70px;
  height: 90px;
  border-radius: 8px;
  object-fit: cover;
  object-position: top;
`;

const InfoText = styled.span`
  font-size: 0.85rem;
  color: #64748b;
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

const AdminCadetEditor = ({ isOpen, onClose, cadet, onComplete, onDelete }) => {
  const [name, setName] = useState('');
  const [rank, setRank] = useState('');
  const [secID, setSecID] = useState('');
  const [dept, setDept] = useState('');
  const [section, setSection] = useState('');
  const [regimentalNo, setRegimentalNo] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newPdfFile, setNewPdfFile] = useState(null);
  const [batch, setBatch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Cropper States
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState(null);

  useEffect(() => {
    if (isOpen && cadet) {
      setName(cadet.Name || '');
      setRank(cadet.rank || '');
      setSecID(cadet.secID || '');
      setDept(cadet.dept || '');
      setSection(cadet.section || '');
      setRegimentalNo(cadet.regimentalNo || '');
      setRegistrationNo(cadet.registrationNo || '');
      setBatch(cadet.Batch || '');
      setNewPhotoFile(null);
      setNewPdfFile(null);
      setMessage('');
      setIsSubmitting(false);
      setShowCropper(false);
      setTempImageSrc(null);
    }
  }, [cadet, isOpen]);

  const handlePhotoSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Enable crop only for 2022-2025 batch and Army/Air wings
      const isTargetBatch = cadet.Batch && cadet.Batch.includes('2022-2025');
      const isTargetWing = cadet.Wing === 'Army' || cadet.Wing === 'Air';

      if (isTargetBatch && isTargetWing) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setTempImageSrc(reader.result);
          setShowCropper(true);
        });
        reader.readAsDataURL(file);
      } else {
        // Direct assignment for other batches
        setNewPhotoFile(file);
      }
    }
  };

  const handleCropComplete = (croppedFile) => {
    if (!croppedFile) {
      setMessage('Unable to crop image. Please try another photo.');
      return;
    }

    // croppedFile is a File object
    setNewPhotoFile(croppedFile);
    setShowCropper(false);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!cadet) return;

    // Check if *any* field has changed
    const hasPhotoChanged = newPhotoFile !== null;
    const hasPdfChanged = newPdfFile !== null;
    const hasNameChanged = name !== (cadet.Name || '');
    const hasRankChanged = rank !== (cadet.rank || '');
    const hasSecIDChanged = secID !== (cadet.secID || '');
    const hasDeptChanged = dept !== (cadet.dept || '');
    const hasSectionChanged = section !== (cadet.section || '');
    const hasRegimentalNoChanged = regimentalNo !== (cadet.regimentalNo || '');
    const hasRegistrationNoChanged = registrationNo !== (cadet.registrationNo || '');
    const hasBatchChanged = batch !== (cadet.Batch || '');

    if (!hasPhotoChanged && !hasPdfChanged && !hasNameChanged && !hasRankChanged &&
      !hasSecIDChanged && !hasDeptChanged && !hasSectionChanged && !hasRegimentalNoChanged && !hasRegistrationNoChanged && !hasBatchChanged) {
      setMessage("No changes to save.");
      return;
    }

    setIsSubmitting(true);
    setMessage('Updating cadet...');

    try {
      const uploadFileToFirebase = async (file, folderPath) => {
        if (!file) return '';
        setMessage(`Uploading ${file.name}...`);
        return uploadFileToFirebaseStorage(file, folderPath);
      };

      const dataToUpdate = {};

      const newPhotoURL = await uploadFileToFirebase(newPhotoFile, 'photos');
      const newPdfURL = await uploadFileToFirebase(newPdfFile, 'dossiers');

      if (newPhotoURL) dataToUpdate.photoURL = newPhotoURL;
      if (newPdfURL) dataToUpdate.pdfURL = newPdfURL;
      if (hasNameChanged) dataToUpdate.Name = name;
      if (hasRankChanged) dataToUpdate.rank = rank;
      if (hasSecIDChanged) dataToUpdate.secID = secID;
      if (hasDeptChanged) dataToUpdate.dept = dept;
      if (hasSectionChanged) dataToUpdate.section = section;
      if (hasRegimentalNoChanged) dataToUpdate.regimentalNo = regimentalNo;
      if (hasRegistrationNoChanged) dataToUpdate.registrationNo = registrationNo;
      if (hasBatchChanged) dataToUpdate.Batch = batch;

      if (Object.keys(dataToUpdate).length > 0) {
        const cadetRef = doc(db, 'cadets', cadet.id);
        await updateDoc(cadetRef, dataToUpdate);
      }


      setMessage('Cadet updated successfully!');
      onComplete();
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error("Error updating cadet:", error);
      setMessage(`Error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!cadet) return;

    // Confirm deletion
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${cadet.Name}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsSubmitting(true);
    setMessage('Deleting cadet...');

    try {
      const cadetRef = doc(db, 'cadets', cadet.id);
      await deleteDoc(cadetRef);

      setMessage('Cadet deleted successfully!');
      if (onDelete) onDelete(cadet);
      onComplete();
      setTimeout(onClose, 1000);
    } catch (error) {
      console.error("Error deleting cadet:", error);
      setMessage(`Error: ${error.message}`);
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !cadet) return null;

  return (
    <AnimatePresence>
      <ModalBackdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <ModalContent initial={{ scale: 0.7 }} animate={{ scale: 1 }} exit={{ scale: 0.7 }}>
          <ModalHeader>
            <ModalTitle>Edit {cadet.Name}</ModalTitle>
            <CloseButton onClick={onClose} disabled={isSubmitting}><X size={24} /></CloseButton>
          </ModalHeader>
          <Form onSubmit={handleSave}>
            {/* File Inputs */}
            <FormGroup>
              <Label>Cadet Photo</Label>
              {cadet.photoURL && (
                <PhotoPreviewContainer>
                  <PhotoPreview src={getOptimizedUrl(cadet.photoURL, 300, 85)} alt="Cadet" />
                  <InfoText>Current photo. Upload a new one to replace it.</InfoText>
                </PhotoPreviewContainer>
              )}
              <FileInput type="file" accept="image/*" onChange={handlePhotoSelect} />
              {newPhotoFile && <UploadSuccess><CheckCircle size={16} /> Ready to Update: {newPhotoFile.name}</UploadSuccess>}
            </FormGroup>
            <FormGroup>
              <Label>Details PDF</Label>
              {cadet.pdfURL && <InfoText>A PDF is already on file.</InfoText>}
              <FileInput type="file" accept="application/pdf" onChange={(e) => setNewPdfFile(e.target.files ? e.target.files[0] : null)} />
              {newPdfFile && <UploadSuccess><CheckCircle size={16} /> Selected: {newPdfFile.name}</UploadSuccess>}
            </FormGroup>

            {/* Editable Information Fields */}
            <FormGroup>
              <Label>Full Name</Label>
              <Input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </FormGroup>

            <FormGroup>
              <Label>Rank</Label>
              <Input type="text" value={rank} onChange={(e) => setRank(e.target.value)} />
            </FormGroup>

            <FormGroup>
              <Label>Student ID / SEC ID</Label>
              <Input type="text" value={secID} onChange={(e) => setSecID(e.target.value)} />
            </FormGroup>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <FormGroup>
                <Label>Department</Label>
                <Input type="text" value={dept} onChange={(e) => setDept(e.target.value)} />
              </FormGroup>
              <FormGroup>
                <Label>Section</Label>
                <Input type="text" value={section} onChange={(e) => setSection(e.target.value)} />
              </FormGroup>
            </div>

            <FormGroup>
              <Label>Regimental No</Label>
              <Input type="text" value={regimentalNo} onChange={(e) => setRegimentalNo(e.target.value)} />
            </FormGroup>

            <FormGroup>
              <Label>Registration No</Label>
              <Input type="text" value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} />
            </FormGroup>

            <FormGroup>
              <Label>Batch (e.g. 2024-2027)</Label>
              <Input type="text" value={batch} onChange={(e) => setBatch(e.target.value)} />
            </FormGroup>

            <Message>{message}</Message>
            <ButtonGroup>
              <SaveButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Working...' : 'Save Changes'}
              </SaveButton>
              <DeleteButton type="button" onClick={handleDelete} disabled={isSubmitting}>
                <Trash2 size={18} />
                Delete Cadet
              </DeleteButton>
            </ButtonGroup>
          </Form>

          {/* Render Cropper Modal if active */}
          {showCropper && tempImageSrc && (
            <ImageCropper
              image={tempImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          )}

        </ModalContent>
      </ModalBackdrop>
    </AnimatePresence>
  );
};
export default AdminCadetEditor;
