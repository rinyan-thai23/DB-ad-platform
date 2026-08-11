const cards = [...document.querySelectorAll('[data-service-card]')];
const search = document.querySelector('#search');
const tier = document.querySelector('#tier');
const bank = document.querySelector('#bank');
const hosting = document.querySelector('#hosting');
const count = document.querySelector('#result-count');

function applyFilters() {
  if (!cards.length) return;
  const q = (search?.value || '').trim().toLowerCase();
  let visible = 0;
  for (const card of cards) {
    const matches = (!q || card.dataset.search.includes(q))
      && (!tier?.value || card.dataset.tier === tier.value)
      && (!bank?.value || card.dataset.bank === bank.value)
      && (!hosting?.value || card.dataset.hosting.includes(hosting.value));
    card.hidden = !matches;
    if (matches) visible++;
  }
  if (count) count.textContent = `${visible}件を表示中`;
}

[search, tier, bank, hosting].forEach(el => el?.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', applyFilters));
applyFilters();

