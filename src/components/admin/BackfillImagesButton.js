import React, { useState } from 'react';
import { ref, listAll, getDownloadURL, uploadBytes, getMetadata } from 'firebase/storage';
import { storage } from '../../firebase';
import styled from 'styled-components';

const Button = styled.button`
  background: #ff5722;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 20px;
  transition: opacity 0.2s;
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Container = styled.div`
  margin: 20px 0;
  padding: 20px;
  background: #fff3e0;
  border-radius: 8px;
  border: 1px solid #ffcc80;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 20px;
  background: #eee;
  border-radius: 10px;
  margin-top: 10px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #ff5722;
  width: ${(props) => props.percent}%;
  transition: width 0.3s ease;
`;

const BackfillImagesButton = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);

  const getAllFiles = async (dirRef, fileList = []) => {
    const res = await listAll(dirRef);
    for (const itemRef of res.items) {
      fileList.push(itemRef);
    }
    for (const folderRef of res.prefixes) {
      // Skip the thumbnails folder to avoid infinite loops
      if (folderRef.name === 'thumbnails') continue;
      await getAllFiles(folderRef, fileList);
    }
    return fileList;
  };

  const handleBackfill = async () => {
    if (!window.confirm("WARNING: This will download and re-upload every image in your database to trigger the new Firebase Extension. This may take a few minutes. Are you sure?")) {
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setTotal(0);
    setStatus('Scanning storage for images...');

    try {
      const rootRef = ref(storage, '/');
      const allFiles = await getAllFiles(rootRef);
      
      // Filter for image files
      const imageFiles = allFiles.filter(f => {
        const name = f.name.toLowerCase();
        return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png');
      });

      setTotal(imageFiles.length);
      setStatus(`Found ${imageFiles.length} images. Starting compression...`);

      for (let i = 0; i < imageFiles.length; i++) {
        const fileRef = imageFiles[i];
        setStatus(`Processing (${i + 1}/${imageFiles.length}): ${fileRef.name}`);
        
        try {
          const url = await getDownloadURL(fileRef);
          const meta = await getMetadata(fileRef);
          const response = await fetch(url);
          const blob = await response.blob();
          
          // Re-uploading overwrites the file, triggering the Firebase Extension
          await uploadBytes(fileRef, blob, { contentType: meta.contentType });
          
        } catch (err) {
          console.error(`Failed to process ${fileRef.name}:`, err);
        }
        
        setProgress(i + 1);
      }

      setStatus('Complete! All images have been queued for WebP compression.');
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Container>
      <h3>📸 Run Image Compression on Entire Gallery</h3>
      <p>Since you installed the Resize Images extension, use this button to scan your entire database and automatically re-process all your old photos so they become lightning fast!</p>
      <Button onClick={handleBackfill} disabled={isProcessing}>
        {isProcessing ? 'Processing...' : 'Start Compression Backfill'}
      </Button>
      
      {isProcessing && (
        <div style={{ marginTop: '15px' }}>
          <strong>{status}</strong>
          <ProgressBar>
            <ProgressFill percent={total > 0 ? (progress / total) * 100 : 0} />
          </ProgressBar>
          <small>{progress} of {total} completed</small>
        </div>
      )}
      {!isProcessing && status !== 'Idle' && (
        <div style={{ marginTop: '15px', color: 'green', fontWeight: 'bold' }}>
          {status}
        </div>
      )}
    </Container>
  );
};

export default BackfillImagesButton;
