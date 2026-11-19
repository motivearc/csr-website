# Meridian Group — Corporate Responsibility site

A single-page Corporate Social Responsibility website for **Meridian Group**, a fictional infrastructure company.
Built with plain HTML, CSS and JavaScript: no frameworks, no build step and no external dependencies, so it works offline.

## Run it

**Option 1:** open `index.html` directly in any modern browser (double-click it).

**Option 2:** serve the folder locally (recommended, because smooth anchor scrolling and the behaviour match production):

```bash
# Python 3
python -m http.server 8000
# or Node
npx serve .
```

Then visit <http://localhost:8000>.

## Structure

```
index.html        Page markup (semantic HTML5, inline SVG icons and illustrations)
css/styles.css    Design tokens, layout, components, responsive and reduced-motion rules
js/main.js        Mobile nav, scroll-reveal, metric count-up, contact form validation, placeholder downloads
```

## Editing content

- **Impact metrics** live only in `index.html`, in the `#metrics-list` list. Each value is written out in full, e.g.

  ```html
  <span class="metric-value"><span class="unit">£</span><span data-count="12.4" data-decimals="1">12.4</span><span class="unit">m</span></span>
  ```

  `data-count` is the number to count up to, `data-decimals` (optional) the decimal places, and any prefix or suffix
  goes in a `.unit` span outside the counted element. `js/main.js` only animates the number; with JavaScript off or
  reduced motion on, the markup is shown as written.
- **Accent colour** and the other design tokens are CSS custom properties in `:root` at the top of `css/styles.css`.
  Form controls use `--line-input`, which meets the 3:1 contrast requirement for non-text UI.
- **Report download links** are placeholders: they have `href="#contact"` and a `data-placeholder-download` attribute.
  Without JavaScript they go to the contact form. With JavaScript, a status line under the list says the document isn't
  published online yet and links to the contact form with "Reporting & data" preselected. When a file is ready, set its
  real URL as the `href` and remove `data-placeholder-download`.
- Any link with `data-enquiry="<option value>"` preselects that enquiry type in the contact form.

## Notes

- The contact form is front-end only. It validates on the client and shows a simulated success state. Connect it to a real endpoint before going live.
- Motion respects `prefers-reduced-motion`.
- All company names, people, figures and organisations are fictional.
