import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | HRIS Gasela Motor",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">HRIS Gasela Motor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Login form diimplementasikan pada Fase 1 (Auth module).
        </p>
      </div>
    </main>
  );
}