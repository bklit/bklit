import { Button } from "@bklit/ui/components/button";
import { Link } from "react-router-dom";
import { Footer } from "../../components/footer";
import { Header } from "../../components/header";

export default function Home() {
  return (
    <>
      <title>Playground Home | Bklit</title>
      <div className="flex flex-col min-h-screen gap-16">
        <Header />

        <section className="container mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 grid-rows-1 aspect-square">
            <div className="col-start-1 row-start-1 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1555422643-328573422dc6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2223"
                alt="Mountain biker by @jakecolling - Unsplash"
                className="object-cover w-full h-full filter grayscale contrast-125"
              />
            </div>
            <div className="col-start-1 row-start-1 flex items-center justify-center">
              <div className="flex items-center justify-center flex-col gap-6 bg-background/50 relative backdrop-blur-3xl p-8">
                <h1 className="text-4xl font-thin">
                  Welcome to the Bklit Playground Store
                </h1>
                <Button variant="mono" size="lg" asChild>
                  <Link to="/products">View Products</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-6xl">
          <Footer />
        </div>
      </div>
    </>
  );
}
