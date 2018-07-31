// TODO: Add plugin reloader
class OHIFPlugin {
    // TODO: this class is still under development and will
    // likely change in the near future
    constructor () {
        this.name = "Unnamed plugin";
        this.description = "No description available";
    }

    // load an individual script URL
    static loadScript(scriptURL) {
        const script = document.createElement("script");

        script.src = scriptURL;
        script.type = "text/javascript";
        script.async = false;

        const head = document.getElementsByTagName("head")[0];
        head.appendChild(script);
        head.removeChild(script);

        return script;
    }

    // reload all the dependency scripts and also
    // the main plugin script url.
    static reloadPlugin(plugin) {
        plugin.scriptURLs = plugin.scriptURLs || {};
        plugin.scriptURLs.forEach(scriptURL => {
            this.loadScript(scriptURL).onload = function() {}
        });

        let scriptURL = plugin.url;

        if (plugin.allowCaching === false) {
            scriptURL += "?" + performance.now();
        }

        this.loadScript(scriptURL).onload = function() {
            if (OHIFPlugin.entryPoints[plugin.name]) {
                OHIFPlugin.entryPoints[plugin.name]();
            }
        }
    }
}

class ViewportPlugin extends OHIFPlugin {
    constructor() {
        super()
    }

    static getDisplaySet(viewportIndex) {
        const viewportData = OHIF.viewerbase.layoutManager.viewportData[viewportIndex];
        const { studyInstanceUid, displaySetInstanceUid } = viewportData;
        const studyMetadata = OHIF.viewer.StudyMetadataList.findBy({ studyInstanceUID: studyInstanceUid });

        return studyMetadata.findDisplaySet(displaySet => {
            return displaySet.displaySetInstanceUid === displaySetInstanceUid;
        });
    }

    setupListeners() {
        if (!this.name) {
            throw new Error('Name is required');
        }

        Tracker.autorun(() => {
            Session.get('LayoutManagerUpdated');

            console.warn(`Layout changed, rerendering viewports for plugin: ${this.name}`);

            const pluginDivs = document.querySelectorAll(`.viewport-plugin-${this.name}`);
            const viewportIndex = $('.viewportContainer').index($(div.parentNode));

            pluginDivs.forEach(div => {
                if (div.innerHTML !== '') {
                    return;
                }

                const viewportDetails = { viewportIndex };
                const displaySet = ViewportPlugin.getDisplaySet(viewportIndex);
                this.setupViewport(displaySet, viewportDetails);
            })
        });
    }

    setupViewport(displaySet) {
        throw new Error('You must override this method!');
    }
}

// each plugin registers an entry point function to be called
// when the loading is complete (called above in reloadPlugin).

// TODO: Move to OHIF.plugins.entryPoints?
OHIFPlugin.entryPoints = {};

export { OHIFPlugin };

// TODO: Should we remove this? Authors should be able to use new 'OHIF.viewerbase.OHIFPlugin()'
window.OHIFPlugin = OHIFPlugin;
window.ViewportPlugin = ViewportPlugin;
