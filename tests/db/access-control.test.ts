import { beforeAll, describe, expect, it } from "vitest";
import { anonClient, channelId, expenseCategoryId, serviceClient } from "./helpers";
import { createWorld, type World } from "./fixtures";

let w: World;

async function addIncome(client: World["adminA"]["client"], businessId: string, amount: number) {
  return client
    .from("income_entries")
    .insert({
      business_id: businessId,
      entry_kind: "aggregate",
      entry_date: "2026-10-10",
      channel_id: await channelId(businessId, "Târg Suceava"),
      gross_amount: amount,
      description: "Încasări târg",
    })
    .select("id, created_by")
    .single();
}

beforeAll(async () => {
  w = await createWorld();
});

describe("authentication", () => {
  it("rejects a wrong password", async () => {
    const { error } = await anonClient().auth.signInWithPassword({
      email: w.adminA.email,
      password: "parola-gresita-123",
    });
    expect(error).not.toBeNull();
  });

  it("does not allow public sign-up", async () => {
    const { error } = await anonClient().auth.signUp({
      email: `random-${Date.now()}@test.local`,
      password: "Parola-lunga-123",
    });
    expect(error).not.toBeNull();
  });

  it("gives anonymous visitors no business data", async () => {
    const anon = anonClient();
    for (const table of ["businesses", "income_entries", "expenses", "audit_logs", "profiles"]) {
      const { data, error } = await anon.from(table).select("id").limit(1);
      // Either permission denied or an empty result; never rows.
      expect(error !== null || data?.length === 0, table).toBe(true);
    }
  });

  it("signs out", async () => {
    const { client } = w.outsider;
    await client.auth.signOut();
    const { data } = await client.auth.getUser();
    expect(data.user).toBeNull();
  });
});

describe("business data isolation", () => {
  it("each admin sees only their own business", async () => {
    const { data } = await w.adminA.client.from("businesses").select("id");
    expect(data?.map((b) => b.id)).toEqual([w.bizA]);
  });

  it("an admin cannot read another business's income", async () => {
    const inB = await addIncome(w.adminB.client, w.bizB, 1234);
    expect(inB.error).toBeNull();
    const { data } = await w.adminA.client.from("income_entries").select("id").eq("id", inB.data!.id);
    expect(data).toEqual([]);
  });

  it("an admin cannot write into another business by sending its business_id", async () => {
    const { error } = await w.adminA.client.from("income_entries").insert({
      business_id: w.bizB,
      entry_kind: "aggregate",
      entry_date: "2026-10-10",
      channel_id: await channelId(w.bizB, "OLX"),
      gross_amount: 10,
    });
    expect(error?.code).toBe("42501");
  });

  it("an expense cannot reference another business's category", async () => {
    const { error } = await w.adminA.client.from("expenses").insert({
      business_id: w.bizA,
      expense_date: "2026-10-10",
      category_id: await expenseCategoryId(w.bizB, "Amenzi"),
      amount: 100,
    });
    expect(error?.code).toBe("23503"); // composite foreign key (business_id, id)
  });

  it("a record cannot be moved to another business", async () => {
    const { data } = await addIncome(w.adminA.client, w.bizA, 50);
    const { error } = await w.adminA.client
      .from("income_entries")
      .update({ business_id: w.bizB })
      .eq("id", data!.id);
    expect(error).not.toBeNull();
  });

  it("a signed-in user without membership sees nothing", async () => {
    const { client } = await (await import("./helpers")).createUser("lonely");
    const { data: biz } = await client.from("businesses").select("id");
    const { data: income } = await client.from("income_entries").select("id");
    expect(biz).toEqual([]);
    expect(income).toEqual([]);
  });
});

describe("roles", () => {
  it("records created_by from the session, not from the client", async () => {
    const { data, error } = await w.operatorA.client
      .from("income_entries")
      .insert({
        business_id: w.bizA,
        entry_kind: "aggregate",
        entry_date: "2026-10-11",
        channel_id: await channelId(w.bizA, "Târg Bacău"),
        gross_amount: 300,
        created_by: w.adminA.id,
      })
      .select("created_by")
      .single();
    expect(error).toBeNull();
    expect(data!.created_by).toBe(w.operatorA.id);
  });

  it("operators see only their own records unless granted report access", async () => {
    const adminEntry = await addIncome(w.adminA.client, w.bizA, 777);
    const asOperator = await w.operatorA.client
      .from("income_entries")
      .select("id")
      .eq("id", adminEntry.data!.id);
    const asReporter = await w.reporterA.client
      .from("income_entries")
      .select("id")
      .eq("id", adminEntry.data!.id);
    expect(asOperator.data).toEqual([]);
    expect(asReporter.data).toHaveLength(1);
  });

  it("operators can edit their own records but not other people's", async () => {
    const own = await addIncome(w.operatorA.client, w.bizA, 100);
    const ownEdit = await w.operatorA.client
      .from("income_entries")
      .update({ gross_amount: 150 })
      .eq("id", own.data!.id)
      .select("gross_amount");
    expect(ownEdit.data?.[0]?.gross_amount).toBe(150);

    const other = await addIncome(w.adminA.client, w.bizA, 100);
    const otherEdit = await w.reporterA.client
      .from("income_entries")
      .update({ gross_amount: 1 })
      .eq("id", other.data!.id)
      .select("id");
    expect(otherEdit.data).toEqual([]); // filtered out by RLS: nothing updated
  });

  it("operators cannot delete; admins soft-delete and the row is kept", async () => {
    const entry = await addIncome(w.operatorA.client, w.bizA, 90);
    const id = entry.data!.id;

    const hard = await w.operatorA.client.from("income_entries").delete().eq("id", id);
    expect(hard.error?.code).toBe("42501");

    const soft = await w.operatorA.client
      .from("income_entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    expect(soft.error?.code).toBe("42501");

    const adminHard = await w.adminA.client.from("income_entries").delete().eq("id", id);
    expect(adminHard.error?.code).toBe("42501");

    const adminSoft = await w.adminA.client
      .from("income_entries")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select("deleted_by")
      .single();
    expect(adminSoft.error).toBeNull();
    expect(adminSoft.data!.deleted_by).toBe(w.adminA.id);

    const stillThere = await serviceClient().from("income_entries").select("id").eq("id", id);
    expect(stillThere.data).toHaveLength(1);
    const operatorView = await w.operatorA.client.from("income_entries").select("id").eq("id", id);
    expect(operatorView.data).toEqual([]);
  });

  it("operators cannot change settings", async () => {
    const { error } = await w.operatorA.client
      .from("expense_categories")
      .insert({ business_id: w.bizA, name: "Categorie nouă", report_group: "operating" });
    expect(error?.code).toBe("42501");

    const rename = await w.operatorA.client
      .from("sales_channels")
      .update({ name: "Altceva" })
      .eq("business_id", w.bizA)
      .select("id");
    expect(rename.data).toEqual([]);
  });

  it("admins manage settings", async () => {
    const { error } = await w.adminA.client
      .from("expense_categories")
      .insert({ business_id: w.bizA, name: "Asigurări", report_group: "operating" });
    expect(error).toBeNull();
  });

  it("operators cannot promote themselves to admin", async () => {
    const { data } = await w.operatorA.client
      .from("business_memberships")
      .update({ role: "admin" })
      .eq("user_id", w.operatorA.id)
      .select("id");
    expect(data).toEqual([]);
    const { data: m } = await serviceClient()
      .from("business_memberships")
      .select("role")
      .eq("user_id", w.operatorA.id)
      .single();
    expect(m!.role).toBe("operator");
  });

  it("the last active admin cannot be demoted or deactivated", async () => {
    const { error } = await w.adminB.client
      .from("business_memberships")
      .update({ role: "operator" })
      .eq("user_id", w.adminB.id);
    expect(error?.message).toMatch(/cel puțin un administrator/);
  });

  it("deactivated members lose access immediately", async () => {
    const { createUser, addMember } = await import("./helpers");
    const temp = await createUser("temp");
    await addMember(w.bizA, temp.id, "operator", true);
    expect((await temp.client.from("businesses").select("id")).data).toHaveLength(1);

    const { error } = await w.adminA.client
      .from("business_memberships")
      .update({ is_active: false })
      .eq("user_id", temp.id)
      .eq("business_id", w.bizA);
    expect(error).toBeNull();
    expect((await temp.client.from("businesses").select("id")).data).toEqual([]);
    expect((await temp.client.from("income_entries").select("id")).data).toEqual([]);
  });
});

describe("audit log", () => {
  it("records actor, action and changed fields; only admins can read it", async () => {
    const entry = await addIncome(w.operatorA.client, w.bizA, 400);
    await w.operatorA.client.from("income_entries").update({ gross_amount: 450 }).eq("id", entry.data!.id);

    const { data } = await w.adminA.client
      .from("audit_logs")
      .select("action, actor_id, changes")
      .eq("entity_id", entry.data!.id)
      .order("id");
    expect(data?.map((r) => r.action)).toEqual(["insert", "update"]);
    expect(data?.[1].actor_id).toBe(w.operatorA.id);
    expect(data?.[1].changes.gross_amount).toEqual({ old: 400, new: 450 });

    const asOperator = await w.operatorA.client
      .from("audit_logs")
      .select("id")
      .eq("entity_id", entry.data!.id);
    expect(asOperator.data).toEqual([]);

    const forge = await w.adminA.client
      .from("audit_logs")
      .insert({ business_id: w.bizA, action: "insert", entity_type: "x" });
    expect(forge.error).not.toBeNull();
  });
});

describe("attachments storage", () => {
  it("members upload to their business folder only", async () => {
    const file = new Blob(["%PDF-1.4 test"], { type: "application/pdf" });
    const own = await w.operatorA.client.storage
      .from("attachments")
      .upload(`${w.bizA}/bon-${Date.now()}.pdf`, file);
    expect(own.error).toBeNull();

    const foreign = await w.operatorA.client.storage
      .from("attachments")
      .upload(`${w.bizB}/bon-${Date.now()}.pdf`, file);
    expect(foreign.error).not.toBeNull();

    const read = await w.adminB.client.storage.from("attachments").download(own.data!.path);
    expect(read.error).not.toBeNull();
  });
});
