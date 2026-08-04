"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import type { Product } from "@/lib/types";

interface FormState {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  price: string;
  category: string;
  inventory: string;
  image: string;
  featured: boolean;
}

const emptyForm: FormState = {
  id: "",
  slug: "",
  nameEn: "",
  nameZh: "",
  price: "",
  category: "",
  inventory: "0",
  image: "",
  featured: false,
};

export default function AdminPage() {
  const { t } = useI18n();
  const [key, setKey] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("adminKey") ?? "";
    setKey(saved);
    if (saved) load();
  }, []);

  async function load() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  async function saveKey() {
    localStorage.setItem("adminKey", key);
    load();
  }

  async function submit() {
    if (!editing) return;
    const body: Partial<Product> = {
      id: editing.id || `p_${Date.now().toString(36)}`,
      slug: editing.slug || editing.id || `p_${Date.now().toString(36)}`,
      name: { en: editing.nameEn, zh: editing.nameZh },
      description: { en: "", zh: "" },
      priceUSD: Number(editing.price) || 0,
      category: editing.category || "General",
      inventory: Number(editing.inventory) || 0,
      images: editing.image ? [editing.image] : [],
      featured: editing.featured,
    };
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setMsg("Saved.");
      setEditing(null);
      load();
    } else {
      setMsg("Error: " + (await res.json()).error);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: { "x-admin-key": key },
    });
    if (res.ok) load();
  }

  function startEdit(p?: Product) {
    if (!p) {
      setEditing({ ...emptyForm });
      return;
    }
    setEditing({
      id: p.id,
      slug: p.slug,
      nameEn: p.name.en,
      nameZh: p.name.zh,
      price: String(p.priceUSD),
      category: p.category,
      inventory: String(p.inventory),
      image: p.images[0] ?? "",
      featured: p.featured,
    });
  }

  if (!key) {
    return (
      <div className="container-page max-w-md py-16">
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.title")}</h1>
        <p className="mt-2 text-sm text-gray-500">Default key: admin123</p>
        <input
          className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2"
          placeholder={t("admin.login")}
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />
        <button className="btn-primary mt-4 w-full" onClick={saveKey}>
          {t("admin.login")}
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.title")}</h1>
        <button className="btn-primary" onClick={() => startEdit()}>
          {t("admin.new")}
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-green-600">{msg}</p>}

      {editing && (
        <div className="card mt-4 space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder={t("admin.nameEn")} value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} />
            <input className="input" placeholder={t("admin.nameZh")} value={editing.nameZh} onChange={(e) => setEditing({ ...editing, nameZh: e.target.value })} />
            <input className="input" placeholder={t("admin.price")} value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
            <input className="input" placeholder={t("admin.category")} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            <input className="input" placeholder={t("admin.inventory")} value={editing.inventory} onChange={(e) => setEditing({ ...editing, inventory: e.target.value })} />
            <input className="input" placeholder={t("admin.image")} value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
            {t("admin.featured")}
          </label>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={submit}>{t("admin.save")}</button>
            <button className="btn-secondary" onClick={() => setEditing(null)}>{t("admin.cancel")}</button>
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {products.map((p) => (
          <div key={p.id} className="card flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images[0]} alt="" className="h-12 w-12 rounded object-cover" />
              <div>
                <div className="font-medium text-gray-900">{p.name.en}</div>
                <div className="text-xs text-gray-400">${p.priceUSD} · stock {p.inventory}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={() => startEdit(p)}>{t("admin.edit")}</button>
              <button className="text-sm text-red-500 hover:underline" onClick={() => remove(p.id)}>{t("admin.delete")}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
