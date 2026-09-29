import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/* KV 3D: rakieta + piłka (GLB) w miejscu grafik z Figmy.
   Świat liczony w px projektu ramki KV (499.53 × 799) – ten sam układ
   na desktopie i mobile (mobile to ta sama ramka przeskalowana). */

const kv = document.querySelector('.kv');

// Stan ładowania dla preloadera (preloader.js czyta go i słucha zdarzeń).
const kvState = (window.__kvState ||= { progress: 0, ready: false });
function signalProgress(value) {
    kvState.progress = value;
    window.dispatchEvent(new CustomEvent('kv:progress', { detail: value }));
}
function signalReady() {
    kvState.progress = 1;
    kvState.ready = true;
    window.dispatchEvent(new CustomEvent('kv:ready'));
}

const DESIGN = { w: 499.53, h: 799 };
// Canvas wychodzi poza ramkę KV, żeby przechył i floating nie ucinały brył.
const BLEED = 0.25;
const CAMERA_FOV = 14;

// Pozycje zmierzone na renderze z Figmy (px w ramce KV).
const RACKET = { butt: [159.4, 781], tip: [264.4, 3], faceTurn: 0.28 };
const BALL = { center: [206.4, 195], diameter: 82, z: 60 };

/* Dwa fizycznie różne przedmioty – każdy ma własną sprężynę:
   rakieta: ciężka, trzymana za rączkę, tłumiona krytycznie (bez odbicia),
            spóźnia się i przechyla z bezwładności przy szybkim ruchu;
   piłka:   lekka, bliżej kamery, niedotłumiona (dobija z lekkim odbiciem),
            przesuwa się mocniej i toczy się zgodnie z kierunkiem ruchu. */
const RACKET_PHYS = {
    pivot: 0.16,          // punkt obrotu: 16% długości od końca rączki (chwyt)
    tilt: 0.2,            // maks. obrót za myszką (rad)
    shift: 6,             // przesunięcie za myszką (px)
    inertiaLean: 0.035,   // przechył z bezwładności (rad na jednostkę prędkości)
    stiffness: 9,
    damping: 6,           // ζ ≈ 1 – spokojnie, bez odbicia
    float: { amp: 14, speed: 0.85 },
};
const BALL_PHYS = {
    tilt: 0.5,
    shift: 26,
    roll: 2.2,            // obrót od prędkości (toczenie)
    idleSpin: 0.18,
    stiffness: 38,
    damping: 5.5,         // ζ ≈ 0.45 – lekkie dobicie i powrót
    float: { amp: 20, speed: 1.35, drift: 6 },
};
/* Fale (SVG za bryłami): płaska warstwa najdalej od kamery – przechyla się
   w 3D (CSS) w stronę kursora, ale przesuwa w przeciwną stronę niż bryły,
   co wzmacnia wrażenie głębi. Sprężyna pośrednia między rakietą a piłką. */
const WAVES_PHYS = {
    tilt: 14,             // maks. obrót (stopnie)
    shift: -12,           // przesunięcie za myszką (px) – przeciwnie do brył
    stiffness: 14,
    damping: 6.5,         // ζ ≈ 0.87 – miękko, prawie bez odbicia
    float: { amp: 8, speed: 0.7 },
};

/* Kliknięcie w obszar KV: rakieta wykonuje uderzenie (zamach → uderzenie →
   wymach) obracając się wokół chwytu. Piłka to osobne ciało: grawitacja
   ciągnie ją wzdłuż HIT.dir do naciągu, a zderzenie z naciągiem liczone jest
   z prędkości względnej – przy uderzeniu piłka dostaje prędkość rakiety,
   przy lądowaniu odbija się (restitution), a rakieta ugina się pod nią. */
const HIT = {
    gravity: 2600,        // px/s², wzdłuż HIT.dir w stronę naciągu
    dir: new THREE.Vector3(0.06, 0.42, 1).normalize(),
    eHit: 0.1,            // sprężystość przy aktywnym uderzeniu rakietą
    eLand: 0.5,           // sprężystość przy lądowaniu na naciągu
    rest: 70,             // poniżej tej prędkości względnej piłka leży (px/s)
    spin: 16,             // rotacja po uderzeniu (rad/s), wygasa
    spinDecay: 1.6,
    recoil: 0.00012,      // ugięcie rakiety przy lądowaniu (rad na px/s)
    maxLaunch: 1150,      // limit prędkości po uderzeniu rakietą (px/s)
    air: 12,              // powyżej tej wysokości nad naciągiem piłka jest „w locie” (px)
    juggle: { min: 950, add: 600, max: 1300 }, // podbicie kursorem w locie (px/s)
};
// Kąt główki (rad) wokół chwytu: + = główka do kamery.
const SWING = {
    windup: -0.14, tWindup: 0.16,   // zamach do tyłu
    strike: 0.09, tStrike: 0.15,    // uderzenie (przyspieszające)
    tBack: 0.5,                     // wymach i powrót
};

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const root = document.documentElement;

function toWorld([x, y]) {
    return new THREE.Vector3(x - DESIGN.w / 2, DESIGN.h / 2 - y, 0);
}

function init() {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
        signalReady();
        return; // brak WebGL – zostają grafiki PNG
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    // Neutral zachowuje nasycenie (ACES wybielał żółć piłki).
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const canvas = renderer.domElement;
    canvas.className = 'kv__canvas';
    canvas.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.9;

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-300, 500, 700);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.8);
    rim.position.set(400, -200, -300);
    scene.add(rim);

    // Kamera: 1 jednostka świata = 1 px projektu na płaszczyźnie z = 0.
    const viewH = DESIGN.h * (1 + 2 * BLEED);
    const viewW = DESIGN.w * (1 + 2 * BLEED);
    const camDist = (viewH / 2) / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, viewW / viewH, 10, camDist * 3);
    camera.position.set(0, 0, camDist);
    camera.lookAt(0, 0, 0);

    // Kompensacja perspektywy dla obiektu przesuniętego w z.
    const perspectiveScale = (z) => (camDist - z) / camDist;

    // Grupy: float (pozycja) → tilt (obrót za myszką) → orient (ułożenie z Figmy) → model
    const racket = { float: new THREE.Group(), tilt: new THREE.Group(), orient: new THREE.Group() };
    const ball = { float: new THREE.Group(), tilt: new THREE.Group(), orient: new THREE.Group() };
    for (const o of [racket, ball]) {
        o.float.add(o.tilt);
        o.tilt.add(o.orient);
        scene.add(o.float);
    }

    const racketMid = toWorld(RACKET.butt).add(toWorld(RACKET.tip)).multiplyScalar(0.5);
    // Rakieta obraca się wokół chwytu, nie wokół środka.
    const racketPivot = toWorld(RACKET.butt).lerp(toWorld(RACKET.tip), RACKET_PHYS.pivot);
    racket.float.position.copy(racketPivot);
    racket.orient.position.copy(racketMid).sub(racketPivot);
    const ballPos = toWorld(BALL.center);
    ballPos.z = BALL.z;
    // Punkt w z > 0 rzutuje się dalej od środka ekranu – przesuwamy go
    // tak, żeby na ekranie wypadł dokładnie w miejscu z projektu.
    ballPos.x *= perspectiveScale(BALL.z);
    ballPos.y *= perspectiveScale(BALL.z);
    ball.float.position.copy(ballPos);

    function setupRacket(model) {
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const dims = [size.x, size.y, size.z];
        const axes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];
        const longIdx = dims.indexOf(Math.max(...dims));
        const thinIdx = dims.indexOf(Math.min(...dims));

        // Kierunek „do główki”: od środka rączki (Rychka) do środka całości.
        let handleCenter = null;
        model.traverse((o) => {
            if (!handleCenter && o.isMesh && /rychka/i.test(o.name)) {
                handleCenter = new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
            }
        });
        const L = axes[longIdx].clone();
        if (handleCenter && center.clone().sub(handleCenter).dot(L) < 0) L.negate();
        const T = axes[thinIdx].clone();
        const B = new THREE.Vector3().crossVectors(L, T);

        const D = toWorld(RACKET.tip).sub(toWorld(RACKET.butt)).normalize();
        const Z = new THREE.Vector3(0, 0, 1);
        const B2 = new THREE.Vector3().crossVectors(D, Z);

        const src = new THREE.Matrix4().makeBasis(L, T, B);
        const dst = new THREE.Matrix4().makeBasis(D, Z, B2);
        const rot = dst.multiply(src.transpose());
        racket.orient.quaternion.setFromRotationMatrix(rot);
        // Lekki skręt wokół osi rakiety – widać grubość ramy.
        racket.orient.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(D, RACKET.faceTurn));

        const length = toWorld(RACKET.tip).distanceTo(toWorld(RACKET.butt));
        racket.orient.scale.setScalar(length / dims[longIdx]);
        racket.orient.add(model);
    }

    function setupBall(model) {
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(box.getCenter(new THREE.Vector3()));
        ball.orient.scale.setScalar((BALL.diameter / Math.max(size.x, size.y, size.z)) * perspectiveScale(BALL.z));
        ball.orient.rotation.set(0.4, -0.6, 0.2);
        model.traverse((o) => {
            if (o.isMesh && o.material) o.material.envMapIntensity = 0.45;
        });
        ball.orient.add(model);
    }

    function resize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        render();
    }

    function render() {
        renderer.render(scene, camera);
    }

    // ---------- Mysz ----------
    let mouseX = 0;
    let mouseY = 0;
    if (canHover) {
        window.addEventListener('pointermove', (e) => {
            mouseX = (e.clientX / window.innerWidth) * 2 - 1;
            mouseY = (e.clientY / window.innerHeight) * 2 - 1;
        });
        document.documentElement.addEventListener('mouseleave', () => {
            mouseX = 0;
            mouseY = 0;
        });
    }

    // ---------- Kliknięcie: uderzenie rakietą ----------
    // Odległość chwyt → piłka: ramię, na którym obrót główki przesuwa naciąg.
    const armL = ballPos.y - racketPivot.y;
    let swingT = -1;       // czas od początku uderzenia (−1 = brak)
    let planeB = 0;        // pozycja naciągu pod piłką wzdłuż HIT.dir (px)
    let ballB = 0;         // pozycja piłki wzdłuż HIT.dir (px)
    let ballV = 0;         // prędkość piłki wzdłuż HIT.dir (px/s)
    let spinV = 0;
    const recoil = { x: 0, v: 0 };  // ugięcie rakiety (sprężyna, rad)
    // Pozycja i promień piłki na ekranie – piłkę w locie można podbić
    // kliknięciem blisko niej, także poza obszarem rakiety.
    const projV = new THREE.Vector3();
    function ballOnScreen() {
        const r = canvas.getBoundingClientRect();
        projV.copy(ball.float.position).project(camera);
        const pxPerUnit = (r.height / viewH) * (camDist / Math.max(1, camDist - ball.float.position.z));
        return {
            x: r.left + ((projV.x + 1) / 2) * r.width,
            y: r.top + ((1 - projV.y) / 2) * r.height,
            radius: (BALL.diameter / 2) * pxPerUnit,
        };
    }
    const swingEnd = SWING.tWindup + SWING.tStrike + SWING.tBack;

    const easeOutQuad = (x) => 1 - (1 - x) * (1 - x);
    const easeInQuad = (x) => x * x;
    const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

    function swingAngle(ts) {
        const { windup, tWindup, strike, tStrike, tBack } = SWING;
        if (ts < tWindup) return windup * easeOutQuad(ts / tWindup);
        ts -= tWindup;
        if (ts < tStrike) return windup + (strike - windup) * easeInQuad(ts / tStrike);
        ts -= tStrike;
        return strike * (1 - easeInOutCubic(Math.min(1, ts / tBack)));
    }

    const isUi = (e) => !!e.target.closest('a, button, .lang, .surface-switch, .mobile-menu');

    function inKv(e) {
        const r = kv.getBoundingClientRect();
        return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }

    function nearBall(e, b = ballOnScreen()) {
        return Math.hypot(e.clientX - b.x, e.clientY - b.y) < b.radius * 2.2 + 24;
    }

    // ---------- Podpowiedź przy piłce ----------
    // Pokazuje się ~1,5 s po wejściu strony, jedzie za piłką, znika po
    // pierwszym odbiciu i już nie wraca (localStorage).
    const hint = document.querySelector('.kv-hint');
    const HINT_KEY = 'kortownia-kv-hint';
    let hintDone = false;
    try {
        // ?hint w adresie – pokaż podpowiedź od nowa (do testów).
        if (new URLSearchParams(location.search).has('hint')) localStorage.removeItem(HINT_KEY);
        hintDone = localStorage.getItem(HINT_KEY) === 'done';
    } catch (e) {}
    let hintVisible = false;

    function showHint() {
        if (!hint || hintDone || reduceMotion) return;
        hintVisible = true;
        placeHint();
        requestAnimationFrame(() => hint.classList.add('is-visible'));
    }

    function dismissHint() {
        if (hintDone) return;
        hintDone = true;
        try { localStorage.setItem(HINT_KEY, 'done'); } catch (e) {}
        if (hint) hint.classList.remove('is-visible');
        setTimeout(() => { hintVisible = false; }, 400);
    }

    function placeHint() {
        if (!hint || !hintVisible) return;
        const b = ballOnScreen();
        const gap = b.radius + 14;
        const w = hint.offsetWidth;
        const h = hint.offsetHeight;
        const vw = window.innerWidth;
        // Z prawej, z lewej, a gdy boki się nie mieszczą – pod piłką.
        let side = 'right';
        if (b.x + gap + w > vw - 16) side = b.x - gap - w >= 16 ? 'left' : 'below';
        let x;
        let y;
        if (side === 'right') { x = b.x + gap; y = b.y - h / 2; }
        else if (side === 'left') { x = b.x - gap - w; y = b.y - h / 2; }
        else {
            x = Math.min(vw - 16 - w, Math.max(16, b.x - w / 2));
            y = b.y + gap;
            hint.style.setProperty('--arrow-x', `${Math.round(b.x - x)}px`);
        }
        hint.classList.toggle('is-left', side === 'left');
        hint.classList.toggle('is-below', side === 'below');
        hint.style.setProperty('--hint-x', `${Math.round(x)}px`);
        hint.style.setProperty('--hint-y', `${Math.round(y)}px`);
    }

    function scheduleHint() {
        const start = () => setTimeout(showHint, 1500);
        if (root.classList.contains('is-loaded')) start();
        else new MutationObserver((_, obs) => {
            if (root.classList.contains('is-loaded')) { obs.disconnect(); start(); }
        }).observe(root, { attributes: true, attributeFilter: ['class'] });
    }

    window.addEventListener('pointerdown', (e) => {
        if (!running || isUi(e)) return;
        if (!inKv(e) && !nearBall(e)) return;
        e.preventDefault(); // bez zaznaczania tekstu przy szybkim klikaniu
        dismissHint();
        // Piłka w locie: podbicie kursorem od razu (żonglerka).
        if (ballB - planeB > HIT.air) {
            const { min, add, max } = HIT.juggle;
            ballV = Math.min(max, Math.max(min, ballV + add));
            spinV = HIT.spin;
        }
        // Rakieta robi zamach, chyba że właśnie trwa zamach/uderzenie.
        if (swingT < 0 || swingT > SWING.tWindup + SWING.tStrike) swingT = 0;
    });

    if (canHover) {
        window.addEventListener('pointermove', (e) => {
            document.body.classList.toggle('kv-hover', running && !isUi(e) && (inKv(e) || nearBall(e)));
        });
    }

    // ---------- Pętla ----------
    const makeSpring = () => ({ x: 0, v: 0 });
    const rs = { x: makeSpring(), y: makeSpring() };  // rakieta
    const bs = { x: makeSpring(), y: makeSpring() };  // piłka
    const ws = { x: makeSpring(), y: makeSpring() };  // fale
    const waves = kv.querySelectorAll('.kv__waves');

    function step(sp, target, k, c, dt) {
        sp.v += (k * (target - sp.x) - c * sp.v) * dt;
        sp.x += sp.v * dt;
    }

    const rollAxis = new THREE.Vector3();
    const clock = new THREE.Clock();
    let running = false;
    let visible = true;

    function frame() {
        if (!running) return;
        requestAnimationFrame(frame);
        const dt = Math.min(clock.getDelta(), 1 / 30);
        const t = clock.elapsedTime;

        // Bez myszy (dotyk): delikatne, samoczynne kołysanie.
        const mx = canHover ? mouseX : Math.sin(t * 0.45) * 0.35;
        const my = canHover ? mouseY : Math.cos(t * 0.35) * 0.25;

        step(rs.x, mx, RACKET_PHYS.stiffness, RACKET_PHYS.damping, dt);
        step(rs.y, my, RACKET_PHYS.stiffness, RACKET_PHYS.damping, dt);
        step(bs.x, mx, BALL_PHYS.stiffness, BALL_PHYS.damping, dt);
        step(bs.y, my, BALL_PHYS.stiffness, BALL_PHYS.damping, dt);
        step(ws.x, mx, WAVES_PHYS.stiffness, WAVES_PHYS.damping, dt);
        step(ws.y, my, WAVES_PHYS.stiffness, WAVES_PHYS.damping, dt);

        // Fale: obrót w stronę kursora (rotateX ujemne, bo oś Y w CSS rośnie w dół).
        // Przesunięcie w px projektu → skala ramki KV.
        const unit = kv.clientWidth / DESIGN.w;
        const wx = ws.x.x * WAVES_PHYS.shift * unit;
        const wy = (ws.y.x * WAVES_PHYS.shift + Math.sin(t * WAVES_PHYS.float.speed + 2) * WAVES_PHYS.float.amp) * unit;
        const wavesTransform = `translate3d(${wx.toFixed(2)}px, ${wy.toFixed(2)}px, 0) ` +
            `rotateX(${(-ws.y.x * WAVES_PHYS.tilt).toFixed(3)}deg) rotateY(${(ws.x.x * WAVES_PHYS.tilt).toFixed(3)}deg)`;
        waves.forEach((w) => { w.style.transform = wavesTransform; });

        // Uderzenie: kąt główki z krzywej zamachu + ugięcie od lądowań.
        let swingA = 0;
        if (swingT >= 0) {
            swingT += dt;
            swingA = swingAngle(swingT);
            if (swingT >= swingEnd) swingT = -1;
        }
        step(recoil, 0, 90, 11, dt);
        const headA = swingA + recoil.x;
        const nextPlane = (armL * Math.sin(headA)) / HIT.dir.z;
        const planeV = dt > 0 ? (nextPlane - planeB) / dt : 0;
        planeB = nextPlane;

        // Piłka: grawitacja w stronę naciągu + zderzenie z naciągiem.
        ballV -= HIT.gravity * dt;
        ballB += ballV * dt;
        if (ballB <= planeB) {
            const rel = ballV - planeV;          // < 0: zbliżają się
            ballB = planeB;
            if (rel < -HIT.rest) {
                const striking = planeV > 150;
                ballV = Math.min(HIT.maxLaunch, planeV - (striking ? HIT.eHit : HIT.eLand) * rel);
                if (striking) spinV = HIT.spin * Math.min(1, -rel / 900);
                else recoil.v += rel * HIT.recoil; // rakieta ugina się pod piłką
            } else {
                ballV = planeV;                  // leży na naciągu
            }
        }
        spinV *= Math.exp(-HIT.spinDecay * dt);

        // Rakieta: skręt za myszką + przechył w przeciwną stronę ruchu (bezwładność główki).
        racket.tilt.rotation.y = rs.x.x * RACKET_PHYS.tilt;
        racket.tilt.rotation.x = rs.y.x * RACKET_PHYS.tilt * 0.6 + headA;
        racket.tilt.rotation.z = -rs.x.v * RACKET_PHYS.inertiaLean - rs.x.x * 0.04;
        racket.float.position.set(
            racketPivot.x + rs.x.x * RACKET_PHYS.shift,
            racketPivot.y + Math.sin(t * RACKET_PHYS.float.speed) * RACKET_PHYS.float.amp - rs.y.x * RACKET_PHYS.shift,
            0,
        );

        // Piłka: mocniejsze przesunięcie (bliżej kamery), dobija z odbiciem.
        ball.tilt.rotation.y = bs.x.x * BALL_PHYS.tilt;
        ball.tilt.rotation.x = bs.y.x * BALL_PHYS.tilt;
        ball.float.position.set(
            ballPos.x + bs.x.x * BALL_PHYS.shift + Math.cos(t * 0.8) * BALL_PHYS.float.drift + HIT.dir.x * ballB,
            ballPos.y + Math.sin(t * BALL_PHYS.float.speed + 1.3) * BALL_PHYS.float.amp - bs.y.x * BALL_PHYS.shift + HIT.dir.y * ballB,
            ballPos.z + HIT.dir.z * ballB,
        );
        if (spinV > 0.01) ball.orient.rotateOnWorldAxis(X_AXIS, -spinV * dt);

        // Toczenie: oś prostopadła do kierunku ruchu na ekranie.
        const vx = bs.x.v;
        const vy = -bs.y.v;
        const speed = Math.hypot(vx, vy);
        if (speed > 1e-4) {
            rollAxis.set(-vy, vx, 0).normalize();
            ball.orient.rotateOnWorldAxis(rollAxis, speed * BALL_PHYS.roll * dt);
        }
        ball.orient.rotateOnWorldAxis(Z_AXIS, BALL_PHYS.idleSpin * dt);

        placeHint();
        render();
    }

    function updateRunning() {
        const should = visible && !document.hidden && !reduceMotion;
        if (should && !running) {
            running = true;
            requestAnimationFrame(frame);
        } else if (!should) {
            running = false;
        }
    }

    new IntersectionObserver((entries) => {
        visible = entries[0].isIntersecting;
        updateRunning();
    }).observe(kv);
    document.addEventListener('visibilitychange', updateRunning);

    // ---------- Ładowanie ----------
    const loader = new GLTFLoader();
    // Mobile: lżejsze modele (tekstury 1024 px zamiast 2048 px).
    const small = window.matchMedia('(max-width: 1023px)').matches;
    const models = small
        ? { racket: 'img/3d/racket-mobile.glb', ball: 'img/3d/ball-mobile.glb' }
        : { racket: 'img/3d/racket.glb', ball: 'img/3d/ball.glb' };
    const bytes = small
        ? { racket: [0, 1217404], ball: [0, 1056072] }
        : { racket: [0, 2482900], ball: [0, 2611716] };
    const onProgress = (key) => (e) => {
        bytes[key] = [e.loaded, e.total || bytes[key][1]];
        const loaded = bytes.racket[0] + bytes.ball[0];
        const total = bytes.racket[1] + bytes.ball[1];
        signalProgress(Math.min(1, loaded / total));
    };
    Promise.all([
        loader.loadAsync(models.racket, onProgress('racket')),
        loader.loadAsync(models.ball, onProgress('ball')),
    ]).then(([racketGltf, ballGltf]) => {
        setupRacket(racketGltf.scene);
        setupBall(ballGltf.scene);
        kv.appendChild(canvas);
        new ResizeObserver(resize).observe(canvas);
        resize();
        kv.classList.add('kv--3d');
        updateRunning();
        // Pierwsza klatka gotowa → preloader może odsłonić stronę.
        requestAnimationFrame(signalReady);
        scheduleHint();
    }).catch((err) => {
        console.warn('[kv3d] Nie udało się wczytać modeli – zostają grafiki 2D.', err);
        signalReady();
    });
}

if (kv) init();
else signalReady();
