import { dataStore } from "../state/dataStore.js";

const PRODUCT_NAMES = {
  "PROD-001": "Detergent 500ml",
  "PROD-002": "Olive Oil 1L",
  "PROD-003": "Tea Box Premium",
  "PROD-004": "Premium Backpack",
  "PROD-005": "Wireless Headset",
  "PROD-006": "Executive Office Chair",
  "PROD-007": "Smart Water Bottle",
  "PROD-008": "Travel Mug Set",
  "PROD-009": "Notebook Premium",
  "PROD-010": "Desk Lamp LED",
  "PROD-011": "Bluetooth Speaker",
};

function getBestSellingProductName() {
  if (!dataStore.invoiceItems || !dataStore.invoiceItems.length) return "-";

  const totals = dataStore.invoiceItems.reduce((acc, item) => {
    const quantity = Number(item.quantity || 0);
    if (!acc[item.product_id]) acc[item.product_id] = 0;
    acc[item.product_id] += quantity;
    return acc;
  }, {});

  const topProduct = Object.entries(totals).sort(([, a], [, b]) => b - a)[0];
  if (!topProduct) return "-";

  return PRODUCT_NAMES[topProduct[0]] || topProduct[0];
}

export function getOverviewData(translate) {
  const t = translate;
  return {
    kpis: [
      { label: t("overview.kpi.totalSales"), value: "$128,430", trend: t("overview.kpi.trendSales") },
      { label: t("overview.kpi.activeCustomers"), value: "1,248", trend: t("overview.kpi.trendCustomers") },
      { label: t("overview.kpi.bestSellingProduct"), value: getBestSellingProductName(), trend: t("overview.kpi.trendBestSelling") },
      { label: t("overview.kpi.collectionRate"), value: "93.8%", trend: t("overview.kpi.trendCollection") },
    ],
  };
}
