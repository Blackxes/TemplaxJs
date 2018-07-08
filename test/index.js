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
