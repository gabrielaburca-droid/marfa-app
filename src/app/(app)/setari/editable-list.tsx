"use client";

import { ChevronDown, ChevronUp, EyeOff, Pencil } from "lucide-react";
import { useActionState, useRef, useState, useTransition } from "react";
import { Badge, EmptyState } from "@/components/ui/card";
import { ConfirmButton } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast, useToast } from "@/components/ui/toast";
import {
  moveSettingsItem,
  saveSettingsItem,
  setSettingsItemActive,
  type SettingsTable,
} from "./list-actions";

export type ListItem = {
  id: string;
  name: string;
  is_active: boolean;
  values: Record<string, string | null>;
  /** Secondary line shown under the name. */
  detail?: string | null;
};

export type ExtraField =
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      emptyLabel?: string;
    }
  | { kind: "text"; name: string; label: string };

type Props = {
  table: SettingsTable;
  items: ListItem[];
  extraFields?: ExtraField[];
  itemLabel: string; // "categorie", "canal", …
};

function ItemForm({
  table,
  item,
  extraFields = [],
  onDone,
  submitLabel,
}: {
  table: SettingsTable;
  item?: ListItem;
  extraFields?: ExtraField[];
  onDone?: () => void;
  submitLabel: string;
}) {
  const [state, action] = useActionState(saveSettingsItem, {});
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state, () => {
    if (!item) formRef.current?.reset();
    onDone?.();
  });
  const e = state.fieldErrors ?? {};
  const prefix = item ? `${table}-${item.id}` : `${table}-new`;

  return (
    <form ref={formRef} action={action} className="flex flex-wrap items-end gap-3" noValidate>
      <input type="hidden" name="table" value={table} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="min-w-48 flex-1">
        <Field
          label="Nume"
          name="name"
          id={`${prefix}-name`}
          defaultValue={item?.name}
          errors={e.name}
          required
        />
      </div>
      {extraFields.map((f) =>
        f.kind === "select" ? (
          <div key={f.name} className="min-w-44">
            <SelectField
              label={f.label}
              name={f.name}
              id={`${prefix}-${f.name}`}
              defaultValue={item?.values[f.name] ?? ""}
              errors={e[f.name]}
            >
              {f.emptyLabel !== undefined ? (
                <option value="">{f.emptyLabel}</option>
              ) : (
                !item && <option value="">Alegeți…</option>
              )}
              {f.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectField>
          </div>
        ) : (
          <div key={f.name} className="min-w-40">
            <Field
              label={f.label}
              name={f.name}
              id={`${prefix}-${f.name}`}
              defaultValue={item?.values[f.name] ?? ""}
              errors={e[f.name]}
            />
          </div>
        ),
      )}
      <div className="flex gap-2">
        <SubmitButton>{submitLabel}</SubmitButton>
        {onDone && item && (
          <button
            type="button"
            onClick={onDone}
            className="px-2 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            Renunță
          </button>
        )}
      </div>
    </form>
  );
}

function Row({
  table,
  item,
  extraFields,
  itemLabel,
  first,
  last,
}: Props & { item: ListItem; first: boolean; last: boolean }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();

  const run = (fn: () => Promise<{ ok?: boolean; message?: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.message) toast({ tone: r.ok ? "success" : "error", message: r.message });
    });

  if (editing) {
    return (
      <li className="rounded-2xl bg-stone-50 px-4 py-4">
        <ItemForm
          table={table}
          item={item}
          extraFields={extraFields}
          submitLabel="Salvează"
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }

  const detail = item.detail;
  const iconButton =
    "rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700";
  return (
    <li className={`group flex items-center gap-2 px-2 py-2.5 sm:px-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-col opacity-60 group-hover:opacity-100">
        <button
          type="button"
          aria-label={`Mută ${item.name} mai sus`}
          disabled={first || pending}
          onClick={() => run(() => moveSettingsItem(table, item.id, "up"))}
          className="rounded p-0.5 text-stone-400 hover:text-stone-800 disabled:invisible"
        >
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`Mută ${item.name} mai jos`}
          disabled={last || pending}
          onClick={() => run(() => moveSettingsItem(table, item.id, "down"))}
          className="rounded p-0.5 text-stone-400 hover:text-stone-800 disabled:invisible"
        >
          <ChevronDown className="size-4" aria-hidden />
        </button>
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <p
          data-name
          className={`text-sm font-semibold ${item.is_active ? "text-stone-800" : "text-stone-500 line-through"}`}
        >
          {item.name}
        </p>
        {detail && (
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
            {detail}
          </span>
        )}
        {!item.is_active && <Badge tone="amber">Inactiv</Badge>}
      </div>
      <div className="flex items-center">
        <button type="button" onClick={() => setEditing(true)} className={iconButton} title="Editează">
          <Pencil className="size-4" aria-hidden />
          <span className="sr-only">Editează</span>
        </button>
        {item.is_active ? (
          <ConfirmButton
            label={
              <>
                <EyeOff className="size-4" aria-hidden />
                <span className="sr-only">Dezactivează</span>
              </>
            }
            className={`${iconButton} hover:text-rose-600`}
            title={`Dezactivați ${itemLabel} „${item.name}”?`}
            description="Nu va mai apărea în formulare. Înregistrările existente și rapoartele rămân neschimbate. O puteți reactiva oricând."
            confirmLabel="Dezactivează"
            onConfirm={() => run(() => setSettingsItemActive(table, item.id, false))}
          />
        ) : (
          <button
            type="button"
            onClick={() => run(() => setSettingsItemActive(table, item.id, true))}
            className="rounded-lg px-2 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            Reactivează
          </button>
        )}
      </div>
    </li>
  );
}

export function EditableList(props: Props) {
  const { items, table, extraFields, itemLabel } = props;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-stone-50 p-4">
        <ItemForm table={table} extraFields={extraFields} submitLabel={`Adaugă ${itemLabel}`} />
      </div>
      {items.length === 0 ? (
        <EmptyState title="Nu există elemente încă." />
      ) : (
        <ul className="divide-y divide-stone-100">
          {items.map((item, i) => (
            <Row key={item.id} {...props} item={item} first={i === 0} last={i === items.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}
