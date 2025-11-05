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
                    <BreadcrumbPage>Products</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex gap-2">
                <Button
                  disabled
                  variant="default"
                  size="lg"
                  className="cursor-pointer"
                >
                  <FilterIcon className="w-4 h-4" /> Filters
                </Button>
                <Button
                  disabled
                  variant="default"
                  size="lg"
                  className="cursor-pointer"
                >
                  <ArrowDownAZIcon className="w-4 h-4" /> Sort
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
