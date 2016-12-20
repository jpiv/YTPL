const $ = require('jquery');
const VideoLinkElement = require('./VideoLinkElement');
const Preview = require('./Preview');

const VIDEO_ELEMENT_CLASS = 'a.yt-uix-sessionlink div.video-thumb.yt-thumb';
const RELATED_VIDEO_ELEMENT_CLASS = 'a.yt-uix-sessionlink.thumb-link';

const ThumbnailPreviewAddon = {
	videoElements: [],
	previews: [],
	isWatchPage: false,
	isResultsPage: false,
	_nonVideoElements: 0,
	_domPollingInterval: null,

	init: function() {
		this.loadPreviews();
	},

	loadPreviews: function(reset) {
		this._updatePageType();
		this._stopPolling();
		if(reset) {
			this._reset();
		}

		const startIndex = this._getVideoLinkElements();
		const newElements = this.videoElements.slice(startIndex);

		if(newElements.length === 0) {
			var polls = 0;
			this._domPollingInterval = setInterval((function() {
				polls++;
				const startIndex = this._getVideoLinkElements();
				const newElements = this.videoElements.slice(startIndex);
				console.log('pollling')
				if(reset && newElements.length === 0){
					this._reset();
				} else {
					this._mapElements(newElements);
					this._stopPolling();
				}
				if(polls > 100) {
					this._stopPolling();
				}
			}).bind(this), 250);
		} else {
			this._mapElements(newElements);
		}
	},

	_updatePageType: function() {
		this.isWatchPage = window.location.pathname.indexOf('watch') > -1;
		this.isResultsPage = window.location.pathname.indexOf('results') > -1;
	},

	_stopPolling: function() {
		clearInterval(this._domPollingInterval);
		this._domPollingInterval = null;
	},

	_reset: function() {
		this._nonVideoElements = 0;
		this.videoElements = [];
	},

	_mapElements: function(newElements) {
		console.log('Loading', newElements.length, 'new Previews.');
		if(!this.isWatchPage && !this.isResultsPage) {
			this._optimizedLoad(newElements);
		} else {
			this._defaultLoad(newElements);
		}
	},

	_optimizedLoad: function(videoElements) {
		console.log('using optimized loading strategy.');

		var priorityVideos = [];
		var secondaryVideos = [];

		var elementsOnCurrentUser = 0;
		var lastUserHref = '';

		const priorityPromises = [];

		videoElements.forEach(function(videoElement) {
			const userHref = $(videoElement.element)
				.parentsUntil('div.yt-lockup.yt-lockup-grid.yt-lockup-video',
					'div.yt-lockup-dismissable').find('a.g-hovercard.yt-uix-sessionlink')[0].href;

			if(elementsOnCurrentUser < 6 && lastUserHref === userHref) {
				priorityVideos.push(videoElement);
				elementsOnCurrentUser++;
			} else if(lastUserHref !== userHref) {
				elementsOnCurrentUser = 1;
				priorityVideos.push(videoElement);
			} else {
				secondaryVideos.push(videoElement);
			}

			lastUserHref = userHref;
		});

		this.previews = $.merge(
			this.previews,
			priorityVideos.map(function(videoElement) {
				const preview = new Preview(videoElement);
				priorityPromises.push(preview.loadPreview());
				return preview;
			})
		);

		Promise.all(priorityPromises)
			.then((function() {
				this._defaultLoad(secondaryVideos);
			}).bind(this))
			.catch(function(err) {
				console.log(err);
			});
	},

	_defaultLoad: function(elements) {
		this.previews = $.merge(
			this.previews,
			elements.map((videoEl, i) => {
				const preview = new Preview(videoEl);
				preview.loadPreview()
					.then(() => console.log(i))
					.catch(err => console.error(err));
				return preview;
			})
		);
	},

	_getVideoLinkElements: function() {
		var elementClass;

		if(!this.isWatchPage) {
			elementClass = VIDEO_ELEMENT_CLASS;
		} else {
			elementClass = RELATED_VIDEO_ELEMENT_CLASS;
		}

		const ogVideoElementsLength = this.videoElements.length;
		const startIndex = ogVideoElementsLength + this._nonVideoElements;
		const foundVideoElements = $(elementClass).slice(startIndex);

		this.videoElements = $.merge(
			this.videoElements,
			foundVideoElements.map((i, videoElement) => {
				const watchLink = VideoLinkElement.getWatchLink(videoElement);
				if(watchLink) {
					return new VideoLinkElement(videoElement, watchLink);
				} else {
					this._nonVideoElements++;
				}
			})
		);

		console.log('Video links:', this.videoElements.length);
		return ogVideoElementsLength;
	}
};

module.exports = function() {
	return ThumbnailPreviewAddon;
};
