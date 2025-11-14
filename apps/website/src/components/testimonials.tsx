import { AnimatedTestimonials } from "@bklit/ui/components/animated-testimonials";

const testimonials = [
  {
    quote:
      "Bklit has given us the clarity we needed to understand our users. The real-time analytics and intuitive dashboard make data-driven decisions effortless.",
    name: "Danny Adams",
    designation: "Product Manager",
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "Switching to Bklit was the best decision for our team. Privacy-focused analytics without compromising on features - exactly what we needed.",
    name: "Sara Olsson",
    designation: "Senior Engineer",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "Bklit's lightweight tracking and beautiful insights have transformed how we monitor our product. Simple setup, powerful results.",
    name: "Jaime Cordero",
    designation: "Marketing Manager",
    src: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

export const Testimonials = () => {
  return (
    <div className="container mx-auto max-w-6xl px-4 mt-24">
      <AnimatedTestimonials testimonials={testimonials} />
    </div>
  );
};
