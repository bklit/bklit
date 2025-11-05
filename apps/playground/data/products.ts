interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  alt: string;
}

export const products: Product[] = [
  {
    id: "product-1",
    name: "Awesome Vercel T-shirt",
    description:
      "This Awesome Vercel T-shirt is made with 100% cotton and is very comfortable to wear.",
    price: "$20.00",
    image: "/t-shirt-1.avif",
    alt: "Awesome Vercel Tshirt",
  },
  {
    id: "product-2",
    name: "Bklit Playground T-shirt",
    description:
      "The new Bklit Playground T-shity is new for 2026, it's a great way to show your support for the Bklit platform.",
    price: "$18.00",
    image: "/t-shirt-1.avif",
    alt: "Bklit Playground T-shirt",
  },
  {
    id: "product-3",
    name: "Vite T-shirt",
    description: "Limited edition Vite T-shirt, only 100 made!",
    price: "$18.50",
    image: "/t-shirt-1.avif",
    alt: "Vite T-shrit",
  },
];
