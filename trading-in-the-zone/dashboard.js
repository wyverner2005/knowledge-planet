'use strict';

const dashboard = document.querySelector('.trade-dashboard');
const dashboardContent = dashboard.querySelector('#dashboard-content');
const dashboardSource = dashboard.querySelector('#dashboard-source');
const periodSelect = dashboard.querySelector('#dashboard-period');
const metrics = [...dashboard.querySelectorAll('[data-metric]')];
const number = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 });
const decimal = new Intl.NumberFormat('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat('zh-TW', { style: 'percent', maximumFractionDigits: 2 });
const units = {
  winRate: value => percent.format(value),
  profitFactor: value => decimal.format(value),
  payoffRatio: value => decimal.format(value),
  net: value => `${value > 0 ? '+' : ''}${decimal.format(value)} U`,
  profit: value => `${decimal.format(value)} U`,
  loss: value => `${decimal.format(value)} U`,
  totalR: value => `${decimal.format(value)}R`,
  givebackR: value => `${decimal.format(value)}R`,
};

function renderGoal(prefix, goal, unit) {
  const { current, target } = goal;
  if (!Number.isFinite(current) || !Number.isFinite(target) || target <= 0) {
    throw new Error('Invalid goal');
  }
  const progress = dashboard.querySelector(`#${prefix}-progress`);
  progress.max = target;
  progress.value = Math.min(target, Math.max(0, current));
  dashboard.querySelector(`#${prefix}-current`).textContent = `${number.format(current)}${unit}`;
  dashboard.querySelector(`#${prefix}-target`).textContent = `／ ${number.format(target)}${unit}`;
  const remaining = Math.max(0, target - current);
  dashboard.querySelector(`#${prefix}-caption`).textContent = remaining > 0
    ? `已達 ${percent.format(current / target)} · 尚差 ${number.format(remaining)}${unit}`
    : `已達 ${percent.format(current / target)}`;
}

function renderPeriod(period) {
  for (const metric of metrics) {
    const key = metric.dataset.metric;
    const value = period[key];
    const format = units[key] ?? (amount => number.format(amount));
    metric.textContent = Number.isFinite(value) ? format(value) : '—';
    if (key === 'net') metric.dataset.sign = value > 0 ? 'positive' : value < 0 ? 'negative' : '';
  }
}

function renderQuarterComparison(periods) {
  const quarters = periods
    .filter(({ period }) => /^\d{4}Q[1-4]$/.test(period))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-2);
  if (quarters.length < 2) return;

  const section = document.createElement('section');
  section.className = 'quarter-comparison';
  section.innerHTML = '<h3>季度比較</h3><div class="quarter-charts"></div>';
  const charts = section.querySelector('.quarter-charts');
  for (const [key, label, maximum] of [
    ['winRate', '勝率', 1],
    ['profitFactor', '總盈虧比', Math.max(1, ...quarters.map(quarter => quarter.profitFactor ?? 0))],
  ]) {
    const chart = document.createElement('div');
    chart.className = 'quarter-chart';
    chart.dataset.series = key;
    const title = document.createElement('h4');
    title.textContent = label;
    chart.append(title);
    for (const quarter of quarters) {
      const row = document.createElement('div');
      row.className = 'quarter-bar';
      row.innerHTML = '<span></span><progress></progress><strong></strong>';
      const [name, bar, amount] = row.children;
      name.textContent = quarter.period;
      const value = quarter[key];
      bar.max = maximum;
      bar.value = Number.isFinite(value) ? Math.max(0, value) : 0;
      bar.setAttribute('aria-hidden', 'true');
      amount.textContent = Number.isFinite(value) ? units[key](value) : '—';
      chart.append(row);
    }
    charts.append(chart);
  }
  dashboard.querySelector('.dashboard-performance').after(section);
}

async function initializeDashboard() {
  try {
    const response = await fetch('dashboard-data.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Unavailable dashboard data');
    const data = await response.json();
    if (!data.periods.length || !/^\d{4}-\d{2}-\d{2}$/.test(data.updated)) {
      throw new Error('Invalid dashboard data');
    }
    renderGoal('retirement', data.retirement, 'R');
    renderGoal('risk', data.riskUnit, ' U');
    const periods = new Map(data.periods.map(period => [period.period, period]));
    periodSelect.replaceChildren(...data.periods.map(({ period }) =>
      new Option(period === 'ALL' ? '全部紀錄' : period, period),
    ));
    periodSelect.addEventListener('change', () => renderPeriod(periods.get(periodSelect.value)));
    renderPeriod(data.periods[0]);
    renderQuarterComparison(data.periods);
    dashboardSource.textContent = `試算表快照 · ${data.updated.replaceAll('-', '/')}`;
    dashboardContent.hidden = false;
  } catch (error) {
    dashboardSource.textContent = '暫時無法讀取交易摘要，重新整理後再試。';
  }
}

initializeDashboard();
