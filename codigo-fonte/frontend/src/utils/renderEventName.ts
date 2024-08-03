import { EditionDisplay, NameDisplay } from 'types/enums';
import { EventType } from 'types/models';

function romanize (num : number) {
    if (isNaN(num))
        return NaN;
    const digits = String(+num).split('');
    const key = ['','C','CC','CCC','CD','D','DC','DCC','DCCC','CM',
        '','X','XX','XXX','XL','L','LX','LXX','LXXX','XC',
        '','I','II','III','IV','V','VI','VII','VIII','IX'];
    let roman = '';
    let i = 3;
    while (i--) {
        const popResult = digits.pop();
        roman = (key[+ (popResult ? popResult : '') + (i * 10)] || '') + roman;
    }
    return Array(+digits.join('') + 1).join('M') + roman;
}

const renderEventName = (event: Partial<EventType>): string => {
    if (
        event?.display != null &&
        event?.editionDisplay != null &&
        event?.edition != null &&
        event?.eventCategory &&
        event?.startDate &&
        event?.eventCategory.category &&
        event?.eventCategory.url_src
    ) {
        let eventName = '';
        
        if (window.innerWidth < 768) {
            eventName = event.eventCategory.url_src.toUpperCase();
        } else {
            eventName = event.eventCategory.category;
        }

        let editionDisplay = '';

        switch (event.editionDisplay) {
            case EditionDisplay.ARABIC:
                editionDisplay += event.edition;
                break;
            case EditionDisplay.ORDINAL:
                editionDisplay += event.edition + '°';
                break;
            case EditionDisplay.ROMAN:
                editionDisplay += romanize(event.edition);
                break;
        }

        switch (event.display) {
            case NameDisplay.SHOW_ALL:
                return `${editionDisplay} ${eventName} ${event.startDate.getFullYear()}`;
            case NameDisplay.SHOW_EDITION_ONLY:
                return `${editionDisplay} ${eventName}`;
            case NameDisplay.SHOW_YEAR_ONLY:
                return `${eventName} ${event.startDate.getFullYear()}`;
            default:
                return eventName;
        }
    } else {
        return '';
    }
};

export default renderEventName;
