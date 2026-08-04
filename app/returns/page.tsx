import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Returns & Warranty — Hanwoo International Inc." };

export default function ReturnsPage() {
  return (
    <InfoPage title="Returns & Warranty" updated="August 4, 2026">
      <h2 className="pt-2 font-semibold text-gray-900">30-day returns</h2>
      <p>
        Not satisfied? You can return eligible items within 30 days of delivery for a refund of the
        product price. Items must be unused, in original packaging, and the return shipping cost is the
        customer&apos;s responsibility unless the item arrived defective or damaged.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">2-year warranty</h2>
      <p>
        All products carry a 2-year manufacturer&apos;s warranty covering defects in materials and
        workmanship. If your product malfunctions under normal use, contact us and we will arrange a
        repair, replacement, or refund at our discretion.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">How to start a return or warranty claim</h2>
      <ol className="list-decimal pl-5">
        <li>Contact us via the <a className="text-blue-600 underline" href="/contact">contact page</a> with your order ID and a description of the issue.</li>
        <li>We will reply within 1 business day with instructions.</li>
        <li>For defective items, we will arrange a replacement or refund after verifying the issue.</li>
      </ol>
      <h2 className="pt-2 font-semibold text-gray-900">Refunds</h2>
      <p>
        Refunds are issued to the original payment method within 5–10 business days after approval.
        For Zelle payments, the refund is returned to the same bank account that made the transfer.
      </p>
    </InfoPage>
  );
}
