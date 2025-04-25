"use client";

import { FC, useEffect, useRef } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import gsap from "gsap";

/**
 * Props for `Hero`.
 */
export type HeroProps = SliceComponentProps<Content.HeroSlice>;

/**
 * Component for "Hero" Slices.
 */
const Hero: FC<HeroProps> = ({ slice }) => {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      backgroundRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 2 }
    );

    tl.fromTo(
      titleRef.current,
      {
        y: 50,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 2.5,
      },
      "-=0.8"
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="h-dvh overflow-hidden relative"
    >
      <div
        ref={backgroundRef}
        className="relative h-full w-full bg-cover bg-no-repeat bg-center opacity-0"
        style={{
          backgroundImage: `url(${slice.primary.background_image.url})`,
        }}
      ></div>
      <div
        ref={titleRef}
        className="absolute title-mobile bottom-8 left-8 text-8xl xl:text-9xl select-none"
        style={{
          opacity: 0,
        }}
      >
        {slice.primary.title}
      </div>
    </section>
  );
};

export default Hero;
