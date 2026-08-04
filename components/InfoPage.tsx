import Link from "next/link";
import { ReactNode } from "react";

export function InfoPage({ title, updated, children }: { title: string; updated?: string; children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-10">
      <div className="breadcrumb">
        <Link href="/">Home</Link> &nbsp;/&nbsp; <span>{title}</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {updated && <p className="mt-1 text-xs text-gray-400">Last updated: {updated}</p>}
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-700">{children}</div>
    </div>
  );
}
