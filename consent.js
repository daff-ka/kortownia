/* ---------- Zgoda na Microsoft Clarity (baner cookies) ----------
   Clarity ładuje się dopiero po „Akceptuję”. Decyzja zostaje w localStorage
   („kortownia-consent”: granted / denied); „Ustawienia cookies” w stopce
   pokazuje baner ponownie. Figma: Design System → Baner cookies. */

const CLARITY_ID = 'yqdmq7hhvu';
const CONSENT_KEY = 'kortownia-consent';

(() => {
    const i18n = window.pageI18n || (window.pageI18n = {});
    Object.assign((i18n.pl = i18n.pl || {}), {
        ckLabel: 'Pliki cookies',
        ckText: 'Za Twoją zgodą używamy Microsoft Clarity (pliki cookies), żeby sprawdzić, jak korzystasz ze strony. Imienia i telefonu z formularza nie nagrywamy. Szczegóły w',
        ckLink: 'polityce prywatności',
        ckAccept: 'Akceptuję',
        ckDecline: 'Odrzucam',
    });
    Object.assign((i18n.en = i18n.en || {}), {
        ckLabel: 'Cookies',
        ckText: 'With your consent we use Microsoft Clarity (cookies) to see how you use the site. We never record the name or phone number from the form. Details in our',
        ckLink: 'privacy policy',
        ckAccept: 'Accept',
        ckDecline: 'Decline',
    });

    let loaded = false;

    function loadClarity() {
        if (loaded) return;
        loaded = true;
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
            t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, 'clarity', 'script', CLARITY_ID);
    }

    function signal(granted) {
        if (!window.clarity) return;
        window.clarity('consentv2', {
            ad_Storage: 'denied',
            analytics_Storage: granted ? 'granted' : 'denied',
        });
        // Wycofanie zgody: Clarity usuwa swoje pliki cookies.
        if (!granted) window.clarity('consent', false);
    }

    function read() {
        try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
    }

    function save(value) {
        try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
    }

    const banner = document.createElement('section');
    banner.className = 'consent';
    banner.setAttribute('aria-labelledby', 'consent-title');
    banner.hidden = true;
    banner.innerHTML = `
        <h2 class="consent__title" id="consent-title" data-i18n="ckLabel"></h2>
        <p class="consent__text"><span data-i18n="ckText"></span> <a href="polityka-prywatnosci.html#cookies" data-i18n="ckLink"></a>.</p>
        <div class="consent__actions">
            <button class="btn btn--dark btn--sm" type="button" data-consent="granted" data-i18n="ckAccept"></button>
            <button class="btn btn--outline btn--sm" type="button" data-consent="denied" data-i18n="ckDecline"></button>
        </div>`;
    document.body.append(banner);

    let opener = null;

    function show(focus) {
        opener = focus ? document.activeElement : null;
        banner.hidden = false;
        if (focus) banner.querySelector('[data-consent="granted"]').focus();
    }

    function decide(value) {
        save(value);
        banner.hidden = true;
        if (value === 'granted') {
            loadClarity();
            signal(true);
        } else {
            signal(false);
        }
        if (opener && opener.isConnected) opener.focus();
    }

    banner.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-consent]');
        if (btn) decide(btn.dataset.consent);
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-consent-open]')) show(true);
    });

    const saved = read();
    if (saved === 'granted') {
        loadClarity();
        signal(true);
    } else if (saved !== 'denied') {
        show(false);
    }
})();
