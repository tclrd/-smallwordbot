const fs = require('fs'),
		path = require('path'),
		Twit = require('twit'),
		config = require(path.join(__dirname, 'config.js')),
		randomWord = require("random-word"),
		tinyText = require("tiny-text"),
		request = require("request"),
		googleConfig = require(path.join(__dirname, 'googleConfig.js'));

// googleConfig.js and config.js required as per google-images / twit npm
// packages - replace process.env.____ with your keys

//
//GOOGLE API FOR PULLING IMAGES
//
const GoogleImages = require("google-images");
const client = new GoogleImages(googleConfig.CSE_ID, googleConfig.API_KEY);
const imageSearch = (queryString, callback) => {
		client
				.search(queryString)
				.then(images => {
						let imageNum = Math.floor(Math.random() * 5);
						output = images[imageNum].url;
						callback(output);
				});
};

//
// END GOOGLE API
//

const T = new Twit(config);
//TODO: FIX CALLBACK HELL HERE
const postTweet = (image, text) => {
		const image_path = path.join(`./images/${image}`),
				b64content = fs.readFileSync(image_path, {encoding: 'base64'});
		console.log('Uploading an image.. standby..');
		T.post('media/upload', {
				media_data: b64content
		}, (err, data, response) => {
				if (err) {
						console.error(err);
				} else {
						console.log("Upload Complete!");
						let mediaIdStr = data.media_id_string,
								meta_params = {
										media_id: mediaIdStr,
										alt_text: {
												text: `an image of ${text}`
										}
								};
						console.log(data.media_id_string);
						T.post('media/metadata/create', meta_params, function (err, data, response) {
								if (!err) {
										//grab uploaded media and actually post tweet
										var params = {
												//tinyText() turns this into ᵗʰᶦˢ again not required.
												status: tinyText(text),
												media_ids: [mediaIdStr]
										};
										//attach status to tweet (not required);
										T.post('statuses/update', params, function (err, data, response) {
												//log useful tweet data
												console.log(`Conteont: ${data.text}`);
												console.log(`ID: ${data.id}`);
												console.log(`Followers: ${data.user.followers_count}`);
												setTimeout(() => {
														// delay to delete image from local storage will be replaced with await/async
														// later
														fs.unlinkSync(image_path);
												}, 10000);
										});
								}
						});
				}
		});
};
const text = randomWord();
imageSearch(text, output => {
		//callback to run in sync
		console.log(`Text: ${text}`);
		//regex to scrub query strings and url paths keeping only filenames.
		const pat = /[^/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/;
		let res = pat.exec(output);
		request(output).pipe(fs.createWriteStream(`./images/${res[0]}`));
		// timeout required otherwise Twit produces Error status 400 Unrecognized Media
		// Format due to file not being saved. Working on fix to run sync and avoid
		// using timeouts entirely.
		setTimeout(() => {
				postTweet(res[0], text);
		}, 10000);

});

// //random tweet interval between 1-7 hours
// const interval = () => {
// 		const min = 3600000,
// 				max = 21600000;

// 		return Math.floor(Math.random() * (max - min)) + min;
// };
// //
// //automation of tweeting process, making the app into a bot
// //
// setInterval(() => {
// 		const text = randomWord();
		
// 		console.log(interval());
// 		imageSearch(text, output => {
// 				//callback to run in sync
// 				console.log(`Text: ${text}`);
// 				//regex to scrub query strings and url paths keeping only filenames.
// 				const pat = /[^/\\&\?]+\.\w{3,4}(?=([\?&].*$|$))/;
// 				let res = pat.exec(output);
// 				request(output).pipe(fs.createWriteStream(`./images/${res[0]}`));
// 				// timeout required otherwise Twit produces Error status 400 Unrecognized Media
// 				// Format due to file not being saved. Working on fix to run sync and avoid
// 				// using timeouts entirely.
// 				setTimeout(() => {
// 						postTweet(res[0], text);
// 				}, 10000);

// 		});
// }, interval);