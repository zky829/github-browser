const {clipboard, remote, nativeImage} = require('electron');
const {shell, app, getCurrentWindow} = remote;
const {exec} = require('child_process');
const config = require('./config');
const isDev = require('./isDev');


const applicationsPath = () => ({
	darwin: '/Applications/',
	win32: 'C:\\Program Files\\',
	linux: '/usr/bin/'
}[process.platform]);

const getOpenBrowserCmd = (browser, url) => ({
	darwin: `open -a "${browser}" "${url}"`,
	win32: `"${browser}" "${url}"`,
	linux: `"${browser}" "${url}"`
}[process.platform]);

function openInBrowser (url) {
	const browser = config.get('browser');
	if (!browser) return shell.openExternal(url);
	exec(getOpenBrowserCmd(browser, url), (err, stdout, stderr) => {
		if ((err || stderr) && isDev) console.log(err || stderr);
	});
}

const getUserDataFolder = () => app.getPath('userData');
const copyToClipboard = (txt) => clipboard.writeText(txt);
const openFolder = (path) => shell.openExternal(`file://${path}`);
const openSettingsFolder = () => openFolder(getUserDataFolder());
const openChangelog = ver => openInBrowser(`https://github.com/tborychowski/github-browser/releases/${ver ? `tag/v${ver}` : 'latest'}`);


function setBadge (text = 0) {
	text = parseInt(text, 10);
	if (process.platform !== 'win32') app.setBadgeCount(text);
	else {														// yep, this is for windows...
		const win = getCurrentWindow();
		if (text === 0) return win.setOverlayIcon(null, '');
		const canvas = document.createElement('canvas');
		canvas.height = 140;
		canvas.width = 140;
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = 'red';
		ctx.beginPath();
		ctx.ellipse(70, 70, 70, 70, 0, 0, 2 * Math.PI);
		ctx.fill();
		ctx.textAlign = 'center';
		ctx.fillStyle = 'white';
		if (text > 99) {
			ctx.font = '75px sans-serif';
			ctx.fillText(text, 70, 98);
		}
		else if (text.length > 9) {
			ctx.font = '100px sans-serif';
			ctx.fillText(text, 70, 105);
		}
		else {
			ctx.font = '125px sans-serif';
			ctx.fillText(text, 70, 112);
		}
		let img = nativeImage.createFromDataURL(canvas.toDataURL());
		win.setOverlayIcon(img, text);
	}
}



const pageTypes = [
	{ reg: /\/issues\/\d+/, 		type: 'timeline',	actualType: 'issue',		desc: 'issue' },
	{ reg: /\/pull\/\d+\/files/, 	type: 'list',		actualType: 'pr-files',		desc: 'pr file diff' },
	{ reg: /\/pull\/\d+\/commits/,	type: 'list',		actualType: 'pr-commits',	desc: 'pr commit list' },
	{ reg: /\/pull\/\d+/, 			type: 'timeline',	actualType: 'pr',			desc: 'pr' },
	{ reg: /\/issues\/?/, 			type: 'list',		actualType: 'issues',		desc: 'issue list' },
	{ reg: /\/pulls/, 				type: 'list',		actualType: 'pr-list',		desc: 'pr list' },
	{ reg: /\/blob\//, 				type: 'list',		actualType: 'file',			desc: 'single file view' },
	{ reg: /\/projects\/\d+/, 		type: 'list',		actualType: 'project',		desc: 'project board' },
];

function getPageTypeFromUrl (url = '') {
	url = url.split(/[?#]/)[0];
	for (const {reg, type} of pageTypes) if (reg.test(url)) return type;
	return 'timeline';
}

function getPageActualTypeFromUrl (url = '') {
	url = url.split(/[?#]/)[0];
	for (const {reg, actualType} of pageTypes) if (reg.test(url)) return actualType;
}



module.exports = {
	openInBrowser,
	copyToClipboard,
	openFolder,
	openSettingsFolder,
	getUserDataFolder,
	setBadge,
	openChangelog,
	getPageTypeFromUrl,
	getPageActualTypeFromUrl,
	applicationsPath,
};
