const fs = require('fs'),
		path = require('path'),
		Twit = require('twit'),
		config = require(path.join(__dirname, 'config.js')),
		randomWord = require("random-word"),
		tinyText = require("tiny-text"),
		request = require("request");

// googleConfig.js and config.js required as per google-images / twit npm
// packages - replace process.env.____ with your keys

//
//GOOGLE API FOR PULLING IMAGES
//
const GoogleImages = require("google-images");
const client = new GoogleImages(process.env.GOOGLE_CSE_ID, process.env.GOOGLE_API_KEY);
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
		const image_path = path.join(__dirname, `/images/${image}`),
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