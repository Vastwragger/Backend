/* eslint-disable no-console */
const Path = require('path');
const FS = require('fs');
const logs_folder = Path.join(__dirname, './../../sample/logs');

async function execute() {
	const files = FS.readdirSync(logs_folder);
	files.forEach((file) => {
		if (!file.endsWith('.log')) return;
		const filePath = Path.join(logs_folder, file);
		const fileData = FS.readFileSync(filePath, 'utf-8');
		const lines = fileData.split('\n');
		const json = [];
		lines.forEach((line) => {
			try {
				json.push(JSON.parse(line));
				return 'done';
			} catch (err) {
				console.log(err);
				return 'error';
			}
		});
		FS.writeFileSync(Path.join(logs_folder, `${file.substring(0, file.indexOf('.'))}.json`), JSON.stringify(json));
	});
	console.log('Completed');
}

execute();
