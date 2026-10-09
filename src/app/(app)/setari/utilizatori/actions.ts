"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorize, FORBIDDEN } from "@/lib/auth/guard";
import { dbErrorMessage } from "@/lib/db-errors";
import { publicEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailSchema, fieldErrors, type FormState } from "@/lib/validation/auth";
import { checkbox, optionalText, uuidSchema } from "@/lib/validation/common";

const PATH = "/setari/utilizatori";
const BAN_FOREVER = "876000h"; // ~100 years

const inviteSchema = z.object({
  email: emailSchema,
  full_name: optionalText(200),
  role: z.enum(["admin", "operator"], { error: "Alegeți rolul." }),
  can_view_reports: checkbox,
});

/**
 * Adds a person to the current business. New people get an invitation email
 * to set their password; people who already have an account are added directly.
 * Only the account lookup and the invitation use the secret key; the
 * membership itself is written as the signed-in admin, so RLS and the audit
 * log apply.
 */
export async function inviteMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const auth = await authorize("users.manage");
  if (!auth) return FORBIDDEN;
  const parsed = inviteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const { email, full_name, role, can_view_reports } = parsed.data;
  const admin = createAdminClient();

  const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  let userId = existing?.id;
  let invited = false;

  if (userId) {
    const { data: membership } = await admin
      .from("business_memberships")
      .select("id, is_active")
      .eq("business_id", auth.businessId)
      .eq("user_id", userId)
      .maybeSingle();
    if (membership) {
      return {
        ok: false,
        message: membership.is_active
          ? "Această persoană are deja acces la firmă."
          : "Această persoană există, dar este dezactivată. Folosiți „Reactivează” din listă.",
      };
    }
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name ?? "" },
      redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    });
    if (error || !data.user) {
      return {
        ok: false,
        message: "Invitația nu a putut fi trimisă. Verificați adresa și încercați din nou.",
      };
    }
    userId = data.user.id;
    invited = true;
  }

  const { error } = await auth.supabase.from("business_memberships").insert({
    business_id: auth.businessId,
    user_id: userId,
    role,
    can_view_reports: role === "operator" && can_view_reports,
  });
  if (error) return { ok: false, message: dbErrorMessage(error) };

  await syncBan(userId);
  revalidatePath(PATH);
  return {
    ok: true,
    message: invited
      ? `Invitația a fost trimisă la ${email}.`
      : `${email} are deja cont și a primit acces la firmă.`,
  };
}

const updateSchema = z.object({
  id: uuidSchema,
  role: z.enum(["admin", "operator"]),
  can_view_reports: z.boolean(),
});

export async function updateMember(input: z.input<typeof updateSchema>): Promise<FormState> {
  const auth = await authorize("users.manage");
  if (!auth) return FORBIDDEN;
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Cerere invalidă." };
  const { id, role, can_view_reports } = parsed.data;

  const { data, error } = await auth.supabase
    .from("business_memberships")
    .update({ role, can_view_reports: role === "operator" && can_view_reports })
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .select("id");
  if (error) return { ok: false, message: dbErrorMessage(error) };
  if (!data?.length) return { ok: false, message: "Utilizatorul nu a fost găsit." };
  revalidatePath(PATH);
  return { ok: true, message: "Drepturile au fost actualizate." };
}

export async function setMemberActive(id: string, active: boolean): Promise<FormState> {
  const auth = await authorize("users.manage");
  if (!auth || !uuidSchema.safeParse(id).success) return FORBIDDEN;

  const { data: member } = await auth.supabase
    .from("business_memberships")
    .select("user_id")
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .single();
  if (!member) return { ok: false, message: "Utilizatorul nu a fost găsit." };
  if (member.user_id === auth.ctx.user.id && !active) {
    return { ok: false, message: "Nu vă puteți dezactiva propriul cont." };
  }

  const { error } = await auth.supabase
    .from("business_memberships")
    .update({ is_active: active })
    .eq("id", id)
    .eq("business_id", auth.businessId);
  if (error) return { ok: false, message: dbErrorMessage(error) };

  await syncBan(member.user_id);
  revalidatePath(PATH);
  return { ok: true, message: active ? "Utilizatorul a fost reactivat." : "Utilizatorul a fost dezactivat." };
}

/** Sends a new set-password link to a member of this business. */
export async function resendAccessLink(id: string): Promise<FormState> {
  const auth = await authorize("users.manage");
  if (!auth || !uuidSchema.safeParse(id).success) return FORBIDDEN;
  const { data: member } = await auth.supabase
    .from("business_memberships")
    .select("is_active, profiles!business_memberships_user_id_fkey(email)")
    .eq("id", id)
    .eq("business_id", auth.businessId)
    .single();
  const email = member?.profiles?.email;
  if (!member?.is_active || !email) return { ok: false, message: "Utilizatorul nu este activ." };

  const { error } = await auth.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  });
  if (error) return { ok: false, message: "Emailul nu a putut fi trimis. Încercați mai târziu." };
  return { ok: true, message: `Am trimis un link pentru setarea parolei la ${email}.` };
}

/**
 * A person with no active membership anywhere is blocked from signing in;
 * anyone with at least one is allowed again.
 */
async function syncBan(userId: string) {
  const admin = createAdminClient();
  const { count } = await admin
    .from("business_memberships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);
  await admin.auth.admin.updateUserById(userId, { ban_duration: count ? "none" : BAN_FOREVER });
}
