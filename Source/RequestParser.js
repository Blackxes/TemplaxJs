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
var Templax = require("./App.js");

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
