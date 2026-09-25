import { LightningElement, api } from 'lwc';
import REPORT_URL from '@salesforce/resourceUrl/StellarCampaignWrapReport';

const DEFAULT_HEIGHT = 1000;

// resourceUrl bakes in a version stamp when the module is compiled, so deploying
// a new static resource alone leaves cached modules pointing at the old copy.
// Bump this whenever the report HTML changes to force browsers off the stale one.
const REPORT_VERSION = 2;

export default class StellarCampaignWrapReport extends LightningElement {
    // The report has a sticky header and scroll-spy rail that track its own scroll
    // position, so the frame is kept near viewport height and lets the report
    // scroll internally. Stretching the frame to full content height breaks both.
    @api frameHeight = DEFAULT_HEIGHT;

    reportUrl = `${REPORT_URL}?v=${REPORT_VERSION}`;

    get frameStyle() {
        const height = parseInt(this.frameHeight, 10) || DEFAULT_HEIGHT;
        return `height:${height}px;`;
    }
}
