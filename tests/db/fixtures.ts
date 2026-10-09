import { addMember, createBusiness, createUser, type TestUser } from "./helpers";

export type World = {
  bizA: string;
  bizB: string;
  adminA: TestUser;
  operatorA: TestUser;
  reporterA: TestUser; // operator allowed to view reports
  adminB: TestUser;
  outsider: TestUser; // signed in, member of nothing
};

export async function createWorld(): Promise<World> {
  const [bizA, bizB] = await Promise.all([createBusiness("Firma A"), createBusiness("Firma B")]);
  const [adminA, operatorA, reporterA, adminB, outsider] = await Promise.all([
    createUser("admin-a"),
    createUser("operator-a"),
    createUser("reporter-a"),
    createUser("admin-b"),
    createUser("outsider"),
  ]);
  await addMember(bizA, adminA.id, "admin");
  await addMember(bizA, operatorA.id, "operator");
  await addMember(bizA, reporterA.id, "operator", true);
  await addMember(bizB, adminB.id, "admin");
  return { bizA, bizB, adminA, operatorA, reporterA, adminB, outsider };
}
