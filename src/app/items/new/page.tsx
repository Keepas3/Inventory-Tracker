import { redirect } from "next/navigation";
import { createItem } from "@/app/actions";
import { ItemForm } from "@/components/item-form";
import { Card } from "@/components/ui";
import { getAccess } from "@/lib/auth";
import { getFacets } from "@/lib/queries";

export const metadata = { title: "Add item" };
// Category/location suggestions come from the DB, so don't prerender at build time.
export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  if (!(await getAccess()).canWrite) redirect("/inventory");
  const { categories, locations } = await getFacets();
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Add item</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Track something new. You can scan a receipt instead to add several at once.</p>
      <Card className="p-5 sm:p-6">
        <ItemForm action={createItem} categories={categories} locations={locations} />
      </Card>
    </main>
  );
}
