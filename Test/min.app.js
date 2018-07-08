"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
				}var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
					var n = e[i][1][r];return o(n || r);
				}, p, p.exports, r, e, n, t);
			}return n[i].exports;
		}for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
			o(t[i]);
		}return o;
	}return r;
})()({ 1: [function (require, module, exports) {

		var Config = require("./Configuration.js");
		var ClassSet = require("./ClassSet.js");

		var Templax = new (function () {
			function TemplaxClass() {
				_classCallCheck(this, TemplaxClass);

				this.tManager = require("./TemplateManager.js").templateManager;
				this.pManager = require("./ProcessManager.js").processManager;
				this.rqParser = require("./RequestParser.js").requestParser;
				this.rlParser = require("./RuleParser.js").ruleParser;
			}

			_createClass(TemplaxClass, [{
				key: "define",
				value: function define(configs) {

					if (!configs || configs.constructor !== Object) return false;

					for (var _id in configs) {

						var item = configs[_id];

						if (item["markup"]) tManager.setMarkup(_id, item["markup"]);
						if (item["options"]) tManager.setOptions(_id, item["options"]);
					}

					return true;
				}
			}, {
				key: "parse",
				value: function parse(id, markup, options) {
					var parentProcess = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

					var pSet = this._verifyParsingSet(id, markup, options);

					if (!pSet.options.render || !pSet.template.valid) return "";

					var content = this._processTemplate(pSet.template, pSet.markup, pSet.options, function (query) {

						var response = this.rqParser.parse(query);
						return response;
					}, null, parentProcess);

					return content;
				}
			}, {
				key: "_verifyParsingSet",
				value: function _verifyParsingSet(templateValue, markup, options) {
					var parsingSet = {
						"template": this.tManager.has(templateValue) ? this.tManager.get(templateValue) : templateValue && templateValue instanceof ClassSet.template ? templateValue : templateValue && templateValue.constructor === String ? new ClassSet.template(null, templateValue) : new ClassSet.template(null, null),
						"markup": markup && markup.constructor == Object ? markup : {},
						"options": options && options.constructor == Object ? Object.assign(Config.defaults.templateOptionSet, options) : Config.defaults.templateOptionSet
					};

					return parsingSet;
				}
			}, {
				key: "_processTemplate",
				value: function _processTemplate(template) {
					var markup = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
					var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

					var _callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

					var _this = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

					var parentProcess = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;

					var process = this.pManager.create(template, markup, options, parentProcess);
					process.options = Object.assign({}, process.options, options);

					var regExtractRule = Config.regex.extractRule();
					var callback = _callback && _callback.constructor == Function ? _callback.bind(_this || this) : function () {
						return null;
					};
					process.queryMarkup = Object.assign({}, this._buildBaseMarkup(process), template.markup, markup);

					var rawRule = null;
					var content = template.value;
					var lastIterator = regExtractRule.lastIndex;
					var postQueries = [];

					while (rawRule = regExtractRule.exec(content)) {

						var rule = this.rlParser.parse(process, rawRule[0]);
						var query = new ClassSet.query(process, rule, content.substring(lastIterator), false);
						process.currentQuery = query;

						var response = this._reviewProcessResponse(process, callback(query));

						if (response.postQuery) postQueries.push(response.postQuery);

						regExtractRule.lastIndex += response.offset !== null ? Number(response.offset) : -(query.rawRule.length - response.value.length);

						lastIterator = regExtractRule.lastIndex;

						content = content.replace(response.replacement, response.value);
					}

					postQueries.forEach(function (postQuery) {

						var response = callback(postQuery);
						content = content.replace(response.replacement, response.value);
					});

					this.pManager.delete(process);

					return content;
				}
			}, {
				key: "_buildBaseMarkup",
				value: function _buildBaseMarkup(process) {

					if (!this.pManager.validate(process)) return {};

					var base = {
						"tx-template-id": process.template.id || process.isSubProcess ? process.template.id : process.template.tid + "-subtemplate"
					};

					return base;
				}
			}, {
				key: "_reviewProcessResponse",
				value: function _reviewProcessResponse(process, response) {

					if (!response || !(response instanceof ClassSet.response)) return new ClassSet.response(process.currentQuery.rule, "", false);

					if (!response.replacement || response.replacement.constructor !== String) response.replacement = process.currentQuery.rawRule;

					if (!response.value || response.value.constructor !== String && response.value.constructor !== Function) response.value = String(response.value);

					return response;
				}
			}, {
				key: "templates",
				get: function get() {
					return this.tManager.get(null, true);
				}
			}]);

			return TemplaxClass;
		}())();
		exports.app = Templax;
	}, { "./ClassSet.js": 2, "./Configuration.js": 3, "./ProcessManager.js": 4, "./RequestParser.js": 5, "./RuleParser.js": 6, "./TemplateManager.js": 7 }], 2: [function (require, module, exports) {
		var Config = require("./Configuration.js");

		var ProcessClass = function () {
			function ProcessClass(id, template, userMarkup, options) {
				var parentProcess = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

				_classCallCheck(this, ProcessClass);

				this.id = id || null;
				this.template = template || null;
				this.userMarkup = userMarkup || {};
				this.queryMarkup = {};
				this.options = Object.assign({}, Config.parsing.optionSets.templateProcess, options);
				this.currentQuery = null;

				this.parentProcess = parentProcess;
			}

			_createClass(ProcessClass, [{
				key: "isSubProcess",
				get: function get() {
					return Boolean(this.parentProcess);
				}
			}]);

			return ProcessClass;
		}();

		;
		exports.process = ProcessClass;

		var TemplateClass = function () {
			function TemplateClass(id, value, options) {
				var parentTemplate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

				_classCallCheck(this, TemplateClass);

				this.id = id || null;
				this.value = value || null;
				this.options = options || {};
				this.parentTemplate = parentTemplate;
			}

			_createClass(TemplateClass, [{
				key: "tid",
				get: function get() {
					if (!this.id) return this.parentTemplate.tid;
					return this.id;
				}
			}, {
				key: "valid",
				get: function get() {
					return Boolean(this.id || !this.id && this.parentTemplate);
				}
			}]);

			return TemplateClass;
		}();

		;
		exports.template = TemplateClass;

		var RuleClass = function RuleClass(id, rawRule, request, key, value, commandValue, options) {
			_classCallCheck(this, RuleClass);

			this.id = id;
			this.rawRule = rawRule || null;
			this.request = request || null;
			this.key = key || null;
			this.value = value || null;
			this.commandValue = commandValue || null;
			this.options = options || null;
		};

		;
		exports.rule = RuleClass;

		var QueryClass = function (_exports$rule) {
			_inherits(QueryClass, _exports$rule);

			function QueryClass(process, rule, template, isPostQuery) {
				_classCallCheck(this, QueryClass);

				var _this2 = _possibleConstructorReturn(this, (QueryClass.__proto__ || Object.getPrototypeOf(QueryClass)).call(this, rule.id, rule.rawRule, rule.request, rule.key, rule.value, rule.commandValue, rule.options));

				_this2.process = process;
				_this2.template = template || null;
				_this2.isPostQuery = isPostQuery || false;
				return _this2;
			}

			return QueryClass;
		}(exports.rule);

		;
		exports.query = QueryClass;

		var ResponseClass = function ResponseClass(replacement, value, postQuery) {
			var offset = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

			_classCallCheck(this, ResponseClass);

			this.replacement = replacement || "";
			this.value = value || "";
			this.postQuery = postQuery || null;
			this.offset = offset !== undefined ? offset : null;

			if (this.postQuery) this.postQuery.isPostQuery = true;
		};

		;
		exports.response = ResponseClass;
	}, { "./Configuration.js": 3 }], 3: [function (require, module, exports) {
		exports.general = {};

		exports.defaults = {};

		exports.regex = {};

		exports.regex.extractRule = function () {
			return new RegExp("{{([^<>]*?)}}", "g");
		};

		exports.regex.extractRequest = function () {
			return new RegExp("([\\w-]+)(?:[\\w\\s:-]+)?", "g");
		};
		exports.regex.extractKey = function () {
			return new RegExp("{{\\s*(?:[\\w-]+)\\s*:\\s*([\\w-]+)(?:[\\w\\s:-]+)?", "g");
		};

		exports.regex.extractArea = function (query, id) {
			return new RegExp(query.rawRule + "(.*?){{\\s*" + query.request + "\\s+end\\s*:\\s*" + id + "\\s*}}", "g");
		};

		exports.debug = {};

		exports.debug.display = true;

		exports.debug.display_trace = true;

		exports.parsing = {};

		exports.parsing.optionSets = {
			"default": {
				"render": true,
				"wrap": "|"
			},
			"template": {
				"processRuleCounter": true,
				"wrapContent": true
			},
			"templateInline": {
				"renderInline": false
			}
		};

		exports.defaults.templateOptionSet = {
			"render": true
		};
	}, {}], 4: [function (require, module, exports) {

		var ClassSet = require("./ClassSet.js");

		var ProcessManager = new (function () {
			function ProcessManagerClass() {
				_classCallCheck(this, ProcessManagerClass);

				this.processes = new Map();
				this.processIterator = 0;
			}

			_createClass(ProcessManagerClass, [{
				key: "create",
				value: function create(template) {
					var markup = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
					var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
					var parentProcess = arguments[3];


					if (!(template instanceof ClassSet.template)) return false;

					var process = new ClassSet.process(++this.processIterator, template, markup, options, parentProcess);
					this.processes.set(process.id, process);

					return this.get(process.id);
				}
			}, {
				key: "delete",
				value: function _delete(value) {

					if (!value) return false;

					if (value instanceof ClassSet.process) return this.processes.delete(value.id);

					return this.processes.delete(id);
				}
			}, {
				key: "has",
				value: function has(value) {

					if (value instanceof ClassSet.query) return this.processes.has(value.processId);
					return this.processes.has(value);
				}
			}, {
				key: "get",
				value: function get(value) {
					if (value instanceof ClassSet.query) return this.processes.get(value.processId);
					return this.processes.get(value);
				}
			}, {
				key: "validate",
				value: function validate(value) {

					var process = value && value instanceof ClassSet.process ? value : this.get(value);

					return !(!process || !process.id || !process.template || !(process.template instanceof ClassSet.template));
				}
			}]);

			return ProcessManagerClass;
		}())();
		exports.processManager = ProcessManager;
	}, { "./ClassSet.js": 2 }], 5: [function (require, module, exports) {
		var Config = require("./Configuration.js");
		var ClassSet = require("./ClassSet.js");
		var Templax = require("./App.js");

		var RequestParser = new (function () {
			function RequestParserClass() {
				_classCallCheck(this, RequestParserClass);

				this.pManager = require("./ProcessManager.js").processManager;
				this.tManager = require("./TemplateManager.js").templateManager;
				this.requestIterator = 0;
			}

			_createClass(RequestParserClass, [{
				key: "parse",
				value: function parse(query) {

					this.requestIterator++;

					if (String(query.options.render) === "false") return new ClassSet.response(query.rawRule, null, false);else if (!(query.request in this)) return new ClassSet.response(query.rawRule, query.value, false);

					return this[query.request](query);
				}
			}, {
				key: "template",
				value: function template(query) {

					if (!query.key) return null;

					if (!this.tManager.has(query.key)) return new ClassSet.response(query.rawRule, !query.isPostQuery ? query.rawRule : "", !query.isPostQuery ? query : false, 0);

					var response = new ClassSet.response(query.rawRule, null, false);
					var content = Templax.app.parse(query.key, query.value, false, this.pManager.get(query));

					response.value = content;

					return response;
				}
			}, {
				key: "templateInline",
				value: function templateInline(query) {
					if (!query.key) return null;

					var response = new ClassSet.response(query.rawRule, "", false);
					var templateMatch = Config.regex.extractArea(query, query.key).exec(query.template);

					if (!templateMatch) return response;

					if (!this.tManager.register(query.key, templateMatch[1])) return response;

					response.replacement = templateMatch[0];

					if (query.options.renderInline) response.value = Templax.app.parse(query.key, query.value);

					return response;
				}
			}, {
				key: "foreach",
				value: function foreach(query) {
					if (!query.key || !query.value || query.value && query.value.constructor !== Array) return null;

					var response = new ClassSet.response(query.rawRule, "", false);
					var foreachMatch = Config.regex.extractArea(query, query.key).exec(query.template);

					if (!foreachMatch) return response;

					response.replacement = foreachMatch[0];
					var content = "";

					query.value.forEach(function (currentMarkup) {
						content += Templax.app.parse(new ClassSet.template(null, foreachMatch[1], query.rawRule.options, query.process.template), currentMarkup, false, query.process);
					});

					response.value = content;

					return response;
				}
			}, {
				key: "case",
				value: function _case(query) {

					if (!query.key) return null;

					var response = new ClassSet.response(query.rawRule, "", false);
					var caseMatch = Config.regex.extractArea(query, query.key).exec(query.template);

					if (!caseMatch) return response;

					response.replacement = caseMatch[0];

					if (!query.value) return response;

					response.value = Templax.app.parse(new ClassSet.template(null, caseMatch[1], query.options, query.process.template), query.value, false, query.process);

					return response;
				}
			}, {
				key: "if",
				value: function _if(query) {

					if (!query.key) return null;

					var response = new ClassSet.response(query.rawRule, "");
					var ifMatch = Config.regex.extractArea(query, query.key).exec(query.template);

					if (!ifMatch) return response;

					response.replacement = ifMatch[0];

					if (!query.process.queryMarkup[query.key]) return response;

					response.value = Templax.app.parse(new ClassSet.template(null, ifMatch[1], query.options, query.process.template), query.commandValue || {}, false, query.process);

					return response;
				}
			}, {
				key: "debug",
				value: function debug(query) {
					var response = new ClassSet.response(query.rawRule, "no data found", false);

					response.value = "Currently not implemented!";

					return response;
				}
			}]);

			return RequestParserClass;
		}())();
		exports.requestParser = RequestParser;
	}, { "./App.js": 1, "./ClassSet.js": 2, "./Configuration.js": 3, "./ProcessManager.js": 4, "./TemplateManager.js": 7 }], 6: [function (require, module, exports) {

		var Config = require("./Configuration.js");
		var ClassSet = require("./ClassSet.js");

		var RuleParser = new (function () {
			function RuleParserClass() {
				_classCallCheck(this, RuleParserClass);

				this.ruleIterator = 0;
			}

			_createClass(RuleParserClass, [{
				key: "parse",
				value: function parse(process, rawRule) {
					var rule = new ClassSet.rule(++this.ruleIterator, rawRule);

					rule.request = this._extractRulePiece(rawRule, Config.regex.extractRequest())[1] || null;
					rule.key = this._extractRulePiece(rawRule, Config.regex.extractKey())[1] || null;

					var primeKey = rule.key || rule.request;
					var queryMarkup = process.queryMarkup;
					var requestValue = queryMarkup[primeKey];
					var customOptions = {};

					if (requestValue && requestValue.constructor === Object) {
						if (requestValue["_options"] && requestValue["_options"].constructor === Object) customOptions = requestValue["_options"];

						if (requestValue["value"] && (requestValue["value"].constructor !== Object || requestValue["value"].constructor !== Array)) requestValue = requestValue["value"];
					}

					rule.value = requestValue;
					rule.commandValue = queryMarkup[rule.request + "-" + rule.key];

					rule.options = this._resolveObjectFunctions(Object.assign({}, Config.parsing.optionSets.default, Config.parsing.optionSets[rule.request] || {}, customOptions));

					return rule;
				}
			}, {
				key: "_extractRulePiece",
				value: function _extractRulePiece(rawRule, regex) {

					if (!rawRule || !regex || rawRule.constructor !== String || regex.constructor !== RegExp) return [];

					var match = regex.exec(rawRule);
					var results = [];

					if (!match) return results;

					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = match[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var item = _step.value;

							results.push(item);
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator.return) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					return results;
				}
			}, {
				key: "_resolveObjectFunctions",
				value: function _resolveObjectFunctions(values) {

					if (!values || values && values.constructor === Array) return null;

					if (values.constructor !== Object) values = { "__value": values };

					for (var index in values) {
						var item = values[index];
						if (item && item.constructor === Function) values[index] = item();
					}

					return values["__value"] || values;
				}
			}]);

			return RuleParserClass;
		}())();
		exports.ruleParser = RuleParser;
	}, { "./ClassSet.js": 2, "./Configuration.js": 3 }], 7: [function (require, module, exports) {

		var ClassSet = require("./ClassSet.js");

		var TemplateManager = new (function () {
			function TemplateManagerClass() {
				_classCallCheck(this, TemplateManagerClass);

				this.templates = new Map();

				this._loadFromDOM();
			}

			_createClass(TemplateManagerClass, [{
				key: "_loadFromDOM",
				value: function _loadFromDOM() {

					var raw = document.querySelector("template#tx-templates");

					if (raw) {
						var _iteratorNormalCompletion2 = true;
						var _didIteratorError2 = false;
						var _iteratorError2 = undefined;

						try {
							for (var _iterator2 = raw.content.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
								var elm = _step2.value;

								if (!this.register(elm.id, elm.innerHTML)) console.log("HTParser: registering template %s failed", elm.id);
							}
						} catch (err) {
							_didIteratorError2 = true;
							_iteratorError2 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion2 && _iterator2.return) {
									_iterator2.return();
								}
							} finally {
								if (_didIteratorError2) {
									throw _iteratorError2;
								}
							}
						}
					}

					return true;
				}
			}, {
				key: "register",
				value: function register(id, template) {

					if (!id || id && id.constructor !== String || !template || template.constructor !== String) return console.log("HTParser: invalid values for template registration: %s", id);else if (this.templates.has(id)) return console.log("HTParser: duplicated template found: '%s'", id);

					var result = this.templates.set(id, new ClassSet.template(id, template.replace(/\s{2,}/g, "")));

					return result ? result.size : false;
				}
			}, {
				key: "get",
				value: function get(id) {
					var all = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

					return all ? this.templates.values() : this.templates.get(id);
				}
			}, {
				key: "has",
				value: function has(id) {
					return this.templates.has(id);
				}
			}, {
				key: "setOptions",
				value: function setOptions(id, definition, value) {

					if (!this.hasTemplate(id)) return false;

					if (!definition && !value) this.getTemplate(id).options = {};else if (definition.constructor === Object) this.getTemplate(id).options = definition;else if (definition.constructor === String) this.getTemplate(id).options[definition] = value;else return false;

					return true;
				}
			}, {
				key: "setMarkup",
				value: function setMarkup(id, definition, value) {

					if (!this.templates.has(id)) return false;

					if (!definition && !value) this.getTemplate(id).markup = {};else if (definition.constructor === Object) this.getTemplate(id).markup = definition;else if (definition.constructor === String) this.getTemplate(id).markup[definition] = value;else return false;

					return true;
				}
			}]);

			return TemplateManagerClass;
		}())();
		exports.templateManager = TemplateManager;
	}, { "./ClassSet.js": 2 }], 8: [function (require, module, exports) {
		if (window) window.templax = require("./Source/App.js").app;
	}, { "./Source/App.js": 1 }] }, {}, [8]);
