export interface RazorpaySuccess { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; }
interface RazorpayInstance { open: () => void; on: (event: "payment.failed", callback: () => void) => void; }
declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance; } }
let loading: Promise<void> | undefined;
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => { if (window.Razorpay) resolve(); else { loading = undefined; reject(new Error("Razorpay could not load.")); } };
    script.onerror = () => { loading = undefined; script.remove(); reject(new Error("Razorpay could not load. Check your connection and retry.")); };
    document.body.appendChild(script);
  });
  return loading;
}
