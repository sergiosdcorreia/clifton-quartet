"use client";

import React, { useEffect, useRef, FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import CarouselItem from "@/components/CarouselItem";
import gsap from "gsap";

/**
 * Props for `Carousel`.
 */
export type CarouselProps = SliceComponentProps<Content.CarouselSlice>;

/**
 * Component for "Carousel" Slices.
 */
const Carousel: FC<CarouselProps> = ({ slice }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const items = slice.primary.repertoire_songs;

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const itemWidth = 182; // 150px width + 32px margins (16px on each side)
    const totalWidth = itemWidth * items.length;

    // Setup for continuous loop
    gsap.set(container, {
      width: totalWidth * 2, // Double width to accommodate clone
      x: 0,
    });

    // Clear existing animations if any
    gsap.killTweensOf(container);

    // Create infinite loop animation
    const tl = gsap.timeline({
      repeat: -1,
      onRepeat: () => {
        // Instantly jump back to start when the animation completes a cycle
        gsap.set(container, { x: 0 });
      },
    });

    // Animate the carousel to the left
    tl.to(container, {
      x: -totalWidth,
      duration: items.length * 2,
      ease: "linear",
    });

    return () => {
      // Clean up animation when component unmounts
      tl.kill();
    };
  }, [items.length]);

  // Double the items to create a seamless loop
  const allItems = [...items, ...items];

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div className="w-full overflow-hidden">
        <div
          className="flex items-start"
          ref={containerRef}
          style={{ willChange: "transform" }}
        >
          {allItems.map((item, index) => (
            <CarouselItem
              key={index}
              image={item.album_image}
              caption={item.song_artist_and_name}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Carousel;
