import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getOptimizedUrl, preloadImages } from "../../utils/imageOptimizer";
import OptimizedImage from '../common/OptimizedImage';

// ---------- Styled Components ----------
const SlideshowContainer = styled.section`
  padding: ${props => props.$isModal ? '0' : '6rem 0'};
  width: ${props => props.$isModal ? '100%' : '100vw'};
  position: relative;
  left: ${props => props.$isModal ? '0' : '50%'};
  transform: ${props => props.$isModal ? 'none' : 'translateX(-50%)'};
  background: ${props => props.$isModal ? 'transparent' : '#f0f2f5'};
  overflow: hidden;
`;

const SlideshowContent = styled.div`
  max-width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SectionTitle = styled(motion.h2)`
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 4rem;
  color: #1a2b4c;
`;

const CarouselWrapper = styled.div`
  position: relative;
  width: 100%;
  height: ${props => props.$isModal ? '90vh' : '600px'};
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 2000px;

  @media (max-width: 768px) {
    height: ${props => props.$isModal ? '70vh' : '400px'};
  }
`;

const SlideCard = styled(motion.div)`
  position: absolute;
  height: 100%;
  width: 80vw;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 20px;
  background-color: transparent;
  filter: drop-shadow(0 10px 40px rgba(0, 0, 0, 0.5));
  transform-style: preserve-3d;
`;

const NavArrow = styled(motion.button)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  color: white;
  backdrop-filter: blur(10px);

  &.prev {
    left: 2rem;
  }
  &.next {
    right: 2rem;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    &.prev { left: 0.5rem; }
    &.next { right: 0.5rem; }
  }
`;

const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 2rem;
`;

const DescriptionOverlay = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 4rem 2rem 2rem;
  background: linear-gradient(to top, rgba(26, 43, 76, 0.9) 0%, rgba(26, 43, 76, 0.4) 60%, transparent 100%);
  color: white;
  text-align: left;
  display: flex;
  align-items: flex-end;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  pointer-events: none;
  z-index: 30;
`;

const InfoBlade = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  max-width: 80%;
`;

const GoldBar = styled(motion.div)`
  width: 4px;
  height: 40px;
  background: #FFBF00;
  border-radius: 2px;
  box-shadow: 0 0 15px rgba(255, 191, 0, 0.5);
`;

const DescriptionText = styled(motion.div)`
  display: flex;
  flex-direction: column;
  
  .label {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #FFBF00;
    margin-bottom: 4px;
  }
  
  .text {
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
    color: white;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
`;

const Dot = styled(motion.button)`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: ${(props) => (props.$active ? "white" : "rgba(255,255,255,0.3)")};
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
  const [currentSlide, setCurrentSlide] = useState(currentIndex);

  useEffect(() => {
    onSlideChange(currentSlide);
  }, [currentSlide, onSlideChange]);

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
          // Preload first 3 images immediately
          const urls = fetched.slice(0, 3).map(s => getOptimizedUrl(s.imageUrl, isModal ? 2000 : 1200, 80));
          preloadImages(urls);
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

  const nextSlide = useCallback(() => slides.length && setCurrentSlide((prev) => (prev + 1) % slides.length), [slides.length]);
  const prevSlide = useCallback(() => slides.length && setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length), [slides.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextSlide();
      else if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Preload adjacent slides for instant transitions
  useEffect(() => {
    if (slides.length <= 1) return;
    const nextIdx = (currentSlide + 1) % slides.length;
    const prevIdx = (currentSlide - 1 + slides.length) % slides.length;
    preloadImages([
      getOptimizedUrl(slides[nextIdx]?.imageUrl, isModal ? 2000 : 1200, 80),
      getOptimizedUrl(slides[prevIdx]?.imageUrl, isModal ? 2000 : 1200, 80),
    ]);
  }, [currentSlide, slides, isModal]);

  if (!slides.length) return null;

  return (
    <SlideshowContainer $isModal={isModal}>
      <SlideshowContent>
        {title && (
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
          {slides.map((slide, index) => {
            const offset = index - currentSlide;
            let adjustedOffset = offset;
            if (offset > slides.length / 2) adjustedOffset = offset - slides.length;
            else if (offset < -slides.length / 2) adjustedOffset = offset + slides.length;

            const isVisible = Math.abs(adjustedOffset) <= 1;
            if (!isVisible && !isModal) return null;

            const isCurrent = adjustedOffset === 0;

            const animationProps = isModal ? {
              x: `${adjustedOffset * 100}%`,
              scale: 1,
              rotateY: 0,
              opacity: isCurrent ? 1 : 0,
              zIndex: isCurrent ? 10 : 0,
            } : {
              x: `${adjustedOffset * 30}vw`,
              rotateY: adjustedOffset * -25,
              scale: isCurrent ? 1 : 0.7,
              opacity: isCurrent ? 1 : 0.3,
              zIndex: slides.length - Math.abs(adjustedOffset),
            };

            return (
              <SlideCard
                key={slide.id}
                animate={animationProps}
                transition={{ type: "spring", stiffness: 260, damping: 30 }}
                style={{ width: isModal ? '100%' : '80vw', maxWidth: '1000px' }}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {slide.imageUrl ? (
                    <OptimizedImage
                      src={slide.imageUrl}
                      width={isModal ? 2000 : 1200}
                      quality={80}
                      alt="Slide"
                      objectFit="contain"
                      style={{ borderRadius: '20px', backgroundColor: '#000' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#000', borderRadius: '20px' }} />
                  )}
                  {slide.description && isCurrent && (
                    <DescriptionOverlay
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <InfoBlade>
                        <GoldBar
                          initial={{ height: 0 }}
                          animate={{ height: 50 }}
                          transition={{ delay: 0.3, duration: 0.5, ease: "circOut" }}
                        />
                        <DescriptionText>
                          <motion.span
                            className="label"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.4 }}
                          >
                            NCC Momentum
                          </motion.span>
                          <motion.span
                            className="text"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 0.4 }}
                          >
                            {slide.description}
                          </motion.span>
                        </DescriptionText>
                      </InfoBlade>
                    </DescriptionOverlay>
                  )}
                </div>
              </SlideCard>
            );
          })}

          {slides.length > 1 && (
            <>
              <NavArrow className="prev" onClick={prevSlide} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <ChevronLeft size={32} />
              </NavArrow>
              <NavArrow className="next" onClick={nextSlide} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <ChevronRight size={32} />
              </NavArrow>
            </>
          )}
        </CarouselWrapper>

        <DotsContainer>
          {slides.map((_, index) => (
            <Dot
              key={index}
              $active={index === currentSlide}
              onClick={() => setCurrentSlide(index)}
              whileHover={{ scale: 1.2 }}
            />
          ))}
        </DotsContainer>
      </SlideshowContent>
    </SlideshowContainer>
  );
};

export default PhotoSlideshow;
