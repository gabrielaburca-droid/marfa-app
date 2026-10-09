export function Alert({ tone, children }: { tone: "error" | "success" | "info"; children: React.ReactNode }) {
  const styles = {
    error: "bg-red-50 text-red-800 ring-red-200",
    success: "bg-brand-50 text-brand-800 ring-brand-200",
    info: "bg-slate-100 text-slate-700 ring-slate-200",
  }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-4 py-3 text-sm ring-1 ${styles}`}
    >
      {children}
    </div>
  );
}
