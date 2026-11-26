# Saved SAP pages

Put SAP.com pages you have saved from your own Chrome browser in this folder.

## How to save a page

1. Open the SAP.com page in Chrome.
2. Press `Ctrl+S` (`Cmd+S` on macOS).
3. Choose **Webpage, Complete**.
4. Save the `.html` file here. Chrome will create a companion `_files` folder — keep it next to the HTML file.
5. From the project root, run:

```bash
npm run import:pages
```

The importer will:

- add every saved page as a Next.js route,
- copy referenced images/fonts into `public/assets/`,
- rewrite SAP links to local routes,
- remove scripts/styles/header/footer/nav so the shared site shell stays consistent,
- merge results into `src/data/pages.json`.

Nested folders become nested routes, for example:

```text
saved-pages/products/cloud-erp.html  ->  /products/cloud-erp
saved-pages/industries.html          ->  /industries
```

You can also pass a custom folder:

```bash
npm run import:pages -- "C:\path\to\saved\sap-pages"
```

Only import pages and assets you are authorized to use locally. This project is a private local study clone; nothing is deployed.
