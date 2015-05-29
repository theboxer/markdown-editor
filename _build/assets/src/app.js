Ext.ns('MarkdownEditor');
MarkdownEditor = function(config) {
    config = config || {};
    MarkdownEditor.superclass.constructor.call(this,config);
};
Ext.extend(MarkdownEditor,Ext.Component,{
    window:{},combo:{},config: {}
});
Ext.reg('markdowneditor',MarkdownEditor);
markdownEditor = new MarkdownEditor();

markdownEditor.loadedElements = {};

markdownEditor.Editor = function(config) {
    config = config || {};
    config.resource = MODx.request.id || 0;
    markdownEditor.Editor.superclass.constructor.call(this,config);
    this.config = config;
};
Ext.extend(markdownEditor.Editor,Ext.Component,{
    remarkable: ''
    ,fullScreen: false
    ,diffDOM: null
    ,localCache: {
        oEmbed: {}
    }
    ,initComponent: function() {
        MarkdownEditor.superclass.initComponent.call(this);

        this.diffDOM = new diffDOM();
        
        if (this.mdElementId){
            Ext.onReady(this.render, this);
        }
    }

    ,destroy: function(){
        this.editor.destroy();

        this.mdContainer.remove();
        this.taMarkdown.remove();

        this.textarea.dom.style.display = null;
        this.textarea.dom.style.width = null;
        this.textarea.dom.style.height = null;

        MarkdownEditor.superclass.destroy.call(this);
    }

    ,render: function(container, position) {
        this.textarea = Ext.get(this.mdElementId);
        this.mdElementName = this.textarea.dom.name;

        if (!this.textarea) return;

        this.buildUI();
        this.registerAce();
        this.registerRemarkable();
        this.buildToolbox();

        var previewButton = this.toolBox.child('.preview-button');
        var fullscreenButton = this.toolBox.child('.fullscreen-button');
        var splitscreenButton = this.toolBox.child('.splitscreen-button');

        var content = this.contentMD;

        var previewButtonOff = Ext.get(Ext.DomHelper.append(content.parent(),{
            tag: 'div',
            class: 'preview-button-off',
            html: '<i class="icon icon-eye-slash icon-large"></i>',
            hidden: true
        }));

        var dropTarget = MODx.load({
            xtype: 'modx-treedrop',
            target: content,
            targetEl: content,
            onInsert: (function(s){
                this.insert(s);
                this.focus();
                return true;
            }).bind(this.editor),
            iframe: true
        });
        this.textarea.on('destroy', function() {dropTarget.destroy();});

        var defaultSplit = parseInt(MODx.config['markdowneditor.general.split'] || 0);
        if (defaultSplit == 1) {
            splitscreenButton.turnOn();
        }
        previewButton.addListener('click', function () {
            this.showPreview();
            this.hideContent();
            this.statusBar.setDisplayed('none');

            this.contentMD.parent().parent().addClass('preview');

            previewButtonOff.show()
        }, this);

        previewButtonOff.addListener('click', function () {
            this.hidePreview();
            this.showContent();
            this.statusBar.setDisplayed('block');

            this.contentMD.parent().parent().removeClass('preview');

            this.editor.focus();

            previewButtonOff.hide();
        }, this);

        splitscreenButton.addListener('click', function(){
            if (splitscreenButton.child('i').hasClass('icon-pause')) {
                splitscreenButton.turnOn();
            } else {
                splitscreenButton.turnOff();
            }
        }, this);

        fullscreenButton.addListener('click', function(){
            if (this.fullScreen == false) {
                fullscreenButton.turnOn();
            } else {
                fullscreenButton.turnOff();
            }

            this.statusBar.setDisplayed('block');
            this.editor.resize(true);

        }, this);

        if (markdownEditor.content[this.mdElementName]) {
            this.editor.setValue(markdownEditor.content[this.mdElementName]);
        }
        this.editor.selection.clearSelection();

        this.preview.update(this.parse(this.editor.getValue()));

        this.preview.fixHeight();

        this.editor.getSession().on('change', function(e,b,c,d){
            if (e.data.action == 'insertText' && this.editor.getSession().getDocument().isNewLine(e.data.text)) {
                var session = this.editor.getSession();
                var document = session.getDocument();

                if (/^\s*(?:[*+-]|\d+\.)\s*$/.exec(document.getLine(e.data.range.start.row)) != null) {
                    document.removeLines(e.data.range.start.row, e.data.range.start.row);
                }
            }

            this.parse(this.editor.getValue());
        }.bind(this));
    }

    ,showContent: function(){
        this.contentMD.setDisplayed('block');
    }

    ,hideContent: function(){
        this.contentMD.setDisplayed('none');
    }

    ,showPreview: function(){
        this.preview.parent().setDisplayed('block');
    }

    ,hidePreview: function(){
        this.preview.parent().setDisplayed('none');
    }

    ,buildUI: function() {
        this.textarea.setDisplayed('none');
        this.textarea.setWidth(0);
        this.textarea.setHeight(0);

        this.taMarkdown = Ext.get(Ext.DomHelper.insertBefore(this.textarea, {
            tag: 'textarea',
            name: this.mdElementName + '_markdown',
            class: this.mdElementName + '_markdown'
        }));

        this.taMarkdown.setDisplayed('none');
        this.taMarkdown.setWidth(0);
        this.taMarkdown.setHeight(0);

        this.mdContainer = Ext.get(Ext.DomHelper.insertBefore(this.textarea, {
            tag: 'div',
            class: 'markdown-container ace-' + (MODx.config['markdowneditor.general.theme'] || 'monokai').toLowerCase().replace(/_/g, '-')
        }));

        var fullScreenHeader = Ext.get(Ext.DomHelper.append(this.mdContainer.dom,{
            tag: 'div',
            class: 'fullscreen-header ace_gutter',
            html: '<input type="text" />'
        }));

        var pageTitle = Ext.getCmp('modx-resource-pagetitle');
        if (pageTitle) {
            var headerInput = fullScreenHeader.child('input');
            headerInput.dom.value = pageTitle.getValue();

            headerInput.on('change', function(){
                pageTitle.setValue(this.dom.value);
            });

            pageTitle.on('change', function(field,value){
                headerInput.dom.value = value;
            });
        }

        var wrapper = Ext.get(Ext.DomHelper.append(this.mdContainer.dom,{
            tag: 'div',
            class: 'markdown-wrapper'
        }));

        this.contentMD = Ext.get(Ext.DomHelper.append(wrapper,{
            tag: 'div',
            class: this.textarea.dom.className + ' content-md ' + this.mdElementName + '_markdown'
        }));

        this.preview = Ext.get(Ext.DomHelper.append(wrapper,{
            tag: 'div',
            class: 'markdown-body preview-md'
        }));
        
        this.preview = Ext.get(Ext.DomHelper.append(this.preview.dom,{
            tag: 'div'
        }));

        var that = this;
        this.preview.fixHeight = function () {
            that.editor.resize();
            var height = that.editor.getSession().getScreenLength() * that.editor.renderer.lineHeight + that.editor.renderer.scrollBar.getWidth()  + 25;
            
            this.parent().setHeight(height);
        };

        if (MODx.config['markdowneditor.upload.enable_image_upload'] == 1 || MODx.config['markdowneditor.upload.enable_file_upload'] == 1) {
            this.statusBar = Ext.get(Ext.DomHelper.append(this.mdContainer.dom,{
                tag: 'div',
                class: 'status-bar ace_gutter'
            }));

            if (this.isMobileDevice()) {
                this.statusBar.dom.innerHTML = '<div class="upload-bar"> <input class="hidden" name="md_file_'+ this.statusBar.id +'" id="' + this.statusBar.id + '-file" type="file" multiple /><input class="hidden" name="md_file_'+ this.statusBar.id +'-mobile" id="' + this.statusBar.id + '-file-mobile" type="file" accept="image/*" capture="camera" />' + _('markdowneditor.status_bar_message_mobile', {id: this.statusBar.id + '-file', id_mobile: this.statusBar.id + '-file-mobile'}) + '</div>';

                this.statusBar.child('#' + this.statusBar.id + '-file-mobile').on('change', function(e, input) {
                    this.handleFiles(input.files, 1);
                    input.value = "";
                }, this);
            } else {
                this.statusBar.dom.innerHTML = '<div class="upload-bar"> <input class="hidden" name="md_file_'+ this.statusBar.id +'" id="' + this.statusBar.id + '-file" type="file" multiple>' + _('markdowneditor.status_bar_message', {id: this.statusBar.id + '-file'}) + '</div>';

                this.statusBar.child('#' + this.statusBar.id + '-file').on('change', function(e, input) {
                    this.handleFiles(input.files);
                    input.value = "";
                }, this);
            }

        } else {
            this.statusBar = Ext.get(Ext.DomHelper.append(this.mdContainer.dom,{
                tag: 'div',
                class: 'status-bar',
                html: _('markdowneditor.status_bar_disabled')
            }));
        }

        Ext.DomHelper.append(this.mdContainer.dom,{
            tag: 'span',
            style: 'clear: both'
        });
    }

    ,buildToolbox: function(){
        this.toolBox = Ext.get(Ext.DomHelper.append(this.statusBar,{
            tag: 'div',
            class: 'toolbox',
            cn: [{
                tag: 'div',
                class: 'preview-button',
                html: '<i class="icon icon-eye icon-large"></i>'
            },{
                tag: 'div',
                class: 'splitscreen-button',
                html: '<i class="icon icon-pause icon-large"></i>'
            },{
                tag: 'div',
                class: 'fullscreen-button',
                html: '<i class="icon icon-expand icon-large"></i>'
            }]
        }));

        var that = this;

        this.toolBox.child('.splitscreen-button').turnOn = function() {
            this.child('i').removeClass('icon-pause');
            this.child('i').addClass('icon-stop');

            that.contentMD.parent().parent().addClass('split');
            that.editor.resize();
            that.preview.fixHeight();
        };

        this.toolBox.child('.splitscreen-button').turnOff = function() {
            this.child('i').addClass('icon-pause');
            this.child('i').removeClass('icon-stop');

            that.contentMD.parent().parent().removeClass('split');
            that.editor.resize();
        };

        this.toolBox.child('.fullscreen-button').turnOn = function() {
            this.child('i').removeClass('icon-expand');
            this.child('i').addClass('icon-compress');

            var modxButtons = Ext.get('modx-action-buttons');
            if (modxButtons) {
                modxButtons.addClass('markdowneditor-fullscreen');
            }

            that.fullScreen = true;

            if (parseInt(MODx.config['markdowneditor.general.split_fullscreen'] || 1) == 1) {
                that.toolBox.child('.splitscreen-button').turnOn();
            } else {
                that.toolBox.child('.splitscreen-button').turnOff();
            }

            that.showPreview();
            that.showContent();

            that.editor.focus();

            that.contentMD.parent().parent().addClass('fullscreen');

            that.editor.setOption('maxLines', null);
            that.editor.resize();
        };

        this.toolBox.child('.fullscreen-button').turnOff = function() {
            this.child('i').addClass('icon-expand');
            this.child('i').removeClass('icon-compress');

            var modxButtons = Ext.get('modx-action-buttons');
            if (modxButtons) {
                modxButtons.removeClass('markdowneditor-fullscreen');
            }

            that.fullScreen = false;

            if (parseInt(MODx.config['markdowneditor.general.split'] || 0) == 1) {
                that.toolBox.child('.splitscreen-button').turnOn();
            } else {
                that.toolBox.child('.splitscreen-button').turnOff();
            }

            that.hidePreview();
            that.showContent();

            that.editor.focus();

            that.contentMD.parent().parent().removeClass('fullscreen');

            that.editor.setOption('maxLines', Infinity);

            that.preview.fixHeight();
        };
    }

    ,registerAce: function() {
        this.editor = ace.edit(Ext.DomQuery.selectNode('div.' + this.mdElementName + '_markdown'));
        ace.require("ace/layer/gutter_toolbar");

        this.editor.setOptions({
            maxLines: Infinity,
            minLines: 25,
            enableBasicAutocompletion: true,
            printMargin: false,
            showGutter: true,
            useSoftTabs: true,
            showFoldWidgets: false,
            showLineNumbers: false,
            fontSize: parseInt(MODx.config['markdowneditor.general.font_size']) || 12,
            fontFamily: MODx.config['markdowneditor.general.font_family'] || ''
        });
        this.editor.$blockScrolling = Infinity;
        this.editor.session.setUseWrapMode(true);
        this.editor.session.setWrapLimitRange();
        this.editor.renderer.setScrollMargin(10, 10);
        this.editor.session.setValue(this.textarea.getValue());
        this.editor.session.setMode("ace/mode/markdowneditor");
        this.editor.setTheme("ace/theme/" + (MODx.config['markdowneditor.general.theme'] || 'monokai'));

        if (this.contentMD.hasClass('ace_dark')) {
            this.mdContainer.addClass('theme-dark');
        } else {
            this.mdContainer.addClass('theme-light');
        }
        
        
        this.editor.selection.on('changeCursor', function (e, selection) {
            if (this.gutterToolbar) {
                this.gutterToolbar.update('');
            }

            var range = selection.getRange();
            if (range.start.row != range.end.row) return;

            this.editor.session.addGutterDecoration(range.start.row, '');
        }.bind(this));

        this.editor.session.gutterRenderer =  {
            getWidth: function(session, lastLineNumber, config) {
                return config.characterWidth;
            },
            getText: function(session, row, cell) {
                if (cell.element && this.editor.getCursorPosition().row == row && session.doc.$lines[row] == "") {
                    this.addGutterToolbar(cell.element);
                } else {
                    cell.element.innerHTML = '';
                }

                return '';
            }.bind(this)
        };

        this.editor.commands.addCommand({
            name: "Indent list",
            bindKey: {win: "Tab", mac: "Tab"},
            exec: function(editor) {
                var line = editor.session.getLine(editor.getCursorPosition().row);
                var match = /^(\s*)(?:([-+*])|(\d+)\.)(\s+)/.exec(line);
                if (match) {
                    editor.session.indentRows(editor.getCursorPosition().row, editor.getCursorPosition().row, '\t');
                } else {
                    editor.indent();
                }
            }
        });

        this.editor.commands.addCommand({
            name: "Exit fullscreen",
            bindKey: {win: "Esc", mac: "Esc"},
            exec: function(editor) {
                if (this.fullScreen) {
                    this.toolBox.child('.fullscreen-button').turnOff();
                }
            }.bind(this)
        });

        var langTools = ace.require("ace/ext/language_tools");
        var resourcesCompleter = {
            getCompletions: function(editor, session, pos, prefix, callback) {
                if (prefix.length === 0) { callback(null, []); return }

                MODx.Ajax.request({
                    url: markdownEditor.config.connectorUrl
                    ,params: {
                        action: 'mgr/resource/getlist'
                        ,prefix: prefix
                    },
                    listeners: {
                        'success': {
                            fn: function(r) {
                                callback(null, r.results);
                            },
                            scope: this
                        }
                    }
                });

            }
        };
        langTools.addCompleter(resourcesCompleter);

        this.editor.container.addEventListener("dragenter", this.catchAndDoNothing, false);
        this.editor.container.addEventListener("dragover", this.catchAndDoNothing, false);
        this.editor.container.addEventListener("drop", this.drop.bind(this), false);
    }

    ,addGutterToolbar: function(cell){
        this.gutterToolbar = Ext.get(cell);

        if (this.isMobileDevice()) {
            this.gutterToolbar.update('<i class="icon icon-plus icon-fixed-width"></i>' +
            '<div class="inline-toolbar">' +
                '<i class="icon icon-archive icon-fixed-width"></i>' +
                '<label for="'+this.statusBar.id+'-file"><i class="icon icon-upload icon-fixed-width"></i></label>' +
                '<label for="'+this.statusBar.id+'-file-mobile"><i class="icon icon-camera icon-fixed-width"></i></label>' +
                '<i class="icon icon-code icon-fixed-width"></i>' +
            '</div>');
        } else {
            this.gutterToolbar.update('<i class="icon icon-plus icon-fixed-width"></i>' +
            '<div class="inline-toolbar">' +
                '<i class="icon icon-archive icon-fixed-width"></i>' +
                '<label for="'+this.statusBar.id+'-file"><i class="icon icon-upload icon-fixed-width"></i></label>' +
                '<i class="icon icon-code icon-fixed-width"></i>' +
            '</div>');
        }

        var switcher = this.gutterToolbar.child('i.icon-plus');
        var inlineToolbar = this.gutterToolbar.child('.inline-toolbar');

        switcher.turnOn = function(){
            switcher.addClass('md-icon-rotate-45');
            inlineToolbar.show();
        };

        switcher.turnOff = function(){
            switcher.removeClass('md-icon-rotate-45');
            inlineToolbar.hide();
        };

        switcher.on('click', function(){
            if(!switcher.hasClass('md-icon-rotate-45')) {
                switcher.turnOn();
            } else {
                switcher.turnOff();
            }
        }.bind(this));

        this.gutterToolbar.child('i.icon-code').on('click', function () {
            MODx.load({
                xtype: 'markdowneditor-window-oembed'
                ,success: function(values){
                    this.editor.insert('[embed ' + values.url + ']');
                    this.editor.focus();
                }
                ,scope: this
            }).show();
        }.bind(this));
        
        this.gutterToolbar.child('i.icon-archive').on('click', function () {
            MODx.load({
                xtype: 'modx-browser-window'
                ,source: parseInt(MODx.config['markdowneditor.general.source'])
                ,hideSourceCombo: parseInt(MODx.config['markdowneditor.general.source_select'] || 0) != 1
                ,onSelect: function(data){
                    var markup = '';
                    if (data.preview) markup = '!';
                    markup = markup + '[' + data.name + '](' + data.fullRelativeUrl + ' "' + data.name + '")';

                    this.editor.insert(markup);
                    this.editor.focus();
                }
                ,scope: this
            }).show();
        }.bind(this));
    }

    ,registerRemarkable: function() {
        hljs.registerLanguage("modx", function(hljs) {
            return {
                cI: true,
                c: [{
                    cN: 'comment',
                    b: '\\[\\[\\s*-',
                    e: '\\]\\]',
                    c: []
                },{
                    cN: 'variable',
                    rE: true,
                    b: '&',
                    e: '=',
                    c: []
                },{
                    cN: 'class',
                    b: '\\[\\[',
                    e: '[\\?]',
                    rB: true,
                    c: [{
                        b: '\\[\\[',
                        e: '[:@\\?]',
                        rE: true,
                        c: [{
                            cN: 'title',
                            b: '[a-zA-Z0-9]+'
                        },{
                            cN: 'string',
                            b: '[\\$\\+!%]'
                        }]
                    },{
                        cN: 'variable',
                        b: '@[a-zA-Z0-9]+'
                    },{
                        cN: 'variable',
                        b: ':[a-zA-Z0-9]+',
                        e: '=',
                        eE: true 
                    }]
                }]
            };
        });
        
        this.remarkable = new Remarkable({
            html: true,
            highlight: function (str, lang) {
                var value = '';
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        value = hljs.highlight(lang, str).value;

                        value = value.replace(/\[\[/g, '&#91;&#91;');
                        value = value.replace(/]]/g, '&#93;&#93;');

                        return value;
                    } catch (err) {}
                }

                try {
                    value = hljs.highlightAuto(str).value;

                    value = value.replace(/\[\[/g, '&#91;&#91;');
                    value = value.replace(/]]/g, '&#93;&#93;');

                    return value;
                } catch (err) {}

                return '';
            }
        });
        this.remarkable.inline.ruler.disable([ 'backticks' ]);

        var oEmbedRenderer = function(tokens, idx, options) {
            if (this.localCache.oEmbed[tokens[idx].url]) {
                return this.localCache.oEmbed[tokens[idx].url];
            } else {
                var embedID = Ext.id();

                MODx.Ajax.request({
                    url: markdownEditor.config.connectorUrl
                    ,params: {
                        action: 'mgr/editor/oembed'
                        ,url: tokens[idx].url
                    },
                    listeners: {
                        'success': {
                            fn: function(r) {
                                var embedDiv = Ext.get(embedID);
                                if (embedDiv) {
                                    embedDiv.update(r.data);
                                    embedDiv.dom.removeAttribute('id');
                
                                    this.localCache.oEmbed[tokens[idx].url] = embedDiv.dom.outerHTML;
                
                                    var textareaContent = Ext.get(Ext.DomHelper.createDom({tag: 'div', html: this.textarea.dom.value}));
                                    textareaContent.child('#' + embedID).update(r.data).dom.removeAttribute('id');
                
                                    this.textarea.dom.value = textareaContent.dom.innerHTML;
                                }
                            },
                            scope: this
                        }
                    }
                });

                return '<div id="' + embedID + '" class="markdowneditor-oembed-content">[embed ' + tokens[idx].url + ']</div>';
            }
        }.bind(this);

        var remarkable = this.remarkable;
        remarkable.renderer.rules.code = (function() {
            var original = remarkable.renderer.rules.code;
            return function() {
                var content = original.apply(this, arguments);
                content = content.replace(/\[\[/g, '&#91;&#91;');
                content = content.replace(/]]/g, '&#93;&#93;');
                
                return content;
            };
        })();
        
        var oEmbed = function(md) {
            md.inline.ruler.push('oEmbed', this.oEmbedParser);
            md.renderer.rules.oEmbed = oEmbedRenderer;
        }.bind(this);
        
        var modxTags = function(md) {
            md.inline.ruler.push('modxCode', this.modxCodeParser);
        }.bind(this);

        this.remarkable.use(oEmbed);
        this.remarkable.use(modxTags);
    }

    ,parse: function(input) {
        var output = this.remarkable.render(input);

        output = output.replace(/%5B/g, '[');
        output = output.replace(/%5D/g, ']');

        if (MODx.config['markdowneditor.lp.parse_modx_tags'] == 1) {
            if (this.parseRequest) {
                clearTimeout(this.parseRequest);
            }

            var timeout = parseInt(MODx.config['markdowneditor.lp.parse_modx_tags_timeout'] || 300);

            this.parseRequest = setTimeout(function(){
                MODx.Ajax.request({
                    url: markdownEditor.config.connectorUrl
                    ,params: {
                        action: 'mgr/editor/processcontent'
                        ,content: output
                        ,resource: MODx.request.id
                    },
                    isUpload : true,
                    listeners: {
                        'success': {
                            fn: function(r) {
                                var newPreview = document.createElement('div');
                                newPreview.innerHTML = r.data;

                                this.diffDOM.apply(this.preview.dom, this.diffDOM.diff(this.preview.dom, newPreview));

                                this.preview.fixHeight();
                                
                                if ((this.editor.getCursorPosition().row + 2) >= this.editor.getSession().getDocument().getLength()) {
                                    this.preview.parent().dom.scrollTop = this.preview.parent().dom.scrollHeight
                                }
                                
                            },
                            scope: this
                        }
                    }
                });
            }.bind(this), timeout);
        } else {
            var newPreview = document.createElement('div');
            newPreview.innerHTML = output;
            
            this.diffDOM.apply(this.preview.dom, this.diffDOM.diff(this.preview.dom, newPreview));
            
            this.preview.fixHeight();
            
            if ((this.editor.getCursorPosition().row + 2) >= this.editor.getSession().getDocument().getLength()) {
                this.preview.parent().dom.scrollTop = this.preview.parent().dom.scrollHeight;
            }
        }

        this.taMarkdown.dom.value = this.editor.getValue();
        this.textarea.dom.value = output;

        return output;
    }

    ,oEmbedParser: function(state) {
        // Given state.src [embed url]
        // We are here:    ^
        var pos = state.pos;
        var marker = state.src.charCodeAt(state.pos);
        if (marker !== 0x5B/* [ */) {
            return false;
        }

        // Given state.src [embed url]
        // We are here:     ^
        pos++;
        marker = state.src.charCodeAt(pos);
        if (marker !== 0x65/* e */) {
            return false;
        }

        // Given state.src [embed url]
        // We are here:      ^
        pos++;
        marker = state.src.charCodeAt(pos);
        if (marker !== 0x6D/* m */) {
            return false;
        }

        // Given state.src [embed url]
        // We are here:       ^
        pos++;
        marker = state.src.charCodeAt(pos);
        if (marker !== 0x62/* b */) {
            return false;
        }

        // Given state.src [embed url]
        // We are here:        ^
        pos++;
        marker = state.src.charCodeAt(pos);
        if (marker !== 0x65/* e */) {
            return false;
        }

        // Given state.src [embed url]
        // We are here:         ^
        pos++;
        marker = state.src.charCodeAt(pos);
        if (marker !== 0x64/* d */) {
            return false;
        }

        // Given state.src [embed url]
        // We are here:          ^
        pos++;
        marker = state.src.charCodeAt(pos);
        if (marker !== 0x20/*   */) {
            return false;
        }

        pos++;

        var start = pos;
        var max = state.posMax;
        var endFound = false;
        while (pos < max) {
            if (state.src.charCodeAt(pos) === 0x5D/* ] */) {
                endFound = true;
                break;
            }

            if (state.src.charCodeAt(pos) === 0x20/*  */) {
                return false;
            }

            pos++;
        }

        if (!endFound) return false;

        state.pos = pos+1;

        if (state.pos > state.posMax) {
            state.pos = state.posMax;
        }

        var url = state.src.slice(start, pos);

        // Having matched all three characters we add a token to the state list
        var token = {
            type: "oEmbed",
            level: state.level,
            content: marker,
            url: url
        };

        state.push(token);

        return true;
    }
    
    ,modxCodeParser: function(state, silent) {
        var max, marker, matchStart, matchEnd,
            pos = state.pos;

        if (state.src.charCodeAt(pos) !== 0x60/* ` */) { return false; }
        pos++;
        if (state.src.charCodeAt(pos) !== 0x60/* ` */) { return false; }
        pos++;
        if (state.src.charCodeAt(pos) !== 0x60/* ` */) { return false; }
        
        pos++;
        max = state.posMax;

        marker = '```';

        matchStart = matchEnd = pos;

        while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
            matchEnd = matchStart + 1;

            while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60/* ` */) { matchEnd++; }

            if (matchEnd - matchStart === marker.length) {
                if (!silent) {
                    state.push({
                        type: 'code',
                        content: state.src.slice(pos, matchStart)
                            .replace(/[ \n]+/g, ' ')
                            .trim(),
                        block: false,
                        level: state.level
                    });
                }
                state.pos = matchEnd;
                return true;
            }
        }

        if (!silent) { state.pending += marker; }
        state.pos += marker.length;
        return true;
    }

    ,catchAndDoNothing: function(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    ,drop: function(e) {
        e.stopPropagation();
        e.preventDefault();

        if (MODx.config['markdowneditor.upload.enable_image_upload'] == 1 || MODx.config['markdowneditor.upload.enable_file_upload'] == 1) {
            this.handleFiles(e.dataTransfer.files);
        }
    }

    ,handleFiles: function(files, mobile) {
        mobile = mobile || 0;

        Ext.each(files, function(file) {
            var isImage = /^image\//.test(file.type);

            if (isImage) {
                if (MODx.config['markdowneditor.upload.enable_image_upload'] == 0) return true;

                if (!this.checkType(MODx.config['markdowneditor.upload.image_types'], file)){
                    this.failMessage(file, 'image', _('markdowneditor.err.upload.unsupported_image'));

                    return true;
                }


                if (!this.checkSize(file.size)) {
                    this.failMessage(file, 'image', _('markdowneditor.err.upload.too_big'));

                    return true;
                }

                if (MODx.config['markdowneditor.cropper.enable_cropper'] == 1) {
                    MODx.load({
                        xtype: 'markdowneditor-window-cropper'
                        ,file: file
                        ,md: this
                        ,mobile: mobile
                    }).show();
                } else {
                    this.uploadFile(file, 'image', mobile);
                    this.editor.focus();
                }
            } else {
                if (MODx.config['markdowneditor.upload.enable_file_upload'] == 0) return true;

                if (!this.checkType(MODx.config['markdowneditor.upload.file_types'], file)) {
                    this.failMessage(file, 'file', _('markdowneditor.err.upload.unsupported_file'));

                    return true;
                }

                if (!this.checkSize(file.size)) {
                    this.failMessage(file, 'file', _('markdowneditor.err.upload.too_big'));

                    return true;
                }

                this.uploadFile(file, 'file');
                this.editor.focus();
            }

        }, this);
    }

    ,checkSize: function(size){
        var maxSize = MODx.config['markdowneditor.upload.max_size'];
        if (!maxSize || maxSize == '') maxSize = (MODx.config['upload_maxsize'] || '2097152');

        maxSize = parseInt(maxSize);

        if (maxSize == 0) return true;

        return size <= maxSize;
    }

    ,checkType: function(allowedTypes, file) {
        allowedTypes = allowedTypes.split(',');
        var ext = file.name.split('.').pop();
        return allowedTypes.indexOf(ext.toLowerCase()) != -1;
    }

    ,uploadFile: function(file, type, mobile) {
        type = type || 'file';
        mobile = mobile || 0;

        var uploader = this.createUploader(type, file.name);

        var formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'mgr/editor/' + type + 'upload');
        formData.append('name', file.name);
        formData.append('resource', this.config.resource);
        formData.append('mobile', mobile);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', markdownEditor.config.connectorUrl);
        xhr.setRequestHeader('Powered-By', 'MODx');
        xhr.setRequestHeader('modAuth', Ext.Ajax.defaultHeaders.modAuth);

        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                var complete = (event.loaded / event.total * 100 | 0);
                uploader.child('.progress').setWidth(complete + '%');
            }
        }.bind(this);

        xhr.onload = function () {
            if (xhr.status === 200) {
                var res = JSON.parse(xhr.responseText);
                if (res.success == true) {
                    uploader.remove();
                    var imagePrefix = (type == 'image') ? '!' : '';
                    var endLine = (type == 'image') ? '\n\n' : '\n';
                    this.editor.insert(imagePrefix + '[' + res.object.name + '](' + res.object.path + ' "' + res.object.name + '")' + endLine);
                } else {
                    this.failUploader(uploader, res.message);
                }
            }
        }.bind(this);

        xhr.send(formData);
    }

    ,createUploader: function(type, fileName) {
        var uploader = Ext.DomHelper.insertFirst(this.statusBar,{
            tag: 'div',
            html: '<div class="progress"><i class="icon icon-spinner icon-spin"></i> <span>' + _('markdowneditor.uploading_' + type) + fileName + '</span></div>'
        });

        return Ext.get(uploader);
    }

    ,failUploader: function(uploader, message) {
        uploader.child('.progress').addClass('error');
        uploader.child('.progress').setWidth('100%');

        uploader.child('i').addClass('remove-message');
        uploader.child('i').replaceClass('icon-spinner', 'icon-remove');
        uploader.child('i').removeClass('icon-spin');

        uploader.child('span').dom.innerHTML += ' failed. ' + message;
        uploader.child('.remove-message').on('click', function() {
            uploader.remove();
        });
    }

    ,failMessage: function(file, type, message) {
        var uploader = this.createUploader(type, file.name);
        this.failUploader(uploader, message);
    }

    ,isMobileDevice: function() {
        return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
    }
});

MODx.loadRTE = function(id) {
    new markdownEditor.Editor({
        mdElementId: id
    });
};

MODx.afterTVLoad = function() {
    var els = Ext.query('textarea.modx-richtext');

    Ext.each(els, function(element){
        element = Ext.get(element);
        if (!element) return true;

        if (markdownEditor.loadedElements[element.id]) return true;

        markdownEditor.loadedElements[element.id] = new markdownEditor.Editor({
            mdElementId: element.id
        });

    });

};

MODx.unloadTVRTE = function() {
    var els = Ext.query('.modx-richtext');

    Ext.each(els, function(element){
        element = Ext.get(element);
        if (!element) return true;

        if (!markdownEditor.loadedElements[element.id]) return true;

        markdownEditor.loadedElements[element.id].destroy();

    });
};