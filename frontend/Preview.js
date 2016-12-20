const fetch = require('isomorphic-fetch');
const $ = require('jquery');

Preview.prototype = {
	previewImages: null,
	img: null,
	currentImage: null,
	_videoElement: null,

	loadPreview: function() {
		return fetch(this._buildQuery(), {
			method: 'GET',
			cors: 'include'
		})
		.then(data => data.json())
		.then(data => {
			this.previewImages = data.data.map(base64Image => {
				imageUrl = 'url(data:image/png;base64,' + base64Image + ')';
				return imageUrl;
			});

			// Add original preview image
			this.previewImages.unshift(this._videoElement.baseImage);
			this.currentImage = this.previewImages[0];
			this.img.style.backgroundImage = this.previewImages[0];

			this._addListeners();
			this._mountPreview();
		}).catch(err => console.error(err));
	},

	_buildQuery: function() {
		const Height_Multiplier = 1.4364;

		return 'https://ytpl-api.com/?path=' + this._videoElement.path
			+ '&width=' + this._videoElement.width
			+ '&height=' + Math.floor((this._videoElement.height * Height_Multiplier));
	},

	_addListeners: function() {
		var listener = null
		var intervalId = null;

		this.img.addEventListener('mouseenter', (function(e) {
			intervalId = this._startPreview();
			if(!listener) {
				listener = this._stopPreview.bind(this, intervalId);
				this.img.addEventListener('mouseleave', listener);
			} else {
				this.img.removeEventListener('mouseleave', listener);
				listener = this._stopPreview.bind(this, intervalId);
				this.img.addEventListener('mouseleave', listener);
			}
		}).bind(this));
	},

	_startPreview: function() {
		var i = 1;
		return setInterval((function() {
			this.img.style.backgroundImage = this.previewImages[i];
			i = i < this.previewImages.length - 1 ? i + 1 : 0;
		}).bind(this), 725);
	},

	_stopPreview: function(intervalId) {
		clearInterval(intervalId);
		this.img.style.backgroundImage = this.previewImages[0];
	},

	_mountPreview: function() {
		this._videoElement.element.firstChild
			.replaceChild(this.img,
				$(this._videoElement.element).find('img')[0]);
		this.img.style.border = '1px solid #d792ff';
		this.img.style.boxSizing = 'border-box';
	}
};
Preview.constructor = Preview;

function Preview(VideoLinkElement) {
	this.img = document.createElement('img');
	this.img.style.backgroundPosition = 'center';
	this.img.style.width = VideoLinkElement.width + 'px';
	this.img.style.height = VideoLinkElement.height + 'px';
	this.img.style.position = 'relative';

	// Related video thumbnail specific styling
	this.img.style.top = VideoLinkElement.onRelatedPage ? '-12px' : null;

	this._videoElement = VideoLinkElement;
};

module.exports = Preview;