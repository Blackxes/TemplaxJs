(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	contains several container classes

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

// includes
var Parser = require( "./HTMLParser.js" );
var Config = require( "./Configuration.js" );

//_____________________________________________________________________________________________
// contains information about a general template process
exports.tprocess = class TemplateProcessClass {

	//_________________________________________________________________________________________
	constructor( id, template, userMarkup, isSubProcess ) {

		this.id = id || null;
		this.template = template || null;
		this.userMarkup = userMarkup || null;
		this.baseMarkup = null;
		this.currentQuery = null;
		this.isSubProcess = isSubProcess || false;

		this.options = Object.assign({}, Config.parsing.optionSets.templateProcess );
	}

	//_________________________________________________________________________________________
	//
	
};

//_____________________________________________________________________________________________
// contains information about a template
exports.template = class TemplateClass {

	//_________________________________________________________________________________________
	constructor( id, value, options ) {

		this.id = ( id && id.constructor === String ) ? id : "";
		this._value = ( value || typeof value === "string" ) ? value : "";
		this.options = options || {};
	}

	//_________________________________________________________________________________________
	//
	get value() {
		
		if ( !this._value && this.id )
			return Parser.parser.getTemplate( this.id )._value;

		return this._value || "";
	}

	//_________________________________________________________________________________________
	//

};

//_____________________________________________________________________________________________
// contains information about the rule
exports.rule = class RuleClass {

	//_________________________________________________________________________________________
	constructor( id, rule, request, key, value, options ) {

		this.id = id;
		this.rule = rule || null;
		this.request = request || null;
		this.key = key || null
		this.value = value || null;
		this.options = options || null;
	}

	//_________________________________________________________________________________________
	//

}; 

//_____________________________________________________________________________________________
// contains information about the current processing template and its request
exports.query = class QueryClass extends exports.rule {

	//_________________________________________________________________________________________
	constructor( processId, rule, template, isPostQuery = false) {

		super( rule.id, rule.rule, rule.request, rule.key, rule.value, rule.options );
		
		this.processId = processId;
		this.template = template || null;
		this.isPostQuery = isPostQuery || false;
	}

	//_________________________________________________________________________________________
	//

};

//_____________________________________________________________________________________________
// contains the final information about the string
// thats being replaced with the assossiated value
//
exports.processResponse = class ProcessResponseClass {

	//_________________________________________________________________________________________
	constructor( replacement, value, postQuery, indexOffSet ) {

		this.replacement = replacement || "";
		this.value = value || "";
		this.postQuery = (postQuery !== undefined) ? postQuery : null;
		this.indexOffSet = (indexOffSet != undefined) ? indexOffSet : null;

		if ( this.postQuery )
			this.postQuery.isPostQuery = true;
	}

	//_________________________________________________________________________________________
	//

};

//_____________________________________________________________________________________________
// templates for debugging purposes
//
class TemplatesClass {

	//_________________________________________________________________________________________
	constructor() {
		this.templates = {};

		this.templates["hp_debug_messages"] = this.hp_debug_messages();
	}

	//_________________________________________________________________________________________
	// prints out debugging messages
	hp_debug_messages() {
		return `
			<div class="hp-debug-messages">
			{{ foreach: hp_debug_messages }}
				<p>{{ message }}</p>
			{{ foreach end: hp_debug_messages }}
			</div>
		`;
	}

	//_________________________________________________________________________________________
	//

}
exports.templates = (new TemplatesClass()).templates;

//_____________________________________________________________________________________________
//
},{"./Configuration.js":2,"./HTMLParser.js":3}],2:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	defaults and configuration

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

/* jshint -W084 */

// includes
// general configuration
exports.general = {};

exports.general.systemPrefix = "hp_";

//_____________________________________________________________________________________________
// regex for extracting and filtering
exports.regex = {};

// matches a rule within a template
exports.regex.extractRule = function() { return new RegExp("{{([^<>]*?)}}", "g"); };

// rule filtering regex / extract the request, key and the options string
exports.regex.extractRequest = function() { return new RegExp("([\\w-]+)(?:[\\w\\s:-]+)?", "g"); }
exports.regex.extractKey = function() { return new RegExp("{{\\s*(?:[\\w-]+)\\s*:\\s*([\\w-]+)(?:[\\w\\s:-]+)?", "g"); }
// exports.regex.extractOptionsString = function() { return new RegExp("\\w+(?::\\w+)?\\s+(\\w+[\\s\\w+-:]+)", "g"); }

// extracts single options from the option part within the rule
// exports.regex.extractOption = () => { return new RegExp("\\s*([\\w-]+)\\s*:\\s*([\\w-]+)\\s*", "g"); };

// extract a substring based on the given rule
// build based on the given rule to extract area
exports.regex.extractArea = function( query, id ) { return new RegExp( `${query.rule}(.*?){{\\s*${query.request}\\s+end\\s*:\\s*${id}\\s*}}`, "g" ); };

//_____________________________________________________________________________________________
// debugging configuration
exports.debug = {};

// display messages in general
exports.debug.display = true;

// display trace
exports.debug.display_trace = true;

//_____________________________________________________________________________________________
// rule parsing configuration
exports.parsing = {};

// contains the default option set for a rule
// Idea: maybe required attribute to each option value?
//
exports.parsing.optionSets = {
	"default": {
		"render": true,
		"wrap": "|",
	},
	"templateProcess": {
		"processRuleCounter": true,
		"wrapContent": true,
	},
	"templateInline": {
		"renderInline": false
	}
};

//_____________________________________________________________________________________________
// debugging stuff when working with the library
// Todo: implement debuggin usage
// exports.config.debug = {};

// displays every invalid value within the template
// exports.config.debug.displayInvalidValues = true;
// exports.config.debug.displayInvalidValuesAttributes = {
// 	"request": true,
// 	"operator": true,
// 	"key": true,
// 	"template": true,
// 	"value": true
// };

//_____________________________________________________________________________________________
//

},{}],3:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	html template parsing class

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

/* jshint -W084 */

// includes
var Config = require( "./Configuration.js" );
var RequestParser = require( "./RequestParser.js" );
var RuleParser = require( "./RuleParser.js" );
var Classes = require( "./Classes.js" );

//_____________________________________________________________________________________________
var HTMLParser = new class HTMLParserClass {

	//_________________________________________________________________________________________
	constructor() {

		this.templates = new Map;
		this.tprocesses = new Set;

		// this._loadTemplates();
		
		this.ruleCounter = 0;
		this.processCounter = 0;
	}

	//_________________________________________________________________________________________
	// parses a template
	//
	// param1 (string) expects the template id
	// param2 (object) expects the markup of the template
	// param3 (object) expects template options
	//
	// return undefined
	//
	parse( id, markup, options, displayParsingTime = true ) {

		if ( !this.templates.has(id) || options && options["render"] )
			return undefined;

		let template = id;

		if ( !templateDefinition || markup && markup.constructor !== Object )
			return "";

		// let template = "";

		template = ( templateDefinition instanceof Classes.template )
			? templateDefinition
			: this.getTemplate( templateDefinition );
		
		let start = Date.now();
		let content = this._parse( template, markup );
		let end = Date.now();

		if ( displayParsingTime )
			console.log( "HTParser: parsing took %sms", (end - start) );

		return content;
	}

	//_________________________________________________________________________________________
	// actual template parsing
	//
	// param1 (TemplateClass) expects the template object
	// param2 (object) expects the object
	//
	_parse( template, markup, options ) {

		let content = this._processTemplate( template, markup, function( query ) {

			// use processing functions to get response
			let response = RequestProcessor.requestProcessor.processRequest( query );
			return response;

		}, null, options );

		return content;
	}

	//_________________________________________________________________________________________
	// queries through the given template and executes the rule extraction regex onto it
	// builds the querry for the matched rule and builds, based on the returned response
	// of the callback, the content.

	_processTemplate( template, markup, _callback, _this, options = {} ) {

		// register current template process
		let tProcess = this._createTProcess( template, markup );
		tProcess.options = Object.assign({}, tProcess.options, options);

		// constant values / they are used not changed
		let regExtractRule = Config.regex.extractRule();
		let callback = ( _callback && _callback.constructor == Function ) ? _callback.bind( _this || this ) : () => null;
		tProcess.baseMarkup = this._buildBaseMarkup( tProcess );

		// values that being ressigned while processing
		let rawRule = null;
		let content = template.value;
		let oldLastIndex = regExtractRule.lastIndex;
		let postQuerries = [];

		while ( rawRule = regExtractRule.exec(content) ) {
			
			let rule = this._buildRule( tProcess, rawRule[0] );
			let query = new Classes.query( tProcess.id, rule, content.substring(oldLastIndex), false );
			tProcess.currentQuery = query;

			console.log(query);

			// get and review response / the rule is used to build a default response
			let response = this._reviewProcessResponse( tProcess, callback( query ) );

			// track post queries
			if ( response.postQuery )
				postQuerries.push( response.postQuery );
			
			// adjust last index to avoid unecessary regex execution and fails when searching for rules
			// replacements smaller than the rule itself in length result in missing rules
			// written directly after the rule
			regExtractRule.lastIndex += (response.indexOffSet !== null)
				? Number(response.indexOffSet)
				: -(query.rule.length - response.value.length);

			// the last index is needed to create a substring from the content
			// to speed up the processing when the processing functions query inner rules
			oldLastIndex = regExtractRule.lastIndex;

			// !! THE HEART LINE of this framework !! YEAAAAAH !!
			// - and the one in the post query post processing
			//
			// finally replacing the content with its value
			// for semantic reason this has to happen after the index got adjusted
			// console.log(response);
			content = content.replace( response.replacement, query.options.wrap.replace( "|", response.value ) );
		}

		// process post queries
		postQuerries.forEach( (postQuery) => {

			let response = callback( postQuery );
			content = content.replace( response.replacement, response.value );
		});

		// delete process
		this._deleteTProcess( tProcess.id );

		return content;
	}

	//_________________________________________________________________________________________
	// builds the base markup for the processing template
	//
	// param1 (TemplateProcessClass) expects the template process instance
	//
	// return Object
	//
	_buildBaseMarkup( tProcess ) {

		if ( !tProcess || !(tProcess instanceof Classes.tprocess) )
			return {};

		let base = {};

		// Todo: implement relation to parent templates when a subprocess
		base[Config.general.systemPrefix + "templateId"] = tProcess.template.id || (tProcess.isSubProcess)
			? tProcess.template.id
			: "Undefined template id";

		return base;
	}

	//_________________________________________________________________________________________
	// builds the rule object for further processing
	//
	// param2 (TemplateProcessClass) expects the process instance
	// param2 (String) expects the raw rule
	//
	// return RuleClass
	//
	_buildRule( tProcess, rawRule ) {
		
		// build base rule
		let request = this._extractRulePiece( rawRule, Config.regex.extractRequest() ) || null;
		let key = this._extractRulePiece( rawRule, Config.regex.extractKey() ) || null;

		let options = Object.assign( {},
			Config.parsing.optionSets.default,
			Config.parsing.optionSets[ request ] || {}
		);
		let rule = new Classes.rule( (tProcess.options.processRuleCounter) ? ruleIdCounter++ : ruleIdCounter, rawRule, request, key, null, options );

		// the prio key is the value that defines the key of the markup
		// marker are referenced with there name in the markup
		// but the value for commands such as "template" or "foreach" are found under the key in the markup
		// therefor a priority key is needed to identify the corrent value from the markup
		let prioKey = key || request;
		let markup = Object.assign( {}, tProcess.baseMarkup, this._buildRuleMarkup( rule ), tProcess.userMarkup );

		// apply markup configurations
		let markupConfig = this._applyMarkupConfigOnRuleConfig( rule, markup[prioKey] );
		rule.options = markupConfig.options;
		rule.value = markupConfig.value;

		return rule;
	}

	//_________________________________________________________________________________________
	// applies the configuration of the markup onto the ones defined in the rule
	//
	// param1 (RuleClass) expects the rule instance
	// param2 (mixed) expects the configuration
	//
	// return Object
	//
	_applyMarkupConfigOnRuleConfig( rule, config ) {
		
		let processedConfig = { "value": null, "options": Object.assign({}, rule.options) };

		if ( !rule || !config )
			return processedConfig;
		
		if ( config.constructor === String )
			processedConfig.value = config;

		else if ( config.constructor === Function )
			processedConfig.value = config();
		
		else if ( config.constructor === Object ) {
			
			if ( config["value"] )
				processedConfig.value = (config.value.constructor === Function) ? config.value() : config.value;
			else
				processedConfig.value = config;
			
			if ( config["options"] )
				processedConfig.options = Object.assign( processedConfig.options, this._processOptions(config.options) );
		}

		else
			processedConfig.value = config;
		
		return processedConfig;
	}

	//_________________________________________________________________________________________
	// process options values / simple checks when the option value is a function
	// and overwrites the value with the returned value from the function
	//
	// param1 (Object) expects the options object
	//
	// return Object
	//
	_processOptions( options ) {

		if ( !options || options.constructor !== Object || !Object.keys(options).length )
			return {};

		for ( let option in options )
			if ( options[option] && options[option].constructor === Function )
				options[option] = options[option]();
		
		return options;
	}

	//_________________________________________________________________________________________
	// returns a markup based on the given rule
	//
	// param1 (RuleInstance) expects the process instance
	//
	// return Object
	//
	_buildRuleMarkup( rule ) {

		if ( !rule || !(rule instanceof Classes.rule) )
			return {};

		let markup = {
			[`${Config.general.systemPrefix}hp_rule`]: rule.rule,
			[`${Config.general.systemPrefix}hp_request`]: rule.request,
			[`${Config.general.systemPrefix}hp_key`]: rule.key || ""
		};
		
		for ( let i in rule.options ) {
			markup[`${Config.general.systemPrefix}hp_option_${i}`] = rule.options[i];
		}

		return markup;
	}

	//_________________________________________________________________________________________
	// gets the request value as "value" and "options" object by the markup and rule
	//
	// param1 (string) expects the prioirity key of the rule
	// param2 (Object) expects the markup value
	//
	// return Object
	//
	_getRequestValue( prioKey, markup ) {

		let config = { "value": null, "options": {} };
		let value = markup[ prioKey ];

		if ( !value )
			return config;
		
		if ( value.constructor === String )
			config.value = value;
		
		else if ( value.constructor === Object ) {
			config.value = value["value"] || null;
			config.options = this._processOptions(value["options"]);
		}

		return config;
	}	

	//_________________________________________________________________________________________
	// extracts a value from a string with a given regex
	// a valid result will be qued through the possible matched groups and passed
	// to the callback and collected in an array that will be returned
	// when no callback is provided it returns either the first group
	// the raw match or an empty string
	//
	// param1 (string) expects the search string
	// param2 (RegExp) expects the regex
	// param3 (Function) (optional) expects a callback function
	//
	// return array
	//
	_extractRulePiece( source, regex, callback = null ) {
		
		let match = regex.exec( source );

		if ( !match )
			return null;
		
		if ( callback && callback.constructor === Function ) {

			let results = [];

			for ( let i = 1;; i++ ) {
				if ( !match[i] )
					break;
				results.push( callback(match[i]) );
			}
			return results;
		}
		
		return match[1] || match[0] || "";
	}

	//_________________________________________________________________________________________
	// checks the given response and corrects it if necessary
	//
	// param1 (ProcessResponse) expects the response instance
	// param2 (RuleClass) expects the processing rule instance
	//
	// return ProcessResponse
	//
	_reviewProcessResponse( tProcess, response ) {

		if ( !response || !(response instanceof Classes.processResponse) )
			return new Classes.processResponse( tProcess.currentQuery.rule, "", false );
		
		if ( !response.replacement || response.replacement.constructor !== String )
			response.replacement = rule.rule;
		
		if ( !response.value || response.value.constructor !== String && response.value.constructor !== Function )
			response.value = String(response.value);

		return response;
	}

	//_________________________________________________________________________________________
	// creates a new template process
	//
	// param1 (TemplateClass) expects the template instance
	//
	// return undefined | null | >0 Number
	//
	_createTProcess( template, markup ) {

		if ( !(template instanceof Classes.template) )
			return undefined;
		
		if ( this._hasTProcess(template.id) )
			return null;
		
		let freshId = this._getFreeTProcessId();
		this.tprocesses[freshId] = new Classes.tprocess( freshId, template, markup, Boolean(template.id) );

		return this._getTProcess( freshId );
	}

	//_________________________________________________________________________________________
	// deletes a template process
	_deleteTProcess( processId ) {

		if ( !this._getTProcess(processId) )
			return null;
		
		delete this.tprocesses[processId];

		return Boolean( this._getTProcess(processId) );
	}

	//_________________________________________________________________________________________
	// returns the existance of a process as a boolean
	_hasTProcess( processId ) {
		return Boolean( this.tprocesses[processId] );
	}

	//_________________________________________________________________________________________
	// returns a template process
	_getTProcess( processId ) {
		return this.tprocesses[processId];
	}

	//_________________________________________________________________________________________
	// returns a usable unique process id
	_getFreeTProcessId() {

		let id = ++Object.values(this.tprocesses).length;
		while ( this.tprocesses[this.tprocesses.length] )
			id++;

		return id;
	}

	//_________________________________________________________________________________________
	// defines either the full options of a template or a specific option
	//
	// param1 (String) expects the template id
	// param2 (String|Object) expects either the options object or the option key
	// param3 (mixed) expects the value for a option / only used when param2 is a string
	//
	// return Boolean
	//
	setTemplateOptions( templateId, definition, value ) {

		if ( !this.hasTemplate(templateId) )
			return false;
		
		if ( !definition && !value )
			this.getTemplate( templateId ).options = {};
		
		else if ( definition.constructor === Object )
			this.getTemplate( templateId ).options = definition;

		else if ( definition.constructor === String )
			this.getTemplate( templateId ).options[definition] = value;
		
		else
			return false;
		
		return true;
	}
	
	//_________________________________________________________________________________________
	// returns a template
	//
	// param1 (String) expects the template id
	//
	// return null | TemplateClass
	//
	getTemplate( templateId, includeCoreTemplates = false) {

		// core templates are left out
		if ( !this.templates[templateId] || !includeCoreTemplates && !templateId.indexOf(Config.general.systemPrefix) )
			return null;

		return this.templates[templateId];
	}

	//_________________________________________________________________________________________
	// returns every registered templates except the core ones
	//
	// return object - key:id value:template instance
	//
	getTemplates( includeCoreTemplates = false ) {

		let templates = {};

		for( let i in this.templates )
			if ( !includeCoreTemplates && i.indexOf(Config.general.systemPrefix) )
				templates[i] = this.templates[i];
		
		return templates;
	}

	//_________________________________________________________________________________________
	// returns the existance of a template
	//
	// return boolean
	//
	hasTemplate( templateId ) {
		return Boolean(this.templates[templateId]);
	}

	//_________________________________________________________________________________________
	//

}();
exports.parser = HTMLParser;

//_____________________________________________________________________________________________
//
},{"./Classes.js":1,"./Configuration.js":2,"./RequestParser.js":4,"./RuleParser.js":5}],4:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	contains processing functions of the template library

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

/* jshint -W084 */

// includes
var Config = require("./Configuration.js");
var Parser = require("./HTMLParser.js");
var Classes = require("./Classes.js");

//_____________________________________________________________________________________________
var RequestProcessor = class RequestProcessorClass {

	//_________________________________________________________________________________________
	constructor() {}

	//_________________________________________________________________________________________
	// processes the given query based on the request
	//
	// param1 (QueryClass) expects the query instance
	//
	// return null | ProcessResponseClass
	//
	processRequest( query ) {

		if ( String(query.options.render).toLowerCase() == "false" )
			return new Classes.processResponse( query.rule, null, false );
		
		// wether to check if the request function exists
		// its more common that a marker is given which just needs to be replaced by its value
		else if ( !(query.request in this) )
			return new Classes.processResponse(query.rule, query.value, false)
		
		return this[ query.request ]( query );
	}

	//_________________________________________________________________________________________
	// replaces current scope with the result of another template
	//
	// param1 (QueryClass) expects the query instance
	//
	// return null | ProcessResponseClass
	//
	template( query ) {
		
		if ( !query.key )
			return null;
		
		// try to requery at a later state but not when its already a post query
		if ( !Parser.parser.hasTemplate(query.key) )
			return new Classes.processResponse( query.rule, (!query.isPostQuery) ? query.rule : "", (!query.isPostQuery) ? query : false, 0 );
		
		let response = new Classes.processResponse( query.rule, null, false );
		let content = Parser.parser.parse( query.key, query.value, false );

		response.value = content;

		return response;
	}

	//_________________________________________________________________________________________
	// extract the inline defined template from the given template an stores it
	// as a separat template with the given id / when the template already exists
	// a warning is displayed in the console
	//
	// param1 (QueryClass) expects the query instance
	//
	// return ProcessResponseClass
	//
	templateInline( query ) {

		// Todo: implement displayment of invalid key definition
		if ( !query.key )
			return null;

		let response = new Classes.processResponse( query.rule, "", false );
		let templateMatch = Config.regex.extractArea( query, query.key ).exec( query.template );

		// Todo: implement displayment of not found inline template definition
		if ( !templateMatch )
			return response;
		
		// Todo: implement displayment of unsuccessful registered inline defined template
		if ( !Parser.parser.registerTemplate(query.key, templateMatch[1]) )
			return response;
		
		response.replacement = templateMatch[0];
		
		if ( query.options.renderInline )
			response.value =  Parser.parser.parse( query.key, query.value );

		return response;
	}

	//_________________________________________________________________________________________
	// extracts the content surrounded by the foreach rule and repeats it
	// with the given configuration defined in the markup by the key
	//
	// param1 (QueryClass) expects the query instance
	//
	// return ProcessResponseClass
	//
	foreach( query ) {

		// Todo: implement displayment of invalid key definition
		// or invalid markup definition
		if ( !query.key || !query.value || query.value && query.value.constructor !== Array )
			return null;

		let response = new Classes.processResponse( query.rule, "", false );
		let foreachMatch = Config.regex.extractArea( query, query.key ).exec( query.template );

		// Todo: implement displayment of undefined or invalid definition of the foreach command
		if ( !foreachMatch )
			return response;
		
		response.replacement = foreachMatch[0];
		let template = foreachMatch[1];
		let content = "";
		
		query.value.forEach( (currentMarkup) => {
			content += Parser.parser.parse( new Classes.template( null, template ), currentMarkup, false );
		});

		response.value = content;

		return response;
	}

	//_________________________________________________________________________________________
	// prints out information about a markup configuration and the current template process
	//
	// param1 (QueryClass) expects the query instance
	//
	// return ProcessResponseClass
	//
	debug( query ) {

		// Todo: finish "debug" command implementation!
		let response = new Classes.processResponse( query.rule, "no data found", false );

		response.value = "Currently not implemented!";

		return response;
	}

	//_________________________________________________________________________________________
	//

};
exports.requestProcessor = RequestProcessor;

//_____________________________________________________________________________________________
//

},{"./Classes.js":1,"./Configuration.js":2,"./HTMLParser.js":3}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
var Parser = require("./HTMLParser.js").parser;

if (window) window.js_htparser = Parser;

exports.parser = Parser;
},{"./HTMLParser.js":3}]},{},[6]);
