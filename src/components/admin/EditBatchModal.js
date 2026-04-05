import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { X } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

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
`;

const ModalContent = styled(motion.div)`
  background: white;
  width: 90%;
  max-width: 400px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a2b4c;
`;

const CloseButton = styled.button`
  background: #f1f5f9;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  color: #64748b;
  transition: all 0.2s;
  &:hover { background: #e2e8f0; color: #1a2b4c; }
`;

const Form = styled.form`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 700;
  color: #1a2b4c;
  font-size: 0.9rem;
`;

const Input = styled.input`
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.2s;
  &:focus { outline: none; border-color: #1a2b4c; box-shadow: 0 0 0 3px rgba(26, 43, 76, 0.1); }
`;

const SaveButton = styled.button`
  background: #1a2b4c;
  color: white;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
  &:disabled { background: #cbd5e1; cursor: not-allowed; transform: none; }
`;

const Message = styled.p`
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${props => props.$error ? '#ef4444' : '#10b981'};
  margin: 0;
  min-height: 1.2rem;
`;

const EditBatchModal = ({ isOpen, onClose, wing, oldBatchName, onComplete }) => {
  const [newBatchName, setNewBatchName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ message: '', error: false });

  useEffect(() => {
    if (oldBatchName && isOpen) {
      const cleanName = oldBatchName.includes('.') ? oldBatchName.split('. ')[1] : oldBatchName;
      setNewBatchName(cleanName);
      setStatus({ message: '', error: false });
    }
  }, [oldBatchName, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanOldName = oldBatchName.includes('.') ? oldBatchName.split('. ')[1] : oldBatchName;
    const cleanNewName = newBatchName.trim();

    if (!cleanNewName) {
      setStatus({ message: 'Name cannot be empty', error: true });
      return;
    }

    if (cleanNewName === cleanOldName) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    setStatus({ message: 'Syncing changes...', error: false });

    try {
      // 1. Get all cadets in this batch across possible wing variations
      const cadetsRef = collection(db, 'cadets');
      const q = query(cadetsRef, where("Batch", "==", cleanOldName));
      const querySnapshot = await getDocs(q);
      
      const firestoreBatch = writeBatch(db);
      querySnapshot.forEach((docSnap) => {
        firestoreBatch.update(docSnap.ref, { Batch: cleanNewName });
      });

      // 2. Update config/batches
      const batchDocRef = doc(db, 'config', 'batches');
      const docSnap = await getDoc(batchDocRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const wingBatches = [...(data[wing] || [])];
        const index = wingBatches.indexOf(oldBatchName);
        
        if (index !== -1) {
          const newFullBatchName = oldBatchName.includes('.') ? `${oldBatchName.split('. ')[0]}. ${cleanNewName}` : cleanNewName;
          wingBatches[index] = newFullBatchName;
          await updateDoc(batchDocRef, { [wing]: wingBatches });
        }
      }

      await firestoreBatch.commit();
      setStatus({ message: 'Success! Everything updated.', error: false });
      
      setTimeout(() => {
        onComplete();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Batch edit failed:", error);
      setStatus({ message: 'Update failed. Try again.', error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalBackdrop initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <ModalContent 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={e => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>Edit Batch Name</ModalTitle>
              <CloseButton onClick={onClose}><X size={20} /></CloseButton>
            </ModalHeader>
            <Form onSubmit={handleSubmit}>
              <InputGroup>
                <Label>Batch Label</Label>
                <Input 
                  type="text" 
                  value={newBatchName} 
                  onChange={(e) => setNewBatchName(e.target.value)} 
                  placeholder="e.g. 2025-2028"
                  autoFocus
                />
              </InputGroup>
              
              <Message $error={status.error}>{status.message}</Message>
              
              <SaveButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating Database...' : 'Apply Changes'}
              </SaveButton>
            </Form>
          </ModalContent>
        </ModalBackdrop>
      )}
    </AnimatePresence>
  );
};

export default EditBatchModal;
