class TimeShower {
	constructor(client) {
		this.client = client;
		this.shower;
	}

	onRun() {
		this.shower = setInterval(() => {
			const date = new Date();
			const time = date.toTimeString().split(' ')[0];

			const sendCommand = {
				"body": {
					"origin": {
						"type": "player"
					},
					"commandLine": `/title @a actionbar §e${time}`,
					"version": 17039360
				},
				"header": {
					"requestId": "00000000-0000-0000-0000000000000000",
					"messagePurpose": "commandRequest",
					"version": 1,
					"messageType": "commandRequest"
				}
			};

			this.client.send(JSON.stringify(sendCommand), (error) => {
				return;
			});
		}, 1000);
	}

	onStop() {
		clearInterval(this.shower);
		this.shower = null;
	}

	onRemove(reason) {
		null;
	}

	onMessage(msg) {
		null;
	}
}

module.exports = TimeShower;