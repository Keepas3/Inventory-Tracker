import { notFound, redirect } from "next/navigation";
import { updateItem } from "@/app/actions";
import { ItemForm } from "@/components/item-form";
import { Card } from "@/components/ui";
import { getAccess } from "@/lib/auth";
import { getFacets, getItem } from "@/lib/queries";

export const metadata = { title: "Edit item" };

export default async function EditItemPage({ params }: PageProps<"/items/[id]/edit">) {
  if (!(await getAccess()).canWrite) redirect("/inventory");
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) notFound();

  const [item, { categories, locations }] = await Promise.all([getItem(numericId), getFacets()]);
  if (!item) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Edit item</h1>
      <p className="mb-6 mt-1 text-sm text-muted">{item.name}</p>
      <Card className="p-5 sm:p-6">
        <ItemForm action={updateItem.bind(null, item.id)} item={item} categories={categories} locations={locations} />
      </Card>
    </main>
  );
}
