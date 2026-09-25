import { LightningElement, api } from 'lwc';
import REPORT_URL from '@salesforce/resourceUrl/CampaignPerformance';
import HAS_ACCESS from '@salesforce/customPermission/Campaign_Performance_Access';

const DEFAULT_HEIGHT = 1000;

export default class CampaignPerformance extends LightningElement {
    // The report has a sticky header and scroll-spy rail that track its own scroll
    // position, so the frame is kept near viewport height and lets the report
    // scroll internally. Stretching the frame to full content height breaks both.
    @api frameHeight = DEFAULT_HEIGHT;

    // Populated by the record page; the report renders its own static dataset, so
    // this is unused today and exists so a future data-bound version has the Id.
    @api recordId;

    reportUrl = REPORT_URL;

    // Access is gated here rather than by a FlexiPage visibility rule: $Permission
    // references to custom permissions do not resolve in flexipage criteria.
    hasAccess = HAS_ACCESS === true;

    get frameStyle() {
        const height = parseInt(this.frameHeight, 10) || DEFAULT_HEIGHT;
        return `height:${height}px;`;
    }
}
