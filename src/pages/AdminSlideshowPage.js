// src/pages/AdminSlideshowPage.js
import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { ImagePlus, Trash2, Save, Edit3, X, Check, RefreshCw, Download } from 'lucide-react';
import { collection, getDocs, orderBy, query, doc, writeBatch, addDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFileToFirebaseStorage } from '../utils/firebaseStorage';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { getOptimizedUrl } from '../utils/imageOptimizer';
import { downloadImage } from '../utils/downloadHelper';

import SEO from '../components/common/SEO'; // Import SEO component
import SystemMigrationModal from '../components/admin/SystemMigrationModal';

// --- STYLES ---
const PageContainer = styled.div`
  padding: 100px 2rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;
const Header = styled.div` text-align: center; margin-bottom: 3rem; `;
const Title = styled.h1` font-size: 2.5rem; color: #1A2B4C; `;
const InfoText = styled.p` color: #555; `;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  width: 100%;
`;

const ImageCard = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  aspect-ratio: 16 / 9; /* Slideshows are usually landscape */
  overflow: hidden; /* CRITICAL: Prevent overflow */
  touch-action: none;
  
  img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
    display: block;
  }
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const ActionButtonsContainer = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
  z-index: 100;
  pointer-events: auto;
`;

const CircleButton = styled.button`
  background: ${props => {
        if (props.$variant === 'delete') return '#dc2626';
        if (props.$variant === 'download') return '#2563eb';
        return '#ffffff';
    }};
  color: ${props => (props.$variant === 'delete' || props.$variant === 'download') ? '#ffffff' : '#1A2B4C'};
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  z-index: 101;
  
  &:hover {
    transform: scale(1.1);
    background: ${props => {
        if (props.$variant === 'delete') return '#ef4444';
        if (props.$variant === 'download') return '#1d4ed8';
        return '#f1f5f9';
    }};
  }
`;

const UploadContainer = styled.div`
  margin: 2rem 0;
  padding: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  max-width: 100%;
  margin-left: auto;
  margin-right: auto;
`;


const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1A2B4C;
`;

const UploadButton = styled.button`
  background: #1A2B4C;
  color: white;
  border: none;
  padding: 0 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 48px;
  white-space: nowrap;
  
  &:disabled {
    background: #ccc;
  }
  
  &:hover:not(:disabled) {
    background: #2D4A7C;
  }
`;

const WingSelector = styled.select`
  padding: 0 1rem;
  border-radius: 8px;
  border: 1px solid #ccc;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 500;
  height: 48px;
  min-width: 200px;
  background-color: white;
`;

const DescriptionInput = styled.input`
  padding: 0 1rem;
  flex: 1;
  min-width: 200px;
  border-radius: 8px;
  border: 1px solid #ccc;
  height: 48px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #1A2B4C;
  }
`;

const SaveButtonContainer = styled.div` display: flex; justify-content: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e0e0e0; `;
const SaveAndExitButton = styled.button` background: #28a745; color: white; border: none; padding: 1rem 2.5rem; font-size: 1.1rem; font-weight: 600; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 0.75rem; transition: background-color 0.2s ease-in-out; &:hover { background: #218838; } `;

// --- Modal Styles ---
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 20px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
`;

const ModalBody = styled.div`
  padding: 2rem;
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #e2e8f0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #e2e8f0;
    color: #1e293b;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  font-size: 1rem;
  line-height: 1.5;
  outline: none;
  resize: vertical;
  transition: border-color 0.2s;

  &:focus {
    border-color: #1A2B4C;
    box-shadow: 0 0 0 3px rgba(26, 43, 76, 0.1);
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;

  &.secondary {
    background: #fff;
    border: 1px solid #cbd5e1;
    color: #64748b;

    &:hover {
      background: #f1f5f9;
      color: #334155;
    }
  }

  &.primary {
    background: #1A2B4C;
    color: white;

    &:hover {
      background: #2D4A7C;
    }
  }
`;

const SortableImage = ({ image, index, onDelete, onEdit }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: image.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <ImageCard ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <img src={getOptimizedUrl(image.imageUrl, 400, 70)} alt={`Slide ${index + 1}`} loading="lazy" />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '0.8rem' }}>
                {image.description || 'No description'}
            </div>
            <ActionButtonsContainer>
                <CircleButton
                    $variant="download"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(image.imageUrl, `slideshow_${image.id}`);
                    }}
                    title="Download Image"
                    style={{ width: 'auto', padding: '0 12px', borderRadius: '20px' }}
                >
                    <Download size={14} />
                    <span style={{ marginLeft: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>Download</span>
                </CircleButton>
                <CircleButton
                    onPointerDown={e => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(image);
                    }}
                    title="Edit Description"
                >
                    <Edit3 size={16} />
                </CircleButton>
                <CircleButton
                    $variant="delete"
                    onPointerDown={e => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(image);
                    }}
                    title="Delete Image"
                >
                    <Trash2 size={16} />
                </CircleButton>
            </ActionButtonsContainer>
        </ImageCard>
    );
};

const AdminSlideshowPage = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [targetCollection, setTargetCollection] = useState('slideshowImages');

    // Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [editDescription, setEditDescription] = useState('');
    const [migrationModalOpen, setMigrationModalOpen] = useState(false);

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetching images from Firestore based on targetCollection
            const q = query(collection(db, targetCollection), orderBy("order", "asc"));
            const querySnapshot = await getDocs(q);
            const fetchedImages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setImages(fetchedImages);
        } catch (error) {
            console.error("Failed to fetch images:", error);
            alert("Failed to load images. Check console for details.");
            setImages([]);
        } finally {
            setIsLoading(false);
        }
    }, [targetCollection]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!active || !over || active.id === over.id) return;
        const oldIndex = images.findIndex(img => img.id === active.id);
        const newIndex = images.findIndex(img => img.id === over.id);
        const newOrder = arrayMove(images, oldIndex, newIndex);
        setImages(newOrder); // Update local state immediately
        // Update Firestore order
        const batch = writeBatch(db);
        newOrder.forEach((item, index) => {
            const docRef = doc(db, targetCollection, item.id);
            batch.update(docRef, { order: index + 1 }); // Use index + 1 for order
        });
        try {
            await batch.commit();
        } catch (error) {
            console.error("Failed to save new order:", error);
            alert("Failed to save new order. Refreshing list.");
            await fetchImages(); // Re-fetch on error
        }
    };


    const [description, setDescription] = useState('');

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsLoading(true);
        try {
            const uploadFileToFirebase = async (file, folderPath) => {
                if (!file) return '';
                return uploadFileToFirebaseStorage(file, folderPath);
            };

            // Use shared upload utility
            console.log("Uploading slideshow image...");
            const imageUrl = await uploadFileToFirebase(file, `slideshows/${targetCollection}`);

            if (imageUrl) {
                console.log("Image uploaded to Cloudinary, adding record to Firestore...");
                const newOrder = images.length > 0 ? Math.max(...images.map(img => img.order)) + 1 : 1;
                await addDoc(collection(db, targetCollection), { imageUrl, order: newOrder, description: description });
                await fetchImages();
                setDescription('');
            } else {
                throw new Error("Upload succeeded but no URL was returned.");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            alert(`Failed to upload image. Error: ${error.message}`);
        } finally {
            setIsLoading(false);
            event.target.value = null; // Reset file input
        }
    };

    const handleEditImage = (image) => {
        setEditingImage(image);
        setEditDescription(image.description || '');
        setEditModalOpen(true);
    };

    const saveDescription = async () => {
        if (!editingImage) return;
        setIsLoading(true);
        try {
            const docRef = doc(db, targetCollection, editingImage.id);
            await updateDoc(docRef, { description: editDescription });

            setImages(prev => prev.map(img =>
                img.id === editingImage.id ? { ...img, description: editDescription } : img
            ));

            setEditModalOpen(false);
            setEditingImage(null);
            setEditDescription('');
        } catch (error) {
            console.error("Error updating description:", error);
            alert("Failed to update description.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (imageToDelete) => {
        if (!window.confirm("Are you sure?")) return;
        setIsLoading(true);
        try {
            await deleteDoc(doc(db, targetCollection, imageToDelete.id));
            await fetchImages();

            const remainingImages = images.filter(img => img.id !== imageToDelete.id);
            const batch = writeBatch(db);
            remainingImages.sort((a, b) => a.order - b.order).forEach((item, index) => {
                const docRef = doc(db, targetCollection, item.id);
                batch.update(docRef, { order: index + 1 });
            });
            await batch.commit();
            await fetchImages();
        } catch (error) {
            console.error("Error deleting image:", error);
            alert("Failed to delete image.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndExit = () => {
        navigate('/'); // Navigate to homepage or relevant page
    };

    return (
        <PageContainer>
            <SEO title="Admin - Slideshow" noindex={true} />
            {isLoading && <LoadingOverlay>Loading...</LoadingOverlay>}
            <Header>
                <Title>Manage Slideshow Photos</Title>
                <InfoText>Select a slideshow, then drag and drop photos to change their order.</InfoText>
            </Header>
            <UploadContainer>
                <label htmlFor="collection-select" style={{ fontWeight: 600, color: '#1A2B4C' }}>Manage Slideshow For:</label>
                <WingSelector id="collection-select" value={targetCollection} onChange={(e) => setTargetCollection(e.target.value)}>
                    <option value="slideshowImages">General (Homepage)</option>
                    <option value="aboutNCCSlideshowImages">About NCC</option>
                    <option value="armySlideshowImages">Army Wing (BTY)</option>
                    <option value="armyBNSlideshowImages">Army Battalion (BN)</option>
                    <option value="armyMEDSlideshowImages">Army Medical (MED)</option>
                    <option value="navySlideshowImages">Navy Wing</option>
                    <option value="airSlideshowImages">Air Wing</option>
                </WingSelector>

                <input type="file" id="photoUpload" style={{ display: 'none' }} onChange={handleUpload} accept="image/jpeg, image/png, image/webp" />

                <DescriptionInput
                    type="text"
                    placeholder="Enter description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <UploadButton onClick={() => document.getElementById('photoUpload').click()} disabled={isLoading}>
                    <ImagePlus size={20} /> Add New Photo
                </UploadButton>

                <UploadButton onClick={() => setMigrationModalOpen(true)} style={{ background: '#6366f1' }}>
                    <RefreshCw size={20} /> System Migration
                </UploadButton>
            </UploadContainer>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={images} strategy={rectSortingStrategy}>
                    <ImageGrid>
                        {images.map((image, index) => (
                            <SortableImage
                                key={image.id}
                                image={image}
                                index={index}
                                onDelete={handleDelete}
                                onEdit={handleEditImage}
                            />
                        ))}
                    </ImageGrid>
                </SortableContext>
            </DndContext>

            <AnimatePresence>
                {editModalOpen && (
                    <ModalOverlay
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setEditModalOpen(false)}
                    >
                        <ModalContent
                            onClick={e => e.stopPropagation()}
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            <ModalHeader>
                                <h3 style={{ margin: 0, color: '#1A2B4C', fontSize: '1.25rem', fontWeight: 'bold' }}>Edit Description</h3>
                                <CloseButton onClick={() => setEditModalOpen(false)}>
                                    <X size={20} />
                                </CloseButton>
                            </ModalHeader>
                            <ModalBody>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#64748b', fontSize: '0.9rem' }}>
                                    Caption
                                </label>
                                <TextArea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="Enter a description for this slide..."
                                    autoFocus
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button className="secondary" onClick={() => setEditModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button className="primary" onClick={saveDescription}>
                                    <Check size={18} />
                                    Save Changes
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>

            <SaveButtonContainer>
                <SaveAndExitButton onClick={handleSaveAndExit}>
                    <Save size={20} />
                    Save and Go to Homepage
                </SaveAndExitButton>
            </SaveButtonContainer>

            <SystemMigrationModal
                isOpen={migrationModalOpen}
                onClose={() => setMigrationModalOpen(false)}
            />
        </PageContainer>
    );
};

export default AdminSlideshowPage;