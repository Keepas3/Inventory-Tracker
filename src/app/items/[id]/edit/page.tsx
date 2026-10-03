import { notFound } from "next/navigation";
import { updateItem } from "@/app/actions";
import { ItemForm } from "@/components/item-form";
import { getFacets, getItem } from "@/lib/queries";

export const metadata = { title: "Edit item — Stockpile" };

export default async function EditItemPage({ params }: PageProps<"/items/[id]/edit">) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [item, { categories, locations }] = await Promise.all([getItem(numericId), getFacets()]);
  if (!item) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Edit item</h1>
      <ItemForm action={updateItem.bind(null, item.id)} item={item} categories={categories} locations={locations} />
    </main>
  );
}
