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

			if ( item["markup"] ) this.tManager.setMarkup( id, item["markup"] );
			if ( item["options"] ) this.tManager.setOptions( id, item["options"] );
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