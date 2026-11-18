import type { ReactNode } from "react";
import { Profile } from "./screens/Profile";
import { ProductDetail, Products, Wishlist } from "./screens/Catalog";
import { Cart, Checkout, OfferForm, Offers, Pay } from "./screens/Buying";
import { Cases, OrderDetail, Orders, Reviews } from "./screens/Orders";
export function BuyerScreen({ route }: { route: string }) {
  const [, a, b, c] = route.split("/");
  if (a === "product") return <ProductDetail id={b} />;
  if (a === "offer" && b === "new") return <OfferForm pid={c} />;
  if (a === "order") return <OrderDetail id={b} />;
  if (a === "pay") return <Pay id={b} />;
  const m: Record<string, ReactNode> = {
    products: <Products />,
    wishlist: <Wishlist />,
    cart: <Cart />,
    checkout: <Checkout />,
    offers: <Offers />,
    orders: <Orders />,
    reviews: <Reviews />,
    cases: <Cases />,
    profile: <Profile />,
  };
  return <>{m[a] ?? <Products />}</>;
}
