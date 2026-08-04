import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Contact Us — Hanwoo International Inc." };

export default function ContactPage() {
  return (
    <InfoPage title="Contact Us">
      <p>
        We usually reply within 1 business day. Please include your order ID (e.g. <code>ord_…</code>)
        if your question is about an existing order.
      </p>
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="font-semibold text-gray-900">Hanwoo International Inc.</div>
        <p className="mt-1 text-gray-600">
          Email: <a className="text-blue-600 underline" href="mailto:support@hanwoointernationalinc.net">support@hanwoointernationalinc.net</a>
        </p>
        <p className="mt-1 text-gray-600">Business hours: Mon–Fri, 9:00–18:00 (EST)</p>
      </div>
      <h2 className="pt-2 font-semibold text-gray-900">Common questions</h2>
      <ul className="list-disc pl-5">
        <li><b>Where is my order?</b> — Use the <a className="text-blue-600 underline" href="/track">track order</a> page with your order ID.</li>
        <li><b>Shipping times & fees?</b> — See our <a className="text-blue-600 underline" href="/shipping">shipping info</a>.</li>
        <li><b>Return or warranty issue?</b> — See our <a className="text-blue-600 underline" href="/returns">returns & warranty</a> page.</li>
      </ul>
    </InfoPage>
  );
}
