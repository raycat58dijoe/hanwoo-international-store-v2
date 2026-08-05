"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/I18nProvider";
import type { Product, Order, OrderStatus } from "@/lib/types";

interface FormState {
  id: string;
  slug: string;
  nameEn: string;
  nameZh: string;
  descEn: string;
  descZh: string;
  price: string;
  salePrice: string;
  sku: string;
  tags: string;
  category: string;
  inventory: string;
  images: string;
  featured: boolean;
  active: boolean;
}

const emptyForm: FormState = {
  id: "",
  slug: "",
  nameEn: "",
  nameZh: "",
  descEn: "",
  descZh: "",
  price: "",
  salePrice: "",
  sku: "",
  tags: "",
  category: "General",
  inventory: "0",
  images: "",
  featured: false,
  active: true,
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

const LOW_STOCK_THRESHOLD = 5;

export default function AdminPage() {
  const { t } = useI18n();
  const [key, setKey] = useState(() => typeof window !== "undefined" ? (localStorage.getItem("adminKey") ?? "") : "");
  const [tab, setTab] = useState<"dashboard" | "products" | "orders">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [msg, setMsg] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [shipForm, setShipForm] = useState<Record<string, { tracking: string; url: string }>>({});
  const [noteForm, setNoteForm] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden" | "low" | "out">("all");
  const [catFilter, setCatFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"updatedAt" | "name" | "price" | "inventory">("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (key) { load(); loadOrders(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function load() {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products ?? data ?? []);
    } catch (e) {
      console.error("[admin] load products failed", e);
    }
  }

  async function loadOrders() {
    try {
      const res = await fetch("/api/orders", { headers: { "x-admin-key": key } });
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (e) {
      console.error("[admin] load orders failed", e);
    }
  }

  useEffect(() => {
    if (!key) return;
    if (tab === "orders" || tab === "dashboard") {
      loadOrders();
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, key]);

  async function saveKey() {
    localStorage.setItem("adminKey", key);
    load();
    loadOrders();
  }

  // ---------- product operations ----------
  async function submit() {
    if (!editing) return;
    const body: Partial<Product> = {
      id: editing.id || `p_${Date.now().toString(36)}`,
      slug: editing.slug || editing.id || `p_${Date.now().toString(36)}`,
      name: { en: editing.nameEn, zh: editing.nameZh },
      description: { en: editing.descEn, zh: editing.descZh },
      priceUSD: Number(editing.price) || 0,
      salePriceUSD: editing.salePrice ? Number(editing.salePrice) : undefined,
      sku: editing.sku.trim() || undefined,
      tags: editing.tags.split(",").map((s) => s.trim()).filter(Boolean),
      category: editing.category || "General",
      inventory: Number(editing.inventory) || 0,
      images: editing.images.split(",").map((s) => s.trim()).filter(Boolean),
      featured: editing.featured,
      active: editing.active,
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
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE", headers: { "x-admin-key": key } });
    if (res.ok) load();
  }

  async function patchProduct(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(patch),
    });
    if (res.ok) load();
    return res.ok;
  }

  async function quickAdjust(id: string, delta: number) {
    await patchProduct(id, { inventoryDelta: delta });
  }

  async function toggleActive(p: Product) {
    await patchProduct(p.id, { active: !p.active });
  }

  function startEdit(p?: Product, clone = false) {
    if (!p) { setEditing({ ...emptyForm }); return; }
    setEditing({
      id: clone ? "" : p.id,
      slug: clone ? "" : p.slug,
      nameEn: p.name.en,
      nameZh: p.name.zh,
      descEn: p.description?.en ?? "",
      descZh: p.description?.zh ?? "",
      price: String(p.priceUSD),
      salePrice: p.salePriceUSD != null ? String(p.salePriceUSD) : "",
      sku: p.sku ?? "",
      tags: (p.tags ?? []).join(", "),
      category: p.category,
      inventory: String(p.inventory),
      images: p.images.join(", "),
      featured: p.featured,
      active: p.active,
    });
  }

  // ---------- order operations ----------
  async function patchOrder(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(patch),
    });
    if (res.ok) loadOrders();
    return res.ok;
  }

  async function confirmPayment(id: string) { await patchOrder(id, { status: "paid" }); }
  async function markShipped(id: string) {
    const f = shipForm[id] ?? { tracking: "", url: "" };
    const ok = await patchOrder(id, { status: "shipped", trackingNumber: f.tracking, trackingUrl: f.url });
    if (ok) setShipForm((s) => ({ ...s, [id]: { tracking: "", url: "" } }));
  }
  async function markDelivered(id: string) { await patchOrder(id, { status: "delivered" }); }
  async function saveNote(id: string) {
    const ok = await patchOrder(id, { note: noteForm[id] ?? "" });
    if (ok) setNoteForm((s) => ({ ...s, [id]: "" }));
  }
  async function removeOrder(id: string) {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    const res = await fetch(`/api/orders/${id}`, { method: "DELETE", headers: { "x-admin-key": key } });
    if (res.ok) { loadOrders(); setMsg("Order deleted."); }
    else setMsg("Delete failed: " + (await res.json()).error);
  }

  async function handleReturn(id: string, status: string) {
    const ok = await patchOrder(id, { returnStatus: status });
    if (ok) setMsg(`Return ${status}.`);
  }

  // ---------- dashboard stats ----------
  const totalOrders = orders.length;
  const revenue = orders
    .filter((o) => o.status === "paid" || o.status === "shipped" || o.status === "delivered")
    .reduce((s, o) => s + Number(o.amountUSD), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const awaitingShip = orders.filter((o) => o.status === "paid").length;

  const totalProducts = products.length;
  const onSale = products.filter((p) => p.active).length;
  const lowStockList = products.filter((p) => p.active && p.inventory > 0 && p.inventory <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.inventory - b.inventory);
  const outOfStock = products.filter((p) => p.active && p.inventory === 0).length;
  const hiddenCount = totalProducts - onSale;

  const topSellers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const it of o.items ?? []) {
        const e = map.get(it.productId) ?? { id: it.productId, name: it.name?.en ?? it.productId, qty: 0, revenue: 0 };
        e.qty += it.qty;
        e.revenue += it.priceUSD * it.qty;
        map.set(it.productId, e);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  // ---------- filter / sort pipeline ----------
  const q = search.trim().toLowerCase();
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);
  const effPrice = (p: Product) => p.salePriceUSD ?? p.priceUSD;

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: products.length, active: 0, hidden: 0, low: 0, out: 0 };
    for (const p of products) {
      if (p.active) { c.active++; if (p.inventory === 0) c.out++; else if (p.inventory <= LOW_STOCK_THRESHOLD) c.low++; }
      else c.hidden++;
    }
    return c;
  }, [products]);

  const shownProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "hidden" && p.active) return false;
      if (statusFilter === "low" && !(p.active && p.inventory > 0 && p.inventory <= LOW_STOCK_THRESHOLD)) return false;
      if (statusFilter === "out" && !(p.active && p.inventory === 0)) return false;
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (q && ![p.id, p.slug, p.name.en, p.name.zh, p.category, p.sku ?? ""].some((s) => s?.toLowerCase().includes(q))) return false;
      return true;
    });
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "name": return dir * (a.name.en.localeCompare(b.name.en));
        case "price": return dir * (effPrice(a) - effPrice(b));
        case "inventory": return dir * (a.inventory - b.inventory);
        default: return dir * ((a.updatedAt ?? "").localeCompare(b.updatedAt ?? ""));
      }
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, statusFilter, catFilter, q, sortKey, sortDir]);

  function toggleSort(key: "updatedAt" | "name" | "price" | "inventory") {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }
  const SortIcon = ({ k }: { k: "updatedAt" | "name" | "price" | "inventory" }) =>
    sortKey === k ? <span className="ml-0.5">{sortDir === "asc" ? "▲" : "▼"}</span> : <span className="ml-0.5 text-gray-300">↕</span>;

  // ---------- batch operations ----------
  const allShownSelected = shownProducts.length > 0 && shownProducts.every((p) => sel.has(p.id));
  function toggleSelectAll() {
    setSel(allShownSelected ? new Set() : new Set(shownProducts.map((p) => p.id)));
  }
  function toggleSelect(id: string) {
    const s = new Set(sel);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSel(s);
  }
  async function batchActive(active: boolean) {
    if (sel.size === 0) return;
    await Promise.all([...sel].map((id) => patchProduct(id, { active })));
    setSel(new Set()); setMsg(active ? "Products shown." : "Products hidden.");
  }
  async function batchAdjust(delta: number) {
    if (sel.size === 0) return;
    await Promise.all([...sel].map((id) => patchProduct(id, { inventoryDelta: delta })));
    setSel(new Set()); setMsg(`Stock ${delta > 0 ? "+" : ""}${delta} applied.`);
  }
  async function batchDelete() {
    if (sel.size === 0) return;
    if (!confirm(`Delete ${sel.size} products? This cannot be undone.`)) return;
    await Promise.all([...sel].map((id) => fetch(`/api/products/${id}`, { method: "DELETE", headers: { "x-admin-key": key } })));
    setSel(new Set()); setMsg("Deleted.");
  }

  // ---------- CSV export ----------
  function exportCSV() {
    const rows = [
      ["ID", "SKU", "Name (EN)", "Name (ZH)", "Price (USD)", "Sale Price (USD)", "Stock", "Category", "Tags", "Status", "Featured", "URL"],
      ...shownProducts.map((p) => [
        p.id, p.sku ?? "", p.name.en, p.name.zh, p.priceUSD, p.salePriceUSD ?? "", p.inventory,
        p.category, (p.tags ?? []).join(" | "), p.active ? "Active" : "Hidden", p.featured ? "Yes" : "No",
        "https://hanwoointernationalinc.net/products/" + p.slug,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function timeAgo(iso?: string): string {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(iso).toLocaleDateString();
  }

  // ---------- orders CSV export ----------
  function exportOrdersCSV() {
    const rows = [
      ["Order ID", "Date", "Customer", "Email", "Phone", "Items", "Subtotal (USD)", "Shipping (USD)", "Total (USD)", "Status", "Payment", "Tracking"],
      ...orders.map((o) => [
        o.id,
        new Date(o.createdAt).toISOString(),
        o.customer?.name ?? "",
        o.customer?.email ?? "",
        o.customer?.phone ?? "",
        (o.items ?? []).map((it) => `${it.name?.en ?? it.productId} x${it.qty}`).join(" | "),
        (Number(o.amountUSD) - Number(o.shippingUSD ?? 0)).toFixed(2),
        Number(o.shippingUSD ?? 0).toFixed(2),
        Number(o.amountUSD).toFixed(2),
        o.status,
        o.paymentMethod ?? "",
        o.trackingNumber ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function StockBadge({ p }: { p: Product }) {
    if (!p.active) return <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">{t("admin.hidden")}</span>;
    if (p.inventory === 0) return <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">{t("admin.outOfStock")}</span>;
    if (p.inventory <= LOW_STOCK_THRESHOLD) return <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{t("admin.lowStock")} {p.inventory}</span>;
    return <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">{t("admin.inStock")} {p.inventory}</span>;
  }

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
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: t("admin.statTotal") ?? "Total Orders", value: totalOrders, cls: "text-gray-900" },
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

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: t("admin.statProducts") ?? "Products", value: totalProducts, cls: "text-gray-900", hint: `${onSale} on sale` },
              { label: t("admin.statOnSale") ?? "On sale", value: onSale, cls: "text-green-700", hint: `${hiddenCount} hidden` },
              { label: t("admin.statLowStock") ?? "Low stock", value: lowStockList.length + outOfStock, cls: "text-amber-700", hint: `${outOfStock} out of stock` },
              { label: t("admin.statHidden") ?? "Hidden", value: hiddenCount, cls: "text-gray-500", hint: "" },
            ].map((c) => (
              <div key={c.label} className="card p-4">
                <div className="text-xs uppercase tracking-wide text-gray-400">{c.label}</div>
                <div className={`mt-1 text-2xl font-bold ${c.cls}`}>{c.value}</div>
                {c.hint && <div className="mt-0.5 text-xs text-gray-400">{c.hint}</div>}
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Low stock alert */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                ⚠️ {t("admin.lowStockAlert") ?? "Low stock alert"}
              </h3>
              {lowStockList.length + outOfStock === 0 ? (
                <p className="mt-2 text-sm text-gray-400">All good.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {lowStockList.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{p.name.en}</span>
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {p.inventory} left
                      </span>
                    </li>
                  ))}
                  {products.filter((p) => p.active && p.inventory === 0).map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{p.name.en}</span>
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                        {t("admin.outOfStock") ?? "Out of stock"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top sellers */}
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-900">
                🔥 {t("admin.topSellers") ?? "Top sellers"}
              </h3>
              {topSellers.length === 0 ? (
                <p className="mt-2 text-sm text-gray-400">No sales yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {topSellers.map((s, i) => (
                    <li key={s.id} className="flex items-center gap-3 text-sm">
                      <span className="w-5 text-center font-bold text-gray-400">{i + 1}</span>
                      <span className="flex-1 truncate text-gray-700">{s.name}</span>
                      <span className="text-xs text-gray-400">{s.qty} × ${s.revenue.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ PRODUCTS ============ */}
      {tab === "products" && editing && (
        <div className="card mt-4 space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder={t("admin.nameEn")} value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} />
            <input className="input" placeholder={t("admin.nameZh")} value={editing.nameZh} onChange={(e) => setEditing({ ...editing, nameZh: e.target.value })} />
            <input className="input" placeholder={t("admin.price")} value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} />
            <input className="input" placeholder={t("admin.salePrice")} value={editing.salePrice} onChange={(e) => setEditing({ ...editing, salePrice: e.target.value })} />
            <input className="input" placeholder={t("admin.sku")} value={editing.sku} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} />
            <input className="input" placeholder={t("admin.tags")} value={editing.tags} onChange={(e) => setEditing({ ...editing, tags: e.target.value })} />
            <input className="input" placeholder={t("admin.category")} value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
            <input className="input" placeholder={t("admin.inventory")} value={editing.inventory} onChange={(e) => setEditing({ ...editing, inventory: e.target.value })} />
            <input className="input col-span-2" placeholder={t("admin.images")} value={editing.images} onChange={(e) => setEditing({ ...editing, images: e.target.value })} />
            <textarea className="input col-span-2" rows={2} placeholder={t("admin.descriptionEn")} value={editing.descEn} onChange={(e) => setEditing({ ...editing, descEn: e.target.value })} />
            <textarea className="input col-span-2" rows={2} placeholder={t("admin.descriptionZh")} value={editing.descZh} onChange={(e) => setEditing({ ...editing, descZh: e.target.value })} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
              {t("admin.featured")}
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              {t("admin.active")}
            </label>
            {editing.images.split(",").map((s) => s.trim()).filter(Boolean).length > 0 && (
              <div className="flex gap-1">
                {editing.images.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 4).map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="h-10 w-10 rounded border border-gray-200 object-cover" />
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={submit}>{t("admin.save")}</button>
            <button className="btn-secondary" onClick={() => setEditing(null)}>{t("admin.cancel")}</button>
          </div>
        </div>
      )}

      {tab === "products" && (
        <div className="mt-4">
          {/* Toolbar: search + filters + export */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input w-full md:w-72"
              placeholder={t("admin.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input w-auto" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="all">{t("admin.allCategories") ?? "All categories"}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button className="btn-secondary px-3 py-2 text-sm" onClick={exportCSV}>
              ⬇ {t("admin.exportCSV") ?? "Export CSV"}
            </button>
            <span className="ml-auto text-sm text-gray-400">{shownProducts.length} / {products.length}</span>
          </div>

          {/* Status filter tabs */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {([
              ["all", t("admin.statusAll") ?? "All", "text-gray-700"],
              ["active", t("admin.statusActive") ?? "Active", "text-green-700"],
              ["low", t("admin.statusLow") ?? "Low stock", "text-amber-700"],
              ["out", t("admin.statusOut") ?? "Out of stock", "text-red-600"],
              ["hidden", t("admin.statusHidden") ?? "Hidden", "text-gray-500"],
            ] as const).map(([k, label, cls]) => (
              <button
                key={k}
                onClick={() => setStatusFilter(k)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${statusFilter === k ? "bg-gray-900 text-white" : `bg-white border border-gray-200 ${cls} hover:bg-gray-50`}`}
              >
                {label} <span className="opacity-60">{statusCounts[k]}</span>
              </button>
            ))}
          </div>

          {/* Batch action bar */}
          {sel.size > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-accent/40 bg-brand-accent/5 px-3 py-2">
              <span className="text-sm font-medium text-gray-900">{sel.size} selected</span>
              <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => batchActive(true)}>{t("admin.batchShow") ?? "Show"}</button>
              <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => batchActive(false)}>{t("admin.batchHide") ?? "Hide"}</button>
              <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => batchAdjust(10)}>{t("admin.batchAddStock") ?? "+10 stock"}</button>
              <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => batchAdjust(-10)}>{t("admin.batchSubStock") ?? "-10 stock"}</button>
              <button className="px-2.5 py-1 text-xs font-medium text-red-600 hover:underline" onClick={() => batchDelete()}>
                {t("admin.batchDelete") ?? "Delete"}
              </button>
              <button className="ml-auto text-xs text-gray-400 hover:underline" onClick={() => setSel(new Set())}>
                {t("admin.clearSelection") ?? "Clear"}
              </button>
            </div>
          )}

          {/* Table */}
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="w-8 px-3 py-2.5">
                    <input type="checkbox" checked={allShownSelected} onChange={toggleSelectAll} />
                  </th>
                  <th className="cursor-pointer select-none px-3 py-2.5" onClick={() => toggleSort("name")}>
                    {t("admin.colProduct") ?? "Product"} <SortIcon k="name" />
                  </th>
                  <th className="px-3 py-2.5">{t("admin.colStatus") ?? "Status"}</th>
                  <th className="cursor-pointer select-none px-3 py-2.5" onClick={() => toggleSort("price")}>
                    {t("admin.colPrice") ?? "Price"} <SortIcon k="price" />
                  </th>
                  <th className="cursor-pointer select-none px-3 py-2.5" onClick={() => toggleSort("inventory")}>
                    {t("admin.colStock") ?? "Stock"} <SortIcon k="inventory" />
                  </th>
                  <th className="px-3 py-2.5">{t("admin.category")}</th>
                  <th className="cursor-pointer select-none px-3 py-2.5" onClick={() => toggleSort("updatedAt")}>
                    {t("admin.colUpdated") ?? "Updated"} <SortIcon k="updatedAt" />
                  </th>
                  <th className="px-3 py-2.5 text-right">{t("admin.colActions") ?? "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shownProducts.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No products.</td></tr>
                )}
                {shownProducts.map((p) => {
                  const onSale = p.salePriceUSD != null && p.salePriceUSD < p.priceUSD;
                  return (
                    <tr key={p.id} className={sel.has(p.id) ? "bg-brand-accent/5" : "hover:bg-gray-50"}>
                      <td className="px-3 py-2.5">
                        <input type="checkbox" checked={sel.has(p.id)} onChange={() => toggleSelect(p.id)} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.images[0]} alt="" className="h-11 w-11 rounded object-cover" />
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900">{p.name.en}</div>
                            <div className="truncate text-xs text-gray-400">
                              {p.sku ? <span className="font-mono">{p.sku}</span> : null}
                              {p.sku ? " · " : ""}{p.name.zh}
                            </div>
                            {(p.tags ?? []).length > 0 && (
                              <div className="mt-0.5 flex flex-wrap gap-1">
                                {p.tags!.slice(0, 3).map((tg) => (
                                  <span key={tg} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">#{tg}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col items-start gap-1">
                          <StockBadge p={p} />
                          <button
                            onClick={() => toggleActive(p)}
                            className="text-[11px] text-gray-400 hover:text-gray-700 hover:underline"
                          >
                            {p.active ? (t("admin.hide") ?? "Hide") : (t("admin.show") ?? "Show")}
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-gray-900">${effPrice(p).toFixed(2)}</span>
                        {onSale && <span className="ml-1 text-xs text-gray-400 line-through">${p.priceUSD.toFixed(2)}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          <span className="w-8 text-right font-medium text-gray-700">{p.inventory}</span>
                          <div className="flex gap-0.5">
                            {[-1, 1].map((d) => (
                              <button
                                key={d}
                                onClick={() => quickAdjust(p.id, d)}
                                className={`h-6 w-6 rounded text-xs font-bold ${d < 0 ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
                                title={`${d > 0 ? "+" : ""}${d}`}
                              >{d > 0 ? "+" : ""}{d}</button>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{p.category}</td>
                      <td className="px-3 py-2.5 text-xs text-gray-400" title={p.updatedAt}>{timeAgo(p.updatedAt)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-2 text-xs">
                          <a className="text-gray-500 hover:text-brand-accent" title="View" target="_blank" rel="noreferrer" href={`/products/${p.slug}`}>👁</a>
                          <button className="text-gray-500 hover:text-gray-900" title={t("admin.duplicate")} onClick={() => startEdit(p, true)}>⧉</button>
                          <button className="text-gray-500 hover:text-gray-900" title={t("admin.edit")} onClick={() => startEdit(p)}>✏️</button>
                          <button className="text-red-500 hover:text-red-700" title={t("admin.delete")} onClick={() => remove(p.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============ ORDERS ============ */}
      {tab === "orders" && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-gray-400">{orders.length} orders</span>
            {orders.length > 0 && (
              <button className="btn-secondary px-3 py-2 text-sm" onClick={exportOrdersCSV}>
                ⬇ {t("admin.exportCSV") ?? "Export CSV"}
              </button>
            )}
          </div>
          <div className="space-y-3">
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
                    <button
                      className="mt-1 block text-xs text-red-500 hover:underline"
                      onClick={() => removeOrder(o.id)}
                    >
                      {t("admin.deleteOrder") ?? "Delete order"}
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
                      {o.shippingUSD != null && (
                        <div className="mt-1 flex justify-between text-xs text-gray-500">
                          <span>Shipping</span>
                          <span>{o.shippingUSD === 0 ? "Free" : `$${Number(o.shippingUSD).toFixed(2)}`}</span>
                        </div>
                      )}
                      <div className="mt-1 flex justify-between font-semibold text-gray-900">
                        <span>Total</span>
                        <span>${Number(o.amountUSD).toFixed(2)}</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase text-gray-400">Ship to</div>
                      <div className="text-gray-700">
                        {o.customer?.name} · {o.customer?.phone && <span className="text-gray-500">{o.customer.phone} · </span>}
                        {o.customer?.address}, {o.customer?.city}
                        {o.customer?.state ? `, ${o.customer.state}` : ""}, {o.customer?.country} {o.customer?.zip}
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

                    {/* After-sales handling */}
                    {o.returnRequested && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase text-orange-700">Return / after-sales</span>
                          <span className="text-xs text-orange-600">
                            {o.returnStatus === "requested" ? "Pending" : o.returnStatus === "approved" ? "Approved" : o.returnStatus === "rejected" ? "Declined" : o.returnStatus === "refunded" ? "Refunded" : ""}
                          </span>
                        </div>
                        {o.returnReason && <p className="mt-1 text-xs text-orange-800">{o.returnReason}</p>}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(o.returnStatus === "requested" || o.returnStatus === "none") && (
                            <>
                              <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => handleReturn(o.id, "approved")}>Approve</button>
                              <button className="btn-secondary px-2.5 py-1 text-xs" onClick={() => handleReturn(o.id, "rejected")}>Decline</button>
                            </>
                          )}
                          {o.returnStatus === "approved" && (
                            <button className="btn-primary px-2.5 py-1 text-xs" onClick={() => handleReturn(o.id, "refunded")}>Mark refunded</button>
                          )}
                        </div>
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
        </div>
      )}
    </div>
  );
}
