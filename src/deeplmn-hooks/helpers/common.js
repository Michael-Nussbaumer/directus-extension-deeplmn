import slugify from "@sindresorhus/slugify";
import { TRANSLATABLE_TYPES, DEFAULT_SYSTEM_FIELDS } from "../config";

const getService = ({ ItemsService, schema, collection }) => {
    return new ItemsService(collection, {
        accountability: {
            admin: true,
        },
        schema,
    });
};

const getTranslationFields = (schema, collection) => {
    return (
        Object.keys(schema?.collections?.[collection]?.fields)?.filter((k) => {
            const f = schema?.collections?.[collection]?.fields[k];
            return f?.special?.includes("translations");
        }) || []
    );
};

const processFields = async ({ schema, collection, field, payload, FieldsService }) => {
    const fieldsService = new FieldsService({
        accountability: { admin: true },
        schema: schema,
    });

    const translateCollection = getTranslationCollection(schema, collection, field);
    const translatableFields = getTranslatableFields(schema, collection, field);
    let fieldInfos = await fieldsService.readAll(translateCollection);
    fieldInfos = fieldInfos.filter((f) => translatableFields.includes(f.field) && Object.keys(payload).includes(f.field));

    Object.keys(payload).forEach((key) => {
        const fieldInfo = fieldInfos.find((f) => f.field === key);

        if (fieldInfo?.meta?.options?.trim) {
            payload[key] = payload[key]?.trim();
        }

        if (fieldInfo?.meta?.options?.slug) {
            payload[key] = slugify(payload[key], { separator: "-", preserveTrailingDash: true });
        }
    });

    return payload;
};

const getTranslationCollection = (schema, collection, field) => {
    return schema?.relations?.find((r) => r?.related_collection === collection && r?.meta?.one_field === field)?.collection || null;
};

const getTranslatableFields = (schema, collection, field) => {
    const translateCollection = getTranslationCollection(schema, collection, field);

    if (!translateCollection) {
        return [];
    }

    const collectionInfo = schema?.collections?.[translateCollection] || {};
    const allFields = collectionInfo?.fields || {};
    const primaryKey = collectionInfo?.primary || "id";

    return Object.keys(allFields).filter((field) => {
        const fieldSchema = allFields[field];

        const isAllowedType = TRANSLATABLE_TYPES.includes(fieldSchema?.type) || false;
        const isSystemField = DEFAULT_SYSTEM_FIELDS.includes(field) || false;
        const isPrimaryKey = field === primaryKey;

        return isAllowedType && !isSystemField && !isPrimaryKey;
    });
};

const getFieldSchema = (schema, collection, field) => {
    return schema?.collections?.[collection]?.fields?.[field] || null;
};

const getLanguageConfig = async ({ ItemsService, schema }) => {
    const settingsService = getService({ ItemsService, schema, collection: "directus_settings" });
    const languageService = getService({ ItemsService, schema, collection: "languages" });

    const languages = await languageService.readByQuery({
        fields: ["*"],
        filter: { _or: [{ deeplmn_is_source: { _eq: true } }, { deeplmn_auto_translate: { _eq: true } }], deeplmn_language: { _nnull: true } },
        limit: -1,
    });

    const settings = await settingsService.readByQuery({
        fields: ["deeplmn_mode"],
        limit: -1,
    });

    const mode = settings?.[0]?.deeplmn_mode || "default";

    const output = {
        mode,
        sourceLanguage: languages.find((l) => l.deeplmn_is_source),
        autoTranslateLanguages: languages.filter((l) => l.deeplmn_auto_translate),
    };

    output.doTranslation = output.sourceLanguage && output.autoTranslateLanguages.length > 0;

    return output;
};

const hasTranslationFieldChanged = ({ schema, collection, payload, sourceLanguage, mode }) => {
    let translationFields = getTranslationFields(schema, collection);

    const sourceTranslationChanged = {};

    translationFields.forEach((field) => {
        sourceTranslationChanged[field] = false;
        if (payload[field] !== undefined) {
            const { create, update } = payload?.[field] || [];

            const translations = [...(create || []), ...(update || [])];
            if (mode === "only_new") {
                sourceTranslationChanged[field] = !!translations?.find((t) => t?.languages_code?.code === sourceLanguage?.code && t?.languages_code !== sourceLanguage?.code);
            } else {
                sourceTranslationChanged[field] = true; // default mode always considers changes
            }
        } else {
            if (mode === "default") {
                sourceTranslationChanged[field] = true; // default mode always considers changes
            }
        }
    });

    if (mode === "only_new") {
        translationFields = translationFields.filter((field) => sourceTranslationChanged[field]);
    }

    const translationPayload = {};

    const allTranslatableFields = {};

    translationFields.forEach((field) => {
        const translatableFields = getTranslatableFields(schema, collection, field);
        allTranslatableFields[field] = [...translatableFields];
        const { create, update } = payload?.[field] || {};
        const translations = [...(create || []), ...(update || [])];
        const sourceTranslation = translations?.find((t) => t?.languages_code?.code === sourceLanguage?.code && t?.languages_code !== sourceLanguage?.code);

        if (!sourceTranslation || mode === "default") {
            return;
        }

        translationPayload[field] = Object.keys(sourceTranslation)
            .filter((f) => translatableFields.includes(f))
            .map((f) => {
                return {
                    languages_code: sourceLanguage.code,
                    field: f,
                    value: sourceTranslation[f],
                };
            })
            .reduce((acc, cur) => {
                acc[cur.field] = cur.value;
                return acc;
            }, {});
    });

    return {
        translationFields,
        allTranslatableFields,
        translationPayload,
        sourceTranslationChanged: Object.values(sourceTranslationChanged).find((changed) => changed) || false,
    };
};

export { getService, getFieldSchema, getTranslatableFields, getLanguageConfig, hasTranslationFieldChanged, processFields };
