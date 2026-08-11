const cards = [...document.querySelectorAll('[data-service-card]')];
const controls = {
  search: document.querySelector('#search'),
  score: document.querySelector('#score'),
  bank: document.querySelector('#bank'),
  payment: document.querySelector('#payment'),
  hosting: document.querySelector('#hosting'),
  format: document.querySelector('#format'),
  region: document.querySelector('#region')
};
const count = document.querySelector('#result-count');
const reset = document.querySelector('#reset-filters');

function includesToken(source, token) {
  return !token || source.split(' ').includes(token);
}

function applyFilters() {
  if (!cards.length || !controls.search) return;
  const query = controls.search.value.trim().toLowerCase();
  let visible = 0;

  for (const card of cards) {
    const matches = (!query || card.dataset.search.includes(query))
      && (!controls.score.value || Number(card.dataset.score) >= Number(controls.score.value))
      && (!controls.bank.value || card.dataset.bank === controls.bank.value)
      && includesToken(card.dataset.payment, controls.payment.value)
      && includesToken(card.dataset.hosting, controls.hosting.value)
      && includesToken(card.dataset.format, controls.format.value)
      && (!controls.region.value || card.dataset.region === controls.region.value);

    card.hidden = !matches;
    if (matches) visible++;
  }

  count.innerHTML = `<strong>${cards.length}</strong>件中 ${visible}件を表示`;
}

Object.values(controls).forEach(control => control?.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', applyFilters));
reset?.addEventListener('click', () => {
  Object.values(controls).forEach(control => { if (control) control.value = ''; });
  applyFilters();
  controls.search.focus();
});

applyFilters();
