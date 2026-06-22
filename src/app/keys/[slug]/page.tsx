import { redirect } from "next/navigation";

export default function LegacyKeysRedirect() {
  redirect("/products");
}
