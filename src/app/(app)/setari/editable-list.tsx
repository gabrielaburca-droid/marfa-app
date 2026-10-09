"use client";

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
            className="px-2 text-sm font-medium text-slate-600 hover:text-slate-900"
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
      <li className="bg-slate-50 px-4 py-4">
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
  return (
    <li className={`flex flex-wrap items-center gap-3 px-4 py-3 ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-col">
        <button
          type="button"
          aria-label={`Mută ${item.name} mai sus`}
          disabled={first || pending}
          onClick={() => run(() => moveSettingsItem(table, item.id, "up"))}
          className="px-1 text-xs leading-none text-slate-400 hover:text-slate-800 disabled:invisible"
        >
          ▲
        </button>
        <button
          type="button"
          aria-label={`Mută ${item.name} mai jos`}
          disabled={last || pending}
          onClick={() => run(() => moveSettingsItem(table, item.id, "down"))}
          className="px-1 text-xs leading-none text-slate-400 hover:text-slate-800 disabled:invisible"
        >
          ▼
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <p data-name className={`text-sm font-medium ${item.is_active ? "" : "text-slate-400 line-through"}`}>
          {item.name}
        </p>
        {detail && <p className="text-xs text-slate-500">{detail}</p>}
      </div>
      {!item.is_active && <Badge>Inactiv</Badge>}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          Editează
        </button>
        {item.is_active ? (
          <ConfirmButton
            label="Dezactivează"
            title={`Dezactivați ${itemLabel} „${item.name}”?`}
            description="Nu va mai apărea în formulare. Înregistrările existente și rapoartele rămân neschimbate. O puteți reactiva oricând."
            confirmLabel="Dezactivează"
            onConfirm={() => run(() => setSettingsItemActive(table, item.id, false))}
          />
        ) : (
          <button
            type="button"
            onClick={() => run(() => setSettingsItemActive(table, item.id, true))}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
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
      <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
        <ItemForm table={table} extraFields={extraFields} submitLabel={`Adaugă ${itemLabel}`} />
      </div>
      {items.length === 0 ? (
        <EmptyState title="Nu există elemente încă." />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
          {items.map((item, i) => (
            <Row key={item.id} {...props} item={item} first={i === 0} last={i === items.length - 1} />
          ))}
        </ul>
      )}
    </div>
  );
}
