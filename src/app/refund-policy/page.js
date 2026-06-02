import RefundPolicyPage from "@/components/public-pages/RefundPolicyPage";

export const metadata = {
  title: "Terms of Service & Refund Policy | Nesti AI",
  description:
    "Nesti subscription billing terms, cancellation policy, and strict no-refund policy.",
};

export default function RefundPolicyRoute() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-background-light/20 to-white">
      <RefundPolicyPage />
    </div>
  );
}
