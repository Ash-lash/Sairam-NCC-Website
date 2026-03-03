import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';
import { db, storage } from '../../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithEmailAndPassword, updatePassword } from 'firebase/auth';

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
  z-index: 10001;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1.5rem 2rem;
  background: #1A2B4C;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Body = styled.div`
  padding: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ToolCard = styled.div`
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActionButton = styled.button`
  background: ${props => props.$color || '#1A2B4C'};
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.2s;
  
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ProgressInfo = styled.div`
  font-size: 0.9rem;
  color: #64748b;
  margin-top: 0.5rem;
`;

const SystemMigrationModal = ({ isOpen, onClose }) => {
    const [migrating, setMigrating] = useState(false);
    const [progress, setProgress] = useState('');


    const syncImages = async () => {
        if (!window.confirm("This will find all Supabase images and re-upload them to Firebase. Continue?")) return;

        setMigrating(true);
        setProgress('Starting migration...');

        const COLLECTIONS = [
            { name: 'cadets', fields: ['photoURL', 'pdfURL'] },
            { name: 'magicMembers', fields: ['photoURL'] },
            { name: 'anos', fields: ['photoUrl', 'pdfUrl'] },
            { name: 'alumni', fields: ['photoUrl'] },
            { name: 'galleryImages', fields: ['imageUrl'] },
            { name: 'galleryAlbums', fields: ['coverImage'] },
            { name: 'slideshowImages', fields: ['imageUrl'] },
            { name: 'aboutNCCSlideshowImages', fields: ['imageUrl'] },
            { name: 'armySlideshowImages', fields: ['imageUrl'] },
            { name: 'navySlideshowImages', fields: ['imageUrl'] },
            { name: 'airSlideshowImages', fields: ['imageUrl'] },
            { name: 'organization', fields: ['imageUrl'] },
            { name: 'achievements', fields: ['cadetPhotoUrl', 'groupPhotoUrl', 'reportUrl', 'groupMembers'] },
            { name: 'events', fields: ['posterUrl', 'photos'] },
            { name: 'nccTeams', fields: ['iconURL'] },
            { name: 'nccTeamBatches', fields: ['posterURL', 'posterURLs'] },
            { name: 'downloads', fields: ['fileUrl'] },
            { name: 'leadership', fields: ['imageUrl'] },
            { name: 'announcements', fields: ['imageUrl'] }
        ];

        const migrateUrl = async (url, path) => {
            if (!url || typeof url !== 'string' || !url.includes('supabase.co')) return url;

            try {
                // Remove wsrv.nl wrapper if present
                let cleanUrl = url;
                if (url.includes('wsrv.nl/?url=')) {
                    const match = url.match(/url=([^&]+)/);
                    if (match) cleanUrl = decodeURIComponent(match[1]);
                }

                const response = await fetch(cleanUrl);
                const blob = await response.blob();
                const fileName = `migration/${path}_${Date.now()}`;
                const storageRef = ref(storage, fileName);
                await uploadBytes(storageRef, blob);
                return await getDownloadURL(storageRef);
            } catch (e) {
                console.error(`Failed to migrate ${url}:`, e);
                return url;
            }
        };

        try {
            let totalProcessed = 0;
            let totalMigrated = 0;

            for (const col of COLLECTIONS) {
                setProgress(`Scanning ${col.name}...`);
                const snapshot = await getDocs(collection(db, col.name));

                for (const document of snapshot.docs) {
                    const data = document.data();
                    const updates = {};
                    let changed = false;

                    for (const field of col.fields) {
                        const val = data[field];
                        if (!val) continue;

                        if (typeof val === 'string') {
                            const newUrl = await migrateUrl(val, `${col.name}/${document.id}_${field}`);
                            if (newUrl !== val) {
                                updates[field] = newUrl;
                                changed = true;
                                totalMigrated++;
                            }
                        } else if (Array.isArray(val)) {
                            const newArray = [];
                            let arrayChanged = false;
                            for (let i = 0; i < val.length; i++) {
                                const item = val[i];
                                if (typeof item === 'string') {
                                    const newUrl = await migrateUrl(item, `${col.name}/${document.id}_${field}_${i}`);
                                    newArray.push(newUrl);
                                    if (newUrl !== item) {
                                        arrayChanged = true;
                                        totalMigrated++;
                                    }
                                } else if (typeof item === 'object' && item !== null) {
                                    // Handle objects like groupMembers: { photoUrl: '...' }
                                    const newItem = { ...item };
                                    let itemChanged = false;
                                    for (const key in item) {
                                        if (typeof item[key] === 'string' && item[key].includes('supabase.co')) {
                                            const newUrl = await migrateUrl(item[key], `${col.name}/${document.id}_${field}_${i}_${key}`);
                                            newItem[key] = newUrl;
                                            itemChanged = true;
                                            totalMigrated++;
                                        }
                                    }
                                    newArray.push(newItem);
                                    if (itemChanged) arrayChanged = true;
                                } else {
                                    newArray.push(item);
                                }
                            }
                            if (arrayChanged) {
                                updates[field] = newArray;
                                changed = true;
                            }
                        }
                    }

                    if (changed) {
                        await updateDoc(doc(db, col.name, document.id), updates);
                    }
                    totalProcessed++;
                    if (totalProcessed % 5 === 0) {
                        setProgress(`Processed ${totalProcessed} docs. Migrated ${totalMigrated} assets...`);
                    }
                }
            }
            setProgress(`Sync complete! Processed ${totalProcessed} documents. Migrated ${totalMigrated} assets.`);
            alert(`Migration finished! ${totalMigrated} items moved to Firebase.`);
        } catch (error) {
            console.error(error);
            setProgress(`Error: ${error.message}`);
            alert(`Migration failed: ${error.message}`);
        } finally {
            setMigrating(false);
        }
    };

    const updateAlumniPasswords = async () => {
        const password = prompt("Please enter the NEW password for Alumni Admin accounts:");
        if (!password || password.length < 6) {
            alert("Invalid password.");
            return;
        }

        alert("Note: To update passwords for OTHER users without their current login, you would normally use a Firebase Admin script or Firebase Console. Since this is the browser client, this tool can only update passwords for the CURRENTLY logged-in users or if you have their current credentials. For mass updates, please use the Cloud functions or contact support.");
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ModalContent
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                >
                    <Header>
                        <h2 style={{ margin: 0 }}>System Migration Tools</h2>
                        <ActionButton onClick={onClose} $color="transparent"><X size={24} /></ActionButton>
                    </Header>
                    <Body>
                        <ToolCard>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <RefreshCw size={32} color="#1A2B4C" />
                                <div>
                                    <h3 style={{ margin: 0 }}>Supabase ➔ Firebase Sync</h3>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                                        Downloads all images from Supabase and stores them in Firebase.
                                    </p>
                                </div>
                            </div>
                            <ActionButton onClick={syncImages} disabled={migrating}>
                                {migrating ? 'Migrating...' : 'Start Image Sync'}
                            </ActionButton>
                            {progress && <ProgressInfo>{progress}</ProgressInfo>}
                        </ToolCard>

                        <ToolCard>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <AlertTriangle size={32} color="#ef4444" />
                                <div>
                                    <h3 style={{ margin: 0 }}>Legacy Password Update</h3>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: '#64748b' }}>
                                        Update passwords for administrative conventions.
                                    </p>
                                </div>
                            </div>
                            <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: '8px', border: '1px solid #fef3c7', fontSize: '0.85rem', color: '#92400e' }}>
                                Recommended: Use the <strong>Firebase Console</strong> to change passwords directly in the Auth tab for <strong>alumini@sairam.edu.in</strong> accounts.
                            </div>
                        </ToolCard>
                    </Body>
                </ModalContent>
            </ModalOverlay>
        </AnimatePresence>
    );
};

export default SystemMigrationModal;
