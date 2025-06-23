# directus-extension-deeplmn

A Directus extension bundle for automatic translation of content using DeepL, with flexible language and translation management.

---

## Features

-   **Automatic translation** of content fields using the DeepL API
-   **Directus settings integration** for translation modes

---

## Installation

### 1. Install via Directus Marketplace

This extension can be installed via the Directus Marketplace.

**Alternatively, install via npm:**

```bash
npm install directus-extension-deeplmn
```

Then copy the extension files to your Directus extensions directory.

---

## Configuration

### 1. DeepL API Key

Set your DeepL API key as an environment variable in your Directus project:

```bash
export DEEPLMN_API_KEY=your-deepl-api-key
```

Or add it to your `.env` file:

```
DEEPLMN_API_KEY=your-deepl-api-key
```

### 2. Directus Language Configuration

In your Directus instance, navigate to `https://directus.example.com/admin/content/languages` and configure the languages:

-   **DeepL Language Keys**: Set the DeepL language key for all languages you want to translate. See [DeepL Supported Languages](https://developers.deepl.com/docs/getting-started/supported-languages).
-   **Source Language**: Select the checkbox for the source language, which will be the base for your translations.
-   **Target Languages**: For all target languages, select the checkbox to enable automatic translation.

The extension will attempt to create the required fields and translations on server start.

---

## Usage

Once installed and configured:

-   On item creation or update, the extension will automatically translate fields for enabled languages.
-   The translation mode can be set in Directus settings (`deeplmn_mode`):
    -   `default`: Always translate empty fields if present in the default language.
    -   `only_new`: Only translate for new content.

---

## Development

### Requirements

-   Node.js 18+
-   Directus 10+

### Build

If you make changes, rebuild the extension:

```bash
npm run build
```

---

## License

MIT

---

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/MichaelNussbaumerGOWEST/directus-extension-deeplmn/issues) page.

---

## Credits

-   [DeepL API](https://www.deepl.com/docs-api)
-   [Directus](https://directus.io/)
