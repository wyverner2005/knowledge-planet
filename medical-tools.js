const equivalents = {
  Hydrocortisone: 20, Cortisone: 25, Prednisone: 5, Prednisolone: 5,
  Methylprednisolone: 4, Triamcinolone: 4, Dexamethasone: 0.75, Betamethasone: 0.6,
};
const format = new Intl.NumberFormat("zh-TW", { maximumSignificantDigits: 5 });
const steroid = document.querySelector("#steroid-form");
for (const field of ["from", "to"]) {
  const select = steroid.elements.namedItem(field);
  for (const [drug, mg] of Object.entries(equivalents)) {
    select.add(new Option(`${drug}（${mg} mg）`, drug));
  }
  select.value = field === "from" ? "Prednisone" : "Dexamethasone";
}

function calculator(form, calculate) {
  const output = form.querySelector("output");
  const get = (key) => form.elements.namedItem(key).value;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    output.textContent = calculate(get);
  });
  form.addEventListener("input", () => {
    output.textContent = "資料已變更，請重新計算。";
  });
}

calculator(steroid, (get) => {
  const dose = Number(get("dose"));
  const result = dose * (equivalents[get("to")] / equivalents[get("from")]);
  if (dose <= 0 || !Number.isFinite(result) || result <= 0) return "請輸入可換算的正數劑量。";
  return `${get("from")} ${format.format(dose)} mg ≈ ${get("to")} ${format.format(result)} mg`;
});
calculator(document.querySelector("#a1c-form"), (get) => {
  const eag = 28.7 * Number(get("a1c")) - 46.7;
  return `eAG 約 ${eag.toFixed(1)} mg/dL（${(eag / 18).toFixed(2)} mmol/L）`;
});
calculator(document.querySelector("#cv-form"), (get) => {
  const mean = Number(get("mean"));
  const cv = Number(get("sd")) / mean * 100;
  if (mean <= 0 || !Number.isFinite(cv)) return "平均血糖須大於 0，請檢查輸入值。";
  return `血糖 CV：${format.format(cv)}%`;
});
