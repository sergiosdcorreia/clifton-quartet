import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import ContactForm from "@/components/contactForm";

/**
 * Props for `Contact`.
 */
export type ContactProps = SliceComponentProps<Content.ContactSlice>;

/**
 * Component for "Contact" Slices.
 */
const Contact: FC<ContactProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
    >
      <main className="container mx-auto py-12 px-4 min-h-100vh">
        <h1 className="text-3xl font-bold text-center mb-8">Contacte-nos</h1>
        <ContactForm />
      </main>
    </section>
  );
};

export default Contact;
