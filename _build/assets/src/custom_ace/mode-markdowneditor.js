
define("ace/mode/markdowneditor_highlight_rules",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/mode/text_highlight_rules","ace/mode/javascript_highlight_rules","ace/mode/xml_highlight_rules","ace/mode/html_highlight_rules","ace/mode/css_highlight_rules"], function(require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var lang = require("../lib/lang");
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
    var JavaScriptHighlightRules = require("./javascript_highlight_rules").JavaScriptHighlightRules;
    var XmlHighlightRules = require("./xml_highlight_rules").XmlHighlightRules;
    var HtmlHighlightRules = require("./html_highlight_rules").HtmlHighlightRules;
    var CssHighlightRules = require("./css_highlight_rules").CssHighlightRules;

    var escaped = function(ch) {
        return "(?:[^" + lang.escapeRegExp(ch) + "\\\\]|\\\\.)*";
    };

    function github_embed(tag, prefix) {
        return { // Github style block
            token : "support.function",
            regex : "^\\s*```" + tag + "\\s*$",
            push  : prefix + "start"
        };
    }

    var MarkdownHighlightRules = function() {
        HtmlHighlightRules.call(this);

        this.$rules["start"].unshift({
                token : "empty_line",
                regex : '^$',
                next: "allowBlock"
            }, { // h1
                token: "markup.heading.1",
                regex: "^=+(?=\\s*$)"
            }, { // h2
                token: "markup.heading.2",
                regex: "^\\-+(?=\\s*$)"
            }, {
                token : function(value) {
                    return "markup.heading." + value.length;
                },
                regex : /^#{1,6}(?=\s*[^ #]|\s+#.)/,
                next : "header"
            },
            github_embed("(?:javascript|js)", "jscode-"),
            github_embed("xml", "xmlcode-"),
            github_embed("html", "htmlcode-"),
            github_embed("css", "csscode-"),
            { // Github style block
                token : "support.function",
                regex : "^\\s*```\\s*\\S*(?:{.*?\\})?\\s*$",
                next  : "githubblock"
            }, { // block quote
                token : "string.blockquote",
                regex : "^\\s*>\\s*(?:[*+-]|\\d+\\.)?\\s+",
                next  : "blockquote"
            }, { // HR * - _
                token : "constant",
                regex : "^ {0,2}(?:(?: ?\\* ?){3,}|(?: ?\\- ?){3,}|(?: ?\\_ ?){3,})\\s*$",
                next: "allowBlock"
            }, { // list
                token : "markup.list",
                regex : "^\\s{0,3}(?:[*+-]|\\d+\\.)\\s+",
                next  : "listblock-start"
            }, {
                include : "basic"
            });

        this.addRules({
            "basic" : [{
                token : "constant.language.escape",
                regex : /\\[\\`*_{}\[\]()#+\-.!]/
            }, { // code span `
                token : "support.function",
                regex : "(`+)(.*?[^`])(\\1)"
            }, { // reference
                token : ["text", "constant", "text", "url", "string", "text"],
                regex : "^([ ]{0,3}\\[)([^\\]]+)(\\]:\\s*)([^ ]+)(\\s*(?:[\"][^\"]+[\"])?(\\s*))$"
            }, { // link by reference
                token : ["text", "string", "text", "constant", "text"],
                regex : "(\\[)(" + escaped("]") + ")(\\]\s*\\[)("+ escaped("]") + ")(\\])"
            }, { // link by url
                token : ["text", "string", "text", "markup.underline", "string", "text"],
                regex : "(\\[)(" +                                        // [
                escaped("]") +                                    // link text
                ")(\\]\\()"+                                      // ](
                '((?:[^\\)\\s\\\\]|\\\\.|\\s(?=[^"]))*)' +        // href
                '(\\s*"' +  escaped('"') + '"\\s*)?' +            // "title"
                "(\\))"                                           // )
            }, { // strong ** __
                token : "string.strong",
                regex : "([*]{2}|[_]{2}(?=\\S))(.*?\\S[*_]*)(\\1)"
            }, { // emphasis * _
                token : "string.emphasis",
                regex : "([*]|[_](?=\\S))(.*?\\S[*_]*)(\\1)"
            }, { //
                token : ["text", "url", "text"],
                regex : "(<)("+
                "(?:https?|ftp|dict):[^'\">\\s]+"+
                "|"+
                "(?:mailto:)?[-.\\w]+\\@[-a-z0-9]+(?:\\.[-a-z0-9]+)*\\.[a-z]+"+
                ")(>)"
            }],
            "allowBlock": [
                {token : "support.function", regex : "^ {4}.+", next : "allowBlock"},
                {token : "empty", regex : "", next : "start"}
            ],

            "header" : [{
                regex: "$",
                next : "start"
            }, {
                include: "basic"
            }, {
                defaultToken : "heading"
            } ],

            "listblock-start" : [{
                token : "support.variable",
                regex : /(?:\[[ x]\])?/,
                next  : "listblock"
            }],

            "listblock" : [ { // Lists only escape on completely blank lines.
                token : "empty_line",
                regex : "^$",
                next  : "start"
            }, { // list
                token : "markup.list",
                regex : "^\\s*(?:[*+-]|\\d+\\.)\\s+",
                next  : "listblock-start"
            }, {
                include : "basic", noEscape: true
            }, { // Github style block
                token : "support.function",
                regex : "^\\s*```\\s*[a-zA-Z]*(?:{.*?\\})?\\s*$",
                next  : "githubblock"
            }, {
                defaultToken : "list" //do not use markup.list to allow stling leading `*` differntly
            } ],

            "blockquote" : [ { // Blockquotes only escape on blank lines.
                token : "empty_line",
                regex : "^\\s*$",
                next  : "start"
            }, { // block quote
                token : "string.blockquote",
                regex : "^\\s*>\\s*(?:[*+-]|\\d+\\.)?\\s+",
                next  : "blockquote"
            }, {
                include : "basic", noEscape: true
            }, {
                defaultToken : "string.blockquote"
            } ],

            "githubblock" : [ {
                token : "support.function",
                regex : "^\\s*```",
                next  : "start"
            }, {
                token : "support.function",
                regex : ".+"
            } ]
        });

        this.embedRules(JavaScriptHighlightRules, "jscode-", [{
            token : "support.function",
            regex : "^\\s*```",
            next  : "pop"
        }]);

        this.embedRules(HtmlHighlightRules, "htmlcode-", [{
            token : "support.function",
            regex : "^\\s*```",
            next  : "pop"
        }]);

        this.embedRules(CssHighlightRules, "csscode-", [{
            token : "support.function",
            regex : "^\\s*```",
            next  : "pop"
        }]);

        this.embedRules(XmlHighlightRules, "xmlcode-", [{
            token : "support.function",
            regex : "^\\s*```",
            next  : "pop"
        }]);

        this.$rules['modxtag-comment'] = [
            {
                token : "comment.modx",
                regex : "[^\\[\\]]+",
                merge : true
            },{
                token : "comment.modx",
                regex : "\\[\\[\\-.*?\\]\\]"
            },{
                token : "comment.modx",
                regex : "\\s+",
                merge : true
            },
            {
                token : "comment.modx",
                regex : "\\]\\]",
                next: "pop"
            }
        ];
        this.$rules['modxtag-start'] = [
            {
                token : ["modx-prefix", "modx-prefix", "modx-tag-name"],
                regex : "(!)?([%|*|~|\\+|\\$]|(?:\\+\\+)|(?:\\*#))?([-_a-zA-Z0-9\\.]+)",
                push : [
                    {include: "modxtag-filter"},
                    {include: "modxtag-propertyset"},
                    {
                        token: "modx",
                        regex: "\\?",
                        push: [
                            {token : "text.modx", regex : "\\s+"},
                            {include: 'modxtag-property-string'},
                            {token: "", regex: "$"},
                            {token: '', regex: '', next: 'pop'}
                        ]
                    },
                    {token : "text.modx", regex : "\\s+"},
                    {token: "", regex: "$"},
                    {token: '', regex: '', next: 'pop'}
                ]
            },
            {
                token : "modx",
                regex : "\\[\\[",
                push : 'modxtag-start'
            },
            {
                token : "text",
                regex : "\\s+"
            },
            {
                token : "modx",
                regex : "\\]\\]",
                next: "pop"
            },
            {defaultToken: 'text.modx'}
        ];
        this.$rules['modxtag-propertyset2'] = [
            {
                token : ['modx-property-set', "modx-property-set"],
                regex : "(@)([-_a-zA-Z0-9\\.]+|\\[\\[.*?\\]\\])",
                next : 'modxtag-filter'
            },
            {
                token : "text",
                regex : "\\s+"
            },
            {token: "", regex: "$"},
            {
                token: "empty",
                regex: "",
                next: "modxtag-filter"
            }
        ];
        this.$rules['modxtag-propertyset'] = [
            {
                token : 'modx-property-set',
                regex : "@",
                push : [
                    {
                        token: "modx-property-set",
                        regex: "[-_a-zA-Z0-9\\.]+|\\[\\[.*?\\]\\]"
                    },
                    {
                        token: "empty",
                        regex: "",
                        next: "pop"
                    }
                ]
            },
            {
                token : "text",
                regex : "\\s+"
            }
        ];
        this.$rules['modxtag-filter'] = [
            {
                token : 'modx-output-modifier',
                regex : ":",
                push : [
                    {
                        token: "modx-output-modifier",
                        regex: "[-_a-zA-Z0-9]+|\\[\\[.*?\\]\\]",
                        push: "modxtag-filter-eq"
                    },
                    {
                        token: "empty",
                        regex: "",
                        next: "pop"
                    }
                ]
            },
            {
                token : "text",
                regex : "\\s+"
            }
        ];
        this.$rules['modxtag-filter-eq'] = [
            {
                token : ["modx"],
                regex : "="
            },{
                token : 'modx',
                regex : '`',
                push: "modxtag-filter-value"
            },
            {
                token : "text",
                regex : "\\s+"
            },
            {
                token: "empty",
                regex: "",
                next: "pop"
            }
        ];
        this.$rules["modxtag-property-string"] = [
            {
                token : "modx-property-name",
                regex: "&"
            },
            {
                token: "modx-property-name",
                regex: "[-_a-zA-Z0-9]+"
            },
            {
                token : "modx",
                regex : '`',
                push : "modxtag-attribute-value"
            }, {
                token : "modx",
                regex : "="
            }, {
                token : "modx",
                regex : "[-_a-zA-Z0-9]+"
            },
            {
                token : "comment.modx",
                regex : "\\[\\[\\-.*?\\]\\]"
            },
            {
                token : "property-string.text.modx",
                regex : "\\s+"
            }
        ];
        this.$rules["modxtag-attribute-value"] = [
            {
                token : "modx",
                regex : "[^`\\[]+",
                merge : true
            },{
                token : "modx",
                regex : "[^`]+",
                merge : true
            },{
                token : "modx",
                regex : "`",
                next  : "pop",
                merge : true
            }
        ];
        this.$rules["modxtag-filter-value"] = [
            {
                token : "modx",
                regex : "[^`\\[]+",
                merge : true
            },{
                token : "modx",
                regex : "\\[\\[.*?\\]\\]",
                merge : true
            }, {
                token : "modx",
                regex : "\\\\$",
                next  : "pop",
                merge : true
            }, {
                token : "modx",
                regex : "`",
                next  : "pop",
                merge : true
            }
        ];

        for (var rule in this.$rules) {
            this.$rules[rule].unshift({
                token : "comment.modx", // opening tag
                regex : "\\[\\[\\-",
                push : 'modxtag-comment',
                merge: true
            }, {
                token : "modx", // opening tag
                regex : "\\[\\[",
                push : 'modxtag-start',
                merge : false
            });
        }

        this.normalizeRules();
    };
    oop.inherits(MarkdownHighlightRules, TextHighlightRules);

    exports.MarkdownHighlightRules = MarkdownHighlightRules;
});

define("ace/mode/markdowneditor",["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/javascript","ace/mode/xml","ace/mode/html","ace/mode/markdown_highlight_rules","ace/mode/folding/markdown"], function(require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var TextMode = require("./text").Mode;
    var JavaScriptMode = require("./javascript").Mode;
    var XmlMode = require("./xml").Mode;
    var HtmlMode = require("./html").Mode;
    var MarkdownHighlightRules = require("./markdowneditor_highlight_rules").MarkdownHighlightRules;
    var MarkdownFoldMode = require("./folding/markdown").FoldMode;

    var Mode = function() {
        this.HighlightRules = MarkdownHighlightRules;

        this.createModeDelegates({
            "js-": JavaScriptMode,
            "xml-": XmlMode,
            "html-": HtmlMode
        });

        this.foldingRules = new MarkdownFoldMode();
    };
    oop.inherits(Mode, TextMode);

    (function() {
        this.type = "text";
        this.blockComment = {start: "<!--", end: "-->"};

        this.getNextLineIndent = function(state, line, tab) {
            if (state == "listblock") {
                var match = /^(\s*)(?:([-+*])|(\d+)\.)(\s+)/.exec(line);
                if (!match)
                    return "";
                var marker = match[2];
                if (!marker)
                    marker = parseInt(match[3], 10) + 1 + ".";
                return match[1] + marker + match[4];
            } else if(state == "listblock-start") {
                var empty = /^(\s*)(?:([-+*])|(\d+)\.)(\s*)$/.exec(line);
                if (empty) return "";
            } else {
                return this.$getIndent(line);
            }
        };
        this.$id = "ace/mode/markdowneditor";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});
