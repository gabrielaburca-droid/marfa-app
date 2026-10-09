export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">
            M
          </div>
          <p className="text-sm font-medium text-slate-500">Evidență financiară</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
