import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Fără acces" };

export default function NoAccessPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="max-w-sm space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
        <h1 className="text-lg font-semibold">Contul nu are acces</h1>
        <p className="text-sm text-stone-600">
          Contul dumneavoastră nu este asociat unei firme sau a fost dezactivat. Contactați administratorul.
        </p>
        <form action={signOut}>
          <Button variant="secondary" type="submit">
            Ieșire din cont
          </Button>
        </form>
      </div>
    </main>
  );
}
