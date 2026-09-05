import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import styled from "styled-components";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getOptimizedUrl, preloadImage } from "../../utils/imageOptimizer";
import MorphSlider from "../common/MorphSlider";
import OptimizedImage from "../common/OptimizedImage";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ---------- Styled Components ----------
const ModalViewerContainer = styled.div`
  width: 100vw;
  height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
`;

const ImageStage = styled.div`
  width: 90vw;
  height: 85vh;
  max-width: 1400px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const NavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${props => props.$direction === 'left' ? 'left: 1.5rem;' : 'right: 1.5rem;'}
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
  transition: all 0.2s ease;
  &:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: translateY(-50%) scale(1.1);
  }
`;

const CaptionOverlay = styled.div`
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  color: #fff;
  padding: 0.6rem 1.4rem;
  border-radius: 20px;
  font-size: 0.95rem;
  max-width: 80%;
  text-align: center;
  pointer-events: none;
  z-index: 10;
`;
const SlideshowContainer = styled.section`
  padding: ${props => props.$isModal ? '0' : '6rem 0'};
  width: ${props => props.$isModal ? '100%' : '100vw'};
  position: relative;
  left: ${props => props.$isModal ? 'auto' : '50%'};
  right: ${props => props.$isModal ? 'auto' : '50%'};
  margin-left: ${props => props.$isModal ? '0' : '-50vw'};
  margin-right: ${props => props.$isModal ? '0' : '-50vw'};
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${props => props.$isModal ? 'transparent' : 'linear-gradient(to bottom, #f1f5f9, #ffffff)'};
`;

const SlideshowContent = styled.div`
  max-width: 1400px;
  width: 100%;
  text-align: center;
`;

const SectionTitle = styled(motion.h2)`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 3rem;
  color: #1a2b4c;
`;

const CarouselWrapper = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.$isModal ? '100vh' : '600px'};
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1500px;
`;

// ---------- Component ----------
const PhotoSlideshow = ({
  collectionName = "slideshowImages",
  images = null,
  title = "Glimpses of Glory",
  currentIndex = 0,
  onSlideChange = () => { },
  isModal = false
}) => {
  const [slides, setSlides] = useState([]);

  // Fetch slides (dummy fallback)
  useEffect(() => {
    if (images) {
      setSlides(prev => {
        if (prev.length === images.length && prev[0]?.id === images[0]?.id) return prev;
        return images;
      });
      return;
    }

    const fetchSlides = async () => {
      try {
        const q = query(collection(db, collectionName), orderBy("order", "asc"), limit(20));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          setSlides([
            { id: 1, imageUrl: "https://picsum.photos/800/400?random=1" },
            { id: 2, imageUrl: "https://picsum.photos/800/400?random=2" },
            { id: 3, imageUrl: "https://picsum.photos/800/400?random=3" },
          ]);
        } else {
          const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setSlides(fetched);
        }
      } catch {
        setSlides([
          { id: 1, imageUrl: "https://picsum.photos/800/400?random=1" },
          { id: 2, imageUrl: "https://picsum.photos/800/400?random=2" },
          { id: 3, imageUrl: "https://picsum.photos/800/400?random=3" },
        ]);
      }
    };
    fetchSlides();
  }, [collectionName, images, isModal]);

  const morphItems = React.useMemo(() => {
    return slides.map(slide => ({
      image: getOptimizedUrl(slide.imageUrl, isModal ? 2000 : 1600, 80),
      fallbackImage: slide.imageUrl,
      caption: slide.description || ''
    }));
  }, [slides, isModal]);

  // Preload neighboring slides when in modal
  useEffect(() => {
    if (!isModal || !slides.length) return;
    const nextIdx = (currentIndex + 1) % slides.length;
    const prevIdx = (currentIndex - 1 + slides.length) % slides.length;
    if (slides[nextIdx]?.imageUrl) preloadImage(slides[nextIdx].imageUrl);
    if (slides[prevIdx]?.imageUrl) preloadImage(slides[prevIdx].imageUrl);
  }, [isModal, currentIndex, slides]);

  // Keyboard navigation for modal lightbox
  useEffect(() => {
    if (!isModal) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        onSlideChange((currentIndex + 1) % slides.length);
      } else if (e.key === 'ArrowLeft') {
        onSlideChange((currentIndex - 1 + slides.length) % slides.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModal, currentIndex, slides.length, onSlideChange]);

  if (!slides.length) return null;

  if (isModal) {
    const currentSlide = slides[currentIndex] || slides[0];
    if (!currentSlide) return null;

    return (
      <ModalViewerContainer>
        <NavButton
          $direction="left"
          onClick={() => onSlideChange((currentIndex - 1 + slides.length) % slides.length)}
          aria-label="Previous photo"
        >
          <ChevronLeft size={30} />
        </NavButton>

        <ImageStage>
          <OptimizedImage
            key={currentSlide.id || currentIndex}
            src={currentSlide.imageUrl}
            alt={currentSlide.description || "Photo"}
            width={1400}
            quality={85}
            priority={true}
            objectFit="contain"
            style={{ width: '100%', height: '100%', maxHeight: '85vh' }}
          />
          {currentSlide.description && (
            <CaptionOverlay>{currentSlide.description}</CaptionOverlay>
          )}
        </ImageStage>

        <NavButton
          $direction="right"
          onClick={() => onSlideChange((currentIndex + 1) % slides.length)}
          aria-label="Next photo"
        >
          <ChevronRight size={30} />
        </NavButton>
      </ModalViewerContainer>
    );
  }

  return (
    <SlideshowContainer $isModal={isModal}>
      <SlideshowContent>
        {title && !isModal && (
          <SectionTitle
            initial={{ opacity: 0, y: -50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {title}
          </SectionTitle>
        )}

        <CarouselWrapper $isModal={isModal}>
          <div style={{ 
            width: isModal ? '100%' : '90vw', 
            maxWidth: isModal ? 'none' : '1400px', 
            height: isModal ? '100vh' : '600px', 
            margin: '0 auto', 
            position: 'relative',
            borderRadius: isModal ? '0' : '20px',
            overflow: 'hidden',
            boxShadow: isModal ? 'none' : '0 25px 50px -12px rgba(0,0,0,0.5)'
          }}>
            <MorphSlider
              items={morphItems}
              startIndex={currentIndex}
              transition="melt"
              intensity={0.55}
              aberration={0.35}
              drift={0.4}
              duration={2.5}
              autoplay={!isModal}
              autoplayDelay={6}
              radius={isModal ? 0 : 20}
              onChange={onSlideChange}
            />
          </div>
        </CarouselWrapper>
      </SlideshowContent>
    </SlideshowContainer>
  );
};

export default PhotoSlideshow;
