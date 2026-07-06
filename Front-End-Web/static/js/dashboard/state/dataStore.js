function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const dataStore = {
  regions: [
    { id: "reg-1", name: "Cairo", status: "Active", created_at: "2024-01-01T09:00:00Z", created_by: "user-1" },
    { id: "reg-2", name: "Alexandria", status: "Active", created_at: "2024-01-10T10:30:00Z", created_by: "user-2" },
    { id: "reg-3", name: "Giza", status: "Inactive", created_at: "2024-01-25T08:45:00Z", created_by: "user-3" },
    { id: "reg-4", name: "North", status: "Active", created_at: "2024-02-12T11:20:00Z", created_by: "user-1" },
    { id: "reg-5", name: "South", status: "Inactive", created_at: "2024-02-28T14:00:00Z", created_by: "user-2" },
  ],
  topReps: [
    { id: "rep-1", name: "Lina Hassan", amount: "$18,450", status: "success" },
    { id: "rep-2", name: "Omar Adel", amount: "$16,900", status: "success" },
    { id: "rep-3", name: "Maha Samir", amount: "$14,320", status: "warning" },
  ],
  sales: [
    { id: "sale-1", invoice: "INV-1042", customer: "Al Noor Store", amount: "$1,240", status: "Paid" },
    { id: "sale-2", invoice: "INV-1043", customer: "West Trade Co.", amount: "$2,990", status: "Pending" },
    { id: "sale-3", invoice: "INV-1044", customer: "Prime Retail", amount: "$780", status: "Paid" },
  ],
  users: [
    { id: "user-1", user_id: 1001, name: "Ahmed Salah", email: "ahmed@company.com", password: "secret123", role: "Administrator", phone: "+20 100 123 4567", status: "Active", created_at: "2024-01-10T09:00:00Z" },
    { id: "user-2", user_id: 1002, name: "Yara Nabil", email: "yara@company.com", password: "secret123", role: "Sales Manager", phone: "+20 101 234 5678", status: "Active", created_at: "2024-02-05T09:30:00Z" },
    { id: "user-3", user_id: 1003, name: "Karim Hatem", email: "karim@company.com", password: "secret123", role: "Sales Representative", phone: "+20 102 345 6789", status: "On Leave", created_at: "2024-03-12T14:15:00Z" },
  ],
};

export function upsertTopRep(record) {
  if (record.id) {
    const i = dataStore.topReps.findIndex((r) => r.id === record.id);
    if (i !== -1) dataStore.topReps[i] = { ...dataStore.topReps[i], ...record };
    return;
  }
  dataStore.topReps.push({ id: createId("rep"), ...record });
}

export function removeTopRep(id) {
  dataStore.topReps = dataStore.topReps.filter((r) => r.id !== id);
}

export function upsertSale(record) {
  if (record.id) {
    const i = dataStore.sales.findIndex((r) => r.id === record.id);
    if (i !== -1) dataStore.sales[i] = { ...dataStore.sales[i], ...record };
    return;
  }
  dataStore.sales.push({ id: createId("sale"), ...record });
}

export function removeSale(id) {
  dataStore.sales = dataStore.sales.filter((r) => r.id !== id);
}

export function userSelectOptions() {
  return dataStore.users.map((u) => ({
    value: u.id,
    label: u.name,
  }));
}

export function getUserName(id) {
  const user = dataStore.users.find((u) => u.id === id);
  return user ? user.name : "—";
}

export function upsertRegion(record) {
  if (record.id) {
    const i = dataStore.regions.findIndex((r) => r.id === record.id);
    if (i !== -1) dataStore.regions[i] = { ...dataStore.regions[i], ...record };
    return;
  }
  const created_at = record.created_at || new Date().toISOString();
  dataStore.regions.push({ id: createId("reg"), created_at, status: record.status || "Active", ...record });
}

export function removeRegion(id) {
  dataStore.regions = dataStore.regions.filter((r) => r.id !== id);
}

export function nextSaleInvoiceNumber() {
  const nums = dataStore.sales
    .map((s) => parseInt(String(s.invoice).replace(/\D/g, ""), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 1040) + 1;
  return `INV-${next}`;
}
