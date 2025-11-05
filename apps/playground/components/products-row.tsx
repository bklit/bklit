import { Card } from "@bklit/ui/components/card";
import { Link } from "react-router-dom";
import { products } from "../data/products";

export const ProductsRow = () => {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 pb-4 grid-cols-1 md:grid-cols-3">
      {products.map((product) => (
        <div key={product.id} className="md:col-span-1">
          <Link
            className="relative block aspect-square h-full w-full"
            to={`/products/${product.id}`}
          >
            <Card className="group flex h-full w-full items-center justify-center overflow-hidden">
              <img
                alt={product.alt}
                className="relative h-full w-full object-contain transition duration-300 ease-in-out group-hover:scale-105"
                src={product.image}
                style={{
                  position: "absolute",
                  height: "100%",
                  width: "100%",
                  inset: "0px",
                  color: "transparent",
                }}
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex w-max px-4 pb-4">
                <div className="flex items-center rounded-full border bg-white/70 p-1 text-xs font-semibold text-black backdrop-blur-md dark:border-neutral-800 dark:bg-black/70 dark:text-white">
                  <h3 className="mr-4 line-clamp-2 grow pl-4 leading-none tracking-tight">
                    {product.name}
                  </h3>
                  <p className="flex-none rounded-full bg-blue-600 p-2 text-white">
                    {product.price}
                    <span className="ml-1 hidden @[275px]/label:inline">
                      USD
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      ))}
    </section>
  );
};
