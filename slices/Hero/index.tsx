import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `Hero`.
 */
export type HeroProps = SliceComponentProps<Content.HeroSlice>;

/**
 * Component for "Hero" Slices.
 */
const Hero: FC<HeroProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="h-[100vh]"
    >
      <div
        className="relative h-full w-full bg-cover bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${slice.primary.background_image.url})`,
        }}
      ></div>
      <div className="absolute bottom-8 left-8 text-7xl lg:text-8xl xl:text-9xl select-none">
        {slice.primary.title}
      </div>
    </section>
  );
};

export default Hero;
