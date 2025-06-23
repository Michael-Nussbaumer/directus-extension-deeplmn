const FIELD_CONFIG = {
    languages: [
        {
            field: "deeplmn_language",
            type: "string",
            meta: {
                interface: "input",
                width: "half",
                translations: [
                    { language: "de-DE", translation: "Deepl Sprache" },
                    { language: "en-US", translation: "Deepl Language" },
                ],
            },
        },
        {
            field: "deeplmn_is_source",
            type: "boolean",
            meta: {
                special: ["cast-boolean"],
                interface: "boolean",
                display: "boolean",
                hidden: false,
                readonly: true,
                conditions: [{ name: "only editable if deeplmn_language is not empty", rule: { _and: [{ deeplmn_language: { _nnull: true } }] }, readonly: false }],
                width: "half",
                translations: [
                    { language: "de-DE", translation: "Ist Source Language für Deepl Auto Translate" },
                    { language: "en-US", translation: "Is source language for Deepl Auto Translate" },
                ],
            },
            schema: { default_value: null, is_nullable: true, is_unique: true },
        },
        {
            field: "deeplmn_auto_translate",
            type: "boolean",
            meta: {
                special: ["cast-boolean"],
                interface: "boolean",
                display: "boolean",
                hidden: false,
                readonly: true,
                conditions: [{ name: "only editable if deeplmn_language is not empty", rule: { _and: [{ deeplmn_language: { _nnull: true } }] }, readonly: false }],
                width: "half",
                translations: [
                    { language: "de-DE", translation: "Soll automatisch übersetzt werden?" },
                    { language: "en-US", translation: "Should be translated automatically?" },
                ],
            },
            schema: { default_value: null, is_nullable: true },
        },
    ],
    directus_settings: [
        { type: "alias", meta: { special: ["alias", "no-data"], interface: "presentation-divider", options: { title: "$t:deeplmn_settings_divder_title" } }, field: "deeplmn_divider" },
        {
            type: "string",
            meta: {
                interface: "select-dropdown",
                special: null,
                options: {
                    choices: [
                        { text: "$t:deeplmn_settings_mode_default", value: "default" },
                        { text: "$t:deeplmn_settings_mode_only_new", value: "only_new" },
                    ],
                },
                required: true,

                translations: [
                    { language: "de-DE", translation: "DeepL-MN Modus" },
                    { language: "en-US", translation: "DeepL-MN Mode" },
                ],
            },
            field: "deeplmn_mode",
            schema: { default_value: "default" },
        },
    ],
};

const DIRECTUS_TRANSLATIONS = [
    { language: "de-DE", key: "deeplmn_settings_divder_title", value: "DeepL-MN Einstellungen" },
    { language: "en-US", key: "deeplmn_settings_divder_title", value: "DeepL-MN Settings" },
    { language: "de-DE", key: "deeplmn_settings_mode_default", value: "Leere Übersetzungen immer übersetzen, wenn in Standard Sprache vorhanden (Standard)" },
    { language: "en-US", key: "deeplmn_settings_mode_default", value: "Empty translations should always be translated if present in the default language (default)" },
    { language: "de-DE", key: "deeplmn_settings_mode_only_new", value: "Leere Übersetzungen nur bei neuen Inhalten in der Standard Sprache übersetzen" },
    { language: "en-US", key: "deeplmn_settings_mode_only_new", value: "Empty translations should only be translated for new content in the default language" },
];

const TRANSLATABLE_TYPES = [
    "string",
    "text",
    "json", // Only if it contains translatable strings, e.g., translation objects
];

const DEFAULT_SYSTEM_FIELDS = ["date_created", "date_updated", "status", "languages_code"];

export { FIELD_CONFIG, TRANSLATABLE_TYPES, DIRECTUS_TRANSLATIONS, DEFAULT_SYSTEM_FIELDS };
