import Promise from 'promise-polyfill';
import 'whatwg-fetch';
import config from './config';
import log from './log';
import { updateLocalizationSettings } from './localize';
import { sendPortalCommand } from './portal';
const metadata = require('../../metadata.json');

const HOST_URL_REGEX = /^[^\/]*\/{2}[^\/]*/;

/**
	* Attempt to load a vendor list from the local domain. If a
	* list is not found attempt to load it from the global list location
	* using the "portal" for cross domain communication.
*/
function fetchVendorList() {
	return fetch(config.globalVendorListLocation)
		.then(res => res.json())
		.catch(() => {
			log.debug('Configured vendors.json not found. Requesting global list');
			return sendPortalCommand({command: 'readVendorList'});
		});
}

function fetchLocalizedPurposeList() {
	let interpolate = (string, args) => string.replace(/\${(\w+)}/g, (_, v) => args[v]);

	const consentLanguage = updateLocalizationSettings({forceLocale: config.forceLocale, localization: config.localization});
	let url = interpolate(metadata.localizedVendorListProvider, {consentLanguage: consentLanguage.toLowerCase()});
	return fetch(url)
		.then(res => res.json())
		.catch(err => {
			log.error(`Failed to load standard purposes in the selected language`, err);
		});
}

function fetchCustomPurposeList() {
	if (!config.storePublisherData || !config.customPurposeListLocation) {
		return Promise.resolve();
	}

	return fetch(config.customPurposeListLocation)
		.then(res => res.json())
		.catch(err => {
			log.error(`Failed to load custom purposes list from ${config.customPurposeListLocation}`, err);
		});
}

function fetchPubvendorsJson() {
	const fullUrl = document.location.href;
	const matchData = fullUrl.match(HOST_URL_REGEX);

	return fetch(matchData[0] + "/.well-known/pubvendors.json")
		.then(res => {
			if (res.status === 404) {
				log.info(`No pubvendors file found`);
				return;
			}
			return res.json();
		})
		.catch(err => {
			console.log(`Failed to load pubvendors.json file`, err);
		});
}

export {
	fetchVendorList,
	fetchLocalizedPurposeList,
	fetchCustomPurposeList,
	fetchPubvendorsJson,
};
