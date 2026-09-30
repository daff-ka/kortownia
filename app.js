const root = document.documentElement;

/* ---------- Nawierzchnia: ceglany / twardy ---------- */

const surfaceButtons = document.querySelectorAll('[data-surface]:not(html)');

// Przesuwana pigułka pod aktywnym segmentem (pozycja i szerokość z układu).
const surfaceSwitch = document.querySelector('.switch--sliding');

function updateThumb() {
    if (!surfaceSwitch) return;
    const active = surfaceSwitch.querySelector('.segment[aria-pressed="true"]');
    if (!active) return;
    surfaceSwitch.style.setProperty('--thumb-x', `${active.offsetLeft}px`);
    surfaceSwitch.style.setProperty('--thumb-w', `${active.offsetWidth}px`);
}

function setSurface(surface) {
    root.dataset.surface = surface;
    surfaceButtons.forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.dataset.surface === surface));
    });
    updateThumb();
    try {
        localStorage.setItem('kortownia-surface', surface);
    } catch (e) {}
}

surfaceButtons.forEach((btn) => {
    btn.addEventListener('click', () => setSurface(btn.dataset.surface));
});

// Klik w etykietę „Kort” przełącza na drugą nawierzchnię.
const surfaceLabel = document.querySelector('.surface-switch__label');
if (surfaceLabel) {
    surfaceLabel.addEventListener('click', () => {
        setSurface(root.dataset.surface === 'ceglany' ? 'twardy' : 'ceglany');
    });
}

setSurface(root.dataset.surface);
// Animacja pigułki dopiero po pierwszym ustawieniu (bez przesuwania przy starcie).
requestAnimationFrame(() => surfaceSwitch && surfaceSwitch.classList.add('is-ready'));
window.addEventListener('resize', updateThumb);
if (document.fonts) document.fonts.ready.then(updateThumb);

/* ---------- Język: PL / ENG ---------- */

const translations = {
    pl: {
        pageTitle: 'Kortownia – szkoła tenisa',
        navLabel: 'Główna',
        navCourt: 'Nasz kort',
        navAbout: 'O nas',
        navPricing: 'Cennik',
        navSignup: 'Zapisy',
        langLabel: 'Język',
        langCode: 'PL',
        langCurrent: 'Język: polski',
        cta: 'Umów pierwszą lekcję',
        ctaPricing: 'Zobacz cennik',
        // |d – łamanie tylko na desktopie, |m – tylko na mobile
        title: 'Od pierwszej|dodbitej piłki|mdo|dprawdziwej pasji',
        lead: 'Treningi indywidualne i w małych grupach –\nod pierwszego odbicia po pierwszy mecz\nze znajomymi.',
        surfaceLabel: 'Kort',
        surfaceClay: 'Ceglany',
        surfaceHard: 'Twardy',
        menuOpen: 'Otwórz menu',
        menuClose: 'Zamknij menu',
        credits: 'Modele 3D · CC BY',
        kvHintClick: 'Kliknij, żeby odbić piłkę',
        kvHintTap: 'Stuknij, żeby odbić piłkę',
    },
    en: {
        pageTitle: 'Kortownia – tennis school',
        navLabel: 'Main',
        navCourt: 'Our court',
        navAbout: 'About us',
        navPricing: 'Pricing',
        navSignup: 'Sign up',
        langLabel: 'Language',
        langCode: 'EN',
        langCurrent: 'Language: English',
        cta: 'Book your first lesson',
        ctaPricing: 'See pricing',
        title: 'From your very|dfirst ball|mto a|dlifelong passion',
        lead: 'One-to-one and small-group coaching –\nfrom your very first hit to your first\nmatch with friends.',
        surfaceLabel: 'Court',
        surfaceClay: 'Clay',
        surfaceHard: 'Hard',
        menuOpen: 'Open menu',
        menuClose: 'Close menu',
        credits: '3D models · CC BY',
        kvHintClick: 'Click to bounce the ball',
        kvHintTap: 'Tap to bounce the ball',
    },
};

const langButtons = document.querySelectorAll('[data-lang]');
let lang = 'pl';

function setLang(next) {
    lang = next;
    const dict = translations[lang];
    root.lang = lang;
    document.title = dict.pageTitle;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const text = dict[el.dataset.i18n];
        if (el.hasAttribute('data-i18n-breaks')) {
            el.textContent = '';
            text.split(/(\|[dm])/).forEach((part) => {
                if (part === '|d' || part === '|m') {
                    const br = document.createElement('span');
                    br.className = part === '|d' ? 'brk-d' : 'brk-m';
                    el.append(br);
                } else {
                    el.append(part);
                }
            });
        } else {
            el.textContent = text;
        }
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
        el.setAttribute('aria-label', dict[el.dataset.i18nAria]);
    });
    langButtons.forEach((btn) => {
        btn.setAttribute('aria-checked', String(btn.dataset.lang === lang));
    });
    updateMenuLabel();
    schedulePlaceMidLine();
    updateThumb();
    try {
        localStorage.setItem('kortownia-lang', lang);
    } catch (e) {}
}

/* Dropdown języka (nawigacja + menu mobilne) */

const langDropdowns = [...document.querySelectorAll('.lang')].map((el) => ({
    el,
    trigger: el.querySelector('.lang__trigger'),
    menu: el.querySelector('.lang__menu'),
    options: [...el.querySelectorAll('.lang__option')],
}));

function setLangOpen(dd, open, focus) {
    dd.trigger.setAttribute('aria-expanded', String(open));
    dd.menu.hidden = !open;
    if (open && focus) {
        const active = dd.options.find((o) => o.dataset.lang === lang) || dd.options[0];
        active.focus();
    }
}

function closeAllLang() {
    langDropdowns.forEach((dd) => setLangOpen(dd, false));
}

langDropdowns.forEach((dd) => {
    dd.trigger.addEventListener('click', () => {
        const open = dd.trigger.getAttribute('aria-expanded') !== 'true';
        closeAllLang();
        setLangOpen(dd, open, open && dd.trigger.matches(':focus-visible'));
    });

    dd.trigger.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setLangOpen(dd, true, true);
        }
    });

    dd.options.forEach((opt, i) => {
        opt.addEventListener('click', () => {
            setLang(opt.dataset.lang);
            setLangOpen(dd, false);
            dd.trigger.focus();
        });
        opt.addEventListener('keydown', (e) => {
            const n = dd.options.length;
            if (e.key === 'ArrowDown') { e.preventDefault(); dd.options[(i + 1) % n].focus(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); dd.options[(i - 1 + n) % n].focus(); }
            if (e.key === 'Home') { e.preventDefault(); dd.options[0].focus(); }
            if (e.key === 'End') { e.preventDefault(); dd.options[n - 1].focus(); }
            if (e.key === 'Tab') setLangOpen(dd, false);
        });
    });
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.lang')) closeAllLang();
});

document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = langDropdowns.find((dd) => dd.trigger.getAttribute('aria-expanded') === 'true');
    if (open) {
        setLangOpen(open, false);
        open.trigger.focus();
        e.stopImmediatePropagation();
    }
}, true);

/* ---------- Menu mobilne ---------- */

const menuButton = document.querySelector('.menu-button');
const menu = document.getElementById('mobile-menu');

function isMenuOpen() {
    return menuButton.getAttribute('aria-expanded') === 'true';
}

function updateMenuLabel() {
    const dict = translations[lang];
    menuButton.setAttribute('aria-label', isMenuOpen() ? dict.menuClose : dict.menuOpen);
}

function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
    document.body.classList.toggle('menu-open', open);
    updateMenuLabel();
}

menuButton.addEventListener('click', () => setMenu(!isMenuOpen()));

menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen()) {
        setMenu(false);
        menuButton.focus();
    }
});

window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches) setMenu(false);
});

/* ---------- Linie kortu: środkowa linia ---------- */

// Desktop: w połowie odstępu między nagłówkiem a plusem/opisem.
// Mobile: w połowie między przełącznikiem nawierzchni a opisem.
const midLine = document.querySelector('.court-line--mid');
const mobileQuery = window.matchMedia('(max-width: 1023px)');

// Pozycja w dokumencie z offsetTop – bez wpływu animacji wejścia (translate).
function docTop(el) {
    let y = 0;
    for (let n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
}

function placeMidLine() {
    if (!midLine) return;
    const $ = (sel) => document.querySelector(sel);
    let above;
    let below;
    if (mobileQuery.matches) {
        // Przełącznik ma translate(-50%, -50%) – jego środek to offsetTop.
        const sw = $('.surface-switch');
        above = docTop(sw) + sw.offsetHeight / 2;
        below = docTop($('.hero__lead'));
    } else {
        const title = $('.hero__title');
        above = docTop(title) + title.offsetHeight;
        below = Math.min(docTop($('.hero__plus')), docTop($('.hero__lead')));
    }
    root.style.setProperty('--grid-mid', `${Math.round((above + below) / 2)}px`);
}

let midLineRaf = 0;
function schedulePlaceMidLine() {
    cancelAnimationFrame(midLineRaf);
    midLineRaf = requestAnimationFrame(placeMidLine);
}

window.addEventListener('resize', schedulePlaceMidLine);
if (document.fonts) document.fonts.ready.then(schedulePlaceMidLine);
new ResizeObserver(schedulePlaceMidLine).observe(document.querySelector('.hero'));

let savedLang = null;
try {
    savedLang = localStorage.getItem('kortownia-lang');
} catch (e) {}
setLang(savedLang in translations ? savedLang : 'pl');
