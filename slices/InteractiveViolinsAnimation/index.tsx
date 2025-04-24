import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";
import { ViolinPhysics, InstrumentConfig } from "@/components/ViolinPhysics";

/**
 * Props for `InteractiveViolinsAnimation`.
 */
export type InteractiveViolinsAnimationProps =
  SliceComponentProps<Content.InteractiveViolinsAnimationSlice>;

/**
 * Component for "InteractiveViolinsAnimation" Slices.
 */
const InteractiveViolinsAnimation: FC<InteractiveViolinsAnimationProps> = ({
  slice,
}) => {
  const violinConfig: InstrumentConfig = {
    url: "/images/violin.png",
    width: 110,
    height: 320,
    quantity: 4,
    options: {
      restitution: 0.5, // Bouncy
      friction: 0.1, // Some friction
      density: 0.002, // Light
    },
  };

  const violinBowConfig: InstrumentConfig = {
    url: "/images/fiddlestick.png",
    width: 20,
    height: 280,
    quantity: 6,
    options: {
      restitution: 0.3, // Less bouncy
      friction: 0.05, // Slippery
      density: 0.001, // Very light
    },
  };

  const celloConfig: InstrumentConfig = {
    url: "/images/cello.png",
    width: 160,
    height: 490,
    quantity: 2,
    options: {
      restitution: 0.4, // Medium bounce
      friction: 0.15, // More friction
      density: 0.003, // Heavier
    },
  };

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <div className="relative h-[75vh] ~p-10/16">
        <PrismicNextImage
          field={slice.primary.background_image}
          alt=""
          fill
          className="object-cover"
          width={1200}
        />
        <ViolinPhysics
          violinConfig={violinConfig}
          violinBowConfig={violinBowConfig}
          celloConfig={celloConfig}
          className="absolute inset-0 pointer-events-auto" // pointer-events-auto to allow interaction
        />
      </div>
    </section>
  );
};

export default InteractiveViolinsAnimation;
