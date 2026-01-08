import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@bklit/ui/components/breadcrumb";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Separator } from "@bklit/ui/components/separator";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Footer } from "../../components/footer";
import { Header } from "../../components/header";
import { ProductsRow } from "../../components/products-row";
import { products } from "../../data/products";

export default function ProductDetails() {
  const { productId } = useParams();
  const product = products.find((product) => product.id === productId);

  const handleAddToCart = () => {
    toast.success("Product added to cart", {
      description: "Event tracked: add-to-cart",
    });
  };
  return (
    <>
      <title>{`Product ${productId}`}</title>
      <div className="flex min-h-screen flex-col gap-16">
        <Header />

        <div className="space-y-4">
          <section className="container mx-auto max-w-6xl px-4">
            <div className="flex justify-between gap-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/">Home</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/products">Products</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{product?.name}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </section>
          <section className="container mx-auto max-w-6xl px-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="group relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border border-neutral-200 bg-white hover:border-blue-600 md:col-span-2 dark:border-border dark:bg-black">
                <img alt={product?.alt} src={product?.image} />
              </div>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    <h2 className="font-bold text-2xl">{product?.name}</h2>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">
                    {product?.description}
                  </p>
                  <p className="text-muted-foreground">
                    This is a playground store for the Bklit analytics platform.
                    Try creating an <code>Event</code> in your dashboard with:
                  </p>
                  <ul className="text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="rounded-md border border-brand-400/10 bg-muted px-2 py-1 text-brand-400 text-sm">
                        data-attr
                      </span>
                      or
                      <span className="rounded-md border border-brand-400/10 bg-muted px-2 py-1 text-brand-400 text-sm">
                        id
                      </span>
                    </li>
                  </ul>
                  <Separator orientation="horizontal" />
                  <p className="font-bold text-2xl text-foreground">
                    {product?.price}
                    <span className="ml-1 @[275px]/label:inline hidden">
                      USD
                    </span>
                  </p>
                  <Separator orientation="horizontal" />
                  <Button
                    className="cursor-pointer"
                    data-bklit-event="add-to-cart"
                    onClick={handleAddToCart}
                    size="lg"
                    variant="mono"
                  >
                    Add to Cart
                  </Button>
                  <div className="container mx-auto flex max-w-6xl flex-col items-center justify-center space-y-3 rounded-xl bg-blue-600/90 p-4 px-4 text-white backdrop-blur-sm">
                    <p className="m-0 font-normal text-base">
                      Clicking &quot;Add to Cart&quot; will track an{" "}
                      <code className="rounded-md bg-background/30 px-2 py-1 text-blue-300 text-sm">
                        add-to-cart
                      </code>{" "}
                      event in the Bklit Playground dashboard.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <section className="container mx-auto max-w-6xl px-4">
            <h3 className="font-semibold text-muted-foreground text-xl">
              You may also like
            </h3>
          </section>
          <ProductsRow />
        </div>

        <div className="container mx-auto max-w-6xl">
          <Footer />
        </div>
      </div>
    </>
  );
}
