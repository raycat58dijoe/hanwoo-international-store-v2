import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Shipping Info — Hanwoo International Inc." };

export default function ShippingPage() {
  return (
    <InfoPage title="Shipping Information" updated="August 4, 2026">
      <h2 className="pt-2 font-semibold text-gray-900">Delivery times</h2>
      <ul className="list-disc pl-5">
        <li>Processing time: 1–3 business days after payment confirmation.</li>
        <li>International delivery: typically 7–21 business days, depending on destination and customs.</li>
        <li>You will receive a tracking number by email once your order ships.</li>
      </ul>
      <h2 className="pt-2 font-semibold text-gray-900">Shipping fees</h2>
      <ul className="list-disc pl-5">
        <li><b>Free international shipping</b> on orders over US$80.</li>
        <li>Orders under US$80 are charged a flat rate of US$9.99.</li>
        <li>The fee is calculated automatically at checkout.</li>
      </ul>
      <h2 className="pt-2 font-semibold text-gray-900">Customs & duties</h2>
      <p>
        International orders may be subject to import duties or taxes levied by the destination country.
        These are the responsibility of the recipient and are not included in the checkout total.
      </p>
      <h2 className="pt-2 font-semibold text-gray-900">Order tracking</h2>
      <p>
        Track your order anytime on our <a className="text-blue-600 underline" href="/track">track order</a> page
        using the order ID from your confirmation email.
      </p>
    </InfoPage>
  );
}
