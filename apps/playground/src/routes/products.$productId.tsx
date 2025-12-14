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
      <div className="flex flex-col min-h-screen gap-16">
        <Header />

        <div className="space-y-4">
          <section className="container mx-auto max-w-6xl px-4">
            <div className="flex gap-2 justify-between">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 group flex h-full w-full items-center justify-center overflow-hidden rounded-lg border bg-white hover:border-blue-600 dark:bg-black relative border-neutral-200 dark:border-border">
                <img src={product?.image} alt={product?.alt} />
              </div>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>
                    <h2 className="text-2xl font-bold">{product?.name}</h2>
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
                      <span className="px-2 py-1 text-sm bg-muted rounded-md text-brand-400 border border-brand-400/10">
                        data-attr
                      </span>
                      or
                      <span className="px-2 py-1 text-sm bg-muted rounded-md text-brand-400 border border-brand-400/10">
                        id
                      </span>
                    </li>
                  </ul>
                  <Separator orientation="horizontal" />
                  <p className="text-foreground text-2xl font-bold">
                    {product?.price}
                    <span className="ml-1 hidden @[275px]/label:inline">
                      USD
                    </span>
                  </p>
                  <Separator orientation="horizontal" />
                  <Button
                    data-bklit-event="add-to-cart"
                    variant="mono"
                    size="lg"
                    className="cursor-pointer"
                    onClick={handleAddToCart}
                  >
                    Add to Cart
                  </Button>
                  <div className="container mx-auto max-w-6xl px-4 flex flex-col space-y-3 items-center justify-center bg-blue-600/90 backdrop-blur-sm p-4 rounded-xl text-white">
                    <p className="text-base font-normal m-0">
                      Clicking &quot;Add to Cart&quot; will track an{" "}
                      <code className="text-sm text-blue-300 px-2 py-1 bg-background/30 rounded-md">
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
            <h3 className="text-xl font-semibold text-muted-foreground">
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
