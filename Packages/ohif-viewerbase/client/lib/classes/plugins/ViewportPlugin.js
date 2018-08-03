import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { Random } from 'meteor/random';

import { OHIF } from 'meteor/ohif:core';

import { OHIFPlugin } from "./OHIFPlugin";

class ViewportPlugin extends OHIFPlugin {
    constructor() {
        super();

        this.destroyed = false;
    }

    static getDisplaySet(viewportIndex) {
        const viewportData = OHIF.viewerbase.layoutManager.viewportData[viewportIndex];
        const { studyInstanceUid, displaySetInstanceUid } = viewportData;
        const studyMetadata = OHIF.viewer.StudyMetadataList.findBy({ studyInstanceUID: studyInstanceUid });

        return studyMetadata.findDisplaySet(displaySet => {
            return displaySet.displaySetInstanceUid === displaySetInstanceUid;
        });
    }

    setViewportToPlugin(viewportIndex) {
        OHIF.viewerbase.layoutManager.viewportData[viewportIndex].plugin = this.name;
        OHIF.viewerbase.layoutManager.updateViewports();
    }

    setupAllPluginViewports() {
        console.warn(`setupAllPluginViewports: rerendering viewports for plugin: ${this.name}`);

        const pluginDivs = document.querySelectorAll(`.viewport-plugin-${this.name}`);
        const allViewports = Array.from(document.querySelectorAll('.viewportContainer'));

        console.info(`setupAllPluginViewports: ${pluginDivs.length} viewports found for plugin ${this.name}`)
        pluginDivs.forEach(div => {
            if (div.innerText !== '') {
                return;
            }

            const viewportIndex = allViewports.indexOf(div.parentNode);
            const viewportDetails = { viewportIndex };
            const displaySet = ViewportPlugin.getDisplaySet(viewportIndex);

            this.setupViewport(displaySet, viewportDetails);
        });
    }

    setupListeners() {
        console.warn('setupListeners');

        if (!this.name) {
            throw new Error('Name is required');
        }

        // TODO: Stop using Meteor's reactivity here
        Tracker.autorun((computation) => {
            Session.get('LayoutManagerUpdated');

            if (this.destroyed) {
                computation.stop();
            }

            Tracker.afterFlush(() => {
                this.setupAllPluginViewports();
            });
        });
    }

    setupViewport(displaySet, viewportDetails) {
        throw new Error('You must override this method!');
    }

    destroy() {
        this.destroyed = true;
    }
}

window.ViewportPlugin = ViewportPlugin;
