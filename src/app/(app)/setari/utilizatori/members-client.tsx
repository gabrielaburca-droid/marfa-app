"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Badge } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { CheckboxField, SelectField } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast, useToast } from "@/components/ui/toast";
import { ROLE_LABELS, type Role } from "@/lib/auth/permissions";
import { inviteMember, resendAccessLink, setMemberActive, updateMember } from "./actions";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  canViewReports: boolean;
  isActive: boolean;
  hasSignedIn: boolean;
  isSelf: boolean;
};

export function InviteForm() {
  const [state, action] = useActionState(inviteMember, {});
  const ref = useRef<HTMLFormElement>(null);
  useActionToast(state, () => ref.current?.reset());
  const e = state.fieldErrors ?? {};
  return (
    <form ref={ref} action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Email" name="email" type="email" autoComplete="off" required errors={e.email} />
        <Field label="Nume" name="full_name" autoComplete="off" errors={e.full_name} />
        <SelectField label="Rol" name="role" defaultValue="operator" errors={e.role}>
          <option value="operator">Operator</option>
          <option value="admin">Administrator</option>
        </SelectField>
      </div>
      <CheckboxField
        name="can_view_reports"
        label="Poate vedea Dashboard, Rapoarte și toate înregistrările"
        hint="Doar pentru operatori. Fără această bifă, operatorul vede doar ce a introdus el."
      />
      <SubmitButton pendingText="Se trimite…">Trimite invitația</SubmitButton>
    </form>
  );
}

function MemberRow({ m }: { m: Member }) {
  const [pending, start] = useTransition();
  const [role, setRole] = useState(m.role);
  const [reports, setReports] = useState(m.canViewReports);
  const toast = useToast();
  const notify = (r: { ok?: boolean; message?: string }) => {
    if (r.message) toast({ tone: r.ok ? "success" : "error", message: r.message });
  };

  const save = (next: { role: Role; can_view_reports: boolean }) =>
    start(async () => {
      const r = await updateMember({ id: m.id, ...next });
      notify(r);
      if (!r.ok) {
        setRole(m.role);
        setReports(m.canViewReports);
      }
    });

  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 ${pending ? "opacity-60" : ""}`}>
      <div className="min-w-48 flex-1">
        <p className="text-sm font-medium">
          {m.name || m.email} {m.isSelf && <span className="text-stone-500">(dvs.)</span>}
        </p>
        {m.name && <p className="text-xs text-stone-500">{m.email}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!m.isActive ? (
          <Badge tone="red">Dezactivat</Badge>
        ) : m.hasSignedIn ? (
          <Badge tone="green">Activ</Badge>
        ) : (
          <Badge tone="amber">Invitat</Badge>
        )}
      </div>
      {m.isActive && (
        <div className="flex flex-wrap items-center gap-4">
          <label className="sr-only" htmlFor={`role-${m.id}`}>
            Rol
          </label>
          <select
            id={`role-${m.id}`}
            value={role}
            disabled={pending || m.isSelf}
            onChange={(e) => {
              const next = e.target.value as Role;
              setRole(next);
              save({ role: next, can_view_reports: reports });
            }}
            className="rounded-xl border-0 bg-white py-1.5 pr-8 pl-3 text-sm ring-1 ring-stone-200"
          >
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {role === "operator" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={reports}
                disabled={pending}
                onChange={(e) => {
                  setReports(e.target.checked);
                  save({ role, can_view_reports: e.target.checked });
                }}
                className="size-4 accent-brand-600"
              />
              Vede rapoarte
            </label>
          )}
        </div>
      )}
      <div className="flex items-center gap-4">
        {m.isActive && !m.hasSignedIn && (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => notify(await resendAccessLink(m.id)))}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Retrimite linkul
          </button>
        )}
        {!m.isSelf &&
          (m.isActive ? (
            <ConfirmButton
              label="Dezactivează"
              title={`Dezactivați accesul pentru ${m.name || m.email}?`}
              description="Persoana nu se mai poate autentifica și nu mai vede datele firmei. Înregistrările introduse de ea rămân. Accesul poate fi reactivat oricând."
              confirmLabel="Dezactivează"
              onConfirm={async () => notify(await setMemberActive(m.id, false))}
            />
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => notify(await setMemberActive(m.id, true)))}
              className="text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Reactivează
            </button>
          ))}
      </div>
    </li>
  );
}

export function MembersTable({ members }: { members: Member[] }) {
  return (
    <ul className="divide-y divide-stone-100 -mx-1">
      {members.map((m) => (
        <MemberRow key={m.id} m={m} />
      ))}
    </ul>
  );
}
