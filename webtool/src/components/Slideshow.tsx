import React, { useState, useEffect, useCallback } from 'react';
import SlideShowData from '../types/Slideshow';

import "../styles/Slideshow.css";
import { FaTimes } from 'react-icons/fa';

interface SlideshowProps extends SlideShowData {
  exitSlideshow: () => void;
}

const Slideshow: React.FC<SlideshowProps> = ({
  collectionData,
  automaticSlideshow,
  slideshowInterval,
  infiniteSlideshow,
  exitSlideshow
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  const goToNextSlide = useCallback(() => {
    if (currentIndex === collectionData.recordIDs.length - 1 && !infiniteSlideshow) {
      exitSlideshow();
      return;
    }

    setFadeOut(true);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex === collectionData.recordIDs.length - 1) {
          return infiniteSlideshow ? 0 : prevIndex;
        }
        return prevIndex + 1;
      });
      setFadeOut(false);
    }, 300); // Fade out duration
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // Total transition duration
  }, [currentIndex, collectionData.recordIDs.length, infiniteSlideshow]);

  const goToPrevSlide = useCallback(() => {
    if (currentIndex === 0 && !infiniteSlideshow) {
      return;
    }

    setFadeOut(true);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex === 0) {
          return infiniteSlideshow ? collectionData.recordIDs.length - 1 : prevIndex;
        }
        return prevIndex - 1;
      });
      setFadeOut(false);
    }, 300); // Fade out duration
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // Total transition duration
  }, [currentIndex, collectionData.recordIDs.length, infiniteSlideshow]);

  useEffect(() => {
    let intervalId: number | null = null;
    
    if (automaticSlideshow && !isTransitioning) {
      intervalId = setInterval(() => {
        goToNextSlide();
      }, slideshowInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [automaticSlideshow, slideshowInterval, goToNextSlide, isTransitioning]);

  const goToSlide = (index: number) => {
    if (index === currentIndex || isTransitioning) return;
    
    setFadeOut(true);
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentIndex(index);
      setFadeOut(false);
    }, 300);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  };

  if (collectionData.recordIDs.length === 0) {
    exitSlideshow();
    return <></>;
  }

  return (
    <div className="slideshow-container">

      <button
        onClick={exitSlideshow}
        className="exit-slideshow-button"
      >
        <h2>Quitter</h2>
        <FaTimes />
      </button>

      <div className={`slideshow-image-container ${fadeOut ? 'fade-out' : 'fade-in'}`}>
        <img
          src={"http://127.0.0.1:5000/api/artwork/" + collectionData.recordIDs[currentIndex] + "/image"}
          alt={`Slide ${currentIndex + 1}`}
        />
      </div>
      
      <div className="slideshow-controls">
        <button
          onClick={goToPrevSlide}
          disabled={isTransitioning || (!infiniteSlideshow && currentIndex === 0)}
          className="slideshow-control slideshow-prev"
        >
          Previous
        </button>
        
        <div className="slideshow-indicators">
          {collectionData.recordIDs.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`slideshow-indicator ${index === currentIndex ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        
        <button
          onClick={goToNextSlide}
          disabled={isTransitioning || (!infiniteSlideshow && currentIndex === collectionData.recordIDs.length - 1)}
          className="slideshow-control slideshow-next"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Slideshow;