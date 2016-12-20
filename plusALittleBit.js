const ytdl = require('ytdl-core');
const ff = require('fluent-ffmpeg');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const https = require('https');
const app = express();
const async = require('async');
const splitCa = require('split-ca');
const cluster = require('cluster');
const OS = require('os');
const credentials = {
	ca: splitCa(__dirname + '/ytpl-api_com.ca-bundle'),
	cert: fs.readFileSync(__dirname + '/ytpl.crt'),
	key: fs.readFileSync(__dirname + '/ytpl.key')
};

const imageDir = __dirname + '/images';
const NEW_REQUEST = 'NEW_REQUEST';
const REPORT = 'REPORT';

const Metrics = {
	requestNo: 0,
	totalResponseTime: 0,
	averageResponse: 0,

	newRequest: function(time) {
		this.requestNo++;
		this.totalResponseTime += time;
		this.averageResponse = (this.totalResponseTime + time) / this.requestNo;
	},

	reportMetrics: function() {
		console.log(
			'Total Requests:', this.requestNo, '\n' +
			'Total Requst Time:', (this.totalResponseTime / 100) + 's\n' +
			'Average Response Time', this.averageResponse + 'ms\n'
		);
	}
};

if(cluster.isMaster) {
	const cpus =  OS.cpus().length;
	console.log('Spawning', cpus, 'processes');
	
	for(var i = 0; i < cpus; i++) {
		const worker = cluster.fork();
		worker.on('message', function(message) {
			if(message.type === NEW_REQUEST) {
				Metrics.newRequest(message.time);
			} else {
				Metrics.reportMetrics();
			}	
		});
	}

	cluster.on('online', function(worker) {
		console.log('Worker process ID:', worker.process.pid,
			'from process', process.pid);
	});
} else {
	app.use(cors());
	app.use(bodyParser.json());

	const handler =function(req, res) {
		function clock(start) {
		    if ( !start ) return process.hrtime();
		    var end = process.hrtime(start);
		    return Math.round((end[0]*1000) + (end[1]/1000000));
		}

		const t0 = clock();
		const timestamps = [];
		console.log(req.query.path)
		const pipe = ytdl('https://www.youtube.com' + req.query.path, {
				filter: function(format) {
					// if(format.resolution === '144p' && format.audioEncoding === null)console.log(format)
					return format.resolution === '144p';
				},
				// range: rng
			}).on('info', function(info) {
				const totalSeconds = info.length_seconds;
				timestamps.push(totalSeconds * 0.20);
				timestamps.push(totalSeconds * 0.40);
				timestamps.push(totalSeconds * 0.60);
				timestamps.push(totalSeconds * 0.80);
			}).on('error', function(err) {
				console.log('err fetching video.');
				res.status(404).send('No video');
			}).on('response', function(response) {
				ff(pipe).on('end', function(err) {
					if(err) throw err;

					async.parallel([
						function(callback) {
							fs.readFile(imageDir + '/vid_' + req.query.path.slice(6) + '_1.png', function(err, data) {
								if(err) callback(err);
								if(data) {
									callback(err, data.toString('base64'));
								} else {
									console.log('null data');
								}
							});
						},
						function(callback) {
							fs.readFile(imageDir + '/vid_' + req.query.path.slice(6) + '_2.png', function(err, data) {
								if(err) callback(err);
								if(data) {
									callback(err, data.toString('base64'));
								} else {
									console.log('null data');
								}
							});
						},
						function(callback) {
							fs.readFile(imageDir + '/vid_' + req.query.path.slice(6) + '_3.png', function(err, data) {
								if(err) callback(err);
								if(data) {
									callback(err, data.toString('base64'));
								} else {
									console.log('null data');
								}
							});
						},
						function(callback) {
							fs.readFile(imageDir + '/vid_' + req.query.path.slice(6) + '_4.png', function(err, data) {
								if(err) callback(err);
								if(data) {
									callback(err, data.toString('base64'));
								} else {
									console.log('null data');
								}
							});
						}
					], function(err, data) {
						const time = clock(t0);
						process.send({
							type: NEW_REQUEST,
							time: time
						});
						console.log('done', time);
						res.status(200).json({
							message: 'complete',
							data: data
						});
					});
				}).takeScreenshots({
					filename: 'vid_' + req.query.path.slice(6) + '_%i',
					timestamps: timestamps,
					folder: imageDir,
					size: req.query.width + 'x' + req.query.height
				});
			})
	};

	app.get('/', handler);

	app.get('/metrics', function(req, res) {
		process.send({ type: REPORT });
		res.status(200).send('Logged Metrics.');
	});

	app.get('/test', function(req, res) {
		res.status(200).send('Test endpoint.');
	});

	const port = 443;
	const server = https.createServer(credentials, app);
	server.listen(port);
	console.log('server listening on port', port);
}
