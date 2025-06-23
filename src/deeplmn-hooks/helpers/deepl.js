import * as deepl from "deepl-node";

const deeplTranslate = async (input, sourceLang, targetLang) => {
    try {
        const authKey = process.env.DEEPLMN_API_KEY;
        if (!authKey) throw new Error("DEEPLMN_API_KEY is not set");
        const deeplClient = new deepl.DeepLClient(authKey);

        if (typeof input === "string") {
            const result = await deeplClient.translateText(input, sourceLang || null, targetLang);
            return result?.text || null;
        }

        if (typeof input === "object" && input !== null) {
            const translatedObj = Array.isArray(input) ? [] : {};

            for (const key of Object.keys(input)) {
                const val = input[key];
                if (typeof val === "string") {
                    translatedObj[key] = await deeplTranslate(val, sourceLang, targetLang);
                } else if (typeof val === "object") {
                    translatedObj[key] = await deeplTranslate(val, sourceLang, targetLang);
                } else {
                    translatedObj[key] = val; // Leave other types (number, boolean) unchanged
                }
            }

            return translatedObj;
        }
    } catch (error) {
        console.error("DeepL translation error:", error);
        return null;
    }

    // If input is neither string nor object
    return input;
};

export { deeplTranslate };
