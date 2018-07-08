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