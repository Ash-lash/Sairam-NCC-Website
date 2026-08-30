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
import { getOptimizedUrl } from "../../utils/imageOptimizer";
import MorphSlider from "../common/MorphSlider";

// ---------- Styled Components ----------
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

  if (!slides.length) return null;

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
