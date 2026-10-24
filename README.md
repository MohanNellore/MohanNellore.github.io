# Mohan Nellore, portfolio

Source for [mohannellore.github.io](https://mohannellore.github.io/): a single-page portfolio for an entry-level GCP data engineer and data analyst.

## Structure

```
index.html            The page (content lives here)
404.html              Not-found page
assets/css/style.css  All styles, with design tokens at the top of the file
assets/js/main.js     Menu, active-section marker, analytics events, contact form
assets/img/           Portrait, favicon, social share image
```

There is no build step and no dependencies. Open `index.html` in a browser to preview it.

## Editing

- **Content:** edit the text in `index.html`. Each section has its own `<section>` with an `id`.
- **Colors and fonts:** change the variables in the `:root` block at the top of `assets/css/style.css`.
- **After editing CSS or JS:** change the `?v=` number on the `style.css` and `main.js` links in `index.html` (and `404.html`). Browsers keep old copies for about ten minutes, and a new number makes them fetch the new file.
- **Add a project:** copy an `<article class="project">` block in the Projects section. Each project uses a small inline SVG (a pipeline diagram or a chart) in place of a screenshot; swap in a screenshot with an `<img>` if you prefer.
- **Skills:** the skills table is the `<dl class="facts">` list in the About section. Add one `facts__row` per group.
- **Analytics:** links with a `data-track` attribute send a Google Analytics event when clicked. The event names match the previous version of the site.
- **Contact form:** posts to Formspree (`action` on the `<form>`). It includes a honeypot field to filter spam.

## Fonts

Bricolage Grotesque and Source Serif 4 load from Google Fonts. If they fail to load, the page falls back to system fonts.
