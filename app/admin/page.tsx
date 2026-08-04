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
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [msg, setMsg] = useState("");
  const [orders, setOrders] = useState<any[]>([]);

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

  async function loadOrders() {
    const res = await fetch("/api/orders", { headers: { "x-admin-key": key } });
    const data = await res.json();
    setOrders(data.orders ?? []);
  }

  // Load orders when switching to the orders tab
  useEffect(() => {
    if (tab === "orders" && key) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, key]);

  async function confirmOrder(id: string) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ status: "paid" }),
    });
    if (res.ok) loadOrders();
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
        {tab === "products" && (
          <button className="btn-primary" onClick={() => startEdit()}>
            {t("admin.new")}
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === "products" ? "border-b-2 border-brand-accent text-gray-900" : "text-gray-500"}`}
          onClick={() => setTab("products")}
        >
          {t("admin.products") ?? "Products"}
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${tab === "orders" ? "border-b-2 border-brand-accent text-gray-900" : "text-gray-500"}`}
          onClick={() => setTab("orders")}
        >
          {t("admin.orders") ?? "Orders"}
        </button>
      </div>

      {msg && <p className="mt-3 text-sm text-green-600">{msg}</p>}

      {tab === "products" && editing && (
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

      {tab === "products" && (
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
      )}

      {tab === "orders" && (
        <div className="mt-6 space-y-3">
          {orders.length === 0 && <p className="text-sm text-gray-400">No orders yet.</p>}
          {orders.map((o: any) => (
            <div key={o.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-mono text-sm text-gray-900">{o.id}</div>
                  <div className="mt-1 text-xs text-gray-400">
                    {o.customer?.name} · {o.customer?.email} · {new Date(o.createdAt).toLocaleString()}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
                      {o.paymentMethod === "zelle" ? "Zelle" : "Stripe"}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 ${
                        o.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {o.status}
                    </span>
                    {o.paymentMethod === "zelle" && o.zelleConfirmed && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">customer says paid</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${Number(o.amountUSD).toFixed(2)}</div>
                  {o.status !== "paid" && (
                    <button
                      className="btn-primary mt-2 px-3 py-1.5 text-sm"
                      onClick={() => confirmOrder(o.id)}
                    >
                      {t("admin.confirmPayment") ?? "Confirm payment"}
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3 border-t pt-3 text-xs text-gray-500">
                {o.items?.map((it: any, i: number) => (
                  <span key={i} className="mr-3">
                    {it.name?.en} × {it.qty}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
