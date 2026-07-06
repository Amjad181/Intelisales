import { t } from "./i18n.js";

const PAYMENT = { Paid: "paid", Pending: "pending", Overdue: "overdue" };
const HEALTH = { Active: "active", "At Risk": "atRisk", Churned: "churned" };
const USER_STATUS = { Active: "active", "On Leave": "onLeave", Inactive: "inactive" };
const REP_PERF = { success: "onTarget", warning: "watchList", danger: "atRisk" };
const PRODUCT_STATUS = { Active: "active", Inactive: "inactive", Archived: "archived" };

export function labelPaymentStatus(value) {
  const k = PAYMENT[value];
  return k ? t(`labels.payment.${k}`) : value;
}

export function labelHealth(value) {
  const k = HEALTH[value];
  return k ? t(`labels.health.${k}`) : value;
}

export function labelUserStatus(value) {
  const k = USER_STATUS[value];
  return k ? t(`labels.userStatus.${k}`) : value;
}

export function labelRepPerformance(value) {
  const k = REP_PERF[value];
  return k ? t(`labels.repPerformance.${k}`) : value;
}

export function labelInventoryLevel(value) {
  const k = { danger: "low", warning: "reorder", success: "healthy" }[value];
  return k ? t(`labels.inventoryLevel.${k}`) : value;
}

export function labelProductStatus(value) {
  const k = PRODUCT_STATUS[value];
  return k ? t(`labels.productStatus.${k}`) : value;
}
