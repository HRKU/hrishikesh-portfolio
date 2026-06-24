'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MIN_SLIDE = 280;
const MAX_SLIDE = 420;
const MAX_PER_VIEW = 3;

function computeSlideLayout(track) {
  const style = getComputedStyle(track);
  const gap = parseFloat(style.gap) || 16;
  const paddingLeft = parseFloat(style.paddingLeft) || 0;
  const paddingRight = parseFloat(style.paddingRight) || 0;
  const width = track.clientWidth - paddingLeft - paddingRight;

  let perView = Math.max(1, Math.floor((width + gap) / (MIN_SLIDE + gap)));
  perView = Math.min(perView, MAX_PER_VIEW);

  let slideWidth = Math.floor((width - gap * (perView - 1)) / perView);
  slideWidth = Math.min(MAX_SLIDE, Math.max(MIN_SLIDE, slideWidth));

  while (perView > 1) {
    const total = perView * slideWidth + (perView - 1) * gap;
    if (total <= width) break;
    perView -= 1;
    slideWidth = Math.floor((width - gap * (perView - 1)) / perView);
    slideWidth = Math.min(MAX_SLIDE, Math.max(MIN_SLIDE, slideWidth));
  }

  return { slideWidth, perView };
}

export default function CardSlider({ children, ariaLabel = 'Project cards' }) {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const { slideWidth } = computeSlideLayout(track);
    track.style.setProperty('--slide-width', `${slideWidth}px`);

    const { scrollLeft, scrollWidth, clientWidth } = track;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const sync = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(updateScrollState);
      });
    };

    sync();

    track.addEventListener('scroll', updateScrollState, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(track);
    Array.from(track.children).forEach((child) => observer.observe(child));

    return () => {
      track.removeEventListener('scroll', updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, children]);

  const scrollByDirection = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector('.card-slider-slide');
    const gap = parseFloat(getComputedStyle(track).gap) || 16;
    const amount = slide ? slide.offsetWidth + gap : track.clientWidth * 0.85;
    track.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  return (
    <div
      className="card-slider"
      data-at-start={!canScrollLeft ? 'true' : 'false'}
      data-at-end={!canScrollRight ? 'true' : 'false'}
    >
      <div className="card-slider-viewport">
        <div className="card-slider-edge card-slider-edge-left" aria-hidden="true" />
        <div className="card-slider-edge card-slider-edge-right" aria-hidden="true" />

        <div
          ref={trackRef}
          className="card-slider-track"
          aria-label={ariaLabel}
          role="region"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') scrollByDirection(-1);
            if (e.key === 'ArrowRight') scrollByDirection(1);
          }}
        >
          {children}
        </div>
      </div>

      <button
        type="button"
        className="card-slider-nav card-slider-nav-prev"
        onClick={() => scrollByDirection(-1)}
        disabled={!canScrollLeft}
        aria-label="Scroll to previous cards"
      >
        <ChevronLeft size={20} />
      </button>

      <button
        type="button"
        className="card-slider-nav card-slider-nav-next"
        onClick={() => scrollByDirection(1)}
        disabled={!canScrollRight}
        aria-label="Scroll to next cards"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export function CardSliderSlide({ children, className = '' }) {
  const slideRef = useRef(null);
  const [visibility, setVisibility] = useState('peek');

  useEffect(() => {
    const slide = slideRef.current;
    if (!slide) return;

    const root = slide.closest('.card-slider-track');
    if (!root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const ratio = entry.intersectionRatio;
        if (ratio >= 0.92) setVisibility('focus');
        else if (ratio > 0.08) setVisibility('peek');
        else setVisibility('ghost');
      },
      { root, threshold: [0, 0.08, 0.5, 0.92, 1] }
    );

    observer.observe(slide);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={slideRef}
      className={`card-slider-slide card-slider-slide--${visibility} ${className}`.trim()}
    >
      <div className="card-slider-slide-inner">
        {children}
      </div>
    </div>
  );
}
