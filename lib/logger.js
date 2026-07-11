const fs = require("fs");
const path = require("path");

// Logger
const logDir = "./logs";
if (!fs.existsSync(logDir)) {
	fs.mkdirSync(logDir, {
		recursive: true
	});
}

class Logger {
	constructor(name = "app", ifprint = true, ifile = true) {
		this.name = name;
		this.print = ifprint;
		this.file = ifile;
	}

	log(message, type = "def") {
		const allowTypes = ["info", "warning", "error", "debug"];
		let logMessage;

		if (allowTypes.includes(type)) {
			const now = new Date().toISOString();
			logMessage = `[${now}] [${type}] ${this.name} - ${message}`;
		} else {
			logMessage = `${message}`;
		}

		if (this.print) {
			const colors = {
				info: "\x1b[32m",
				warning: "\x1b[33m",
				error: "\x1b[31m",
				debug: "\x1b[35m",
				reset: "\x1b[0m"
			}

			console.log(`${colors[type] || ""}${logMessage}${colors.reset}`);
		}

		if (this.file) {
			fs.appendFile(path.join(logDir, `${this.name}.log`), logMessage + "\n", "utf-8", (error) => {
				if (error) console.log("Log Error: ", error)
			});
		}
	}

	info(message) {
		this.log(message, "info");
	}

	warning(message) {
		this.log(message, "warning");
	}

	error(message) {
		this.log(message, "error");
	}

	debug(message) {
		this.log(message, "debug");
	}
}

module.exports = Logger;