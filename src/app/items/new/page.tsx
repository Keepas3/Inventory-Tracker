import { redirect } from "next/navigation";
import { createItem } from "@/app/actions";
import { getAccess } from "@/lib/auth";
import { ItemForm } from "@/components/item-form";
import { getFacets } from "@/lib/queries";

export const metadata = { title: "Add item — Stockpile" };
// Category/location suggestions come from the DB, so don't prerender at build time.
export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  if (!(await getAccess()).canWrite) redirect("/");
  const { categories, locations } = await getFacets();
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Add item</h1>
      <ItemForm action={createItem} categories={categories} locations={locations} />
    </main>
  );
}
