const BACKEND_ROLE_TO_KEY = {
  COMPANY_ADMIN: "administrator",
  SALES_MANAGER: "salesManager",
  SALES_SUPERVISOR: "salesSupervisor",
  SALES_REPRESENTATIVE: "salesRep",
  ACCOUNTANT: "accountant",
};

export function roleKeyFromBackend(role) {
  return BACKEND_ROLE_TO_KEY[role] || null;
}

// Backend role enum values paired with the existing translated role labels,
// for building the Users role <select> without duplicating the enum list.
export const BACKEND_ROLE_OPTIONS = Object.entries(BACKEND_ROLE_TO_KEY).map(([backendRole, key]) => ({
  value: backendRole,
  labelKey: `labels.role.${key}`,
}));
