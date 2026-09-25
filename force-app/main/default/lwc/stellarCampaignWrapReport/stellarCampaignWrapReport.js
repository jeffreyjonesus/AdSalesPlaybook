import { LightningElement, api } from 'lwc';
import REPORT_URL from '@salesforce/resourceUrl/StellarCampaignWrapReport';

const DEFAULT_HEIGHT = 1000;

export default class StellarCampaignWrapReport extends LightningElement {
    // The report has a sticky header and scroll-spy rail that track its own scroll
    // position, so the frame is kept near viewport height and lets the report
    // scroll internally. Stretching the frame to full content height breaks both.
    @api frameHeight = DEFAULT_HEIGHT;

    reportUrl = REPORT_URL;

    get frameStyle() {
        const height = parseInt(this.frameHeight, 10) || DEFAULT_HEIGHT;
        return `height:${height}px;`;
    }
}
