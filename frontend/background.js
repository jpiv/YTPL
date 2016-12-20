const ACTIONS = {
	SEARCH: 'results',
	LOAD_MORE_HOME: 'browse_ajax',
	LOAD_MORE_RELATED: 'related_ajax',
	VIEW_VIDEO: 'watch?',
	VIEW_CHANNEL: 'user',
	NAV: '?spf=navigate'
};

chrome.webRequest.onCompleted.addListener(function(details) {
	console.log('Sending message...');
	chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
		console.log(details.url)
		var messageSent = false;
		
		Object.keys(ACTIONS).forEach(function(key) {
			const message = {
				type: key
			};
			if(details.url.indexOf(ACTIONS[key]) > -1 && !messageSent) {
				chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
					console.log(response && response.done && 'done');
				});
				messageSent = true;
			}
		});
	});
}, {
	urls: [
		'https://*.youtube.com/' + ACTIONS.SEARCH + '*',
		'https://*.youtube.com/' + ACTIONS.LOAD_MORE_RELATED + '*',
		'https://*.youtube.com/' + ACTIONS.LOAD_MORE_HOME + '*',
		'https://*.youtube.com/' + ACTIONS.VIEW_VIDEO + '*',
		'https://*.youtube.com/' + ACTIONS.VIEW_CHANNEL + '*',
		'https://*.youtube.com/' + ACTIONS.NAV
	]
});