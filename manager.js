function manage(cls) {
	try {
		cls.add("time", "TimeShower", true);
	} catch (error) {
		console.error(error);
	}
}

module.exports = { manage };