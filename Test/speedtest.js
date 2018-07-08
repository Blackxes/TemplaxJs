	
	let template = js_htparser.getTemplate("marker-extraction-speed-test").value;
	let extract_rule = new RegExp("{{([^<>]*?)}}", "g");
	let filter_rule = new RegExp("{{\\s*([\\w-]+?)(?:\\s*:+\\s*([\\w-]+)+)?\\s*(?:\\s(.*?))?\\s*}}", "g");

	let runs = 50;
	let times = 10000;
	let timeStart = 0;
	let match = null;

	

	// big regex
	let fullRegex = function() {

		let totalTimes = [];

		console.log("FullRegex start ..");

		for (let a = 0; a < runs; a++) {

			let fullResults = [];
			timeStart = Date.now();

			for ( let i = 0; i < times; i++ ) {

				while ( rule = extract_rule.exec(template) ) {	
					while ( match = filter_rule.exec(rule[0]) ) {

						let fullRegexLoopResult = {};		
						fullRegexLoopResult.request = match[1] || null;
						fullRegexLoopResult.key = match[2] || null;
				
						if (match[3]) {
							let option = null;
							let options = {};
							let regOption = new RegExp("\\s*(\\w+)\\s*:\\s*(\\w+)\\s*", "g")
							while (option = regOption.exec(match[3])) {
								options[option[1]] = option[2];
							}
							fullRegexLoopResult.options = options;
						}
						fullResults.push(fullRegexLoopResult);
					}
				}
			}
			let done = Date.now();
			console.log("FullRegex Time:", ((done - timeStart) / 1000).toFixed(4));

			totalTimes.push(((done - timeStart) / 1000).toFixed(4));
		}

		let average = 0;

		totalTimes.forEach( (c) => {
			average += parseFloat(c);
		});
		
		average /= totalTimes.length;

		console.log("FullRegex done! Average: ", average.toFixed(4), "seconds");
	}

	
	let littleRegex = function() {

		let totalTimes = [];

		console.log("LittleRegex starts ..");

		for (let a = 0; a < runs; a++) {

			// little regex
			extract_rule = new RegExp("{{([^<>]*?)}}", "g");
			let regExtractRequest = new RegExp("{{\\s*(\\w+)[^{}]*}}", "g");
			let regExtractKey = new RegExp("{{\\s*\\w+\\s*:\\s*([\\w]+)\\s+(?:[\\w:]+)?\\s*}}", "g");
			let regExtractOptions = new RegExp("{{\\s*\\w+\\s*(?::\\s*\\w+\\s+)?[:]?\\s*([\\w\\s:-]+?)\\s*}}", "g");
			let regFilterOption = new RegExp("\\s*(\\w+)\\s*:\\s*(\\w+)\\s*", "g");

			// start little regex
			match = null;
			timeStart = Date.now();

			let littleResults = [];

			for ( let i = 0; i < times; i++ ) {

				while ( match = extract_rule.exec(template) ) {

					regExtractRequest.lastIndex = 0;
					regExtractKey.lastIndex = 0;
					regExtractOptions.lastIndex = 0;

					let loopResult = {};
					let request = regExtractRequest.exec( match[0] );
					let key = regExtractKey.exec( match[0] );
					let options = regExtractOptions.exec( match[0] );

					if (request) loopResult.request = request[1].trim();
					if (key) loopResult.key = key[1].trim();

					if ( options ) {
						let option = null;
						let extractedOptions = {};
						regFilterOption.lastIndex = 0;

						while (option = regFilterOption.exec(options[1])) {
							extractedOptions[option[1]] = option[2];
						}
						loopResult.options = extractedOptions;
					}

					littleResults.push(loopResult);
				}
			}
			let done = Date.now();
			console.log("LittleRegex Time:", ((done - timeStart) / 1000).toFixed(4));

			totalTimes.push(((done - timeStart) / 1000).toFixed(4));
		}

		let average = 0;

		totalTimes.forEach( (c) => {
			average += parseFloat(c);
		});
		
		average /= totalTimes.length;

		console.log("LittleRegex done! Average: ", average.toFixed(4), "seconds");
	}

	fullRegex();
	littleRegex();

	return true;