import { LogoMark } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-14" />
          <p className="mt-4 text-xl font-bold tracking-tight text-stone-900">Marfa</p>
          <p className="text-sm text-stone-500">Încasări și cheltuieli, simplu.</p>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">{children}</div>
      </div>
    </main>
  );
}
