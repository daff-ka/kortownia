/* Preloader: biały ekran, kropka z logo odbija się w miejscu (animacja CSS
   „preloader-bounce” w style.css), licznik %. Gdy hero (modele 3D + fonty)
   jest gotowe, kropka zatrzymuje się w szczycie odbicia i sama rośnie
   w okrąg odsłaniający stronę – okrąg startuje dokładnie z jej rozmiaru. */

const root = document.documentElement;
const el = document.getElementById('preloader');

const MAX_TIME = 20;         // po tym czasie odsłaniamy niezależnie od stanu
// Ile najwyżej czekamy na modele 3D – potem odsłaniamy stronę z grafikami
// PNG, a 3D podmienia je płynnie po wczytaniu (kv3d.js).
const KV_WAIT = window.matchMedia('(max-width: 1023px)').matches ? 2 : 5;
const REVEAL_MS = 1100;

if (el) run();

function run() {
    window.__preloaderAlive = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ball = el.querySelector('.preloader__ball');
    const countEl = el.querySelector('[data-count]');

    const kvState = (window.__kvState ||= { progress: 0, ready: false });
    let fontsReady = !document.fonts;
    if (document.fonts) document.fonts.ready.then(() => { fontsReady = true; });

    let shown = 0;               // wyświetlany licznik
    let revealing = false;
    let revealStart = 0;
    let origin = null;           // środek i promień kropki w chwili startu (px, viewport)
    let pending = false;
    let freezeY = 0;
    let last = performance.now();
    const start = last;

    const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    function canFinish() {
        const elapsed = (performance.now() - start) / 1000;
        const kvDone = kvState.ready || elapsed >= KV_WAIT;
        const fontsDone = fontsReady || elapsed >= KV_WAIT + 1; // font-display: swap dociągnie resztę
        // Bez czekania na dojście (ukrytego) licznika do 100 – o jedno odbicie krócej.
        return (kvDone && fontsDone) || elapsed >= MAX_TIME;
    }

    // Każde okrążenie animacji kończy się uderzeniem w podłogę; szczyt
    // (kropka idealnie okrągła, prędkość 0) wypada pół okresu później.
    const period = parseFloat(getComputedStyle(ball).animationDuration) || 0.55;
    ball.addEventListener('animationiteration', () => {
        if (revealing || pending || !canFinish()) return;
        pending = true;
        setTimeout(startReveal, (period / 2) * 1000);
    });

    function startReveal() {
        revealing = true;
        countEl.textContent = '100';
        revealStart = performance.now();
        // Zatrzymanie w szczycie: aktualne przesunięcie z animacji zamieniamy
        // na stały transform i dalej skalujemy wokół środka kropki.
        ball.style.animationPlayState = 'paused';
        const m = new DOMMatrixReadOnly(getComputedStyle(ball).transform);
        freezeY = m.f;
        ball.style.animation = 'none';
        ball.style.transformOrigin = '50% 50%';
        ball.style.transform = `translate(-50%, ${freezeY}px)`;
        const rect = ball.getBoundingClientRect();
        origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, r: rect.width / 2 };
        el.classList.add('is-revealing');
        root.classList.remove('is-loading');
        root.classList.add('is-loaded');
    }

    function reveal() {
        const t = Math.min(1, (performance.now() - revealStart) / REVEAL_MS);
        const e = easeInOutCubic(t);
        const maxR = Math.hypot(
            Math.max(origin.x, window.innerWidth - origin.x),
            Math.max(origin.y, window.innerHeight - origin.y),
        ) + 2;
        const r = origin.r + e * (maxR - origin.r);
        el.style.background = `radial-gradient(circle at ${origin.x}px ${origin.y}px,
            transparent ${r}px, var(--kreda) ${r + 1}px)`;

        // Kropka rośnie razem z okręgiem (ten sam kształt), a jej kolor
        // przechodzi w odsłanianą stronę.
        ball.style.transform = `translate(-50%, ${freezeY}px) scale(${r / origin.r})`;
        ball.style.opacity = String(Math.max(0, 1 - t / 0.28));
        return t >= 1;
    }

    function finish() {
        el.remove();
        window.__preloaderAlive = false;
    }

    function updateCount(dt) {
        // Licznik goni realny postęp, 100 dopiero gdy wszystko gotowe.
        const target = kvState.ready && fontsReady ? 100 : Math.min(96, 8 + kvState.progress * 88);
        shown += (target - shown) * Math.min(1, dt * (kvState.ready ? 6 : 3));
        countEl.textContent = String(Math.round(shown)).padStart(3, '0');
    }

    function frame(now) {
        const dt = Math.min((now - last) / 1000, 1 / 30);
        last = now;
        if (!revealing) {
            updateCount(dt);
        } else if (reveal()) {
            finish();
            return;
        }
        requestAnimationFrame(frame);
    }

    // Ograniczony ruch: bez odbić (CSS), spokojne wygaszenie.
    function tickReduced(now) {
        const elapsed = (now - start) / 1000;
        const ready = (kvState.ready && fontsReady) || elapsed >= MAX_TIME;
        countEl.textContent = ready ? '100' : String(Math.round(8 + kvState.progress * 88)).padStart(3, '0');
        if (ready) {
            root.classList.remove('is-loading');
            root.classList.add('is-loaded');
            el.classList.add('is-fading');
            setTimeout(finish, 500);
            return;
        }
        requestAnimationFrame(tickReduced);
    }

    requestAnimationFrame(reduceMotion ? tickReduced : frame);
}
