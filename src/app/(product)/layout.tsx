import type { ReactNode } from "react";
import { ProductFrame } from "@/components/layout/product-frame";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { requireUser } from "@/server/auth";

type ProductLayoutProps = {
  children: ReactNode;
};

export default async function ProductLayout(props: ProductLayoutProps) {
  const children = props.children;

  await requireUser();

  return <ProductFrame topNav={<ProductTopNav />}>{children}</ProductFrame>;
}
