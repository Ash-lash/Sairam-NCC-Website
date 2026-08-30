import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styled from "styled-components";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import AsyncCachedImage from "../common/AsyncCachedImage";

const SlideshowContainer = styled.section`
  padding: ${(props) => (props.$isModal ? "0" : "4rem 0")};
  width: 100vw;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  background: ${(props) => (props.$isModal ? "black" : "#f8f9fa")};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2rem;
  color: #1a2b4c;
`;

const CarouselWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 1200px;
  height: ${(props) => (props.$isModal ? "100vh" : "600px")};
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  border-radius: ${(props) => (props.$isModal ? "0" : "24px")};
  box-shadow: ${(props) => (props.$isModal ? "none" : "0 20px 40px rgba(0,0,0,0.1)")};
  background: #000;

  @media (max-width: 768px) {
    height: ${(props) => (props.$isModal ? "100vh" : "400px")};
    border-radius: ${(props) => (props.$isModal ? "0" : "12px")};
    width: 95%;
  }
`;

const SlideImageWrapper = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const DescriptionOverlay = styled(motion.div)`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 4rem 2rem 2rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
  color: white;
  z-index: 30;
  pointer-events: none;
`;

const InfoBlade = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
`;

const GoldBar = styled.div`
  width: 4px;
  height: 40px;
  background: #ffbf00;
  border-radius: 2px;
`;

const DescriptionText = styled.div`
  display: flex;
  flex-direction: column;

  .label {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #ffbf00;
    margin-bottom: 4px;
  }

  .text {
    font-size: 1.2rem;
    font-weight: 600;
    color: white;
  }
`;

const NavArrow = styled.button`
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
  z-index: 40;
  color: white;
  backdrop-filter: blur(10px);
  transition: background 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
  }

  &.prev {
    left: 1rem;
  }
  &.next {
    right: 1rem;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
  }
`;

const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 1.5rem;
  padding: 0 1rem;
`;

const Dot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background: ${(props) => (props.$active ? "#1a2b4c" : "#ccc")};
  transition: all 0.3s ease;

  &:hover {
    background: #1a2b4c;
    transform: scale(1.2);
  }
`;

// Slide animation variants
const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 1000 : -1000,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    zIndex: 0,
    x: direction < 0 ? 1000 : -1000,
    opacity: 0,
  }),
};

const PhotoSlideshow = ({
  collectionName = "slideshowImages",
  images = null,
  title = "Glimpses of Glory",
  currentIndex = 0,
  onSlideChange = () => {},
  isModal = false,
}) => {
  const [slides, setSlides] = useState([]);
  const [page, setPage] = useState(currentIndex);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    onSlideChange(page);
  }, [page, onSlideChange]);

  useEffect(() => {
    if (images) {
      setSlides(images);
      return;
    }

    const fetchSlides = async () => {
      try {
        const q = query(collection(db, collectionName), orderBy("order", "asc"), limit(20));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setSlides(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error("Failed to load slideshow", err);
      }
    };
    fetchSlides();
  }, [collectionName, images]);

  const paginate = useCallback(
    (newDirection) => {
      if (!slides.length) return;
      setDirection(newDirection);
      setPage((prev) => (prev + newDirection + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") paginate(1);
      else if (e.key === "ArrowLeft") paginate(-1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paginate]);

  if (!slides.length) return null;

  const currentSlide = slides[page];

  return (
    <SlideshowContainer $isModal={isModal}>
      {!isModal && title && <SectionTitle>{title}</SectionTitle>}

      <CarouselWrapper $isModal={isModal}>
        <AnimatePresence initial={false} custom={direction}>
          <SlideImageWrapper
            key={page}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
          >
            <AsyncCachedImage
              src={currentSlide?.imageUrl}
              alt={currentSlide?.description || "Slideshow Image"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: isModal ? "contain" : "cover",
              }}
            />
            {currentSlide?.description && (
              <DescriptionOverlay>
                <InfoBlade>
                  <GoldBar />
                  <DescriptionText>
                    <span className="label">NCC MOMENTUM</span>
                    <span className="text">{currentSlide.description}</span>
                  </DescriptionText>
                </InfoBlade>
              </DescriptionOverlay>
            )}
          </SlideImageWrapper>
        </AnimatePresence>

        {slides.length > 1 && (
          <>
            <NavArrow className="prev" onClick={() => paginate(-1)}>
              <ChevronLeft size={32} />
            </NavArrow>
            <NavArrow className="next" onClick={() => paginate(1)}>
              <ChevronRight size={32} />
            </NavArrow>
          </>
        )}
      </CarouselWrapper>

      {!isModal && slides.length > 1 && (
        <DotsContainer>
          {slides.map((_, index) => (
            <Dot
              key={index}
              $active={index === page}
              onClick={() => {
                setDirection(index > page ? 1 : -1);
                setPage(index);
              }}
            />
          ))}
        </DotsContainer>
      )}
    </SlideshowContainer>
  );
};

export default PhotoSlideshow;
