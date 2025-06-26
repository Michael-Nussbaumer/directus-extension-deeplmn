import { FIELD_CONFIG, DIRECTUS_TRANSLATIONS } from "./config";
import { getService, processFields, getLanguageConfig, hasTranslationFieldChanged } from "./helpers/common";
import { deeplTranslate } from "./helpers/deepl";

export default ({ filter, action }, { services, database, getSchema, logger }) => {
    const { ItemsService, FieldsService, TranslationsService } = services;

    const handleChanges = async ({ event, payload, keys, collection, database, schema, accountability }) => {
        const { mode, doTranslation, sourceLanguage, autoTranslateLanguages } = await getLanguageConfig({
            ItemsService,
            schema,
        });

        const { translationFields, allTranslatableFields, translationPayload, sourceTranslationChanged } = hasTranslationFieldChanged({ schema, collection, payload, sourceLanguage, mode });

        const key = keys?.[0] || payload?.id;

        if (!sourceTranslationChanged || !doTranslation || !key) {
            return payload;
        }

        const itemsService = getService({ ItemsService, schema, collection });

        const currentItem = await itemsService.readOne(key, {
            fields: ["id", ...translationFields.map((f) => `${f}.*`)],
        });

        if (mode === "default") {
            // In default mode, we always translate fields that are not present in the current item
            for (const field of translationFields) {
                const currentTranslation = currentItem[field]?.find((t) => t?.languages_code === sourceLanguage.code) || null;
                if (currentTranslation) {
                    Object.keys(currentTranslation).forEach((k) => {
                        if (!allTranslatableFields?.[field]?.includes(k)) {
                            delete currentTranslation[k];
                        }
                    });
                    translationPayload[field] = currentTranslation;
                }
            }
        }

        const updatePayload = {};
        try {
            for (const field of Object.keys(translationPayload)) {
                const existingSourceTranslation = JSON.parse(JSON.stringify(currentItem))?.[field]?.find((t) => t?.languages_code === sourceLanguage.code) || null;
                updatePayload[field] = {
                    create: [],
                    update: [],
                };

                for (const lang of autoTranslateLanguages) {
                    let translatedPayload = {};

                    const existingTranslation = JSON.parse(JSON.stringify(currentItem))?.[field]?.find((t) => t?.languages_code === lang.code) || null;

                    if (existingSourceTranslation) {
                        // Filter out fields that are not in the translationFields
                        Object.keys(existingSourceTranslation).forEach((k) => {
                            if (!allTranslatableFields?.[field]?.includes(k)) {
                                delete existingSourceTranslation[k];
                            } else if (!existingTranslation?.[k]) {
                                translationPayload[field][k] = existingSourceTranslation[k];
                            }
                        });
                    }

                    for (const f of Object.keys(translationPayload[field])) {
                        if (!existingTranslation?.[f]) {
                            const text = translationPayload[field][f];
                            if (!text) continue;

                            translatedPayload[f] = await deeplTranslate(text, sourceLanguage.deeplmn_language, lang.deeplmn_language);
                        }
                    }

                    // to process the fields (trim, slugify, etc.)
                    translatedPayload = await processFields({ schema, collection, field, payload: translatedPayload, FieldsService });

                    if (existingTranslation) {
                        updatePayload[field].update.push({
                            ...existingTranslation,
                            ...translatedPayload,
                        });
                    } else {
                        updatePayload[field].create.push({
                            languages_code: lang.code,
                            ...translatedPayload,
                        });
                    }
                }
            }

            await itemsService.updateOne(key, updatePayload, { emitEvents: false });
        } catch (error) {
            console.error("Error during translation:", error);
        }

        return payload;
    };

    action("items.create", async ({ event, payload, key, keys, collection }, { database, schema, accountability }) => {
        const itemKeys = keys || [key];
        return await handleChanges({ event, payload, keys: itemKeys, collection, database, schema, accountability });
    });

    action("items.update", async ({ event, payload, key, keys, collection }, { database, schema, accountability }) => {
        const itemKeys = keys || [key];
        return await handleChanges({ event, payload, keys: itemKeys, collection, database, schema, accountability });
    });

    action("server.start", async (meta, context) => {
        let schema = await getSchema();
        const fieldsService = new FieldsService({
            accountability: { admin: true },
            schema: schema,
        });
        for (const [collection, fields] of Object.entries(FIELD_CONFIG)) {
            for (const fieldConfig of fields) {
                try {
                    await fieldsService.readOne(collection, fieldConfig.field);
                    console.log(`[✔] Field '${fieldConfig.field}' already exists in '${collection}'`);
                } catch {
                    try {
                        await fieldsService.createField(collection, fieldConfig);
                        console.log(`[+] Created field '${fieldConfig.field}' in '${collection}'`);
                    } catch (err) {
                        console.error(`[✖] Failed to create field '${fieldConfig.field}' in '${collection}':`, err.message);
                    }
                }
            }
        }

        const translationsService = new TranslationsService({
            accountability: { admin: true },
            schema: schema,
        });
        for (const translation of DIRECTUS_TRANSLATIONS) {
            try {
                const translationsRes = await translationsService.readByQuery({
                    filter: {
                        key: translation.key,
                        language: translation.language,
                    },
                });

                if (translationsRes.length > 0) {
                    console.log(`[✔] Translation '${translation.key}' for language '${translation.language}' already exists`);
                    continue;
                }
                await translationsService.createOne(translation);
                console.log(`[+] Created translation '${translation.key}' for '${translation.language}'`);
            } catch {
                console.error(`[✖] Failed to create translation '${translation.key}' for '${translation.language}':`, err.message);
            }
        }
    });
};
