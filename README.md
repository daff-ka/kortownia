# Kortownia

Strona główna szkoły tenisa – statyczny HTML/CSS/JS, bez kroku budowania.

- Dwie nawierzchnie (kort ceglany / twardy) i dwa języki (PL / EN)
- Rakieta i piłka w 3D (three.js) reagujące na kursor; kliknięcie podbija piłkę
- Preloader, linie kortu rozpięte na układzie strony, wersja mobilna

## Uruchomienie

Moduły i modele 3D wymagają serwera (nie działają z `file://`):

```sh
python3 -m http.server 8000
```

i otwórz http://localhost:8000. Linie kortu z makiety Figma: `?grid=figma`.

## Struktura

- `index.html`, `style.css` – układ i style
- `app.js` – nawierzchnia, język, menu mobilne, linie kortu
- `cennik.html`, `cennik.css`, `cennik.js` – cennik (tabela budowana z `data/cennik.json`)
- `data/cennik.json` – ceny i teksty cennika (PL / EN); jedyne miejsce zmiany cen
- `polityka-prywatnosci.html`, `polityka.css` – polityka prywatności (PL / EN w jednym pliku);
  `<mark class="todo">` oznacza zmyślone dane firmy do uzupełnienia
- `booking.js` – modal „Umów pierwszą lekcję” otwierany z linków `#zapisy`; tryb testowy
  (`BOOKING_ENDPOINT = null`) – zgłoszenie trafia tylko do konsoli przeglądarki
- `kv3d.js` – scena 3D (rakieta, piłka, fale)
- `preloader.js` – preloader
- `img/3d/` – skompresowane modele GLB (wersje desktop i mobile)

## Licencje modeli 3D

Modele z Sketchfab, licencja [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/)
(tekstury skompresowane do WebP):

- [Tennis Ball](https://sketchfab.com/3d-models/tennis-ball-edc344dcc65440ea97b5eae84f1957a4) – Tentrox
- [Tennis Racket Wilson Blade](https://sketchfab.com/3d-models/tennis-racket-wilson-blade-599589f98217465f960310104b7aa474) – Vladislav3000111
