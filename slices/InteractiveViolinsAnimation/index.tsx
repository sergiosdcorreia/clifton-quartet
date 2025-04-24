import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

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
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      Placeholder component for interactive_violins_animation (variation:{" "}
      {slice.variation}) Slices
    </section>
  );
};

export default InteractiveViolinsAnimation;
