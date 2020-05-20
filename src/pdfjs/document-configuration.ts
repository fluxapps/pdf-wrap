import { PageRenderingMode, ViewFeatures } from "../api/document.service";

const DEFAULT_FEATURE_CONFIG: ViewFeatures = Object.freeze({
    renderingMode: PageRenderingMode.WEBGL,
    selectableText: true
});

/**
 * Takes the optional feature config and adds the missing default values.
 *
 * @param partialConfig - The partial feature config which overwrites the default values.
 * @return A valid view feature configuration.
 */
export function parseViewFeatureConfig(partialConfig: Partial<ViewFeatures> | undefined): ViewFeatures {
    if (!partialConfig) {
        return DEFAULT_FEATURE_CONFIG;
    }

    const defaults: ViewFeatures = Object.assign({}, DEFAULT_FEATURE_CONFIG);
    const config: ViewFeatures = Object.assign(
        defaults,
        partialConfig
    );

    return Object.freeze(config);
}
