(() => {
  const group = document.querySelector('#medGroup');
  const dose = document.querySelector('#medDose1');
  const label = document.querySelector('#medDoseLabel');
  const output = document.querySelector('#medCalcOut');
  const filters = [...document.querySelectorAll('.filter-btn')];
  const rows = [...document.querySelectorAll('#rweTable tbody tr')];

  function addDays(date, days) {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
  }

  function addMonths(date, months) {
    const result = new Date(date);
    const day = result.getUTCDate();
    result.setUTCDate(1);
    result.setUTCMonth(result.getUTCMonth() + months + 1, 0);
    result.setUTCDate(Math.min(day, result.getUTCDate()));
    return result;
  }

  const format = date => date.toISOString().split('T')[0];

  function updateSchedule() {
    const priorZoster = group.value === 'prior_hz';
    const liveVaccine = group.value === 'zvl';
    const accelerated = group.value === 'ic';
    label.textContent = liveVaccine ? 'Zostavax 接種日' : '第 1 劑 Shingrix 接種日';
    dose.closest('label').hidden = priorZoster;

    if (priorZoster) {
      output.textContent = '待急性期結束、症狀緩解後再安排接種。美國 CDC 未設固定等待月數。若曾有眼部帶狀疱疹，與眼科確認病況穩定後的接種時機。';
      return;
    }

    const date = dose.valueAsDate;
    if (!date) {
      output.textContent = '請輸入接種日期。';
      return;
    }

    if (liveVaccine) {
      output.textContent = `依美國 CDC 建議，第 1 劑 Shingrix 最早可於 ${format(addDays(date, 56))} 接種（間隔至少 8 週）。之後仍需完成第 2 劑。`;
      return;
    }

    const minimum = addDays(date, 28);
    const first = addMonths(date, accelerated ? 1 : 2);
    const last = addMonths(date, accelerated ? 2 : 6);
    const window = `${format(new Date(Math.max(first, minimum)))} 至 ${format(last)}`;
    output.textContent = accelerated
      ? `依美國 CDC 加速時程，第 2 劑建議於 ${window} 接種（1–2 個月）。台灣疾管署一般建議間隔 2–6 個月，請依照護團隊安排。`
      : `第 2 劑建議於 ${window} 接種（2–6 個月），最短間隔 4 週（${format(minimum)}）。若超過 6 個月，補接種第 2 劑即可。`;
  }

  group.addEventListener('change', updateSchedule);
  dose.addEventListener('input', updateSchedule);
  updateSchedule();

  for (const filter of filters) {
    filter.addEventListener('click', () => {
      for (const item of filters) {
        item.classList.toggle('active', item === filter);
        item.setAttribute('aria-pressed', String(item === filter));
      }
      for (const row of rows) row.hidden = filter.dataset.filter !== 'all' && row.dataset.cat !== filter.dataset.filter;
    });
  }
})();
