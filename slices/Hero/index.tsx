import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";

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
      className="p-10"
    >
      <div className="text-4xl font-bold mb-6">
        <PrismicRichText field={slice.primary.title} />
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex flex-col gap-4 lg:w-1/2">
          <PrismicRichText field={slice.primary.paragraph1} />
          <PrismicRichText field={slice.primary.paragraph2} />
          <PrismicRichText field={slice.primary.paragraph3} />
          <PrismicRichText field={slice.primary.paragraph4} />
          <PrismicRichText field={slice.primary.paragraph5} />
          <PrismicRichText field={slice.primary.paragraph6} />
        </div>
        <div className="w-full lg:w-1/2">
          <PrismicNextImage field={slice.primary.image} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
