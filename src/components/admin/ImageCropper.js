import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Modal = styled(motion.div)`
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    font-size: 1.25rem;
    font-weight: 800;
    color: #1a2b4c;
    margin: 0;
  }
`;

const CropContainer = styled.div`
  position: relative;
  width: 100%;
  height: 400px;
  background: #333;
`;

const Controls = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const SliderGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #64748b;
    min-width: 60px;
  }
  
  input {
    flex: 1;
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    appearance: none;
    &::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      background: #1a2b4c;
      border-radius: 50%;
      cursor: pointer;
      border: 3px solid #ffbf00;
    }
  }
`;

const Footer = styled.div`
  padding: 1.5rem 2rem;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.$primary ? `
    background: #1a2b4c;
    color: white;
    border: none;
    &:hover { background: #ffbf00; color: #1a2b4c; }
  ` : `
    background: white;
    color: #64748b;
    border: 1px solid #e2e8f0;
    &:hover { background: #f1f5f9; }
  `}
`;

const ImageCropper = ({ image, imageSrc, onCropComplete, onCancel, cropShape = 'round', aspect = 1 }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const sourceImage = image || imageSrc;

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);
  const onRotationChange = (rotation) => setRotation(rotation);

  const onCropCompleted = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async () => {
    try {
      if (!sourceImage || !croppedAreaPixels) return null;

      const img = await createImage(sourceImage);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const maxSize = Math.max(img.width, img.height);
      const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

      canvas.width = safeArea;
      canvas.height = safeArea;

      ctx.translate(safeArea / 2, safeArea / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-safeArea / 2, -safeArea / 2);

      ctx.drawImage(
        img,
        safeArea / 2 - img.width * 0.5,
        safeArea / 2 - img.height * 0.5
      );

      const data = ctx.getImageData(0, 0, safeArea, safeArea);

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + img.width * 0.5 - croppedAreaPixels.x),
        Math.round(0 - safeArea / 2 + img.height * 0.5 - croppedAreaPixels.y)
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleDone = async () => {
    const croppedBlob = await getCroppedImg();
    if (!croppedBlob) return;
    onCropComplete(croppedBlob);
  };

  return (
    <Overlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Modal
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        <Header>
          <h2>Crop Profile Picture</h2>
          <IconButton onClick={onCancel} style={{ background: 'none' }}><X size={20} /></IconButton>
        </Header>

        <CropContainer>
          <Cropper
            image={sourceImage}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={onCropChange}
            onRotationChange={onRotationChange}
            onCropComplete={onCropCompleted}
            onZoomChange={onZoomChange}
          />
        </CropContainer>

        <Controls>
          <SliderGroup>
            <label>Zoom</label>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
            />
          </SliderGroup>
          <SliderGroup>
            <label>Rotate</label>
            <input
              type="range"
              value={rotation}
              min={0}
              max={360}
              step={1}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
            />
          </SliderGroup>
        </Controls>

        <Footer>
          <Button onClick={onCancel}>Cancel</Button>
          <Button $primary onClick={handleDone}>
            <Check size={18} /> Apply Crop
          </Button>
        </Footer>
      </Modal>
    </Overlay>
  );
};

const IconButton = styled.button`
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  &:hover { color: #1a2b4c; }
`;

export default ImageCropper;
