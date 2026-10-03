"use client";

import { Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { buttonClass, inputClass } from "./ui";

interface Props {
  categories: string[];
  locations: string[];
  q?: string;
  category?: string;
  location?: string;
  sort: string;
  filtered: boolean;
}

/** Search + filters that apply as you change them (client-side navigation via next/form). */
export function InventoryFilters({ categories, locations, q, category, location, sort, filtered }: Props) {
  const form = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const submit = () => form.current?.requestSubmit();

  return (
    <Form ref={form} action="/inventory" replace scroll={false} role="search" className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap">
      <div className="relative sm:col-span-2 lg:min-w-60 lg:flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search name or notes…"
          aria-label="Search items"
          onChange={() => {
            clearTimeout(timer.current);
            timer.current = setTimeout(submit, 350);
          }}
          className={`${inputClass} pl-9`}
        />
      </div>
      <select name="category" defaultValue={category ?? ""} aria-label="Category" onChange={submit} className={inputClass + " lg:w-auto"}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select name="location" defaultValue={location ?? ""} aria-label="Location" onChange={submit} className={inputClass + " lg:w-auto"}>
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
      <select name="sort" defaultValue={sort} aria-label="Sort by" onChange={submit} className={inputClass + " lg:w-auto"}>
        <option value="name">Sort: name</option>
        <option value="newest">Sort: newest</option>
        <option value="quantity">Sort: lowest quantity</option>
      </select>
      {filtered && (
        <Link href="/inventory" replace className={buttonClass("ghost")}>
          Clear filters
        </Link>
      )}
    </Form>
  );
}
