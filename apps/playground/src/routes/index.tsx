import { Button } from "@bklit/ui/components/button";
import { Link } from "react-router-dom";
import { Footer } from "../../components/footer";
import { Header } from "../../components/header";

export default function Home() {
  return (
    <>
      <title>Playground Home | Bklit</title>
      <div className="flex min-h-screen flex-col gap-16">
        <div className="flex flex-col gap-4">
          <Header />

          <div className="container mx-auto max-w-6xl px-4">
            <a
              className="container mx-auto flex max-w-6xl flex-col items-center justify-center space-y-3 rounded-xl bg-blue-600/90 p-4 px-4 text-white backdrop-blur-sm transition-all duration-300 hover:ring-4 hover:ring-blue-600/40"
              href="https://app.bklit.com/?utm_source=playground&utm_medium=referral&utm_campaign=playground"
            >
              <p className="m-0 font-semibold text-base">
                This store is used solely for collecting analytics for the Bklit
                demo project (Bklit Playground).
              </p>
              <p className="m-0 text-blue-200 text-sm">
                You can view the analytics by signing up for a free Bklit
                account.
              </p>
            </a>
          </div>
        </div>

        <section className="container mx-auto max-w-6xl px-4">
          <div className="grid aspect-square grid-cols-1 grid-rows-1">
            <div className="col-start-1 row-start-1 flex items-center justify-center">
              <img
                alt="Mountain biker by @jakecolling - Unsplash"
                className="h-full w-full rounded-4xl object-cover contrast-125 grayscale filter"
                src="https://images.unsplash.com/photo-1555422643-328573422dc6?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2223"
              />
            </div>
            <div className="relative col-start-1 row-start-1 flex items-center justify-center">
              <div className="relative flex flex-col items-center justify-center gap-6 bg-background/50 p-8 backdrop-blur-3xl">
                <h1 className="text-center font-thin text-xl sm:text-4xl">
                  Welcome to the Bklit Playground Store
                </h1>
                <Button asChild size="lg" variant="mono">
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
