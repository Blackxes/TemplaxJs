//_____________________________________________________________________________________________
/**********************************************************************************************

	parses a raw rule matched by the regex and returns a rule object containing
	information about the given rule

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

var Config = require( "./Configuration.js" );
var ClassSet = require( "./ClassSet.js" );

//_____________________________________________________________________________________________
// rule parsing class
var RuleParser = new class RuleParserClass {

	//_____________________________________________________________________________________________
	constructor() {
		
		this.ruleIterator = 0;
	}

	//_________________________________________________________________________________________
	// parses the incoming rule
	//
	// param1 (ProcessClass) expects the process of the current rule
	// param2 (string) expects the raw rule matched by the regex
	//
	// return RuleClass
	//		-	the created rule based on the given raw rule and the in the process defined
	//			configurations
	//
	parse( process, rawRule ) {

		// base rule
		let rule = new ClassSet.rule( ++this.ruleIterator, rawRule );

		// build base rule
		rule.request = this._extractRulePiece( rawRule, Config.regex.extractRequest() )[1] || null;
		rule.key = this._extractRulePiece( rawRule, Config.regex.extractKey() )[1] || null;
		
		// the prime key defines the selector of the markup
		// marker are referenced with their name in the markup
		// but the value for commands such as "template" or "foreach" are defined as the key
		// therefor a primary key is needed to identify the corrent selection from the markup
		let primeKey = rule.key || rule.request;
		let queryMarkup = process.queryMarkup;
		let requestValue = queryMarkup[ primeKey ];
		let customOptions = {};

		// parse the markup value / can be an object containing more information about the rule
		if ( requestValue && requestValue.constructor === Object ) {
			if ( requestValue["_options"] && requestValue["_options"].constructor === Object )
				customOptions = requestValue["_options"];
			
			if ( requestValue["value"] && (requestValue["value"].constructor !== Object || requestValue["value"].constructor !== Array) )
				requestValue = requestValue["value"];
		}

		// define value after the value parsing of the markup / just because it could be an object
		rule.value = requestValue;
		rule.commandValue = queryMarkup[ rule.request + "-" + rule.key ];

		// define options based on the prio order
		// and of course resolve options
		rule.options = this._resolveObjectFunctions( Object.assign( {},
			Config.parsing.optionSets.default,
			Config.parsing.optionSets[ rule.request ] || {},
			customOptions
		));

		return rule;
	}

	//_________________________________________________________________________________________
	// extract a part of the given rule matched by the given regex
	//
	// param1 (string) expects the raw rule
	// param2 (RegExp) expects the regex object
	//
	// return Array - the matched regex
	//
	_extractRulePiece( rawRule, regex ) {

		if ( !rawRule || !regex || rawRule.constructor !== String || regex.constructor !== RegExp )
			return [];
		
		let match = regex.exec( rawRule );
		let results = [];

		if ( !match ) return results;

		for( let item of match )
			results.push( item );

		return results;
	}

	//_________________________________________________________________________________________
	// process options values / simple checks when the option value is a function
	// and overwrites the value with the returned value from the function
	//
	// Arrays are not supported !! just because the dont have an identifier
	// .. and this function is called resolve .. OBJECT .. Functions *shortly pushed laughter*
	//
	// param1 (mixed|Object) expects the object which shall be resolved
	//		Object - resolve every layer1 items when functions
	//		mixed - resolves this items and returns the result
	//
	// return null | Object | mixed
	//		null - when invalid object is passed
	//		Object - the assossiated resolved Object
	//		mixed - the result when a value is passed other than Object
	//
	_resolveObjectFunctions( values ) {

		if ( !values || values && values.constructor === Array )
			return null;
		
		if ( values.constructor !== Object )
			values = { "__value": values };
		
		for( let index in values ) {
			let item = values[index];
			if ( item && item.constructor === Function )
				values[ index ] = item();
		}
		
		// single given values have higher prio
		return values["__value"] || values;
	}

}();
exports.ruleParser = RuleParser;

//_____________________________________________________________________________________________
//