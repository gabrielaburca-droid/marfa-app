import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";

export const metadata = { title: "Fără acces" };

export default function NoAccessPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="surface max-w-sm space-y-4 p-8 text-center">
        <LogoMark className="mx-auto size-12" />
        <h1 className="text-xl font-bold tracking-tight text-stone-900">Contul nu are acces</h1>
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
