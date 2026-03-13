import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Image } from '@/components/ui/image';

interface CarouselImage {
  id: string;
  url: string;
  alt: string;
}

const RubberBandCarouselSection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [mouseOffset, setMouseOffset] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const animationFrameRef = useRef<number>();
  const baseScrollRef = useRef(0);
  const velocityRef = useRef(0);

  // Sample images - replace with actual portfolio images
  const images: CarouselImage[] = [
    {
      id: '1',
      url: 'https://static.wixstatic.com/media/e9d727_dc338c865879444cab6ecb545a8e8d0b~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 1',
    },
    {
      id: '2',
      url: 'https://static.wixstatic.com/media/e9d727_caf9a0b8c25a48e498e615968b84cfc5~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 2',
    },
    {
      id: '3',
      url: 'https://static.wixstatic.com/media/e9d727_af58458647a24198895103de7f52ee34~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 3',
    },
    {
      id: '4',
      url: 'https://static.wixstatic.com/media/e9d727_7398b229af7349179713a070e2ba3045~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 4',
    },
    {
      id: '5',
      url: 'https://static.wixstatic.com/media/e9d727_df5b596912a946fa8801c5a797d9fab5~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 5',
    },
    {
      id: '6',
      url: 'https://static.wixstatic.com/media/e9d727_9ddd1fbce8c04f54a8ae54df6c169f95~mv2.png?originWidth=1920&originHeight=1024',
      alt: 'Portfolio work 6',
    },
  ];

  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images, ...images];
  const totalWidth = duplicatedImages.length * 100; // Each image is 100vw

  useEffect(() => {
    const animate = () => {
      // Auto-scroll speed (pixels per frame)
      const autoScrollSpeed = 0.5;
      baseScrollRef.current += autoScrollSpeed;

      // Calculate rubber band offset based on mouse position
      let rubberBandOffset = 0;
      if (isHovering && containerRef.current) {
        // Normalize mouse offset to -1 to 1 range
        const normalizedOffset = mouseOffset / (window.innerWidth / 2);
        // Use power curve for non-linear tension
        const tensionCurve = Math.pow(Math.abs(normalizedOffset), 1.5);
        rubberBandOffset = normalizedOffset * tensionCurve * 100; // Max 100px pull
      }

      // Combine base scroll with rubber band offset
      const totalOffset = baseScrollRef.current + rubberBandOffset;

      // Loop the scroll position
      const loopedPosition = totalOffset % totalWidth;
      setScrollPosition(loopedPosition);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovering, mouseOffset, totalWidth]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    const mouseX = e.clientX;

    // Calculate offset from center (-1 to 1)
    const offset = (mouseX - centerX) / (window.innerWidth / 2);
    setMouseOffset(offset * (window.innerWidth / 2));
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setMouseOffset(0);
  };

  return (
    <section
      ref={containerRef}
      className="relative w-screen h-[65vh] bg-[#0a0a0a] overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Carousel container */}
      <motion.div
        className="flex h-full"
        style={{
          x: -scrollPosition,
          gap: '8px',
        }}
      >
        {duplicatedImages.map((image, index) => (
          <div
            key={`${image.id}-${index}`}
            className="flex-shrink-0 w-screen h-full"
          >
            <Image
              src={image.url}
              alt={image.alt}
              width={1920}
              height={1080}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </motion.div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#2a2a2a]" />

      {/* View all work link */}
      <a
        href="/work"
        className="absolute bottom-6 right-8 font-montserrat text-sm tracking-widest text-white hover:opacity-70 transition-opacity duration-300"
      >
        VIEW ALL WORK
      </a>
    </section>
  );
};

export default RubberBandCarouselSection;
