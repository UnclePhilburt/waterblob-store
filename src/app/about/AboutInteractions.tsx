'use client';

import { useEffect, useRef, useCallback } from 'react';

/* ==========================================================================
   WaterRipple — Canvas-based ripple animation for the hero background
   ========================================================================== */

class WaterRipple {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;
  private ripples: {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    opacity: number;
    speed: number;
  }[] = [];
  private animationId: number = 0;
  private running: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.resize);
  }

  private resize = () => {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.spawnLoop();
    this.draw();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resize);
  }

  private spawnLoop = () => {
    if (!this.running) return;
    this.spawn();
    setTimeout(this.spawnLoop, 1200 + Math.random() * 2000);
  };

  private spawn() {
    this.ripples.push({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      radius: 0,
      maxRadius: 80 + Math.random() * 160,
      opacity: 0.18 + Math.random() * 0.12,
      speed: 0.4 + Math.random() * 0.6,
    });
    if (this.ripples.length > 12) {
      this.ripples.shift();
    }
  }

  private draw = () => {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i];
      r.radius += r.speed;
      const life = r.radius / r.maxRadius;
      const alpha = r.opacity * (1 - life);

      if (alpha <= 0.001) {
        this.ripples.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(0, 168, 232, ${alpha})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // inner ring
      if (r.radius > 10) {
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, r.radius * 0.6, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(0, 217, 255, ${alpha * 0.5})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    }

    this.animationId = requestAnimationFrame(this.draw);
  };
}

/* ==========================================================================
   Hook: useAboutInteractions
   ========================================================================== */

export interface AboutRefs {
  heroCanvas: React.RefObject<HTMLCanvasElement | null>;
  statsSection: React.RefObject<HTMLElement | null>;
  statNumbers: React.RefObject<(HTMLSpanElement | null)[]>;
  timelineItems: React.RefObject<(HTMLDivElement | null)[]>;
  carouselTrack: React.RefObject<HTMLDivElement | null>;
  carouselDots: React.RefObject<(HTMLButtonElement | null)[]>;
  mediaCards: React.RefObject<(HTMLDivElement | null)[]>;
  qualityCards: React.RefObject<(HTMLDivElement | null)[]>;
  regionBadges: React.RefObject<(HTMLDivElement | null)[]>;
  founderSection: React.RefObject<HTMLElement | null>;
  founderImage: React.RefObject<HTMLDivElement | null>;
  signatureEl: React.RefObject<HTMLParagraphElement | null>;
}

/** Scoped CSS module class names that the hook needs to toggle via DOM */
export interface AboutClassNames {
  visible: string;
  carouselDotActive: string;
}

export function useAboutInteractions(
  refs: AboutRefs,
  classNames: AboutClassNames
) {
  const carouselIndex = useRef(0);
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const rippleInstance = useRef<WaterRipple | null>(null);

  /* --- helper: animate a single number from 0 to target --- */
  const animateNumber = useCallback(
    (el: HTMLSpanElement, target: number, suffix: string) => {
      const duration = 2000;
      const start = performance.now();
      const step = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out-quart
        const eased = 1 - Math.pow(1 - progress, 4);
        const value = Math.round(eased * target);
        el.textContent = value.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    []
  );

  /* --- helper: go to carousel slide --- */
  const goToSlide = useCallback(
    (index: number, totalSlides: number) => {
      carouselIndex.current = index;
      const track = refs.carouselTrack.current;
      if (track) {
        track.style.transform = `translateX(-${index * 100}%)`;
      }
      refs.carouselDots.current?.forEach((dot, i) => {
        if (!dot) return;
        if (i === index) {
          dot.classList.add(classNames.carouselDotActive);
        } else {
          dot.classList.remove(classNames.carouselDotActive);
        }
      });
    },
    [refs.carouselTrack, refs.carouselDots, classNames.carouselDotActive]
  );

  useEffect(() => {
    const { visible } = classNames;

    /* ------ 1. Hero ripple canvas ------ */
    if (refs.heroCanvas.current) {
      rippleInstance.current = new WaterRipple(refs.heroCanvas.current);
      rippleInstance.current.start();
    }

    /* ------ 2. Stats animated counters ------ */
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          refs.statNumbers.current?.forEach((el) => {
            if (!el) return;
            const target = parseInt(el.dataset.target || '0', 10);
            const suffix = el.dataset.suffix || '';
            animateNumber(el, target, suffix);
          });
          statsObserver.disconnect();
        });
      },
      { threshold: 0.3 }
    );
    if (refs.statsSection.current) {
      statsObserver.observe(refs.statsSection.current);
    }

    /* ------ 3. Timeline scroll animations ------ */
    const timelineObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add(visible);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );
    refs.timelineItems.current?.forEach((item) => {
      if (item) timelineObserver.observe(item);
    });

    /* ------ 4. Media / quality / region card stagger animations ------ */
    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.dataset.stagger || '0', 10);
            setTimeout(() => {
              el.classList.add(visible);
            }, delay);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    refs.mediaCards.current?.forEach((card) => {
      if (card) cardObserver.observe(card);
    });
    refs.qualityCards.current?.forEach((card) => {
      if (card) cardObserver.observe(card);
    });
    refs.regionBadges.current?.forEach((badge) => {
      if (badge) cardObserver.observe(badge);
    });

    /* ------ 5. Testimonials carousel auto-play ------ */
    const totalSlides = 4;
    goToSlide(0, totalSlides);
    carouselTimer.current = setInterval(() => {
      const next = (carouselIndex.current + 1) % totalSlides;
      goToSlide(next, totalSlides);
    }, 5000);

    /* ------ 6. Parallax for founder image ------ */
    const handleScroll = () => {
      const section = refs.founderSection.current;
      const img = refs.founderImage.current;
      if (!section || !img) return;
      const rect = section.getBoundingClientRect();
      const viewH = window.innerHeight;
      if (rect.top < viewH && rect.bottom > 0) {
        const progress = (viewH - rect.top) / (viewH + rect.height);
        const offset = (progress - 0.5) * 40;
        img.style.transform = `translateY(${offset}px)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    /* ------ 7. Signature entrance animation ------ */
    const sigObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add(visible);
            sigObserver.disconnect();
          }
        });
      },
      { threshold: 0.5 }
    );
    if (refs.signatureEl.current) {
      sigObserver.observe(refs.signatureEl.current);
    }

    /* ------ Cleanup ------ */
    return () => {
      rippleInstance.current?.stop();
      statsObserver.disconnect();
      timelineObserver.disconnect();
      cardObserver.disconnect();
      sigObserver.disconnect();
      if (carouselTimer.current) clearInterval(carouselTimer.current);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [refs, classNames, animateNumber, goToSlide]);

  return { goToSlide, carouselIndex };
}
