import { ImageField, KeyTextField } from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";

interface CarouselItemProps {
  image: ImageField;
  caption: KeyTextField;
}

const CarouselItem: React.FC<CarouselItemProps> = ({ image, caption }) => {
  return (
    <div className="flex flex-col items-center mx-4">
      <div className="w-36 h-36 rounded-md flex items-center justify-center aspect-square">
        <PrismicNextImage field={image} />
      </div>
      <p className="mt-2 text-center text-white text-sm">{caption}</p>
    </div>
  );
};

export default CarouselItem;
