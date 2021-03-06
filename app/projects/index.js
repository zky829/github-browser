const $ = require('../util');
const { EVENT, users, github } = require('../services');

let isReady = false, el, listEl;
const projectSort = (a, b) => a.name.localeCompare(b.name);


function refresh () {
	github.getProjects()
		.then(projects => {
			if (!projects || !projects.length) return Promise.resolve([]);
			projects.sort(projectSort);
			return Promise.all(projects.map(remapProjectFields));
		})
		.then(projects => listEl.html(projects.map(getProjectHtml).join('')));
}


function getProjectHtml (project) {
	return `<a href="${project.html_url}" class="btn project-box">
		<img class="avatar" src="${project.creator.avatar_url}"
			alt="${project.creator.name || project.creator.login}" />
		<span class="name">${project.name}</span>
		<span class="time">Updated: ${project.updated_at_str}</span>
	</a>`;
}


function remapProjectFields (project) {
	project.created_at_str = $.prettyDate(project.created_at);
	project.updated_at_str = $.prettyDate(project.updated_at);

	return users.getById(project.login).then(usr => {
		if (usr) project.creator.name = usr.name;
		return project;
	});
}


function onClick (e) {
	e.preventDefault();

	let target = $(e.target);
	if (target.is('.js-refresh')) return refresh();
	target = target.closest('.btn');
	if (target.length) return $.trigger(EVENT.url.change.to, target.attr('href'));
}



function init () {
	if (isReady) return;

	el = $('.subnav-projects');
	listEl = el.find('.subnav-section-list');

	el.on('click', onClick);
	$.on(EVENT.projects.refresh, refresh);

	refresh();

	isReady = true;
}


module.exports = {
	init
};
