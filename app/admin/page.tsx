"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import type { Product, Order, OrderStatus } from "@/lib/types";

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

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  failed: "Failed",
};
const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-purple-100 text-purple-700",
  failed: "bg-red-100 text-red-700",
};

export default function AdminPage() {
  const { t } = useI18n();
  const [key, setKey] = useState("");
  const [tab, setTab] = useState<"dashboard" | "products" | "orders">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [msg, setMsg] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [shipForm, setShipForm] = useState<Record<string, { tracking: string; url: string }>>({});
  const [noteForm, setNoteForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("adminKey") ?? "";
    setKey(saved);
    if (saved) { load(); loadOrders(); }
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

  useEffect(() => {
    if ((tab === "orders" || tab === "dashboard") && key) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, key]);

  async function saveKey() {
    localStorage.setItem("adminKey", key);
    load();
    loadOrders();
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
    const res = await fetch(`/api/products/${id}`, { method: "DELETE", headers: { "x-admin-key": key } });
    if (res.ok) load();
  }

  function startEdit(p?: Product) {
    if (!p) { setEditing({ ...emptyForm }); return; }
    setEditing({
      id: p.id, slug: p.slug, nameEn: p.name.en, nameZh: p.name.zh,
      price: String(p.priceUSD), category: p.category, inventory: String(p.inventory),
      image: p.images[0] ?? "", featured: p.featured,
    });
  }

  async function patchOrder(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(patch),
    });
    if (res.ok) loadOrders();
    return res.ok;
  }

  async function confirmPayment(id: string) {
    await patchOrder(id, { status: "paid" });
  }
  async function markShipped(id: string) {
    const f = shipForm[id] ?? { tracking: "", url: "" };
    const ok = await patchOrder(id, {
      status: "shipped",
      trackingNumber: f.tracking,
      trackingUrl: f.url,
    });
    if (ok) setShipForm((s) => ({ ...s, [id]: { tracking: "", url: "" } }));
  }
  async function markDelivered(id: string) {
    await patchOrder(id, { status: "delivered" });
  }
  async function saveNote(id: string) {
    const ok = await patchOrder(id, { note: noteForm[id] ?? "" });
    if (ok) setNoteForm((s) => ({ ...s, [id]: "" }));
  }

  // ---------- dashboard stats ----------
  const total = orders.length;
  const revenue = orders
    .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
    .reduce((s, o) => s + Number(o.amountUSD), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const awaitingShip = orders.filter((o) => o.status === "paid").length;
  const shipped = orders.filter((o) => o.status === "shipped").length;

  if (!key) {
    return (
      <div className="container-page max-w-md py-16">
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.title")}</h1>
        <p className="mt-2 text-sm text-gray-500">Enter your admin password to continue.</p>
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
          <button className="btn-primary" onClick={() => startEdit()}>{t("admin.new")}</button>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-b border-gray-200">
        {(["dashboard", "products", "orders"] as const).map((tb) => (
          <button
            key={tb}
            className={`px-4 py-2 text-sm font-medium ${tab === tb ? "border-b-2 border-brand-accent text-gray-900" : "text-gray-500"}`}
            onClick={() => setTab(tb)}
          >
            {tb === "dashboard" ? (t("admin.dashboard") ?? "Dashboard") : tb === "products" ? (t("admin.products") ?? "Products") : (t("admin.orders") ?? "Orders")}
          </button>
        ))}
      </div>

      {msg && <p className="mt-3 text-sm text-green-600">{msg}</p>}

      {/* ============ DASHBOARD ============ */}
      {tab === "dashboard" && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: t("admin.statTotal") ?? "Total Orders", value: total, cls: "text-gray-900" },
            { label: t("admin.statRevenue") ?? "Revenue", value: "$" + revenue.toFixed(2), cls: "text-green-700" },
            { label: t("admin.statPending") ?? "Pending", value: pending, cls: "text-amber-700" },
            { label: t("admin.statAwaitingShip") ?? "Awaiting Ship", value: awaitingShip, cls: "text-blue-700" },
          ].map((c) => (
            <div key={c.label} className="card p-4">
              <div className="text-xs uppercase tracking-wide text-gray-400">{c.label}</div>
              <div className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ============ PRODUCTS ============ */}
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

      {/* ============ ORDERS ============ */}
      {tab === "orders" && (
        <div className="mt-6 space-y-3">
          {orders.length === 0 && <p className="text-sm text-gray-400">No orders yet.</p>}
          {orders.map((o) => {
            const open = detailId === o.id;
            const sf = shipForm[o.id] ?? { tracking: "", url: "" };
            return (
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
                      <span className={`rounded px-2 py-0.5 ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                      {o.paymentMethod === "zelle" && o.zelleConfirmed && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">customer says paid</span>
                      )}
                      {o.trackingNumber && (
                        <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600 font-mono">📦 {o.trackingNumber}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">${Number(o.amountUSD).toFixed(2)}</div>
                    <button
                      className="mt-2 text-xs text-brand-accent hover:underline"
                      onClick={() => setDetailId(open ? null : o.id)}
                    >
                      {open ? (t("admin.collapse") ?? "Collapse") : (t("admin.details") ?? "Details")}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="mt-3 space-y-3 border-t pt-3 text-sm">
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase text-gray-400">Items</div>
                      {o.items?.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-gray-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {it.image && <img src={it.image} alt="" className="h-8 w-8 rounded object-cover" />}
                          <span>{it.name?.en} × {it.qty}</span>
                          <span className="text-gray-400">${Number(it.priceUSD).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase text-gray-400">Ship to</div>
                      <div className="text-gray-700">
                        {o.customer?.address}, {o.customer?.city}, {o.customer?.country} {o.customer?.zip}
                      </div>
                    </div>

                    {/* Fulfillment actions */}
                    <div className="flex flex-wrap gap-2">
                      {o.status === "pending" && (
                        <button className="btn-primary px-3 py-1.5 text-sm" onClick={() => confirmPayment(o.id)}>
                          {t("admin.confirmPayment") ?? "Confirm payment"}
                        </button>
                      )}
                      {o.status === "paid" && (
                        <button className="btn-primary px-3 py-1.5 text-sm" onClick={() => markShipped(o.id)}>
                          {t("admin.markShipped") ?? "Mark shipped"}
                        </button>
                      )}
                      {o.status === "shipped" && (
                        <button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => markDelivered(o.id)}>
                          {t("admin.markDelivered") ?? "Mark delivered"}
                        </button>
                      )}
                    </div>

                    {/* Shipping form (only when paid/pending-shipped) */}
                    {(o.status === "paid" || o.status === "shipped") && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          className="input"
                          placeholder={t("admin.trackingNumber") ?? "Tracking number"}
                          value={sf.tracking}
                          onChange={(e) => setShipForm((s) => ({ ...s, [o.id]: { ...sf, tracking: e.target.value } }))}
                        />
                        <input
                          className="input"
                          placeholder={t("admin.trackingUrl") ?? "Tracking URL (optional)"}
                          value={sf.url}
                          onChange={(e) => setShipForm((s) => ({ ...s, [o.id]: { ...sf, url: e.target.value } }))}
                        />
                      </div>
                    )}

                    {/* Note */}
                    <div className="flex gap-2">
                      <input
                        className="input flex-1"
                        placeholder={t("admin.note") ?? "Internal note"}
                        value={noteForm[o.id] ?? o.note ?? ""}
                        onChange={(e) => setNoteForm((s) => ({ ...s, [o.id]: e.target.value }))}
                      />
                      <button className="btn-secondary px-3 py-1.5 text-sm" onClick={() => saveNote(o.id)}>
                        {t("admin.saveNote") ?? "Save note"}
                      </button>
                    </div>
                    {o.shippedAt && (
                      <div className="text-xs text-gray-400">
                        {t("admin.shippedAt") ?? "Shipped at"}: {new Date(o.shippedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
