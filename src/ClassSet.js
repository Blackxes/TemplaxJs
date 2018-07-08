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