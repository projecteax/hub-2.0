import { AuthForm } from "@/components/auth-form";
import { PRODUCT_NAME } from "@/lib/brand";

export default function LoginPage() {
  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <section>
        <p className="text-sm font-semibold text-indigo-700">{PRODUCT_NAME}</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-slate-950">Client & expert access</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Clients run self-serve research and request human verification. Experts review matched reports and attest
          findings with their credentials.
        </p>
      </section>
      <AuthForm />
    </main>
  );
}
