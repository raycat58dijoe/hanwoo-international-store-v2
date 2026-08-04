"use client";

import { useState } from "react";
import Link from "next/link";

const FAQS: { cat: string; q: string; a: string }[] = [
  { cat: "Orders & Payment", q: "Which payment methods do you accept?", a: "We accept credit/debit cards via Stripe (instant confirmation) and Zelle bank transfers (manual confirmation, usually within a few hours). All payments are collected in USD." },
  { cat: "Orders & Payment", q: "When will my card be charged?", a: "With Stripe your card is charged immediately at checkout. With Zelle, you send the exact amount shown and we confirm the transfer within a few hours." },
  { cat: "Orders & Payment", q: "Why is my order still 'Pending' after paying with Zelle?", a: "Zelle transfers are confirmed manually. We match your transfer using the order ID you entered in the memo, usually within a few hours during business days. You can check status anytime on the My Orders page." },
  { cat: "Orders & Payment", q: "Can I change or cancel my order?", a: "If your order has not shipped yet, contact us as soon as possible and we will do our best to change or cancel it. Orders that have shipped can be returned within 30 days of delivery." },
  { cat: "Shipping & Delivery", q: "How much is shipping?", a: "Free international shipping on orders over US$80. Orders under US$80 are charged a flat rate of US$9.99. The fee is calculated automatically at checkout." },
  { cat: "Shipping & Delivery", q: "How long does delivery take?", a: "We process orders within 1–3 business days after payment confirmation. International delivery typically takes 7–21 business days depending on your country and customs processing." },
  { cat: "Shipping & Delivery", q: "How do I track my order?", a: "Once your order ships we send you a tracking number by email. You can also check the live status anytime on the My Orders page or the Track Order page using your order ID." },
  { cat: "Shipping & Delivery", q: "Do you ship power banks internationally?", a: "Due to airline regulations, orders containing power banks may be subject to special handling and longer delivery times. This is noted at checkout." },
  { cat: "Returns & Warranty", q: "What is your return policy?", a: "You can return eligible items within 30 days of delivery for a refund of the product price. Items must be unused and in original packaging. Return shipping is covered by the customer unless the item arrived defective or damaged." },
  { cat: "Returns & Warranty", q: "What warranty do your products carry?", a: "All products include a 2-year manufacturer's warranty covering defects in materials and workmanship. Contact us with your order ID to start a claim." },
  { cat: "Returns & Warranty", q: "When will I get my refund?", a: "Refunds are issued to the original payment method within 5–10 business days after approval. Zelle refunds are returned to the same bank account that made the transfer." },
  { cat: "Customs & Duties", q: "Will I have to pay customs or import taxes?", a: "International orders may be subject to import duties or taxes levied by the destination country. These are the responsibility of the recipient and are not included in the checkout total." },
  { cat: "Customs & Duties", q: "Why hasn't my package moved in customs?", a: "Customs clearance times vary by country and can occasionally take several days. If your package has been in customs for more than 2 weeks, contact us and we will investigate with the carrier." },
];

export default function FaqPage() {
  const [open, setOpen] = useState<string | null>(null);
  const cats = Array.from(new Set(FAQS.map((f) => f.cat)));

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="breadcrumb">
        <Link href="/">Home</Link> &nbsp;/&nbsp; <span>FAQ</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h1>
      <p className="mt-2 text-sm text-gray-500">
        Quick answers about orders, shipping, returns and more. Can&apos;t find what you need?{" "}
        <Link href="/contact" className="text-brand-accent hover:underline">Contact us</Link>.
      </p>

      <div className="mt-8 space-y-6">
        {cats.map((cat) => (
          <div key={cat}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">{cat}</h2>
            <div className="mt-2 space-y-2">
              {FAQS.filter((f) => f.cat === cat).map((f) => {
                const isOpen = open === f.q;
                return (
                  <div key={f.q} className="card overflow-hidden">
                    <button
                      className="flex w-full items-center justify-between gap-3 p-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50"
                      onClick={() => setOpen(isOpen ? null : f.q)}
                    >
                      <span>{f.q}</span>
                      <span className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}>▾</span>
                    </button>
                    {isOpen && <p className="border-t px-4 py-3 text-sm leading-relaxed text-gray-600">{f.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-10 flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-sm text-gray-600">Still have questions about your order?</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/account" className="btn-primary">My Orders</Link>
          <Link href="/contact" className="btn-secondary">Contact Us</Link>
        </div>
      </div>
    </div>
  );
}
