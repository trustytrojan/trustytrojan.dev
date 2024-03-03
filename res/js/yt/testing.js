import { getInfo } from '../tt-ytdl-core/info.js';
import { highestBitrate, audioOnly, videoOnly } from '../tt-ytdl-core/format-filters.js';
import { player, audioPlayer } from './elements.js';
import { createElement } from '../utils/elements.js';
import { FFmpeg } from '../@ffmpeg/ffmpeg/package/dist/esm/index.js';
import { fetchFile } from '../@ffmpeg/util/package/dist/esm/index.js';

window.separateElements = async () => {
	const { formats } = await getInfo('05MQCSWV4fU');
	const audioFormat = highestBitrate(audioOnly(formats));
	const videoFormat = highestBitrate(videoOnly(formats));
	audioPlayer.src = audioFormat.url;
	player.src = videoFormat.url;
};

/** @type {FFmpeg | undefined} */
let ffmpeg;

window.fftest = async () => {
	if (!ffmpeg) {
		// Initialization
		ffmpeg = new FFmpeg();
		ffmpeg.on('log', console.log);
		ffmpeg.on('progress', console.log);
		await ffmpeg.load({ coreURL: '../../../../core-mt/package/dist/esm/ffmpeg-core.js' });
	}

	const { formats, videoDetails } = await getInfo('05MQCSWV4fU');
	const audioFormat = highestBitrate(audioOnly(formats));
	const videoFormat = highestBitrate(videoOnly(formats));

	try { 
		await Promise.all([
			fetchFile(audioFormat.url).then(f => ffmpeg.writeFile('audio', f)),
			fetchFile(videoFormat.url).then(f => ffmpeg.writeFile('video', f))
		]);
	} catch (err) {
		console.error(err);
		return;
	}

	await ffmpeg.exec([
		'-i', 'audio',
		'-i', 'video',
		'-c', 'copy',
		'-metadata', `title=${videoDetails.title}`,
		'-metadata', `artist=${videoDetails.author}`,
		// '-metadata', `date=${videoDetails.publishDate.substring(0, 10)}`,
		'-metadata', `duration=${videoDetails.lengthSeconds}`,
		// '-f', 'matroska',
		'output.mkv'
	]);
	
	const fileData = await ffmpeg.readFile('output.mkv');
	const blob = new Blob([fileData], { type: 'video/mkv' });
	createElement('a', { href: URL.createObjectURL(blob) }).click();
};
