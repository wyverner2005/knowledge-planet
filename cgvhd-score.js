const cgvhdOrgans = [
  [
    "skin",
    "皮膚",
    [
      "無受累，也無硬化",
      "受累體表面積至 18%，無達較高分的皮膚表徵",
      "受累 19–50%，或表層硬化（仍可捏起）",
      "受累 >50%，或深層硬化（不可捏起）、影響活動或潰瘍"
    ],
    "體表面積與皮膚表徵分別評估，取較高分。"
  ],
  [
    "mouth",
    "口腔",
    [
      "無症狀；可有無症狀的苔癬樣病灶",
      "有疾病體徵及輕症，進食未明顯受限",
      "有疾病體徵及中度症狀，進食部分受限",
      "有疾病體徵及重度症狀，進食明顯受限"
    ],
    "單有口乾不能確診口腔 GVHD。"
  ],
  [
    "eyes",
    "眼睛",
    [
      "無症狀；可有眼科確認的無症狀乾性角結膜炎",
      "輕度乾眼不影響日常活動，潤滑滴眼液需求 ≤3 次／日",
      "部分影響日常活動，潤滑滴眼液 >3 次／日或需淚點栓塞，無新發視力障礙",
      "明顯影響日常活動、因眼症狀無法工作，或因乾性角結膜炎喪失視力"
    ],
    "有症狀時按功能與潤滑滴眼液需求評估；Schirmer 數值不直接計分。"
  ],
  [
    "gi",
    "腸胃道",
    [
      "無症狀",
      "有症狀，近 3 個月體重減輕 <5%",
      "近 3 個月體重減輕 5–15%，或中度腹瀉未明顯影響日常活動",
      "近 3 個月體重減輕 >15%、多數熱量仰賴營養補充、需食道擴張，或重度腹瀉明顯影響日常活動"
    ],
    "體重下降須與腸胃道 GVHD 相關。"
  ],
  [
    "liver",
    "肝臟",
    [
      "總膽紅素正常，且 ALT 與 ALP 都 <3 × ULN",
      "總膽紅素正常，且 ALT 為 3–5 × ULN 或 ALP ≥3 × ULN（未達較高分）",
      "總膽紅素升高但 ≤3 mg/dL，或 ALT >5 × ULN（總膽紅素未達 3 分）",
      "總膽紅素 >3 mg/dL"
    ],
    "ULN＝檢驗正常上限。從最高符合條件判定；AST 和 GGT 不計分。"
  ],
  [
    "lungs",
    "肺",
    [
      "FEV₁ ≥80% 預測值；無肺功能時：無症狀",
      "FEV₁ 60–79%；無肺功能時：上一層樓梯後喘",
      "FEV₁ 40–59%；無肺功能時：平地行走時喘",
      "FEV₁ ≤39%；無肺功能時：靜息時喘或需氧氣"
    ],
    "有肺功能結果時，FEV₁ 優先於症狀分數；肺 1 分即中度、肺 ≥2 分即重度。"
  ],
  [
    "joints",
    "關節與筋膜",
    [
      "無症狀",
      "輕度肢體緊繃，活動度正常或略降，不影響日常活動",
      "肢體緊繃、攣縮或疑筋膜炎紅斑，活動度中度減少，日常活動輕至中度受限",
      "攣縮合併活動度明顯減少，且明顯限制日常活動"
    ],
    "依關節活動度與日常功能評估。"
  ],
  [
    "genital",
    "生殖道",
    [
      "無體徵",
      "輕度體徵，例如苔癬樣變化",
      "中度體徵，例如女性糜爛或裂隙、男性硬化性苔癬樣變化或中度紅斑",
      "重度體徵，例如女性黏連或陰道狹窄、男性包莖或尿道／尿道口瘢痕"
    ],
    "按檢查體徵評分，未檢查請標為未評估。"
  ]
];

function gradeCgvhd(scores) {
  const assessed = Object.values(scores).filter(score => score !== "");
  const values = assessed.filter(score => score !== "excluded").map(Number);
  const lung = Number(scores.lungs);
  if (values.includes(3) || lung >= 2) {
    return assessed.length === 8 ? "重度" : "已達重度門檻，仍有器官未評估";
  }
  if (assessed.length < 8) return "尚無法判定整體分級";
  const involved = values.filter(score => score > 0).length;
  if (values.includes(2) || lung === 1 || involved >= 3) return "中度";
  return involved ? "輕度" : "目前無計分器官受累";
}

const gvhdForm = document.querySelector("#cgvhd-form");
const gvhdGrid = document.querySelector("#cgvhd-organs");
const gvhdResult = document.querySelector("#cgvhd-result");
for (const [id, name, criteria, tip] of cgvhdOrgans) {
  const field = document.createElement("fieldset");
  const legend = document.createElement("legend");
  legend.textContent = name;
  const help = document.createElement("p");
  help.className = "kp-score-tip";
  help.textContent = tip;
  const options = [
    ["", "未評估"],
    ...criteria.map((description, score) => [String(score), description]),
    ["excluded", "排除：已確認完全由其他病因造成"],
  ];
  field.append(legend, help);
  for (const [score, description] of options) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = id;
    input.value = score;
    input.defaultChecked = score === "";
    const line = document.createElement("span");
    if (score !== "" && score !== "excluded") {
      const badge = document.createElement("strong");
      badge.className = "kp-score-number";
      badge.textContent = score + " 分";
      line.append(badge);
    }
    line.append(description);
    label.append(input, line);
    field.append(label);
  }
  gvhdGrid.append(field);
}

function showCgvhdGrade() {
  const data = new FormData(gvhdForm);
  const scores = Object.fromEntries(cgvhdOrgans.map(([id]) => [id, data.get(id) ?? ""]));
  const checked = Object.values(scores).filter(score => score !== "").length;
  const excluded = Object.values(scores).filter(score => score === "excluded").length;
  gvhdResult.textContent = "已評估 " + checked + "／8 項" +
    (excluded ? "（排除 " + excluded + " 項）" : "") + "。整體：" + gradeCgvhd(scores) + "。";
}
gvhdForm.addEventListener("change", showCgvhdGrade);
gvhdForm.addEventListener("reset", () => queueMicrotask(showCgvhdGrade));
showCgvhdGrade();
