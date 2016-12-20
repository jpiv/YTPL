const ThumbnailPreviewAddon = require('./ThumbnailPreviewAddon')();

ThumbnailPreviewAddon.init();

addListeners();

function addListeners() {
	chrome.runtime.onMessage.addListener((function(message, sender, respond) {
		console.log(message);
		action(message.type);
		respond({ done: true });
	}).bind(this));
	window.addEventListener('popstate', action.bind(null, 'POP_STATE'));
};

function action(type) {
	var reset;

	switch(type) {
		case 'LOAD_MORE_HOME':
			reset = false;
			break;
		case 'LOAD_MORE_RELATED':
			reset = false;
		default:
			reset = true;
			break;
	}

	ThumbnailPreviewAddon.loadPreviews(reset);
}
