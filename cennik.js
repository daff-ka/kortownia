/* ---------- Cennik ----------
   Teksty strony (łączone z tłumaczeniami w app.js) i tabela cen budowana
   z data/cennik.json – jedynego miejsca, w którym zmienia się ceny. */

window.pageI18n = {
    pl: {
        pageTitle: 'Cennik – Kortownia',
        ctaHome: 'Strona główna',
        eyebrow: 'Sezon 2026/27',
        pageHeading: 'Cennik',
        pricingLead: 'Każda cena obejmuje kort, piłki i trenera. Rakietę pożyczysz na miejscu bez dopłaty.',
        seasonLabel: 'Sezon',
        seasonSummer: 'Lato',
        seasonWinter: 'Zima',
        tableCaption: 'Ceny w złotych, w sezonie letnim i zimowym',
        colOffer: 'Zajęcia',
        notesTitle: 'Dobrze wiedzieć',
        notAvailable: 'nieczynny',
        updated: 'Ceny z dnia',
        loadError: 'Nie udało się wczytać cennika. Odśwież stronę albo zadzwoń do nas.',
    },
    en: {
        pageTitle: 'Pricing – Kortownia',
        ctaHome: 'Home',
        eyebrow: 'Season 2026/27',
        pageHeading: 'Pricing',
        pricingLead: 'Every price covers the court, balls and coach. Borrow a racket on site at no extra cost.',
        seasonLabel: 'Season',
        seasonSummer: 'Summer',
        seasonWinter: 'Winter',
        tableCaption: 'Prices in Polish złoty, summer and winter season',
        colOffer: 'Sessions',
        notesTitle: 'Good to know',
        notAvailable: 'closed',
        updated: 'Prices as of',
        loadError: 'The price list didn’t load. Refresh the page or give us a call.',
    },
};

(() => {
    const SEASONS = ['lato', 'zima'];
    let data = null;
    let lang = document.documentElement.lang || 'pl';

    const court = document.querySelector('.price-court');
    const table = court.querySelector('.price-table');
    const notesList = document.querySelector('[data-notes]');
    const updatedEl = document.querySelector('[data-updated]');

    const t = (key) => window.pageI18n[lang][key];
    const pick = (field) => (field ? field[lang] ?? field.pl : '');

    function el(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    function priceCell(value, season) {
        const td = el('td', `price is-${season}`);
        if (value == null) {
            td.classList.add('price--none');
            td.append(el('span', 'price__none', t('notAvailable')));
            return td;
        }
        const amount = new Intl.NumberFormat(lang === 'pl' ? 'pl-PL' : 'en-GB').format(value);
        td.append(el('span', 'price__amount', amount), el('span', 'price__currency', 'zł'));
        return td;
    }

    function render() {
        if (!data) return;
        table.querySelectorAll('tbody').forEach((b) => b.remove());

        SEASONS.forEach((s) => {
            const th = table.querySelector(`[data-season-col="${s}"]`);
            th.textContent = '';
            th.append(
                el('span', 'season__name', pick(data.seasons[s].name)),
                el('span', 'season__period', pick(data.seasons[s].period)),
            );
        });

        data.groups.forEach((group) => {
            const body = el('tbody', 'price-group');
            body.dataset.group = group.id;

            const headRow = el('tr', 'price-group__head');
            const headCell = el('th');
            headCell.colSpan = 3;
            headCell.scope = 'rowgroup';
            headCell.append(
                el('span', 'price-group__name', pick(group.name)),
                el('span', 'price-group__unit', pick(group.unit)),
            );
            headRow.append(headCell);
            body.append(headRow);

            group.items.forEach((item) => {
                const row = el('tr', 'price-row');
                const offer = el('th', 'offer');
                offer.scope = 'row';
                const name = el('span', 'offer__name', pick(item.name));
                if (item.badge) name.append(el('span', 'offer__badge', pick(item.badge)));
                offer.append(name, el('span', 'offer__detail', pick(item.detail)));
                row.append(offer, ...SEASONS.map((s) => priceCell(item.prices[s], s)));
                body.append(row);
            });

            table.append(body);
        });

        notesList.textContent = '';
        data.notes.forEach((note) => notesList.append(el('li', null, pick(note))));

        const date = new Date(`${data.updated}T12:00:00`);
        updatedEl.textContent = `${t('updated')} ${date.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }

    document.addEventListener('kortownia:lang', (e) => {
        lang = e.detail;
        render();
    });

    fetch('data/cennik.json', { cache: 'no-cache' })
        .then((r) => {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        })
        .then((json) => {
            data = json;
            render();
            court.classList.add('is-ready');
        })
        .catch(() => {
            court.replaceWith(el('p', 'pricing__error', t('loadError')));
        });

    /* Mobile: przełącznik sezonu pokazuje jedną kolumnę cen. */
    const seasonButtons = document.querySelectorAll('.season-switch [data-season]');
    seasonButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            court.dataset.season = btn.dataset.season;
            seasonButtons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        });
    });
})();
