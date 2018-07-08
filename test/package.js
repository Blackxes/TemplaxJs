(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	contains several container classes

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

// includes
var Config = require( "./Configuration.js" );

//_____________________________________________________________________________________________
// contains information about a general template process
class ProcessClass {

	//_________________________________________________________________________________________
	//
	// param1 (string) expects the process id
	// param2 (TemplateClass) expects the template instance
	// param3 (Object) expects the initial markup from the user
	// param4 (boolean) describes wether this is a subprocess or not
	//
	constructor( id, template, userMarkup, options, parentProcess = null ) {

		this.id = id || null;
		this.template = template || null;
		this.userMarkup = userMarkup || {};
		this.queryMarkup = {};
		this.options = Object.assign({}, Config.parsing.optionSets.templateProcess, options );
		this.currentQuery = null;
		
		// the parent template id is not equal to the absolute parent of this process
		// the id pull goes up to the process that actually has a template id
		this.parentProcess = parentProcess;
	}

	//_________________________________________________________________________________________
	// returns true/false wether this is a subprocess or not
	//
	get isSubProcess() {
		return Boolean( this.parentProcess );
	}
};
exports.process = ProcessClass;

//_____________________________________________________________________________________________
// contains information about a template
class TemplateClass {

	//_________________________________________________________________________________________
	constructor( id, value, options, parentTemplate = null ) {

		this.id = id || null;
		this.value = value || null;
		this.options = options || {};
		this.parentTemplate = parentTemplate;
	}

	//_________________________________________________________________________________________
	// returns the template id considering wether this is a subtemplate or not
	// when this.id is not defined it returns the parent id recursively
	get tid() {
		if ( !this.id )
			return this.parentTemplate.tid;
		return this.id;
	}

	//_________________________________________________________________________________________
	// return true/false wether this template is valid
	// a template is only valid when the id is given or instead a parent template is defined
	//
	get valid() {
		return Boolean( this.id || !this.id && this.parentTemplate );
	}
};
exports.template = TemplateClass;

//_____________________________________________________________________________________________
// contains information about the rule
class RuleClass {

	//_________________________________________________________________________________________
	constructor( id, rawRule, request, key, value, commandValue, options ) {

		this.id = id;
		this.rawRule = rawRule || null;
		this.request = request || null;
		this.key = key || null
		this.value = value || null;
		this.commandValue = commandValue || null; // value specified for the request for example if-xy
		//	the if parsing functions will work with the value then when defined in the markup
		this.options = options || null;
	}
}; 
exports.rule = RuleClass;

//_____________________________________________________________________________________________
// contains information about the current processing template and its request
class QueryClass extends exports.rule {

	//_________________________________________________________________________________________
	constructor( process, rule, template, isPostQuery ) {

		super( rule.id, rule.rawRule, rule.request, rule.key, rule.value, rule.commandValue, rule.options );
		
		this.process = process;
		this.template = template || null;
		this.isPostQuery = isPostQuery || false;
	}
};
exports.query = QueryClass;

//_____________________________________________________________________________________________
// contains the final information about the string
// thats being replaced with the assossiated value
//
class ResponseClass {

	//_________________________________________________________________________________________
	constructor( replacement, value, postQuery, offset = null ) {

		this.replacement = replacement || "";
		this.value = value || "";
		this.postQuery = postQuery || null;
		this.offset = (offset !== undefined) ? offset : null;

		if ( this.postQuery )
			this.postQuery.isPostQuery = true;
	}
};
exports.response = ResponseClass;

//_____________________________________________________________________________________________
//
},{"./Configuration.js":2}],2:[function(require,module,exports){
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

// default sets
exports.defaults = {};

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
exports.regex.extractArea = function( query, id ) { return new RegExp( `${query.rawRule}(.*?){{\\s*${query.request}\\s+end\\s*:\\s*${id}\\s*}}`, "g" ); };

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
	"template": {
		"processRuleCounter": true,
		"wrapContent": true,
	},
	"templateInline": {
		"renderInline": false
	}
};

// default option setup for a template
exports.defaults.templateOptionSet = {
	"render": true
}

//_____________________________________________________________________________________________
//

},{}],3:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	process class 

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

var ClassSet = require( "./ClassSet.js" );

//_____________________________________________________________________________________________
var ProcessManager = new class ProcessManagerClass {

	//_________________________________________________________________________________________
	constructor() {

		this.processes = new Map();
		this.processIterator = 0;
	}

	//_________________________________________________________________________________________
	// creates a new template process
	//
	// param1 (TemplateClass) expects the template instance
	// param2 ()
	//
	// return
	//		false when invalid params are passed
	//		ProcessClass - process has been created successfully
	//
	create( template, markup = {}, options = {}, parentProcess ) {

		if ( !(template instanceof ClassSet.template) )
			return false;
		
		let process = new ClassSet.process( ++this.processIterator, template, markup, options, parentProcess );
		this.processes.set( process.id, process );

		return this.get( process.id );
	}

	//_________________________________________________________________________________________
	// deletes a template process
	//
	// param1 (int|ProcessClass) expects the process id or the process instance
	//
	// return boolean
	//		true on success deletion
	//		false when process doesnt exist
	//
	delete( value ) {
		
		if ( !value )
			return false;

		if ( value instanceof ClassSet.process )
			return this.processes.delete( value.id );
		
		return this.processes.delete( id );
	}

	//_________________________________________________________________________________________
	// returns the existance of a process as a boolean
	//
	// param1 (int|Query) expects the process id or a query instance
	//
	// return boolean
	//		true when process exist
	//		false when process doesnt exist
	//
	has( value ) {

		if ( value instanceof ClassSet.query )
			return this.processes.has( value.processId );
		return this.processes.has( value );
	}

	//_________________________________________________________________________________________
	// returns a template process
	//
	// param1 (int|Query) expects the process id or a query instance
	//
	// return ProcessClass
	//		the requested process id
	//
	get( value ) {
		if ( value instanceof ClassSet.query )
			return this.processes.get( value.processId );
		return this.processes.get( value );
	}

	//_________________________________________________________________________________________
	// validates a process selected by either the id or the instance
	//
	// param1 (int|ProcessClass) expects either the process id or the process instance
	//
	// return boolean
	//		true - when the process is valid
	//		false - when the process is invalid
	//
	validate( value ) {

		let process = ( value && value instanceof ClassSet.process )
			? value
			: this.get( value );
		
		return !( !process || !process.id || !process.template || !(process.template instanceof ClassSet.template) )
	}

}
exports.processManager = ProcessManager;

//_____________________________________________________________________________________________
//
},{"./ClassSet.js":1}],4:[function(require,module,exports){
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
var ClassSet = require("./ClassSet.js");
var Templax = require("./Templax.js");

//_____________________________________________________________________________________________
var RequestParser = new class RequestParserClass {

	//_________________________________________________________________________________________
	constructor() {
		
		this.pManager = require( "./ProcessManager.js" ).processManager;
		this.tManager = require( "./TemplateManager.js" ).templateManager;
		this.requestIterator = 0;
	}

	//_________________________________________________________________________________________
	// processes the given query based on the request
	//
	// param1 (QueryClass) expects the query instance
	//
	// return null | ResponseClass
	//
	parse( query ) {

		this.requestIterator++;

		if ( String(query.options.render) === "false" )
			return new ClassSet.response( query.rawRule, null, false );
		
		// wether to check if the request function exists
		// its more common that a marker is given which just needs to be replaced by its value
		else if ( !(query.request in this) )
			return new ClassSet.response(query.rawRule, query.value, false)
		
		return this[ query.request ]( query );
	}

	//_________________________________________________________________________________________
	// replaces current scope with the result of another template
	//
	// param1 (QueryClass) expects the query instance
	//
	// return null | ResponseClass
	//
	template( query ) {
		
		if ( !query.key ) return null;
		
		// try to requery at a later state but not when its already a post query
		if ( !this.tManager.has(query.key) )
			return new ClassSet.response( query.rawRule, (!query.isPostQuery) ? query.rawRule : "", (!query.isPostQuery) ? query : false, 0 );
		
		let response = new ClassSet.response( query.rawRule, null, false );
		let content = Templax.app.parse( query.key, query.value, false, this.pManager.get(query) );

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
	// return ResponseClass
	//
	templateInline( query ) {

		// Todo: implement displayment of invalid key definition
		if ( !query.key ) return null;

		let response = new ClassSet.response( query.rawRule, "", false );
		let templateMatch = Config.regex.extractArea( query, query.key ).exec( query.template );

		// Todo: implement displayment of not found inline template definition
		if ( !templateMatch ) return response;
		
		// Todo: implement displayment of unsuccessful registered inline defined template
		if ( !this.tManager.register( query.key, templateMatch[1]) )
			return response;
		
		response.replacement = templateMatch[0];
		
		if ( query.options.renderInline )
			response.value =  Templax.app.parse( query.key, query.value );

		return response;
	}

	//_________________________________________________________________________________________
	// extracts the content surrounded by the foreach rule and repeats it
	// with the given configuration defined in the markup by the key
	//
	// param1 (QueryClass) expects the query instance
	//
	// return ResponseClass
	//
	foreach( query ) {

		// Todo: implement displayment of invalid key definition
		// or invalid markup definition
		if ( !query.key || !query.value || query.value && query.value.constructor !== Array )
			return null;

		let response = new ClassSet.response( query.rawRule, "", false );
		let foreachMatch = Config.regex.extractArea( query, query.key ).exec( query.template );

		// Todo: implement displayment of undefined or invalid definition of the foreach command
		if ( !foreachMatch ) return response;
		
		response.replacement = foreachMatch[0];
		let content = "";
		
		query.value.forEach( (currentMarkup) => {
			content += Templax.app.parse(
				new ClassSet.template( null, foreachMatch[1], query.rawRule.options, query.process.template ),
				currentMarkup,
				false,
				query.process
			);
		});

		response.value = content;

		return response;
	}

	//_________________________________________________________________________________________
	// similar to the if command but instead of rendering only when the requested key is true
	// or simply defined case renders the inner content when the markup value is defined
	// .. well simply matches true when checking
	//
	case( query ) {

		if ( !query.key ) return null;

		let response = new ClassSet.response( query.rawRule, "", false );
		let caseMatch = Config.regex.extractArea( query, query.key ).exec( query.template );

		if ( !caseMatch ) return response;
		
		response.replacement = caseMatch[0];

		// when the rendering is not permitted
		if ( !query.value ) return response;

		response.value = Templax.app.parse(
			new ClassSet.template( null, caseMatch[1] , query.options, query.process.template ),
			query.value,
			false,
			query.process
		);

		return response;
	}

	//_________________________________________________________________________________________
	// renders the inner part of the if request when the markup item assossiated
	// with the key is true
	//
	if( query ) {

		if ( !query.key ) return null;

		let response = new ClassSet.response( query.rawRule, "" );
		let ifMatch = Config.regex.extractArea( query, query.key ).exec( query.template );

		if ( !ifMatch ) return response;
		
		response.replacement = ifMatch[0];

		// when the current markup item assossiated with the key is false
		if ( !query.process.queryMarkup[ query.key ] ) return response;

		response.value = Templax.app.parse(
			new ClassSet.template( null, ifMatch[1] , query.options, query.process.template ),
			query.commandValue || {},
			false,
			query.process
		);

		return response;
	}

	//_________________________________________________________________________________________
	// prints out information about a markup configuration and the current template process
	//
	// param1 (QueryClass) expects the query instance
	//
	// return ResponseClass
	//
	debug( query ) {

		// Todo: finish "debug" command implementation!
		let response = new ClassSet.response( query.rawRule, "no data found", false );

		response.value = "Currently not implemented!";

		return response;
	}

	//_________________________________________________________________________________________
	//

};
exports.requestParser = RequestParser;

//_____________________________________________________________________________________________
//

},{"./ClassSet.js":1,"./Configuration.js":2,"./ProcessManager.js":3,"./TemplateManager.js":6,"./Templax.js":7}],5:[function(require,module,exports){
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
var RuleParser = new class RuleParser {

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
},{"./ClassSet.js":1,"./Configuration.js":2}],6:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	template manager

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

var ClassSet = require( "./ClassSet.js" );

//_____________________________________________________________________________________________
var TemplateManager = new class TemplateManagerClass {

	//_________________________________________________________________________________________
	constructor() {

		this.templates = new Map();

		this._loadFromDOM();
	}

	//_________________________________________________________________________________________
	// loads templates from the dom
	//
	// return boolean
	//
	_loadFromDOM() {

		let raw = document.querySelector("template#tx-templates");
		
		// load custom user
		if ( raw ) {
			for ( let elm of raw.content.children ) {
				if ( !this.register( elm.id, elm.innerHTML ) )
					console.log("HTParser: registering template %s failed", elm.id);
			}
		}

		return true;
	}

	//_________________________________________________________________________________________
	// registers a template
	//
	// param1 (string) expects the (unique) template id
	//		how duplicates are handled is defined in the config
	// param2 (string) the actual template as string
	//
	// return undefined | number
	//		undefined - on invalid values
	//		number - the count of registered templates - including the newly registered
	//
	register( id, template ) {
		
		if ( !id || id && id.constructor !== String || !template || template.constructor !== String )
			return console.log( "HTParser: invalid values for template registration: %s", id );

		else if ( this.templates.has(id) )
			return console.log( "HTParser: duplicated template found: '%s'", id );
		
		let result = this.templates.set( id, new ClassSet.template(id, template.replace(/\s{2,}/g, "")) );

		return (result) ? result.size : false;
	}

	//_________________________________________________________________________________________
	// returns the requested template or false when not found
	//
	// param1 (string) expects the template id
	// param2 (boolean) defines the return
	//		true will return all templates
	//		false only the requested one
	//
	// return TemplateClass | boolean
	//
	get( id, all = false ) {
		return ( all ) ? this.templates.values() : this.templates.get( id );
	}
	
	//_________________________________________________________________________________________
	// returns the presence of a template as boolean
	//
	// param1 (string) expects the template id
	//
	// return boolean
	//		true - when template exists
	//		false - when template doesnt exists.. no shit.
	//
	has( id ) {
		return this.templates.has( id );
	}

	//_________________________________________________________________________________________
	// defines either the full options of a template or a specific option
	//
	// param1 (string) expects the template id
	// param2 (string|Object) expects either the options object or the option key
	// param3 (mixed) expects the value for a option
	//		only used when param2 is given and exists
	//
	// return boolean
	//		true - when the option(s) has been set
	//		false - on invalid values or the template doesnt exist
	//
	setOptions( id, definition, value ) {

		if ( !this.hasTemplate(id) )
			return false;
		
		if ( !definition && !value )
			this.getTemplate( id ).options = {};
		
		else if ( definition.constructor === Object )
			this.getTemplate( id ).options = definition;

		else if ( definition.constructor === String )
			this.getTemplate( id ).options[definition] = value;
		
		else
			return false;
		
		return true;
	}

	//_________________________________________________________________________________________
	// defines the default markup for this template or a single item
	//
	// param1 (string) expects the template id
	// param2 (string|Object) expects the markup or the 
	// param3 (mixed) expects the value for the markup item
	//		only used when param2 is given and exists
	//
	// return boolean
	//		true - when successfully defined markup
	//		false - when template not found or invalid values
	//
	setMarkup( id, definition, value ) {

		if ( !this.templates.has(id) )
			return false;

		if ( !definition && !value )
			this.getTemplate( id ).markup = {};
		
		else if ( definition.constructor === Object )
			this.getTemplate( id ).markup = definition;
		
		else if ( definition.constructor === String )
			this.getTemplate( id ).markup[definition] = value;
		
		else
			return false;

		return true;
	}
}
exports.templateManager = TemplateManager;

//_____________________________________________________________________________________________
//
},{"./ClassSet.js":1}],7:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	html template parsing class

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

/* jshint -W084 */

var Config = require( "./Configuration.js" );
var ClassSet = require( "./ClassSet.js" );

//_____________________________________________________________________________________________
var Templax = new class TemplaxClass {

	//_________________________________________________________________________________________
	constructor() {
		
		this.tManager = require( "./TemplateManager.js" ).templateManager;
		this.pManager = require( "./ProcessManager.js" ).processManager;
		this.rqParser = require( "./RequestParser.js" ).requestParser;
		this.rlParser = require( "./RuleParser.js" ).ruleParser;
	}

	//_________________________________________________________________________________________
	// define the framework and assigns the given default markups and options to their
	// assossiated template
	//
	// param1 (array) expects the configurations
	//		{
	//			template1: { "markup": {}, "options": {} }
	//			template2: { "markup": {}, "options": {} }
	//		}
	//
	// return boolean
	//
	define( configs ) {

		if ( !configs || configs.constructor !== Object )
			return false;
		
		for( let id in configs ) {

			let item = configs[id];

			if ( item["markup"] ) tManager.setMarkup( id, item["markup"] );
			if ( item["options"] ) tManager.setOptions( id, item["options"] );
		}

		return true;
	}

	//_________________________________________________________________________________________
	// parses a template
	//
	// param1 (string) expects the template id
	// param2 (object) expects the markup of the template
	// param3 (object) expects template options
	// param4 (ProcessClass) expects the parent process instance
	//		this can and shall be ignored by the user / it only has an internal use
	//
	// return string
	//		string - empty string on invalid params
	//			invalid template id or the render option is false
	//		string - parsed content
	//
	parse( id, markup, options, parentProcess = null ) {

		// parsingSet / contains a templat instance, a markup and an options object
		let pSet = this._verifyParsingSet( id, markup, options );

		if ( !pSet.options.render || !pSet.template.valid )
			return "";
			
		let content = this._processTemplate( pSet.template, pSet.markup, pSet.options, function( query ) {

			let response = this.rqParser.parse( query );
			return response;

		}, null, parentProcess);

		return content;
	}

	//_________________________________________________________________________________________
	// verifies the given parameter and return an (assossitated) object
	// replaces every invalid value with default values except the template
	//
	// param1 (string|TemplateClass) expects the template id a template string or a template instance
	// param2 (object) expects the markup
	// param3 (object) expects the options
	//
	_verifyParsingSet( templateValue, markup, options ) {

		// the template is crucial so pick up the right choice
		// actually i think it looks kinda pretty ..
		let parsingSet = {
			"template": ( this.tManager.has(templateValue) )
				? this.tManager.get( templateValue )
				: ( templateValue && templateValue instanceof ClassSet.template )
					? templateValue
					: ( templateValue && templateValue.constructor === String )
						? new ClassSet.template( null, templateValue )
						: new ClassSet.template( null, null ),
			"markup": (markup && markup.constructor == Object ) ? markup : {},
			"options": ( options && options.constructor == Object )
				? Object.assign( Config.defaults.templateOptionSet, options )
				: Config.defaults.templateOptionSet
		};

		return parsingSet;
	}

	//_________________________________________________________________________________________
	// queries through the given template and executes the rule extraction regex onto it
	// builds the querry for the matched rule and builds, based on the returned response
	// of the callback, the content.
	//
	// param1 (TemplateClass) expects the template instance
	// param2 (Object) expects the markup
	// param3 (Object) expects the options
	// param4 (Function) expects the callback function in which the query will be passed
	//		the callback has to return a response object // see ClassSet.js "ResponseClass"
	//
	// return string
	//		the parsed template as string
	//
	_processTemplate( template, markup = {}, options = {}, _callback = null, _this = null, parentProcess = null ) {

		// register current template process
		let process = this.pManager.create( template, markup, options, parentProcess );
		process.options = Object.assign({}, process.options, options);

		// constant values / they are used not changed
		let regExtractRule = Config.regex.extractRule();
		let callback = ( _callback && _callback.constructor == Function ) ? _callback.bind( _this || this ) : () => null;
		process.queryMarkup = Object.assign( {}, this._buildBaseMarkup( process ), template.markup, markup );

		// values that being ressigned while processing
		let rawRule = null;
		let content = template.value;
		let lastIterator = regExtractRule.lastIndex;
		let postQueries = [];

		while ( rawRule = regExtractRule.exec(content) ) {
			
			let rule = this.rlParser.parse( process, rawRule[0] );
			let query = new ClassSet.query( process, rule, content.substring(lastIterator), false );
			process.currentQuery = query;

			// get and review response / the rule is used to build a default response
			let response = this._reviewProcessResponse( process, callback( query ) );

			// track post queries
			if ( response.postQuery )
				postQueries.push( response.postQuery );
			
			// adjust last index to avoid unecessary regex execution and fails when searching for rules
			// replacements smaller than the rule itself in length result in missing rules
			// written directly after the rule
			regExtractRule.lastIndex += (response.offset !== null)
				? Number(response.offset)
				: -(query.rawRule.length - response.value.length);
			
			// the last index is needed to create a substring from the content
			// to speed up the processing when the processing functions query inner rules
			lastIterator = regExtractRule.lastIndex;

			// !! THE HEART LINE of this framework !! YEAAAAAH !!
			// - and the one in the post query post processing
			//
			// finally replacing the content with its value
			// for semantic reason this has to happen after the index got adjusted
			content = content.replace( response.replacement, response.value );
		}

		// process post queries
		postQueries.forEach( (postQuery) => {
			
			let response = callback( postQuery );
			content = content.replace( response.replacement, response.value );
		});

		// delete process
		this.pManager.delete( process );

		return content;
	}

	//_________________________________________________________________________________________
	// builds the base markup for the processing template
	//
	// param1 (TemplateProcessClass) expects the template process instance
	//
	// return Object
	//
	_buildBaseMarkup( process ) {

		if ( !this.pManager.validate( process ) )
			return {};

		let base = {
			"tx-template-id": process.template.id || (process.isSubProcess)
				? process.template.id
				: `${process.template.tid}-subtemplate`
		};

		return base;
	}
	
	//_________________________________________________________________________________________
	// checks the given response and corrects it if necessary
	//
	// param1 (ProcessResponse) expects the response instance
	// param2 (RuleClass) expects the processing rule instance
	//
	// return ProcessResponse
	//
	_reviewProcessResponse( process, response ) {

		if ( !response || !(response instanceof ClassSet.response) )
			return new ClassSet.response( process.currentQuery.rule, "", false );
		
		if ( !response.replacement || response.replacement.constructor !== String )
			response.replacement = process.currentQuery.rawRule;
		
		if ( !response.value || response.value.constructor !== String && response.value.constructor !== Function )
			response.value = String(response.value);

		return response;
	}

	//_________________________________________________________________________________________
	// returns the template manager
	get templates() { return this.tManager.get( null, true ); }

}();
exports.app = Templax;

//_____________________________________________________________________________________________
//
},{"./ClassSet.js":1,"./Configuration.js":2,"./ProcessManager.js":3,"./RequestParser.js":4,"./RuleParser.js":5,"./TemplateManager.js":6}],8:[function(require,module,exports){
//_____________________________________________________________________________________________
/**********************************************************************************************

	testing file

	@Author: Alexander Bassov
	@Email: blackxes@gmx.de
	@Github: https://www.github.com/Blackxes

/*********************************************************************************************/

let firstName = () => {
	return false;
}

class Unit {

}

var markups = {

	// basic marker functionality
	"test-basic-marker-functionality": {
		"first_name": "Alex",
		"last_name": "Bassov",
		"email": "blackxes@gmx.de"
	},

	// template inline declaration
	"test-template-inline-declaration": {
		"inline-template": {
			"options": {
				"if": function() { return true; }
			}
		}
	},

	// post inline template definition
	"test-post-inline-template-definition": {
		"inline-definition": {
			"inline_marker": "Sick Marker"
		}
	},

	// foreach command
	"test-foreach": {
		"fruits": [
			{ "fruit": "apple" },
			{ "fruit": "avocado" },
		]
	},

	// observe command
	"test-observe": {
		"units": [
			{  }
		]
	},

	// logout
	"test-case-command": {
		"login": true,
	},

	"test-if-command": {
		"health": 200,
		"if-health": {
			"damage": 40,
			"armor": 70
		},
		"if-damage": {
			"tower": "Balistic",
			"type": "range"
		}
	}
};

// tests
var parserTests = {
	1: "test-basic-marker-functionality",
	2: "test-template-inline-declaration",
	3: "test-post-inline-template-definition",
	4: "test-template-placeholder",
	5: "test-foreach",
	6: "test-invalid-rules",
	7: "test-case-command",
	8: "test-if-command",
};

performTests = function( ...givenTests ) {

	let templax = require("../src/Templax.js").app;

	for( let nb of givenTests) {

		if ( !nb ) return document.getElementById("app").innerHTML += `<p>Test Nr. ${testNr} not found</p>`;

		console.log("Current Test: %s | Markup: %o\n---", parserTests[ nb ], markups[parserTests[nb]] || "none given");

		let result = templax.parse(
			parserTests[ nb ],
			markups[parserTests[ nb ]] || {}
		);

		document.getElementById("app").innerHTML += "<div class=\"test-block\">" + result + "</div>";
	};
}

//_____________________________________________________________________________________________
document.addEventListener("DOMContentLoaded", function() {

	let templax = require( "../src/Templax.js" ).app;

	// define test template
	performTests( 8 );

	return true;
});

//_____________________________________________________________________________________________
//

},{"../src/Templax.js":7}]},{},[8]);
