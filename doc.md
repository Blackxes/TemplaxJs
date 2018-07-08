# js_htparser ideas and thoughts v3

## [ Ideas and Feature ]
Creating rules is different from v2. Your are now able to define options besides the regular request.
```html
{{ request: key option1:value1 option2:value2 }}
```
The example above shows how the options are added to the rule. You are free to palce spaces as much as you like. So do not worry about them. They still getting found and interpreted.

Besides the new option possibilities, the performance of the query building has increased by exponentially. In the previous versions a long regex is used to extract every value needed to build the query. So the "request", the "key" and the "options" string were extracted by one single long regex.

Now little regexes are used to extract each value separately.

Some test result: <br>
```html
Situation: 100 Marker.
The time has been taken when the parser parsed the template some times.
Times = x / Repetitions = r

Results: x1000, r10 / +417,11%
old average: 7.2407 seconds
new average:  1.7359 seconds

Results: x100, r50 / +407,9%
old average: 0.7020 seconds
new average: 0.1721 seconds

Results: x10, r1000 / +398,88%
old average: 0.0714 seconds
new average: 0.0179 seconds

old function: 0.007  * 10.0702 ^ x
new function: 0.0017 * 9.8477  ^ x
```
I created a simple template with single marker, a request with a key and one option "option:value" times 10. So in total 30 rules.
```javascript
{{ marker }} // x10
{{ request: key }} // x10
{{ request: key option:value }} // x10
```
Both methods, the long regex and 3 small ones (extracting only one value), were running for 100.000 times several times, 50 times.

---

## [ Superficial Options ]  
Options that are being processed regardless of their request type. For example you defined the following rule:
```html
{{ template if:headerCheck }}
```
That rule will only be rendered when the "headerCheck" equals true. You can define regular boolean or a function. Both will be interpreted correctly.  
But be aware! - values like "1" and "0" will be interpreted as their assossiated boolean value "Boolean(true)" and "Boolean(false)".

### [ List of the superficial options ]
- if (default: true)

## [ processing order - some thoughts on the way a rule is being processed ]
First they are matched by the "extract_rule" regex.
### [ filter rule ]
The match is passed to the "_buildRule" function that expects the raw rule. This function applies different regex onto the rule string and extract the "request", the "key" and the "options" string. A new instance of type "RuleClass" is created and defined with those three values. Except the options string. That one needs to be processed. The extraction of the option is done by the "_extractOptions" function. It returns an object containing the default option setup, which can be overwritten by the rule definition. In other words, you simply can overwrite it by defining it in the rule.
After filtering, the rule instance looks the following:
```javascript
// expecting that a big rule is given
let rule = {
	"request": "your_request",
	"key": "your_key",
	"options": {
		"if": true,
		"some_other_option": "value"
	}
}
```

### [ build query ]
The query is the object thats being passed to the request processing functions. It is built by the "_buildQuery" function and expects the filtered rule.
This is how a query looks like:
```javascript
let query = {
	"rule": "{{ request: key option:value }}",
	"request": "request",
	"key": "key",
	"options": {
		"option": "value"
	}
	"isPostQuery": false
}
```
The query stores the "request" and the "key" separately. The options are sorted into an object and the "isPostQuery" defines wether the current query is a post query.

### [ from the start to the finished content ]
A simple function "parse" of the js_htparser, but so much behind it.
That function simply expects a template id and a markup. The markup can either be an array or an object.
Depending on the case, read more in the "foreach" request.

But what happens excactly?
First, checks. Checks are important and help catching failures that can occur. The template id needs to be a string,
and the markup, well an object or an array. This function simply prepares the two main values for the real parsing.

The "_parse" function declares some variables needed to process the given template with its markup.
For example the rule extraction regex, where the rule (without specifically extracting the parts of it) is getting extracted. Extraction.
The base markup, which includes some more marker you can use, eg. the "hp_templateId" which contains the current template id.
Some request also include other marker, eg. the "foreach" includes the "hp_index".

After the declaration the templates being executed with the rule extraction regex.
The found rule will then passed to the "_filterRule".
That function simply uses different regex to extract the "request", the "key" and the "options string".
The options have an extra treatment where they get executed with a further regex that extracts each option pair,
containing the option key and its assossiated value.
When no options found it just sets the option property to an empty object.

