const $ = require('jquery');

VideoLinkElement.prototype = {
	element: null,
	path: null,
	baseImage: null,
	width: 0,
	height: 0,
	onRelatedPage: false,

	getDimensions: function(imageEl) {
		this.width = imageEl.width;
		this.height = imageEl.height;
	},

	_getBaseImage: function() {
		const imgEl = $(this.element).find('img')[0];
		const checkGif = /.gif/;
		var imgSrc = '';

		if(checkGif.test(imgEl.src)) {
			if(/https:/.test(imgEl.dataset.thumb)) {
				imgSrc = imgEl.dataset.thumb;
			}
		} else {
			imgSrc = imgEl.src;
		}

		this.baseImage = 'url(' + imgSrc + ')';

		return imgEl;
	}
};
VideoLinkElement.constructor = VideoLinkElement;

VideoLinkElement.getWatchLink = function(element) {
	const hrefRegex = /watch?.+/;
	const listParamRegex = /watch?.+&/;
	const videoHref = element.tagName === 'A' ? element.href
		: $(element).parents('a')[0].href;
	var watchLink;

	if(listParamRegex.test(videoHref)) {
		return null;
	} else {
		watchLink = hrefRegex.exec(videoHref);
		return watchLink ? watchLink[0] : null;
	}
};

function VideoLinkElement(element, path) {
	this.element = element;
	this.path = path;
	this.onRelatedPage = element.tagName === 'A';
	const imageEl = this._getBaseImage();
	this.getDimensions(imageEl);
};

module.exports = VideoLinkElement;
