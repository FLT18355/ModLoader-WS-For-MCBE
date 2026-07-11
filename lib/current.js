class Current {
	static client = null;
	static properties = {};

	static has(key) {
		return Boolean(this.properties[key]);
	}

	static get(key) {
		return this.properties[key];
	}

	static set(key, value) {
		return this.properties[key] = value;
	}

	static reset() {
		this.client = null;
		this.properties = {};
	}
}

module.exports = Current;