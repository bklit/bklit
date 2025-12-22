import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@bklit/ui/components/breadcrumb";
import { Button } from "@bklit/ui/components/button";
import { ArrowDownAZIcon, FilterIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Footer } from "../../components/footer";
import { Header } from "../../components/header";
import { ProductsRow } from "../../components/products-row";

export default function Products() {
  return (
    <>
      <title>Playground Products | Bklit</title>
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
                    <BreadcrumbPage>Products</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex gap-2">
                <Button
                  className="cursor-pointer"
                  disabled
                  size="lg"
                  variant="secondary"
                >
                  <FilterIcon className="h-4 w-4" /> Filters
                </Button>
                <Button
                  className="cursor-pointer"
                  disabled
                  size="lg"
                  variant="secondary"
                >
                  <ArrowDownAZIcon className="h-4 w-4" /> Sort
                </Button>
              </div>
            </div>
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
