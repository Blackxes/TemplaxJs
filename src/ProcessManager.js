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