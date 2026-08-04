"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotFound() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <div className="container-page max-w-xl py-20 text-center">
      <div className="text-6xl font-extrabold tracking-tight text-gray-200">404</div>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
      </p>

      <form
        className="mt-6 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products"); }}
      >
        <input
          className="input flex-1"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn-primary" type="submit">Search</button>
      </form>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-secondary">Home</Link>
        <Link href="/products" className="btn-secondary">Shop all</Link>
        <Link href="/track" className="btn-secondary">Track order</Link>
        <Link href="/faq" className="btn-secondary">FAQ</Link>
      </div>
    </div>
  );
}
