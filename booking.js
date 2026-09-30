/* ---------- Zapis na pierwszą lekcję (modal) ----------
   Otwierany z każdego linku do #zapisy. Tryb testowy: zgłoszenie nie wychodzi
   z przeglądarki – trafia do konsoli, a modal pokazuje ekran potwierdzenia.
   Docelowo BOOKING_ENDPOINT wskaże funkcję, która powiadomi trenera na WhatsAppie. */

const BOOKING_ENDPOINT = null;

(() => {
    const i18n = window.pageI18n || (window.pageI18n = {});
    Object.assign((i18n.pl = i18n.pl || {}), {
        bkTitle: 'Umów pierwszą lekcję',
        bkLead: 'Zostaw numer, a trener oddzwoni w ciągu jednego dnia roboczego i dobierze termin do Twojego poziomu.',
        bkClose: 'Zamknij',
        bkOffer: 'Od czego zaczynamy?',
        bkOfferSolo: 'Lekcja próbna 1 na 1',
        bkOfferGroup: 'Trening w grupie',
        bkOfferKids: 'Zajęcia dla dziecka',
        bkLevel: 'Twój poziom',
        bkLevelNew: 'Pierwszy raz z rakietą',
        bkLevelBack: 'Wracam po przerwie',
        bkLevelRegular: 'Gram regularnie',
        bkTime: 'Kiedy Ci pasuje?',
        bkTimeMorning: 'Rano',
        bkTimeAfternoon: 'Po 16:00',
        bkTimeWeekend: 'Weekend',
        bkName: 'Imię',
        bkPhone: 'Telefon',
        bkConsent: 'Zgadzam się na kontakt telefoniczny w sprawie lekcji. Dane przetwarzamy zgodnie z',
        bkConsentLink: 'polityką prywatności',
        bkSubmit: 'Wyślij zgłoszenie',
        bkPromise: 'Bez zobowiązań – płacisz dopiero na korcie.',
        bkErrName: 'Wpisz imię, żeby trener wiedział, do kogo dzwoni.',
        bkErrPhone: 'Wpisz numer telefonu – 9 cyfr, np. 600 123 456.',
        bkErrConsent: 'Zaznacz zgodę, żebyśmy mogli oddzwonić.',
        bkDoneTitle: 'Dzięki, {name}! Mamy Twoje zgłoszenie',
        bkDoneLead: 'Trener zadzwoni na numer {phone} w ciągu jednego dnia roboczego. Na pierwszą lekcję weź wodę i buty z płaską, jasną podeszwą – rakietę i piłki masz od nas.',
        bkSumOffer: 'Zajęcia',
        bkSumLevel: 'Poziom',
        bkSumTime: 'Pory',
        bkAnyTime: 'dowolne',
        bkTest: 'Tryb testowy: zgłoszenie nie zostało wysłane.',
    });
    Object.assign((i18n.en = i18n.en || {}), {
        bkTitle: 'Book your first lesson',
        bkLead: 'Leave your number and a coach will call you back within one working day to find a time that suits your level.',
        bkClose: 'Close',
        bkOffer: 'How would you like to start?',
        bkOfferSolo: 'Trial one-to-one lesson',
        bkOfferGroup: 'Group session',
        bkOfferKids: 'Kids’ classes',
        bkLevel: 'Your level',
        bkLevelNew: 'Never played before',
        bkLevelBack: 'Coming back after a break',
        bkLevelRegular: 'I play regularly',
        bkTime: 'When suits you?',
        bkTimeMorning: 'Mornings',
        bkTimeAfternoon: 'After 4 pm',
        bkTimeWeekend: 'Weekends',
        bkName: 'First name',
        bkPhone: 'Phone',
        bkConsent: 'I agree to be contacted by phone about the lesson. We process your data in line with our',
        bkConsentLink: 'privacy policy',
        bkSubmit: 'Send request',
        bkPromise: 'No commitment – you only pay on court.',
        bkErrName: 'Enter your first name so the coach knows who they’re calling.',
        bkErrPhone: 'Enter your phone number – 9 digits, e.g. 600 123 456.',
        bkErrConsent: 'Tick the box so we can call you back.',
        bkDoneTitle: 'Thanks, {name}! We’ve got your request',
        bkDoneLead: 'A coach will call {phone} within one working day. For your first lesson, bring water and shoes with flat, non-marking soles – rackets and balls are on us.',
        bkSumOffer: 'Session',
        bkSumLevel: 'Level',
        bkSumTime: 'Times',
        bkAnyTime: 'any',
        bkTest: 'Test mode: the request was not sent.',
    });

    const OFFERS = [['solo', 'bkOfferSolo', '119 zł'], ['group', 'bkOfferGroup', '60 zł'], ['kids', 'bkOfferKids']];
    const LEVELS = [['new', 'bkLevelNew'], ['back', 'bkLevelBack'], ['regular', 'bkLevelRegular']];
    const TIMES = [['morning', 'bkTimeMorning'], ['afternoon', 'bkTimeAfternoon'], ['weekend', 'bkTimeWeekend']];

    const chips = (name, type, items, checked) => items.map(([value, key, sub], i) => `
                    <label class="chip">
                        <input type="${type}" name="${name}" value="${value}"${i === checked ? ' checked' : ''}>
                        <span class="chip__body"><span data-i18n="${key}"></span>${sub ? `<span class="chip__sub">${sub}</span>` : ''}</span>
                    </label>`).join('');

    const closeIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

    const dialog = document.createElement('dialog');
    dialog.className = 'booking';
    dialog.setAttribute('aria-labelledby', 'booking-title');
    dialog.innerHTML = `
        <div class="booking__panel">
            <form class="booking__form" novalidate>
                <div class="booking__head">
                    <div>
                        <h2 class="booking__title" id="booking-title" data-i18n="bkTitle" tabindex="-1"></h2>
                        <p class="booking__lead" data-i18n="bkLead"></p>
                    </div>
                    <button class="close-btn" type="button" data-close data-i18n-aria="bkClose">${closeIcon}</button>
                </div>
                <fieldset class="booking__field">
                    <legend class="booking__label" data-i18n="bkOffer"></legend>
                    <div class="chips">${chips('offer', 'radio', OFFERS, 0)}</div>
                </fieldset>
                <fieldset class="booking__field">
                    <legend class="booking__label" data-i18n="bkLevel"></legend>
                    <div class="chips">${chips('level', 'radio', LEVELS, 0)}</div>
                </fieldset>
                <fieldset class="booking__field">
                    <legend class="booking__label" data-i18n="bkTime"></legend>
                    <div class="chips">${chips('time', 'checkbox', TIMES, -1)}</div>
                </fieldset>
                <div class="booking__row">
                    <div class="booking__field">
                        <label class="booking__label" for="bk-name" data-i18n="bkName"></label>
                        <input class="input" id="bk-name" name="name" type="text" autocomplete="given-name" required aria-describedby="bk-name-err">
                        <p class="booking__error" id="bk-name-err" data-error="name" hidden></p>
                    </div>
                    <div class="booking__field">
                        <label class="booking__label" for="bk-phone" data-i18n="bkPhone"></label>
                        <input class="input" id="bk-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="600 000 000" required aria-describedby="bk-phone-err">
                        <p class="booking__error" id="bk-phone-err" data-error="phone" hidden></p>
                    </div>
                </div>
                <div class="booking__field">
                    <label class="check">
                        <input type="checkbox" name="consent" required aria-describedby="bk-consent-err">
                        <span class="check__box" aria-hidden="true"><svg viewBox="0 0 12 10"><path d="M1 5l3.5 3.5L11 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
                        <span class="check__text"><span data-i18n="bkConsent"></span> <a href="polityka-prywatnosci.html" target="_blank" rel="noopener" data-i18n="bkConsentLink"></a>.</span>
                    </label>
                    <p class="booking__error" id="bk-consent-err" data-error="consent" hidden></p>
                </div>
                <div class="booking__actions">
                    <button class="btn btn--primary" type="submit" data-i18n="bkSubmit"></button>
                    <p class="booking__note" data-i18n="bkPromise"></p>
                </div>
            </form>

            <div class="booking__done" hidden>
                <div class="booking__done-top">
                    <span class="booking__ball" aria-hidden="true"></span>
                    <button class="close-btn" type="button" data-close data-i18n-aria="bkClose">${closeIcon}</button>
                </div>
                <h2 class="booking__title" data-done-title tabindex="-1"></h2>
                <p class="booking__lead" data-done-lead></p>
                <dl class="booking__summary" data-summary></dl>
                <p class="booking__test" data-test hidden data-i18n="bkTest"></p>
                <button class="btn btn--primary" type="button" data-close data-i18n="bkClose"></button>
            </div>
        </div>`;
    document.body.append(dialog);

    const form = dialog.querySelector('.booking__form');
    const done = dialog.querySelector('.booking__done');
    const t = (key) => window.pageI18n[document.documentElement.lang][key] || window.pageI18n.pl[key];
    let opener = null;

    function open() {
        opener = document.activeElement;
        form.hidden = false;
        done.hidden = true;
        dialog.classList.remove('is-sent');
        dialog.showModal();
        dialog.querySelector('#booking-title').focus();
    }

    function close() {
        dialog.close();
    }

    dialog.addEventListener('close', () => {
        if (opener && opener.isConnected) opener.focus();
        if (location.hash === '#zapisy') history.replaceState(null, '', location.pathname + location.search);
    });

    // Klik w tło (poza panelem) zamyka modal.
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) close();
        if (e.target.closest('[data-close]')) close();
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href$="#zapisy"]');
        if (!link) return;
        e.preventDefault();
        open();
    });

    /* Walidacja: komunikat pod polem, fokus na pierwszym błędzie. */
    function setError(name, message) {
        const el = form.querySelector(`[data-error="${name}"]`);
        const input = form.elements[name];
        el.textContent = message || '';
        el.hidden = !message;
        input.setAttribute('aria-invalid', String(Boolean(message)));
    }

    function validate() {
        const name = form.elements.name.value.trim();
        const digits = form.elements.phone.value.replace(/\D/g, '').replace(/^(00)?48(?=\d{9}$)/, '');
        const errors = {
            name: name ? '' : t('bkErrName'),
            phone: /^\d{9}$/.test(digits) ? '' : t('bkErrPhone'),
            consent: form.elements.consent.checked ? '' : t('bkErrConsent'),
        };
        Object.entries(errors).forEach(([k, v]) => setError(k, v));
        const first = Object.keys(errors).find((k) => errors[k]);
        if (first) form.elements[first].focus();
        return first ? null : { name, phone: digits };
    }

    /* Telefon formatowany w trakcie pisania: 600 123 456 (z +48: +48 600 123 456).
       Kursor zostaje za tą samą cyfrą, także przy poprawkach w środku numeru. */
    function formatPhone(value) {
        const plus = value.trim().startsWith('+');
        let digits = value.replace(/\D/g, '').replace(/^00/, '');
        let prefix = '';
        if (plus || (digits.length > 9 && digits.startsWith('48'))) {
            prefix = `+${digits.slice(0, 2)} `;
            digits = digits.slice(2);
        }
        digits = digits.slice(0, 9);
        return (prefix + digits.replace(/(\d{3})(?=\d)/g, '$1 ')).trimEnd();
    }

    const phoneInput = form.elements.phone;
    phoneInput.addEventListener('input', (e) => {
        if (e.inputType && e.inputType.startsWith('delete') && /\s$/.test(phoneInput.value)) return;
        const caret = phoneInput.selectionStart;
        const digitsBefore = phoneInput.value.slice(0, caret).replace(/\D/g, '').length;
        const formatted = formatPhone(phoneInput.value);
        if (formatted === phoneInput.value) return;
        phoneInput.value = formatted;
        let pos = 0;
        for (let seen = 0; pos < formatted.length && seen < digitsBefore; pos++) {
            if (/\d/.test(formatted[pos])) seen++;
        }
        phoneInput.setSelectionRange(pos, pos);
    });

    ['name', 'phone', 'consent'].forEach((k) => {
        form.elements[k].addEventListener(k === 'consent' ? 'change' : 'input', () => {
            if (form.elements[k].getAttribute('aria-invalid') === 'true') setError(k, '');
        });
    });

    const label = (items, value) => {
        const item = items.find(([v]) => v === value);
        return item ? t(item[1]) + (item[2] ? ` · ${item[2]}` : '') : '';
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const contact = validate();
        if (!contact) return;

        const data = new FormData(form);
        const request = {
            offer: data.get('offer'),
            level: data.get('level'),
            times: data.getAll('time'),
            name: contact.name,
            phone: contact.phone,
            lang: document.documentElement.lang,
            page: location.pathname,
            sentAt: new Date().toISOString(),
        };

        let testMode = !BOOKING_ENDPOINT;
        if (testMode) {
            console.info('[Kortownia] Zgłoszenie (tryb testowy):', request);
        } else {
            await fetch(BOOKING_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            });
        }

        const phone = contact.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        dialog.querySelector('[data-done-title]').textContent = t('bkDoneTitle').replace('{name}', contact.name);
        dialog.querySelector('[data-done-lead]').textContent = t('bkDoneLead').replace('{phone}', phone);
        const summary = dialog.querySelector('[data-summary]');
        summary.textContent = '';
        [
            [t('bkSumOffer'), label(OFFERS, request.offer)],
            [t('bkSumLevel'), label(LEVELS, request.level)],
            [t('bkSumTime'), request.times.map((v) => label(TIMES, v).toLowerCase()).join(', ') || t('bkAnyTime')],
        ].forEach(([k, v]) => {
            const row = document.createElement('div');
            const dt = document.createElement('dt');
            const dd = document.createElement('dd');
            dt.textContent = k;
            dd.textContent = v;
            row.append(dt, dd);
            summary.append(row);
        });
        dialog.querySelector('[data-test]').hidden = !testMode;

        form.reset();
        form.hidden = true;
        done.hidden = false;
        dialog.classList.add('is-sent');
        dialog.querySelector('[data-done-title]').focus();
    });

    // Wejście z innej strony przez link …#zapisy.
    if (location.hash === '#zapisy') requestAnimationFrame(open);
})();
