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
    ,localCache: {
        oEmbed: {}
    }
    ,initComponent: function() {
        MarkdownEditor.superclass.initComponent.call(this);

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
        this.preview.setDisplayed('block');
    }

    ,hidePreview: function(){
        this.preview.setDisplayed('none');
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

        var that = this;
        this.preview.fixHeight = function () {
            that.editor.resize();
            var height = that.editor.getSession().getScreenLength() * that.editor.renderer.lineHeight + that.editor.renderer.scrollBar.getWidth()  + 25;
            
            this.setHeight(height);
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
        };

        this.toolBox.child('.splitscreen-button').turnOff = function() {
            this.child('i').addClass('icon-pause');
            this.child('i').removeClass('icon-stop');

            that.contentMD.parent().parent().removeClass('split');
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
        this.editor.getSession().setUseWrapMode(true);
        this.editor.getSession().setWrapLimitRange();
        this.editor.renderer.setScrollMargin(10, 10);
        this.editor.getSession().setValue(this.textarea.getValue());
        this.editor.getSession().setMode("ace/mode/markdowneditor");
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

            if (selection.session.doc.$lines[this.editor.getCursorPosition().row] == "") {
                var node = Ext.DomQuery.selectNode('.' + this.mdElementName + '_markdown .ace_gutter-cell:nth-child(' + (this.editor.getCursorPosition().row + 1) + ')');
                if (node) {
                    this.addGutterToolbar(node);
                }
            }
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
                '<label for="'+this.statusBar.id+'-file"><i class="icon icon-upload icon-fixed-width"></i></label>' +
                '<label for="'+this.statusBar.id+'-file-mobile"><i class="icon icon-camera icon-fixed-width"></i></label>' +
                '<i class="icon icon-code icon-fixed-width"></i>' +
            '</div>');
        } else {
            this.gutterToolbar.update('<i class="icon icon-plus icon-fixed-width"></i>' +
            '<div class="inline-toolbar">' +
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
    }

    ,registerRemarkable: function() {
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

        var oEmbed = function(md) {
            md.inline.ruler.push('oEmbed', this.oEmbedParser);
            md.renderer.rules.oEmbed = oEmbedRenderer;
        }.bind(this);

        this.remarkable.use(oEmbed);
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
                                this.preview.update(r.data);

                                if ((this.editor.getCursorPosition().row + 2) >= this.editor.getSession().getDocument().getLength()) {
                                    this.preview.dom.scrollTop = this.preview.dom.scrollHeight
                                }

                                this.preview.fixHeight();
                            },
                            scope: this
                        }
                    }
                });
            }.bind(this), timeout);
        } else {
            this.preview.update(output);

            if ((this.editor.getCursorPosition().row + 2) >= this.editor.getSession().getDocument().getLength()) {
                this.preview.dom.scrollTop = this.preview.dom.scrollHeight
            }

            this.preview.fixHeight();
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

        return allowedTypes.indexOf(file.name.split('.').pop()) != -1;
    }

    ,uploadFile: function(file, type, mobile) {
        type = type || 'file';
        mobile = mobile || 0;

        var uploader = this.createUploader();

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
markdownEditor.combo.CropperProfile = function(config) {
    var data = JSON.parse(MODx.config['markdowneditor.cropper.profiles'] || '[]');

    config = config || {};
    Ext.applyIf(config,{
        store: new Ext.data.JsonStore({
            data: data
            ,fields: ['name', 'width', 'height', 'ratio']
        })
        ,displayField: 'name'
        ,mode: 'local'
        ,valueField: 'name'
        ,editable: false
        ,value: data[0] ? data[0].name : ''
    });

    var showDescription = parseInt(MODx.config['markdowneditor.cropper.show_description'] || 0);
    if (showDescription) {
        config.tpl = new Ext.XTemplate('<tpl for="."><div class="x-combo-list-item"><span style="font-weight: bold">{name}</span>'
            ,'<br /><tpl if="width">W:{width} </tpl><tpl if="height">H:{height} </tpl><tpl if="ratio">R:{ratio}</tpl></div></tpl>');
    }

    markdownEditor.combo.CropperProfile.superclass.constructor.call(this,config);
};
Ext.extend(markdownEditor.combo.CropperProfile,MODx.combo.ComboBox);
Ext.reg('markdowneditor-combo-cropper-profile',markdownEditor.combo.CropperProfile);
markdownEditor.window.Cropper = function(config) {
    config = config || {};
    config.cropperSelector = config.cropperSelector || '.image-upload-wrapper > img';

    var id = Ext.id();

    Ext.applyIf(config,{
        modal: false
        ,layout: 'auto'
        ,closeAction: 'hide'
        ,shadow: true
        ,resizable: true
        ,collapsible: true
        ,maximizable: false
        ,autoHeight: false
        ,autoScroll: true
        ,allowDrop: true
        ,width: 800
        ,mobile: 0
        ,title: _('markdowneditor.cropper.crop_image')
        ,cls: 'modx-window markdowneditor-cropper-window'
        ,items:[{
            layout: 'column'
            ,border: false
            ,defaults: {
                layout: 'form'
                ,labelAlign: 'top'
                ,labelSeparator: ''
                ,anchor: '100%'
                ,border: false
            }
            ,items: [{
                columnWidth: 0.1
                ,defaults: {
                    msgTarget: 'under'
                    ,anchor: '100%'
                }
                ,cls: 'markdowneditor-toolbar'
                ,items: [{
                    xtype: 'button'
                    ,text: '<i class="icon icon-arrows icon-large"></i>'
                    ,tooltip: _('markdowneditor.cropper.move')
                    ,scope: this
                    ,param: 'move'
                    ,action: 'setDragMode'
                    ,handler: this.callCropperAction
                },{
                    xtype: 'button'
                    ,text: '<i class="icon icon-crop icon-large"></i>'
                    ,tooltip: _('markdowneditor.cropper.crop')
                    ,scope: this
                    ,param: 'crop'
                    ,action: 'setDragMode'
                    ,handler: this.callCropperAction
                },{
                    xtype: 'button'
                    ,text: '<i class="icon icon-search-plus icon-large"></i>'
                    ,tooltip: _('markdowneditor.cropper.zoom_in')
                    ,scope: this
                    ,param: 0.1
                    ,action: 'zoom'
                    ,handler: this.callCropperAction
                },{
                    xtype: 'button'
                    ,text: '<i class="icon icon-search-minus icon-large"></i>'
                    ,tooltip: _('markdowneditor.cropper.zoom_out')
                    ,scope: this
                    ,param: -0.1
                    ,action: 'zoom'
                    ,handler: this.callCropperAction
                },{
                    xtype: 'button'
                    ,text: '<i class="icon icon-rotate-left icon-large"></i>'
                    ,tooltip: _('markdowneditor.cropper.rotate_left')
                    ,scope: this
                    ,param: -90
                    ,action: 'rotate'
                    ,handler: this.callCropperAction
                },{
                    xtype: 'button'
                    ,text: '<i class="icon icon-rotate-right icon-large"></i>'
                    ,tooltip: _('markdowneditor.cropper.rotate_right')
                    ,scope: this
                    ,param: 90
                    ,action: 'rotate'
                    ,handler: this.callCropperAction
                },{
                    xtype: 'button'
                    ,text: '<i class="icon icon-remove icon-large"></i>'
                    ,tooltip: _('markdowneditor.cropper.clear_cropper')
                    ,scope: this
                    ,param: null
                    ,action: 'clear'
                    ,handler: this.callCropperAction
                }]
            },{
                columnWidth: 0.9
                ,defaults: {
                    msgTarget: 'under'
                    ,anchor: '100%'
                }
                ,cls: 'markdowneditor-cropper'
                ,items: [{
                    html: '<div class="image-upload-wrapper"><img src="' + URL.createObjectURL(config.file) + '"></div>'
                }]
            }]
        }]
        ,bbar: [{
            xtype: 'markdowneditor-combo-cropper-profile'
            ,id: id + '-cropper-profile'
            ,listeners: {
                select: {
                    fn: function(combo, value){
                        this.changeCropperProfile(value.data);
                    },
                    scope: this
                }
            }
        },'->',{
            text: _('cancel')
            ,scope: this
            ,handler: this.close
        },{
            text: _('markdowneditor.cropper.upload')
            ,cls: 'primary-button'
            ,scope: this
            ,crop: 0
            ,handler: this.upload
        },{
            text: _('markdowneditor.cropper.crop_upload')
            ,cls: 'primary-button'
            ,scope: this
            ,crop: 1
            ,handler: this.upload
        }]
        ,listeners: {
            'show': {
                fn: function() {
                    var cropperOptions = {};
                    this.$cropperEl = $('#' + this.id + ' ' + config.cropperSelector);
                    cropperOptions.strict = false;

                    cropperOptions.crop = function (data) {
                        this.imageData = [
                            '{"x":' + data.x,
                            '"y":' + data.y,
                            '"height":' + data.height,
                            '"width":' + data.width,
                            '"rotate":' + data.rotate + '}'
                        ].join();
                    }.bind(this);

                    this.$cropperEl.cropper(cropperOptions);

                    var profile = Ext.getCmp(id + '-cropper-profile').store.getAt(0);
                    this.changeCropperProfile(profile.data);
                },
                scope: this
            }
        }
    });
    markdownEditor.window.Cropper.superclass.constructor.call(this,config);
    this.config = config;

};
Ext.extend(markdownEditor.window.Cropper, Ext.Window,{
    imageData: ''
    ,cropperProfile: {name: ''}

    ,changeCropperProfile: function(profile){
        var ratio;

        if (profile.ratio != "") {
            ratio = profile.ratio;
            ratio.replace(/[^-:x()\d/*+.]/g, '');
            ratio = eval(ratio) || NaN;
        } else {
            if (profile.width && profile.height) {
                var width = parseInt(profile.width);
                var height = parseInt(profile.height);
                if (width > 0 && height > 0) {
                    ratio = width / height;
                } else {
                    ratio = NaN;
                }
            } else {
                ratio = NaN;
            }
        }

        this.cropperProfile = profile;

        this.callCropperAction({action: 'setAspectRatio', param: ratio});
    }

    ,upload: function(button) {
        var uploader = this.config.md.createUploader('image', this.config.file.name);

        var formData = new FormData();
        formData.append('file', this.config.file);
        formData.append('action', 'mgr/editor/imageupload');
        formData.append('imageData', this.imageData);
        formData.append('name', this.config.file.name);
        formData.append('crop', button.crop);
        formData.append('resource', this.config.md.config.resource);
        formData.append('mobile', this.config.mobile);
        formData.append('profile', this.cropperProfile.name);

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
                    this.config.md.editor.insert('![' + res.object.name + '](' + res.object.path + ' "' + res.object.name + '")\n\n');
                } else {
                    this.config.md.failUploader(uploader, res.message);
                }
            }
        }.bind(this);

        xhr.send(formData);

        this.close();
    }

    ,callCropperAction: function(btn) {
        this.$cropperEl.cropper(btn.action, btn.param);
    }

    ,close: function() {
        this.$cropperEl.cropper("destroy");

        markdownEditor.window.Cropper.superclass.close.call(this);
        this.config.md.editor.focus();
    }
});
Ext.reg('markdowneditor-window-cropper',markdownEditor.window.Cropper);

markdownEditor.window.OEmbed = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        title: _('markdowneditor.oembed.embed_url')
        ,closeAction: 'close'
        ,resizable: false
        ,collapsible: false
        ,maximizable: false
        ,height: 185
        ,modal: true
        ,fields: this.getFields(config)
    });
    markdownEditor.window.OEmbed.superclass.constructor.call(this,config);
};
Ext.extend(markdownEditor.window.OEmbed,MODx.Window, {
    getFields: function(config) {
        return [{
            xtype: 'textfield'
            ,name: 'url'
            ,fieldLabel: _('markdowneditor.oembed.url')
            ,allowBlank: false
            ,anchor: '100%'
            ,vtype: 'url'
        }];
    }

    ,submit: function(){
        var f = this.fp.getForm();

        if (f.isValid()) {
            if (this.config.success) {
                Ext.callback(this.config.success,this.config.scope || this,[f.getValues()]);
            }

            this.close();
        }
    }
});
Ext.reg('markdowneditor-window-oembed',markdownEditor.window.OEmbed);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbWJvLmpzIiwibWFya2Rvd25lZGl0b3Iud2luZG93LmpzIiwib2VtYmVkLndpbmRvdy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcjdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIkV4dC5ucygnTWFya2Rvd25FZGl0b3InKTtcbk1hcmtkb3duRWRpdG9yID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIE1hcmtkb3duRWRpdG9yLnN1cGVyY2xhc3MuY29uc3RydWN0b3IuY2FsbCh0aGlzLGNvbmZpZyk7XG59O1xuRXh0LmV4dGVuZChNYXJrZG93bkVkaXRvcixFeHQuQ29tcG9uZW50LHtcbiAgICB3aW5kb3c6e30sY29tYm86e30sY29uZmlnOiB7fVxufSk7XG5FeHQucmVnKCdtYXJrZG93bmVkaXRvcicsTWFya2Rvd25FZGl0b3IpO1xubWFya2Rvd25FZGl0b3IgPSBuZXcgTWFya2Rvd25FZGl0b3IoKTtcblxubWFya2Rvd25FZGl0b3IubG9hZGVkRWxlbWVudHMgPSB7fTtcblxubWFya2Rvd25FZGl0b3IuRWRpdG9yID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGNvbmZpZy5yZXNvdXJjZSA9IE1PRHgucmVxdWVzdC5pZCB8fCAwO1xuICAgIG1hcmtkb3duRWRpdG9yLkVkaXRvci5zdXBlcmNsYXNzLmNvbnN0cnVjdG9yLmNhbGwodGhpcyxjb25maWcpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xufTtcbkV4dC5leHRlbmQobWFya2Rvd25FZGl0b3IuRWRpdG9yLEV4dC5Db21wb25lbnQse1xuICAgIHJlbWFya2FibGU6ICcnXG4gICAgLGZ1bGxTY3JlZW46IGZhbHNlXG4gICAgLGxvY2FsQ2FjaGU6IHtcbiAgICAgICAgb0VtYmVkOiB7fVxuICAgIH1cbiAgICAsaW5pdENvbXBvbmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIE1hcmtkb3duRWRpdG9yLnN1cGVyY2xhc3MuaW5pdENvbXBvbmVudC5jYWxsKHRoaXMpO1xuXG4gICAgICAgIGlmICh0aGlzLm1kRWxlbWVudElkKXtcbiAgICAgICAgICAgIEV4dC5vblJlYWR5KHRoaXMucmVuZGVyLCB0aGlzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICxkZXN0cm95OiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmVkaXRvci5kZXN0cm95KCk7XG5cbiAgICAgICAgdGhpcy5tZENvbnRhaW5lci5yZW1vdmUoKTtcbiAgICAgICAgdGhpcy50YU1hcmtkb3duLnJlbW92ZSgpO1xuXG4gICAgICAgIHRoaXMudGV4dGFyZWEuZG9tLnN0eWxlLmRpc3BsYXkgPSBudWxsO1xuICAgICAgICB0aGlzLnRleHRhcmVhLmRvbS5zdHlsZS53aWR0aCA9IG51bGw7XG4gICAgICAgIHRoaXMudGV4dGFyZWEuZG9tLnN0eWxlLmhlaWdodCA9IG51bGw7XG5cbiAgICAgICAgTWFya2Rvd25FZGl0b3Iuc3VwZXJjbGFzcy5kZXN0cm95LmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgLHJlbmRlcjogZnVuY3Rpb24oY29udGFpbmVyLCBwb3NpdGlvbikge1xuICAgICAgICB0aGlzLnRleHRhcmVhID0gRXh0LmdldCh0aGlzLm1kRWxlbWVudElkKTtcbiAgICAgICAgdGhpcy5tZEVsZW1lbnROYW1lID0gdGhpcy50ZXh0YXJlYS5kb20ubmFtZTtcblxuICAgICAgICBpZiAoIXRoaXMudGV4dGFyZWEpIHJldHVybjtcblxuICAgICAgICB0aGlzLmJ1aWxkVUkoKTtcbiAgICAgICAgdGhpcy5yZWdpc3RlckFjZSgpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyUmVtYXJrYWJsZSgpO1xuICAgICAgICB0aGlzLmJ1aWxkVG9vbGJveCgpO1xuXG4gICAgICAgIHZhciBwcmV2aWV3QnV0dG9uID0gdGhpcy50b29sQm94LmNoaWxkKCcucHJldmlldy1idXR0b24nKTtcbiAgICAgICAgdmFyIGZ1bGxzY3JlZW5CdXR0b24gPSB0aGlzLnRvb2xCb3guY2hpbGQoJy5mdWxsc2NyZWVuLWJ1dHRvbicpO1xuICAgICAgICB2YXIgc3BsaXRzY3JlZW5CdXR0b24gPSB0aGlzLnRvb2xCb3guY2hpbGQoJy5zcGxpdHNjcmVlbi1idXR0b24nKTtcblxuICAgICAgICB2YXIgY29udGVudCA9IHRoaXMuY29udGVudE1EO1xuXG4gICAgICAgIHZhciBwcmV2aWV3QnV0dG9uT2ZmID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmFwcGVuZChjb250ZW50LnBhcmVudCgpLHtcbiAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICBjbGFzczogJ3ByZXZpZXctYnV0dG9uLW9mZicsXG4gICAgICAgICAgICBodG1sOiAnPGkgY2xhc3M9XCJpY29uIGljb24tZXllLXNsYXNoIGljb24tbGFyZ2VcIj48L2k+JyxcbiAgICAgICAgICAgIGhpZGRlbjogdHJ1ZVxuICAgICAgICB9KSk7XG5cbiAgICAgICAgdmFyIGRyb3BUYXJnZXQgPSBNT0R4LmxvYWQoe1xuICAgICAgICAgICAgeHR5cGU6ICdtb2R4LXRyZWVkcm9wJyxcbiAgICAgICAgICAgIHRhcmdldDogY29udGVudCxcbiAgICAgICAgICAgIHRhcmdldEVsOiBjb250ZW50LFxuICAgICAgICAgICAgb25JbnNlcnQ6IChmdW5jdGlvbihzKXtcbiAgICAgICAgICAgICAgICB0aGlzLmluc2VydChzKTtcbiAgICAgICAgICAgICAgICB0aGlzLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMuZWRpdG9yKSxcbiAgICAgICAgICAgIGlmcmFtZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy50ZXh0YXJlYS5vbignZGVzdHJveScsIGZ1bmN0aW9uKCkge2Ryb3BUYXJnZXQuZGVzdHJveSgpO30pO1xuXG4gICAgICAgIHZhciBkZWZhdWx0U3BsaXQgPSBwYXJzZUludChNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IuZ2VuZXJhbC5zcGxpdCddIHx8IDApO1xuICAgICAgICBpZiAoZGVmYXVsdFNwbGl0ID09IDEpIHtcbiAgICAgICAgICAgIHNwbGl0c2NyZWVuQnV0dG9uLnR1cm5PbigpO1xuICAgICAgICB9XG4gICAgICAgIHByZXZpZXdCdXR0b24uYWRkTGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5zaG93UHJldmlldygpO1xuICAgICAgICAgICAgdGhpcy5oaWRlQ29udGVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNCYXIuc2V0RGlzcGxheWVkKCdub25lJyk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudE1ELnBhcmVudCgpLnBhcmVudCgpLmFkZENsYXNzKCdwcmV2aWV3Jyk7XG5cbiAgICAgICAgICAgIHByZXZpZXdCdXR0b25PZmYuc2hvdygpXG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHByZXZpZXdCdXR0b25PZmYuYWRkTGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5oaWRlUHJldmlldygpO1xuICAgICAgICAgICAgdGhpcy5zaG93Q29udGVudCgpO1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNCYXIuc2V0RGlzcGxheWVkKCdibG9jaycpO1xuXG4gICAgICAgICAgICB0aGlzLmNvbnRlbnRNRC5wYXJlbnQoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygncHJldmlldycpO1xuXG4gICAgICAgICAgICB0aGlzLmVkaXRvci5mb2N1cygpO1xuXG4gICAgICAgICAgICBwcmV2aWV3QnV0dG9uT2ZmLmhpZGUoKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgc3BsaXRzY3JlZW5CdXR0b24uYWRkTGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmIChzcGxpdHNjcmVlbkJ1dHRvbi5jaGlsZCgnaScpLmhhc0NsYXNzKCdpY29uLXBhdXNlJykpIHtcbiAgICAgICAgICAgICAgICBzcGxpdHNjcmVlbkJ1dHRvbi50dXJuT24oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3BsaXRzY3JlZW5CdXR0b24udHVybk9mZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBmdWxsc2NyZWVuQnV0dG9uLmFkZExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZiAodGhpcy5mdWxsU2NyZWVuID09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgZnVsbHNjcmVlbkJ1dHRvbi50dXJuT24oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZnVsbHNjcmVlbkJ1dHRvbi50dXJuT2ZmKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuc3RhdHVzQmFyLnNldERpc3BsYXllZCgnYmxvY2snKTtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLnJlc2l6ZSh0cnVlKTtcblxuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBpZiAobWFya2Rvd25FZGl0b3IuY29udGVudFt0aGlzLm1kRWxlbWVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLmVkaXRvci5zZXRWYWx1ZShtYXJrZG93bkVkaXRvci5jb250ZW50W3RoaXMubWRFbGVtZW50TmFtZV0pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZWRpdG9yLnNlbGVjdGlvbi5jbGVhclNlbGVjdGlvbigpO1xuXG4gICAgICAgIHRoaXMucHJldmlldy51cGRhdGUodGhpcy5wYXJzZSh0aGlzLmVkaXRvci5nZXRWYWx1ZSgpKSk7XG5cbiAgICAgICAgdGhpcy5wcmV2aWV3LmZpeEhlaWdodCgpO1xuXG4gICAgICAgIHRoaXMuZWRpdG9yLmdldFNlc3Npb24oKS5vbignY2hhbmdlJywgZnVuY3Rpb24oZSxiLGMsZCl7XG4gICAgICAgICAgICBpZiAoZS5kYXRhLmFjdGlvbiA9PSAnaW5zZXJ0VGV4dCcgJiYgdGhpcy5lZGl0b3IuZ2V0U2Vzc2lvbigpLmdldERvY3VtZW50KCkuaXNOZXdMaW5lKGUuZGF0YS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5lZGl0b3IuZ2V0U2Vzc2lvbigpO1xuICAgICAgICAgICAgICAgIHZhciBkb2N1bWVudCA9IHNlc3Npb24uZ2V0RG9jdW1lbnQoKTtcblxuICAgICAgICAgICAgICAgIGlmICgvXlxccyooPzpbKistXXxcXGQrXFwuKVxccyokLy5leGVjKGRvY3VtZW50LmdldExpbmUoZS5kYXRhLnJhbmdlLnN0YXJ0LnJvdykpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlTGluZXMoZS5kYXRhLnJhbmdlLnN0YXJ0LnJvdywgZS5kYXRhLnJhbmdlLnN0YXJ0LnJvdyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnBhcnNlKHRoaXMuZWRpdG9yLmdldFZhbHVlKCkpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cblxuICAgICxzaG93Q29udGVudDogZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5jb250ZW50TUQuc2V0RGlzcGxheWVkKCdibG9jaycpO1xuICAgIH1cblxuICAgICxoaWRlQ29udGVudDogZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5jb250ZW50TUQuc2V0RGlzcGxheWVkKCdub25lJyk7XG4gICAgfVxuXG4gICAgLHNob3dQcmV2aWV3OiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnByZXZpZXcuc2V0RGlzcGxheWVkKCdibG9jaycpO1xuICAgIH1cblxuICAgICxoaWRlUHJldmlldzogZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy5wcmV2aWV3LnNldERpc3BsYXllZCgnbm9uZScpO1xuICAgIH1cblxuICAgICxidWlsZFVJOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy50ZXh0YXJlYS5zZXREaXNwbGF5ZWQoJ25vbmUnKTtcbiAgICAgICAgdGhpcy50ZXh0YXJlYS5zZXRXaWR0aCgwKTtcbiAgICAgICAgdGhpcy50ZXh0YXJlYS5zZXRIZWlnaHQoMCk7XG5cbiAgICAgICAgdGhpcy50YU1hcmtkb3duID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmluc2VydEJlZm9yZSh0aGlzLnRleHRhcmVhLCB7XG4gICAgICAgICAgICB0YWc6ICd0ZXh0YXJlYScsXG4gICAgICAgICAgICBuYW1lOiB0aGlzLm1kRWxlbWVudE5hbWUgKyAnX21hcmtkb3duJyxcbiAgICAgICAgICAgIGNsYXNzOiB0aGlzLm1kRWxlbWVudE5hbWUgKyAnX21hcmtkb3duJ1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy50YU1hcmtkb3duLnNldERpc3BsYXllZCgnbm9uZScpO1xuICAgICAgICB0aGlzLnRhTWFya2Rvd24uc2V0V2lkdGgoMCk7XG4gICAgICAgIHRoaXMudGFNYXJrZG93bi5zZXRIZWlnaHQoMCk7XG5cbiAgICAgICAgdGhpcy5tZENvbnRhaW5lciA9IEV4dC5nZXQoRXh0LkRvbUhlbHBlci5pbnNlcnRCZWZvcmUodGhpcy50ZXh0YXJlYSwge1xuICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgIGNsYXNzOiAnbWFya2Rvd24tY29udGFpbmVyIGFjZS0nICsgKE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci5nZW5lcmFsLnRoZW1lJ10gfHwgJ21vbm9rYWknKS50b0xvd2VyQ2FzZSgpLnJlcGxhY2UoL18vZywgJy0nKVxuICAgICAgICB9KSk7XG5cbiAgICAgICAgdmFyIGZ1bGxTY3JlZW5IZWFkZXIgPSBFeHQuZ2V0KEV4dC5Eb21IZWxwZXIuYXBwZW5kKHRoaXMubWRDb250YWluZXIuZG9tLHtcbiAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICBjbGFzczogJ2Z1bGxzY3JlZW4taGVhZGVyIGFjZV9ndXR0ZXInLFxuICAgICAgICAgICAgaHRtbDogJzxpbnB1dCB0eXBlPVwidGV4dFwiIC8+J1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdmFyIHBhZ2VUaXRsZSA9IEV4dC5nZXRDbXAoJ21vZHgtcmVzb3VyY2UtcGFnZXRpdGxlJyk7XG4gICAgICAgIGlmIChwYWdlVGl0bGUpIHtcbiAgICAgICAgICAgIHZhciBoZWFkZXJJbnB1dCA9IGZ1bGxTY3JlZW5IZWFkZXIuY2hpbGQoJ2lucHV0Jyk7XG4gICAgICAgICAgICBoZWFkZXJJbnB1dC5kb20udmFsdWUgPSBwYWdlVGl0bGUuZ2V0VmFsdWUoKTtcblxuICAgICAgICAgICAgaGVhZGVySW5wdXQub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcGFnZVRpdGxlLnNldFZhbHVlKHRoaXMuZG9tLnZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBwYWdlVGl0bGUub24oJ2NoYW5nZScsIGZ1bmN0aW9uKGZpZWxkLHZhbHVlKXtcbiAgICAgICAgICAgICAgICBoZWFkZXJJbnB1dC5kb20udmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdyYXBwZXIgPSBFeHQuZ2V0KEV4dC5Eb21IZWxwZXIuYXBwZW5kKHRoaXMubWRDb250YWluZXIuZG9tLHtcbiAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICBjbGFzczogJ21hcmtkb3duLXdyYXBwZXInXG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmNvbnRlbnRNRCA9IEV4dC5nZXQoRXh0LkRvbUhlbHBlci5hcHBlbmQod3JhcHBlcix7XG4gICAgICAgICAgICB0YWc6ICdkaXYnLFxuICAgICAgICAgICAgY2xhc3M6IHRoaXMudGV4dGFyZWEuZG9tLmNsYXNzTmFtZSArICcgY29udGVudC1tZCAnICsgdGhpcy5tZEVsZW1lbnROYW1lICsgJ19tYXJrZG93bidcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMucHJldmlldyA9IEV4dC5nZXQoRXh0LkRvbUhlbHBlci5hcHBlbmQod3JhcHBlcix7XG4gICAgICAgICAgICB0YWc6ICdkaXYnLFxuICAgICAgICAgICAgY2xhc3M6ICdtYXJrZG93bi1ib2R5IHByZXZpZXctbWQnXG4gICAgICAgIH0pKTtcblxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgICAgIHRoaXMucHJldmlldy5maXhIZWlnaHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGF0LmVkaXRvci5yZXNpemUoKTtcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSB0aGF0LmVkaXRvci5nZXRTZXNzaW9uKCkuZ2V0U2NyZWVuTGVuZ3RoKCkgKiB0aGF0LmVkaXRvci5yZW5kZXJlci5saW5lSGVpZ2h0ICsgdGhhdC5lZGl0b3IucmVuZGVyZXIuc2Nyb2xsQmFyLmdldFdpZHRoKCkgICsgMjU7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHRoaXMuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci51cGxvYWQuZW5hYmxlX2ltYWdlX3VwbG9hZCddID09IDEgfHwgTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLnVwbG9hZC5lbmFibGVfZmlsZV91cGxvYWQnXSA9PSAxKSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c0JhciA9IEV4dC5nZXQoRXh0LkRvbUhlbHBlci5hcHBlbmQodGhpcy5tZENvbnRhaW5lci5kb20se1xuICAgICAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdzdGF0dXMtYmFyIGFjZV9ndXR0ZXInXG4gICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzTW9iaWxlRGV2aWNlKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1c0Jhci5kb20uaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJ1cGxvYWQtYmFyXCI+IDxpbnB1dCBjbGFzcz1cImhpZGRlblwiIG5hbWU9XCJtZF9maWxlXycrIHRoaXMuc3RhdHVzQmFyLmlkICsnXCIgaWQ9XCInICsgdGhpcy5zdGF0dXNCYXIuaWQgKyAnLWZpbGVcIiB0eXBlPVwiZmlsZVwiIG11bHRpcGxlIC8+PGlucHV0IGNsYXNzPVwiaGlkZGVuXCIgbmFtZT1cIm1kX2ZpbGVfJysgdGhpcy5zdGF0dXNCYXIuaWQgKyctbW9iaWxlXCIgaWQ9XCInICsgdGhpcy5zdGF0dXNCYXIuaWQgKyAnLWZpbGUtbW9iaWxlXCIgdHlwZT1cImZpbGVcIiBhY2NlcHQ9XCJpbWFnZS8qXCIgY2FwdHVyZT1cImNhbWVyYVwiIC8+JyArIF8oJ21hcmtkb3duZWRpdG9yLnN0YXR1c19iYXJfbWVzc2FnZV9tb2JpbGUnLCB7aWQ6IHRoaXMuc3RhdHVzQmFyLmlkICsgJy1maWxlJywgaWRfbW9iaWxlOiB0aGlzLnN0YXR1c0Jhci5pZCArICctZmlsZS1tb2JpbGUnfSkgKyAnPC9kaXY+JztcblxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzQmFyLmNoaWxkKCcjJyArIHRoaXMuc3RhdHVzQmFyLmlkICsgJy1maWxlLW1vYmlsZScpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlLCBpbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUZpbGVzKGlucHV0LmZpbGVzLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1c0Jhci5kb20uaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJ1cGxvYWQtYmFyXCI+IDxpbnB1dCBjbGFzcz1cImhpZGRlblwiIG5hbWU9XCJtZF9maWxlXycrIHRoaXMuc3RhdHVzQmFyLmlkICsnXCIgaWQ9XCInICsgdGhpcy5zdGF0dXNCYXIuaWQgKyAnLWZpbGVcIiB0eXBlPVwiZmlsZVwiIG11bHRpcGxlPicgKyBfKCdtYXJrZG93bmVkaXRvci5zdGF0dXNfYmFyX21lc3NhZ2UnLCB7aWQ6IHRoaXMuc3RhdHVzQmFyLmlkICsgJy1maWxlJ30pICsgJzwvZGl2Pic7XG5cbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1c0Jhci5jaGlsZCgnIycgKyB0aGlzLnN0YXR1c0Jhci5pZCArICctZmlsZScpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlLCBpbnB1dCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZUZpbGVzKGlucHV0LmZpbGVzKTtcbiAgICAgICAgICAgICAgICAgICAgaW5wdXQudmFsdWUgPSBcIlwiO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c0JhciA9IEV4dC5nZXQoRXh0LkRvbUhlbHBlci5hcHBlbmQodGhpcy5tZENvbnRhaW5lci5kb20se1xuICAgICAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdzdGF0dXMtYmFyJyxcbiAgICAgICAgICAgICAgICBodG1sOiBfKCdtYXJrZG93bmVkaXRvci5zdGF0dXNfYmFyX2Rpc2FibGVkJylcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEV4dC5Eb21IZWxwZXIuYXBwZW5kKHRoaXMubWRDb250YWluZXIuZG9tLHtcbiAgICAgICAgICAgIHRhZzogJ3NwYW4nLFxuICAgICAgICAgICAgc3R5bGU6ICdjbGVhcjogYm90aCdcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLGJ1aWxkVG9vbGJveDogZnVuY3Rpb24oKXtcbiAgICAgICAgdGhpcy50b29sQm94ID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmFwcGVuZCh0aGlzLnN0YXR1c0Jhcix7XG4gICAgICAgICAgICB0YWc6ICdkaXYnLFxuICAgICAgICAgICAgY2xhc3M6ICd0b29sYm94JyxcbiAgICAgICAgICAgIGNuOiBbe1xuICAgICAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdwcmV2aWV3LWJ1dHRvbicsXG4gICAgICAgICAgICAgICAgaHRtbDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLWV5ZSBpY29uLWxhcmdlXCI+PC9pPidcbiAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdzcGxpdHNjcmVlbi1idXR0b24nLFxuICAgICAgICAgICAgICAgIGh0bWw6ICc8aSBjbGFzcz1cImljb24gaWNvbi1wYXVzZSBpY29uLWxhcmdlXCI+PC9pPidcbiAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICAgICAgY2xhc3M6ICdmdWxsc2NyZWVuLWJ1dHRvbicsXG4gICAgICAgICAgICAgICAgaHRtbDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLWV4cGFuZCBpY29uLWxhcmdlXCI+PC9pPidcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH0pKTtcblxuICAgICAgICB2YXIgdGhhdCA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy50b29sQm94LmNoaWxkKCcuc3BsaXRzY3JlZW4tYnV0dG9uJykudHVybk9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmNoaWxkKCdpJykucmVtb3ZlQ2xhc3MoJ2ljb24tcGF1c2UnKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5hZGRDbGFzcygnaWNvbi1zdG9wJyk7XG5cbiAgICAgICAgICAgIHRoYXQuY29udGVudE1ELnBhcmVudCgpLnBhcmVudCgpLmFkZENsYXNzKCdzcGxpdCcpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudG9vbEJveC5jaGlsZCgnLnNwbGl0c2NyZWVuLWJ1dHRvbicpLnR1cm5PZmYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5hZGRDbGFzcygnaWNvbi1wYXVzZScpO1xuICAgICAgICAgICAgdGhpcy5jaGlsZCgnaScpLnJlbW92ZUNsYXNzKCdpY29uLXN0b3AnKTtcblxuICAgICAgICAgICAgdGhhdC5jb250ZW50TUQucGFyZW50KCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ3NwbGl0Jyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b29sQm94LmNoaWxkKCcuZnVsbHNjcmVlbi1idXR0b24nKS50dXJuT24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5yZW1vdmVDbGFzcygnaWNvbi1leHBhbmQnKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5hZGRDbGFzcygnaWNvbi1jb21wcmVzcycpO1xuXG4gICAgICAgICAgICB2YXIgbW9keEJ1dHRvbnMgPSBFeHQuZ2V0KCdtb2R4LWFjdGlvbi1idXR0b25zJyk7XG4gICAgICAgICAgICBpZiAobW9keEJ1dHRvbnMpIHtcbiAgICAgICAgICAgICAgICBtb2R4QnV0dG9ucy5hZGRDbGFzcygnbWFya2Rvd25lZGl0b3ItZnVsbHNjcmVlbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LmZ1bGxTY3JlZW4gPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAocGFyc2VJbnQoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmdlbmVyYWwuc3BsaXRfZnVsbHNjcmVlbiddIHx8IDEpID09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnRvb2xCb3guY2hpbGQoJy5zcGxpdHNjcmVlbi1idXR0b24nKS50dXJuT24oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhhdC50b29sQm94LmNoaWxkKCcuc3BsaXRzY3JlZW4tYnV0dG9uJykudHVybk9mZigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LnNob3dQcmV2aWV3KCk7XG4gICAgICAgICAgICB0aGF0LnNob3dDb250ZW50KCk7XG5cbiAgICAgICAgICAgIHRoYXQuZWRpdG9yLmZvY3VzKCk7XG5cbiAgICAgICAgICAgIHRoYXQuY29udGVudE1ELnBhcmVudCgpLnBhcmVudCgpLmFkZENsYXNzKCdmdWxsc2NyZWVuJyk7XG5cbiAgICAgICAgICAgIHRoYXQuZWRpdG9yLnNldE9wdGlvbignbWF4TGluZXMnLCBudWxsKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRvb2xCb3guY2hpbGQoJy5mdWxsc2NyZWVuLWJ1dHRvbicpLnR1cm5PZmYgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5hZGRDbGFzcygnaWNvbi1leHBhbmQnKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5yZW1vdmVDbGFzcygnaWNvbi1jb21wcmVzcycpO1xuXG4gICAgICAgICAgICB2YXIgbW9keEJ1dHRvbnMgPSBFeHQuZ2V0KCdtb2R4LWFjdGlvbi1idXR0b25zJyk7XG4gICAgICAgICAgICBpZiAobW9keEJ1dHRvbnMpIHtcbiAgICAgICAgICAgICAgICBtb2R4QnV0dG9ucy5yZW1vdmVDbGFzcygnbWFya2Rvd25lZGl0b3ItZnVsbHNjcmVlbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LmZ1bGxTY3JlZW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYgKHBhcnNlSW50KE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci5nZW5lcmFsLnNwbGl0J10gfHwgMCkgPT0gMSkge1xuICAgICAgICAgICAgICAgIHRoYXQudG9vbEJveC5jaGlsZCgnLnNwbGl0c2NyZWVuLWJ1dHRvbicpLnR1cm5PbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGF0LnRvb2xCb3guY2hpbGQoJy5zcGxpdHNjcmVlbi1idXR0b24nKS50dXJuT2ZmKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoYXQuaGlkZVByZXZpZXcoKTtcbiAgICAgICAgICAgIHRoYXQuc2hvd0NvbnRlbnQoKTtcblxuICAgICAgICAgICAgdGhhdC5lZGl0b3IuZm9jdXMoKTtcblxuICAgICAgICAgICAgdGhhdC5jb250ZW50TUQucGFyZW50KCkucGFyZW50KCkucmVtb3ZlQ2xhc3MoJ2Z1bGxzY3JlZW4nKTtcblxuICAgICAgICAgICAgdGhhdC5lZGl0b3Iuc2V0T3B0aW9uKCdtYXhMaW5lcycsIEluZmluaXR5KTtcblxuICAgICAgICAgICAgdGhhdC5wcmV2aWV3LmZpeEhlaWdodCgpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgICxyZWdpc3RlckFjZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZWRpdG9yID0gYWNlLmVkaXQoRXh0LkRvbVF1ZXJ5LnNlbGVjdE5vZGUoJ2Rpdi4nICsgdGhpcy5tZEVsZW1lbnROYW1lICsgJ19tYXJrZG93bicpKTtcbiAgICAgICAgYWNlLnJlcXVpcmUoXCJhY2UvbGF5ZXIvZ3V0dGVyX3Rvb2xiYXJcIik7XG5cbiAgICAgICAgdGhpcy5lZGl0b3Iuc2V0T3B0aW9ucyh7XG4gICAgICAgICAgICBtYXhMaW5lczogSW5maW5pdHksXG4gICAgICAgICAgICBtaW5MaW5lczogMjUsXG4gICAgICAgICAgICBlbmFibGVCYXNpY0F1dG9jb21wbGV0aW9uOiB0cnVlLFxuICAgICAgICAgICAgcHJpbnRNYXJnaW46IGZhbHNlLFxuICAgICAgICAgICAgc2hvd0d1dHRlcjogdHJ1ZSxcbiAgICAgICAgICAgIHVzZVNvZnRUYWJzOiB0cnVlLFxuICAgICAgICAgICAgc2hvd0ZvbGRXaWRnZXRzOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3dMaW5lTnVtYmVyczogZmFsc2UsXG4gICAgICAgICAgICBmb250U2l6ZTogcGFyc2VJbnQoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmdlbmVyYWwuZm9udF9zaXplJ10pIHx8IDEyLFxuICAgICAgICAgICAgZm9udEZhbWlseTogTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmdlbmVyYWwuZm9udF9mYW1pbHknXSB8fCAnJ1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lZGl0b3IuJGJsb2NrU2Nyb2xsaW5nID0gSW5maW5pdHk7XG4gICAgICAgIHRoaXMuZWRpdG9yLmdldFNlc3Npb24oKS5zZXRVc2VXcmFwTW9kZSh0cnVlKTtcbiAgICAgICAgdGhpcy5lZGl0b3IuZ2V0U2Vzc2lvbigpLnNldFdyYXBMaW1pdFJhbmdlKCk7XG4gICAgICAgIHRoaXMuZWRpdG9yLnJlbmRlcmVyLnNldFNjcm9sbE1hcmdpbigxMCwgMTApO1xuICAgICAgICB0aGlzLmVkaXRvci5nZXRTZXNzaW9uKCkuc2V0VmFsdWUodGhpcy50ZXh0YXJlYS5nZXRWYWx1ZSgpKTtcbiAgICAgICAgdGhpcy5lZGl0b3IuZ2V0U2Vzc2lvbigpLnNldE1vZGUoXCJhY2UvbW9kZS9tYXJrZG93bmVkaXRvclwiKTtcbiAgICAgICAgdGhpcy5lZGl0b3Iuc2V0VGhlbWUoXCJhY2UvdGhlbWUvXCIgKyAoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmdlbmVyYWwudGhlbWUnXSB8fCAnbW9ub2thaScpKTtcblxuICAgICAgICBpZiAodGhpcy5jb250ZW50TUQuaGFzQ2xhc3MoJ2FjZV9kYXJrJykpIHtcbiAgICAgICAgICAgIHRoaXMubWRDb250YWluZXIuYWRkQ2xhc3MoJ3RoZW1lLWRhcmsnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubWRDb250YWluZXIuYWRkQ2xhc3MoJ3RoZW1lLWxpZ2h0Jyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIFxuICAgICAgICB0aGlzLmVkaXRvci5zZWxlY3Rpb24ub24oJ2NoYW5nZUN1cnNvcicsIGZ1bmN0aW9uIChlLCBzZWxlY3Rpb24pIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmd1dHRlclRvb2xiYXIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmd1dHRlclRvb2xiYXIudXBkYXRlKCcnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlKCk7XG4gICAgICAgICAgICBpZiAocmFuZ2Uuc3RhcnQucm93ICE9IHJhbmdlLmVuZC5yb3cpIHJldHVybjtcblxuICAgICAgICAgICAgaWYgKHNlbGVjdGlvbi5zZXNzaW9uLmRvYy4kbGluZXNbdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yUG9zaXRpb24oKS5yb3ddID09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IEV4dC5Eb21RdWVyeS5zZWxlY3ROb2RlKCcuJyArIHRoaXMubWRFbGVtZW50TmFtZSArICdfbWFya2Rvd24gLmFjZV9ndXR0ZXItY2VsbDpudGgtY2hpbGQoJyArICh0aGlzLmVkaXRvci5nZXRDdXJzb3JQb3NpdGlvbigpLnJvdyArIDEpICsgJyknKTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEd1dHRlclRvb2xiYXIobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuZWRpdG9yLnNlc3Npb24uZ3V0dGVyUmVuZGVyZXIgPSAge1xuICAgICAgICAgICAgZ2V0V2lkdGg6IGZ1bmN0aW9uKHNlc3Npb24sIGxhc3RMaW5lTnVtYmVyLCBjb25maWcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnLmNoYXJhY3RlcldpZHRoO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFRleHQ6IGZ1bmN0aW9uKHNlc3Npb24sIHJvdywgY2VsbCkge1xuICAgICAgICAgICAgICAgIGlmIChjZWxsLmVsZW1lbnQgJiYgdGhpcy5lZGl0b3IuZ2V0Q3Vyc29yUG9zaXRpb24oKS5yb3cgPT0gcm93ICYmIHNlc3Npb24uZG9jLiRsaW5lc1tyb3ddID09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRHdXR0ZXJUb29sYmFyKGNlbGwuZWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY2VsbC5lbGVtZW50LmlubmVySFRNTCA9ICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZWRpdG9yLmNvbW1hbmRzLmFkZENvbW1hbmQoe1xuICAgICAgICAgICAgbmFtZTogXCJJbmRlbnQgbGlzdFwiLFxuICAgICAgICAgICAgYmluZEtleToge3dpbjogXCJUYWJcIiwgbWFjOiBcIlRhYlwifSxcbiAgICAgICAgICAgIGV4ZWM6IGZ1bmN0aW9uKGVkaXRvcikge1xuICAgICAgICAgICAgICAgIHZhciBsaW5lID0gZWRpdG9yLnNlc3Npb24uZ2V0TGluZShlZGl0b3IuZ2V0Q3Vyc29yUG9zaXRpb24oKS5yb3cpO1xuICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IC9eKFxccyopKD86KFstKypdKXwoXFxkKylcXC4pKFxccyspLy5leGVjKGxpbmUpO1xuICAgICAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3Iuc2Vzc2lvbi5pbmRlbnRSb3dzKGVkaXRvci5nZXRDdXJzb3JQb3NpdGlvbigpLnJvdywgZWRpdG9yLmdldEN1cnNvclBvc2l0aW9uKCkucm93LCAnXFx0Jyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmluZGVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBuYW1lOiBcIkV4aXQgZnVsbHNjcmVlblwiLFxuICAgICAgICAgICAgYmluZEtleToge3dpbjogXCJFc2NcIiwgbWFjOiBcIkVzY1wifSxcbiAgICAgICAgICAgIGV4ZWM6IGZ1bmN0aW9uKGVkaXRvcikge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZ1bGxTY3JlZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50b29sQm94LmNoaWxkKCcuZnVsbHNjcmVlbi1idXR0b24nKS50dXJuT2ZmKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHZhciBsYW5nVG9vbHMgPSBhY2UucmVxdWlyZShcImFjZS9leHQvbGFuZ3VhZ2VfdG9vbHNcIik7XG4gICAgICAgIHZhciByZXNvdXJjZXNDb21wbGV0ZXIgPSB7XG4gICAgICAgICAgICBnZXRDb21wbGV0aW9uczogZnVuY3Rpb24oZWRpdG9yLCBzZXNzaW9uLCBwb3MsIHByZWZpeCwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICBpZiAocHJlZml4Lmxlbmd0aCA9PT0gMCkgeyBjYWxsYmFjayhudWxsLCBbXSk7IHJldHVybiB9XG5cbiAgICAgICAgICAgICAgICBNT0R4LkFqYXgucmVxdWVzdCh7XG4gICAgICAgICAgICAgICAgICAgIHVybDogbWFya2Rvd25FZGl0b3IuY29uZmlnLmNvbm5lY3RvclVybFxuICAgICAgICAgICAgICAgICAgICAscGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdtZ3IvcmVzb3VyY2UvZ2V0bGlzdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICxwcmVmaXg6IHByZWZpeFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdzdWNjZXNzJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHIucmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgbGFuZ1Rvb2xzLmFkZENvbXBsZXRlcihyZXNvdXJjZXNDb21wbGV0ZXIpO1xuXG4gICAgICAgIHRoaXMuZWRpdG9yLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VudGVyXCIsIHRoaXMuY2F0Y2hBbmREb05vdGhpbmcsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lZGl0b3IuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCB0aGlzLmNhdGNoQW5kRG9Ob3RoaW5nLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuZWRpdG9yLmNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwiZHJvcFwiLCB0aGlzLmRyb3AuYmluZCh0aGlzKSwgZmFsc2UpO1xuICAgIH1cblxuICAgICxhZGRHdXR0ZXJUb29sYmFyOiBmdW5jdGlvbihjZWxsKXtcbiAgICAgICAgdGhpcy5ndXR0ZXJUb29sYmFyID0gRXh0LmdldChjZWxsKTtcblxuICAgICAgICBpZiAodGhpcy5pc01vYmlsZURldmljZSgpKSB7XG4gICAgICAgICAgICB0aGlzLmd1dHRlclRvb2xiYXIudXBkYXRlKCc8aSBjbGFzcz1cImljb24gaWNvbi1wbHVzIGljb24tZml4ZWQtd2lkdGhcIj48L2k+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImlubGluZS10b29sYmFyXCI+JyArXG4gICAgICAgICAgICAgICAgJzxsYWJlbCBmb3I9XCInK3RoaXMuc3RhdHVzQmFyLmlkKyctZmlsZVwiPjxpIGNsYXNzPVwiaWNvbiBpY29uLXVwbG9hZCBpY29uLWZpeGVkLXdpZHRoXCI+PC9pPjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgJzxsYWJlbCBmb3I9XCInK3RoaXMuc3RhdHVzQmFyLmlkKyctZmlsZS1tb2JpbGVcIj48aSBjbGFzcz1cImljb24gaWNvbi1jYW1lcmEgaWNvbi1maXhlZC13aWR0aFwiPjwvaT48L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICc8aSBjbGFzcz1cImljb24gaWNvbi1jb2RlIGljb24tZml4ZWQtd2lkdGhcIj48L2k+JyArXG4gICAgICAgICAgICAnPC9kaXY+Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmd1dHRlclRvb2xiYXIudXBkYXRlKCc8aSBjbGFzcz1cImljb24gaWNvbi1wbHVzIGljb24tZml4ZWQtd2lkdGhcIj48L2k+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImlubGluZS10b29sYmFyXCI+JyArXG4gICAgICAgICAgICAgICAgJzxsYWJlbCBmb3I9XCInK3RoaXMuc3RhdHVzQmFyLmlkKyctZmlsZVwiPjxpIGNsYXNzPVwiaWNvbiBpY29uLXVwbG9hZCBpY29uLWZpeGVkLXdpZHRoXCI+PC9pPjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbiBpY29uLWNvZGUgaWNvbi1maXhlZC13aWR0aFwiPjwvaT4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzd2l0Y2hlciA9IHRoaXMuZ3V0dGVyVG9vbGJhci5jaGlsZCgnaS5pY29uLXBsdXMnKTtcbiAgICAgICAgdmFyIGlubGluZVRvb2xiYXIgPSB0aGlzLmd1dHRlclRvb2xiYXIuY2hpbGQoJy5pbmxpbmUtdG9vbGJhcicpO1xuXG4gICAgICAgIHN3aXRjaGVyLnR1cm5PbiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzd2l0Y2hlci5hZGRDbGFzcygnbWQtaWNvbi1yb3RhdGUtNDUnKTtcbiAgICAgICAgICAgIGlubGluZVRvb2xiYXIuc2hvdygpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHN3aXRjaGVyLnR1cm5PZmYgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgc3dpdGNoZXIucmVtb3ZlQ2xhc3MoJ21kLWljb24tcm90YXRlLTQ1Jyk7XG4gICAgICAgICAgICBpbmxpbmVUb29sYmFyLmhpZGUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBzd2l0Y2hlci5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYoIXN3aXRjaGVyLmhhc0NsYXNzKCdtZC1pY29uLXJvdGF0ZS00NScpKSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoZXIudHVybk9uKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHN3aXRjaGVyLnR1cm5PZmYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcblxuICAgICAgICB0aGlzLmd1dHRlclRvb2xiYXIuY2hpbGQoJ2kuaWNvbi1jb2RlJykub24oJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgTU9EeC5sb2FkKHtcbiAgICAgICAgICAgICAgICB4dHlwZTogJ21hcmtkb3duZWRpdG9yLXdpbmRvdy1vZW1iZWQnXG4gICAgICAgICAgICAgICAgLHN1Y2Nlc3M6IGZ1bmN0aW9uKHZhbHVlcyl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yLmluc2VydCgnW2VtYmVkICcgKyB2YWx1ZXMudXJsICsgJ10nKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3IuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICB9KS5zaG93KCk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgLHJlZ2lzdGVyUmVtYXJrYWJsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVtYXJrYWJsZSA9IG5ldyBSZW1hcmthYmxlKHtcbiAgICAgICAgICAgIGh0bWw6IHRydWUsXG4gICAgICAgICAgICBoaWdobGlnaHQ6IGZ1bmN0aW9uIChzdHIsIGxhbmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAnJztcbiAgICAgICAgICAgICAgICBpZiAobGFuZyAmJiBobGpzLmdldExhbmd1YWdlKGxhbmcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGhsanMuaGlnaGxpZ2h0KGxhbmcsIHN0cikudmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXFxbXFxbL2csICcmIzkxOyYjOTE7Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL11dL2csICcmIzkzOyYjOTM7Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7fVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gaGxqcy5oaWdobGlnaHRBdXRvKHN0cikudmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9cXFtcXFsvZywgJyYjOTE7JiM5MTsnKTtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9dXS9nLCAnJiM5MzsmIzkzOycpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHt9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnJlbWFya2FibGUuaW5saW5lLnJ1bGVyLmRpc2FibGUoWyAnYmFja3RpY2tzJyBdKTtcblxuICAgICAgICB2YXIgb0VtYmVkUmVuZGVyZXIgPSBmdW5jdGlvbih0b2tlbnMsIGlkeCwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKHRoaXMubG9jYWxDYWNoZS5vRW1iZWRbdG9rZW5zW2lkeF0udXJsXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxvY2FsQ2FjaGUub0VtYmVkW3Rva2Vuc1tpZHhdLnVybF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBlbWJlZElEID0gRXh0LmlkKCk7XG5cbiAgICAgICAgICAgICAgICBNT0R4LkFqYXgucmVxdWVzdCh7XG4gICAgICAgICAgICAgICAgICAgIHVybDogbWFya2Rvd25FZGl0b3IuY29uZmlnLmNvbm5lY3RvclVybFxuICAgICAgICAgICAgICAgICAgICAscGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICdtZ3IvZWRpdG9yL29lbWJlZCdcbiAgICAgICAgICAgICAgICAgICAgICAgICx1cmw6IHRva2Vuc1tpZHhdLnVybFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdzdWNjZXNzJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuOiBmdW5jdGlvbihyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlbWJlZERpdiA9IEV4dC5nZXQoZW1iZWRJRCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbWJlZERpdikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW1iZWREaXYudXBkYXRlKHIuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWJlZERpdi5kb20ucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxvY2FsQ2FjaGUub0VtYmVkW3Rva2Vuc1tpZHhdLnVybF0gPSBlbWJlZERpdi5kb20ub3V0ZXJIVE1MO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGV4dGFyZWFDb250ZW50ID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmNyZWF0ZURvbSh7dGFnOiAnZGl2JywgaHRtbDogdGhpcy50ZXh0YXJlYS5kb20udmFsdWV9KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0YXJlYUNvbnRlbnQuY2hpbGQoJyMnICsgZW1iZWRJRCkudXBkYXRlKHIuZGF0YSkuZG9tLnJlbW92ZUF0dHJpYnV0ZSgnaWQnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXh0YXJlYS5kb20udmFsdWUgPSB0ZXh0YXJlYUNvbnRlbnQuZG9tLmlubmVySFRNTDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGU6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGlkPVwiJyArIGVtYmVkSUQgKyAnXCIgY2xhc3M9XCJtYXJrZG93bmVkaXRvci1vZW1iZWQtY29udGVudFwiPltlbWJlZCAnICsgdG9rZW5zW2lkeF0udXJsICsgJ108L2Rpdj4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgdmFyIG9FbWJlZCA9IGZ1bmN0aW9uKG1kKSB7XG4gICAgICAgICAgICBtZC5pbmxpbmUucnVsZXIucHVzaCgnb0VtYmVkJywgdGhpcy5vRW1iZWRQYXJzZXIpO1xuICAgICAgICAgICAgbWQucmVuZGVyZXIucnVsZXMub0VtYmVkID0gb0VtYmVkUmVuZGVyZXI7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB0aGlzLnJlbWFya2FibGUudXNlKG9FbWJlZCk7XG4gICAgfVxuXG4gICAgLHBhcnNlOiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICB2YXIgb3V0cHV0ID0gdGhpcy5yZW1hcmthYmxlLnJlbmRlcihpbnB1dCk7XG5cbiAgICAgICAgb3V0cHV0ID0gb3V0cHV0LnJlcGxhY2UoLyU1Qi9nLCAnWycpO1xuICAgICAgICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvJTVEL2csICddJyk7XG5cbiAgICAgICAgaWYgKE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci5scC5wYXJzZV9tb2R4X3RhZ3MnXSA9PSAxKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wYXJzZVJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5wYXJzZVJlcXVlc3QpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgdGltZW91dCA9IHBhcnNlSW50KE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci5scC5wYXJzZV9tb2R4X3RhZ3NfdGltZW91dCddIHx8IDMwMCk7XG5cbiAgICAgICAgICAgIHRoaXMucGFyc2VSZXF1ZXN0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIE1PRHguQWpheC5yZXF1ZXN0KHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBtYXJrZG93bkVkaXRvci5jb25maWcuY29ubmVjdG9yVXJsXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ21nci9lZGl0b3IvcHJvY2Vzc2NvbnRlbnQnXG4gICAgICAgICAgICAgICAgICAgICAgICAsY29udGVudDogb3V0cHV0XG4gICAgICAgICAgICAgICAgICAgICAgICAscmVzb3VyY2U6IE1PRHgucmVxdWVzdC5pZFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBpc1VwbG9hZCA6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3N1Y2Nlc3MnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm46IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3LnVwZGF0ZShyLmRhdGEpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgodGhpcy5lZGl0b3IuZ2V0Q3Vyc29yUG9zaXRpb24oKS5yb3cgKyAyKSA+PSB0aGlzLmVkaXRvci5nZXRTZXNzaW9uKCkuZ2V0RG9jdW1lbnQoKS5nZXRMZW5ndGgoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3LmRvbS5zY3JvbGxUb3AgPSB0aGlzLnByZXZpZXcuZG9tLnNjcm9sbEhlaWdodFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3LmZpeEhlaWdodCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2NvcGU6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCB0aW1lb3V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHJldmlldy51cGRhdGUob3V0cHV0KTtcblxuICAgICAgICAgICAgaWYgKCh0aGlzLmVkaXRvci5nZXRDdXJzb3JQb3NpdGlvbigpLnJvdyArIDIpID49IHRoaXMuZWRpdG9yLmdldFNlc3Npb24oKS5nZXREb2N1bWVudCgpLmdldExlbmd0aCgpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmV2aWV3LmRvbS5zY3JvbGxUb3AgPSB0aGlzLnByZXZpZXcuZG9tLnNjcm9sbEhlaWdodFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnByZXZpZXcuZml4SGVpZ2h0KCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnRhTWFya2Rvd24uZG9tLnZhbHVlID0gdGhpcy5lZGl0b3IuZ2V0VmFsdWUoKTtcbiAgICAgICAgdGhpcy50ZXh0YXJlYS5kb20udmFsdWUgPSBvdXRwdXQ7XG5cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9XG5cbiAgICAsb0VtYmVkUGFyc2VyOiBmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgICAvLyBHaXZlbiBzdGF0ZS5zcmMgW2VtYmVkIHVybF1cbiAgICAgICAgLy8gV2UgYXJlIGhlcmU6ICAgIF5cbiAgICAgICAgdmFyIHBvcyA9IHN0YXRlLnBvcztcbiAgICAgICAgdmFyIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHN0YXRlLnBvcyk7XG4gICAgICAgIGlmIChtYXJrZXIgIT09IDB4NUIvKiBbICovKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHaXZlbiBzdGF0ZS5zcmMgW2VtYmVkIHVybF1cbiAgICAgICAgLy8gV2UgYXJlIGhlcmU6ICAgICBeXG4gICAgICAgIHBvcysrO1xuICAgICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgICBpZiAobWFya2VyICE9PSAweDY1LyogZSAqLykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2l2ZW4gc3RhdGUuc3JjIFtlbWJlZCB1cmxdXG4gICAgICAgIC8vIFdlIGFyZSBoZXJlOiAgICAgIF5cbiAgICAgICAgcG9zKys7XG4gICAgICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmIChtYXJrZXIgIT09IDB4NkQvKiBtICovKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHaXZlbiBzdGF0ZS5zcmMgW2VtYmVkIHVybF1cbiAgICAgICAgLy8gV2UgYXJlIGhlcmU6ICAgICAgIF5cbiAgICAgICAgcG9zKys7XG4gICAgICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmIChtYXJrZXIgIT09IDB4NjIvKiBiICovKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHaXZlbiBzdGF0ZS5zcmMgW2VtYmVkIHVybF1cbiAgICAgICAgLy8gV2UgYXJlIGhlcmU6ICAgICAgICBeXG4gICAgICAgIHBvcysrO1xuICAgICAgICBtYXJrZXIgPSBzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpO1xuICAgICAgICBpZiAobWFya2VyICE9PSAweDY1LyogZSAqLykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2l2ZW4gc3RhdGUuc3JjIFtlbWJlZCB1cmxdXG4gICAgICAgIC8vIFdlIGFyZSBoZXJlOiAgICAgICAgIF5cbiAgICAgICAgcG9zKys7XG4gICAgICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmIChtYXJrZXIgIT09IDB4NjQvKiBkICovKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHaXZlbiBzdGF0ZS5zcmMgW2VtYmVkIHVybF1cbiAgICAgICAgLy8gV2UgYXJlIGhlcmU6ICAgICAgICAgIF5cbiAgICAgICAgcG9zKys7XG4gICAgICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmIChtYXJrZXIgIT09IDB4MjAvKiAgICovKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBwb3MrKztcblxuICAgICAgICB2YXIgc3RhcnQgPSBwb3M7XG4gICAgICAgIHZhciBtYXggPSBzdGF0ZS5wb3NNYXg7XG4gICAgICAgIHZhciBlbmRGb3VuZCA9IGZhbHNlO1xuICAgICAgICB3aGlsZSAocG9zIDwgbWF4KSB7XG4gICAgICAgICAgICBpZiAoc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKSA9PT0gMHg1RC8qIF0gKi8pIHtcbiAgICAgICAgICAgICAgICBlbmRGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDIwLyogICovKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwb3MrKztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZW5kRm91bmQpIHJldHVybiBmYWxzZTtcblxuICAgICAgICBzdGF0ZS5wb3MgPSBwb3MrMTtcblxuICAgICAgICBpZiAoc3RhdGUucG9zID4gc3RhdGUucG9zTWF4KSB7XG4gICAgICAgICAgICBzdGF0ZS5wb3MgPSBzdGF0ZS5wb3NNYXg7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdXJsID0gc3RhdGUuc3JjLnNsaWNlKHN0YXJ0LCBwb3MpO1xuXG4gICAgICAgIC8vIEhhdmluZyBtYXRjaGVkIGFsbCB0aHJlZSBjaGFyYWN0ZXJzIHdlIGFkZCBhIHRva2VuIHRvIHRoZSBzdGF0ZSBsaXN0XG4gICAgICAgIHZhciB0b2tlbiA9IHtcbiAgICAgICAgICAgIHR5cGU6IFwib0VtYmVkXCIsXG4gICAgICAgICAgICBsZXZlbDogc3RhdGUubGV2ZWwsXG4gICAgICAgICAgICBjb250ZW50OiBtYXJrZXIsXG4gICAgICAgICAgICB1cmw6IHVybFxuICAgICAgICB9O1xuXG4gICAgICAgIHN0YXRlLnB1c2godG9rZW4pO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgICxjYXRjaEFuZERvTm90aGluZzogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfVxuXG4gICAgLGRyb3A6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmIChNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IudXBsb2FkLmVuYWJsZV9pbWFnZV91cGxvYWQnXSA9PSAxIHx8IE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci51cGxvYWQuZW5hYmxlX2ZpbGVfdXBsb2FkJ10gPT0gMSkge1xuICAgICAgICAgICAgdGhpcy5oYW5kbGVGaWxlcyhlLmRhdGFUcmFuc2Zlci5maWxlcyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAsaGFuZGxlRmlsZXM6IGZ1bmN0aW9uKGZpbGVzLCBtb2JpbGUpIHtcbiAgICAgICAgbW9iaWxlID0gbW9iaWxlIHx8IDA7XG5cbiAgICAgICAgRXh0LmVhY2goZmlsZXMsIGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgICAgIHZhciBpc0ltYWdlID0gL15pbWFnZVxcLy8udGVzdChmaWxlLnR5cGUpO1xuXG4gICAgICAgICAgICBpZiAoaXNJbWFnZSkge1xuICAgICAgICAgICAgICAgIGlmIChNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IudXBsb2FkLmVuYWJsZV9pbWFnZV91cGxvYWQnXSA9PSAwKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jaGVja1R5cGUoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLnVwbG9hZC5pbWFnZV90eXBlcyddLCBmaWxlKSl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmFpbE1lc3NhZ2UoZmlsZSwgJ2ltYWdlJywgXygnbWFya2Rvd25lZGl0b3IuZXJyLnVwbG9hZC51bnN1cHBvcnRlZF9pbWFnZScpKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jaGVja1NpemUoZmlsZS5zaXplKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWxNZXNzYWdlKGZpbGUsICdpbWFnZScsIF8oJ21hcmtkb3duZWRpdG9yLmVyci51cGxvYWQudG9vX2JpZycpKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIuZW5hYmxlX2Nyb3BwZXInXSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIE1PRHgubG9hZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB4dHlwZTogJ21hcmtkb3duZWRpdG9yLXdpbmRvdy1jcm9wcGVyJ1xuICAgICAgICAgICAgICAgICAgICAgICAgLGZpbGU6IGZpbGVcbiAgICAgICAgICAgICAgICAgICAgICAgICxtZDogdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgLG1vYmlsZTogbW9iaWxlXG4gICAgICAgICAgICAgICAgICAgIH0pLnNob3coKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwbG9hZEZpbGUoZmlsZSwgJ2ltYWdlJywgbW9iaWxlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3IuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IudXBsb2FkLmVuYWJsZV9maWxlX3VwbG9hZCddID09IDApIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNoZWNrVHlwZShNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IudXBsb2FkLmZpbGVfdHlwZXMnXSwgZmlsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsTWVzc2FnZShmaWxlLCAnZmlsZScsIF8oJ21hcmtkb3duZWRpdG9yLmVyci51cGxvYWQudW5zdXBwb3J0ZWRfZmlsZScpKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2hlY2tTaXplKGZpbGUuc2l6ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsTWVzc2FnZShmaWxlLCAnZmlsZScsIF8oJ21hcmtkb3duZWRpdG9yLmVyci51cGxvYWQudG9vX2JpZycpKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnVwbG9hZEZpbGUoZmlsZSwgJ2ZpbGUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvci5mb2N1cygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgICxjaGVja1NpemU6IGZ1bmN0aW9uKHNpemUpe1xuICAgICAgICB2YXIgbWF4U2l6ZSA9IE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci51cGxvYWQubWF4X3NpemUnXTtcbiAgICAgICAgaWYgKCFtYXhTaXplIHx8IG1heFNpemUgPT0gJycpIG1heFNpemUgPSAoTU9EeC5jb25maWdbJ3VwbG9hZF9tYXhzaXplJ10gfHwgJzIwOTcxNTInKTtcblxuICAgICAgICBtYXhTaXplID0gcGFyc2VJbnQobWF4U2l6ZSk7XG5cbiAgICAgICAgaWYgKG1heFNpemUgPT0gMCkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgcmV0dXJuIHNpemUgPD0gbWF4U2l6ZTtcbiAgICB9XG5cbiAgICAsY2hlY2tUeXBlOiBmdW5jdGlvbihhbGxvd2VkVHlwZXMsIGZpbGUpIHtcbiAgICAgICAgYWxsb3dlZFR5cGVzID0gYWxsb3dlZFR5cGVzLnNwbGl0KCcsJyk7XG5cbiAgICAgICAgcmV0dXJuIGFsbG93ZWRUeXBlcy5pbmRleE9mKGZpbGUubmFtZS5zcGxpdCgnLicpLnBvcCgpKSAhPSAtMTtcbiAgICB9XG5cbiAgICAsdXBsb2FkRmlsZTogZnVuY3Rpb24oZmlsZSwgdHlwZSwgbW9iaWxlKSB7XG4gICAgICAgIHR5cGUgPSB0eXBlIHx8ICdmaWxlJztcbiAgICAgICAgbW9iaWxlID0gbW9iaWxlIHx8IDA7XG5cbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5jcmVhdGVVcGxvYWRlcigpO1xuXG4gICAgICAgIHZhciBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ2ZpbGUnLCBmaWxlKTtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdhY3Rpb24nLCAnbWdyL2VkaXRvci8nICsgdHlwZSArICd1cGxvYWQnKTtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCduYW1lJywgZmlsZS5uYW1lKTtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdyZXNvdXJjZScsIHRoaXMuY29uZmlnLnJlc291cmNlKTtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdtb2JpbGUnLCBtb2JpbGUpO1xuXG4gICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgeGhyLm9wZW4oJ1BPU1QnLCBtYXJrZG93bkVkaXRvci5jb25maWcuY29ubmVjdG9yVXJsKTtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ1Bvd2VyZWQtQnknLCAnTU9EeCcpO1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignbW9kQXV0aCcsIEV4dC5BamF4LmRlZmF1bHRIZWFkZXJzLm1vZEF1dGgpO1xuXG4gICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgaWYgKGV2ZW50Lmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29tcGxldGUgPSAoZXZlbnQubG9hZGVkIC8gZXZlbnQudG90YWwgKiAxMDAgfCAwKTtcbiAgICAgICAgICAgICAgICB1cGxvYWRlci5jaGlsZCgnLnByb2dyZXNzJykuc2V0V2lkdGgoY29tcGxldGUgKyAnJScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzLnN1Y2Nlc3MgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGltYWdlUHJlZml4ID0gKHR5cGUgPT0gJ2ltYWdlJykgPyAnIScgOiAnJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVuZExpbmUgPSAodHlwZSA9PSAnaW1hZ2UnKSA/ICdcXG5cXG4nIDogJ1xcbic7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yLmluc2VydChpbWFnZVByZWZpeCArICdbJyArIHJlcy5vYmplY3QubmFtZSArICddKCcgKyByZXMub2JqZWN0LnBhdGggKyAnIFwiJyArIHJlcy5vYmplY3QubmFtZSArICdcIiknICsgZW5kTGluZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsVXBsb2FkZXIodXBsb2FkZXIsIHJlcy5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB4aHIuc2VuZChmb3JtRGF0YSk7XG4gICAgfVxuXG4gICAgLGNyZWF0ZVVwbG9hZGVyOiBmdW5jdGlvbih0eXBlLCBmaWxlTmFtZSkge1xuICAgICAgICB2YXIgdXBsb2FkZXIgPSBFeHQuRG9tSGVscGVyLmluc2VydEZpcnN0KHRoaXMuc3RhdHVzQmFyLHtcbiAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICBodG1sOiAnPGRpdiBjbGFzcz1cInByb2dyZXNzXCI+PGkgY2xhc3M9XCJpY29uIGljb24tc3Bpbm5lciBpY29uLXNwaW5cIj48L2k+IDxzcGFuPicgKyBfKCdtYXJrZG93bmVkaXRvci51cGxvYWRpbmdfJyArIHR5cGUpICsgZmlsZU5hbWUgKyAnPC9zcGFuPjwvZGl2PidcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIEV4dC5nZXQodXBsb2FkZXIpO1xuICAgIH1cblxuICAgICxmYWlsVXBsb2FkZXI6IGZ1bmN0aW9uKHVwbG9hZGVyLCBtZXNzYWdlKSB7XG4gICAgICAgIHVwbG9hZGVyLmNoaWxkKCcucHJvZ3Jlc3MnKS5hZGRDbGFzcygnZXJyb3InKTtcbiAgICAgICAgdXBsb2FkZXIuY2hpbGQoJy5wcm9ncmVzcycpLnNldFdpZHRoKCcxMDAlJyk7XG5cbiAgICAgICAgdXBsb2FkZXIuY2hpbGQoJ2knKS5hZGRDbGFzcygncmVtb3ZlLW1lc3NhZ2UnKTtcbiAgICAgICAgdXBsb2FkZXIuY2hpbGQoJ2knKS5yZXBsYWNlQ2xhc3MoJ2ljb24tc3Bpbm5lcicsICdpY29uLXJlbW92ZScpO1xuICAgICAgICB1cGxvYWRlci5jaGlsZCgnaScpLnJlbW92ZUNsYXNzKCdpY29uLXNwaW4nKTtcblxuICAgICAgICB1cGxvYWRlci5jaGlsZCgnc3BhbicpLmRvbS5pbm5lckhUTUwgKz0gJyBmYWlsZWQuICcgKyBtZXNzYWdlO1xuICAgICAgICB1cGxvYWRlci5jaGlsZCgnLnJlbW92ZS1tZXNzYWdlJykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB1cGxvYWRlci5yZW1vdmUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLGZhaWxNZXNzYWdlOiBmdW5jdGlvbihmaWxlLCB0eXBlLCBtZXNzYWdlKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuY3JlYXRlVXBsb2FkZXIodHlwZSwgZmlsZS5uYW1lKTtcbiAgICAgICAgdGhpcy5mYWlsVXBsb2FkZXIodXBsb2FkZXIsIG1lc3NhZ2UpO1xuICAgIH1cblxuICAgICxpc01vYmlsZURldmljZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiAodHlwZW9mIHdpbmRvdy5vcmllbnRhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIikgfHwgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignSUVNb2JpbGUnKSAhPT0gLTEpO1xuICAgIH1cbn0pO1xuXG5NT0R4LmxvYWRSVEUgPSBmdW5jdGlvbihpZCkge1xuICAgIG5ldyBtYXJrZG93bkVkaXRvci5FZGl0b3Ioe1xuICAgICAgICBtZEVsZW1lbnRJZDogaWRcbiAgICB9KTtcbn07XG5cbk1PRHguYWZ0ZXJUVkxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxzID0gRXh0LnF1ZXJ5KCd0ZXh0YXJlYS5tb2R4LXJpY2h0ZXh0Jyk7XG5cbiAgICBFeHQuZWFjaChlbHMsIGZ1bmN0aW9uKGVsZW1lbnQpe1xuICAgICAgICBlbGVtZW50ID0gRXh0LmdldChlbGVtZW50KTtcbiAgICAgICAgaWYgKCFlbGVtZW50KSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICBpZiAobWFya2Rvd25FZGl0b3IubG9hZGVkRWxlbWVudHNbZWxlbWVudC5pZF0pIHJldHVybiB0cnVlO1xuXG4gICAgICAgIG1hcmtkb3duRWRpdG9yLmxvYWRlZEVsZW1lbnRzW2VsZW1lbnQuaWRdID0gbmV3IG1hcmtkb3duRWRpdG9yLkVkaXRvcih7XG4gICAgICAgICAgICBtZEVsZW1lbnRJZDogZWxlbWVudC5pZFxuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG59O1xuXG5NT0R4LnVubG9hZFRWUlRFID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVscyA9IEV4dC5xdWVyeSgnLm1vZHgtcmljaHRleHQnKTtcblxuICAgIEV4dC5lYWNoKGVscywgZnVuY3Rpb24oZWxlbWVudCl7XG4gICAgICAgIGVsZW1lbnQgPSBFeHQuZ2V0KGVsZW1lbnQpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGlmICghbWFya2Rvd25FZGl0b3IubG9hZGVkRWxlbWVudHNbZWxlbWVudC5pZF0pIHJldHVybiB0cnVlO1xuXG4gICAgICAgIG1hcmtkb3duRWRpdG9yLmxvYWRlZEVsZW1lbnRzW2VsZW1lbnQuaWRdLmRlc3Ryb3koKTtcblxuICAgIH0pO1xufTsiLCJtYXJrZG93bkVkaXRvci5jb21iby5Dcm9wcGVyUHJvZmlsZSA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IuY3JvcHBlci5wcm9maWxlcyddIHx8ICdbXScpO1xuXG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIEV4dC5hcHBseUlmKGNvbmZpZyx7XG4gICAgICAgIHN0b3JlOiBuZXcgRXh0LmRhdGEuSnNvblN0b3JlKHtcbiAgICAgICAgICAgIGRhdGE6IGRhdGFcbiAgICAgICAgICAgICxmaWVsZHM6IFsnbmFtZScsICd3aWR0aCcsICdoZWlnaHQnLCAncmF0aW8nXVxuICAgICAgICB9KVxuICAgICAgICAsZGlzcGxheUZpZWxkOiAnbmFtZSdcbiAgICAgICAgLG1vZGU6ICdsb2NhbCdcbiAgICAgICAgLHZhbHVlRmllbGQ6ICduYW1lJ1xuICAgICAgICAsZWRpdGFibGU6IGZhbHNlXG4gICAgICAgICx2YWx1ZTogZGF0YVswXSA/IGRhdGFbMF0ubmFtZSA6ICcnXG4gICAgfSk7XG5cbiAgICB2YXIgc2hvd0Rlc2NyaXB0aW9uID0gcGFyc2VJbnQoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIuc2hvd19kZXNjcmlwdGlvbiddIHx8IDApO1xuICAgIGlmIChzaG93RGVzY3JpcHRpb24pIHtcbiAgICAgICAgY29uZmlnLnRwbCA9IG5ldyBFeHQuWFRlbXBsYXRlKCc8dHBsIGZvcj1cIi5cIj48ZGl2IGNsYXNzPVwieC1jb21iby1saXN0LWl0ZW1cIj48c3BhbiBzdHlsZT1cImZvbnQtd2VpZ2h0OiBib2xkXCI+e25hbWV9PC9zcGFuPidcbiAgICAgICAgICAgICwnPGJyIC8+PHRwbCBpZj1cIndpZHRoXCI+Vzp7d2lkdGh9IDwvdHBsPjx0cGwgaWY9XCJoZWlnaHRcIj5IOntoZWlnaHR9IDwvdHBsPjx0cGwgaWY9XCJyYXRpb1wiPlI6e3JhdGlvfTwvdHBsPjwvZGl2PjwvdHBsPicpO1xuICAgIH1cblxuICAgIG1hcmtkb3duRWRpdG9yLmNvbWJvLkNyb3BwZXJQcm9maWxlLnN1cGVyY2xhc3MuY29uc3RydWN0b3IuY2FsbCh0aGlzLGNvbmZpZyk7XG59O1xuRXh0LmV4dGVuZChtYXJrZG93bkVkaXRvci5jb21iby5Dcm9wcGVyUHJvZmlsZSxNT0R4LmNvbWJvLkNvbWJvQm94KTtcbkV4dC5yZWcoJ21hcmtkb3duZWRpdG9yLWNvbWJvLWNyb3BwZXItcHJvZmlsZScsbWFya2Rvd25FZGl0b3IuY29tYm8uQ3JvcHBlclByb2ZpbGUpOyIsIm1hcmtkb3duRWRpdG9yLndpbmRvdy5Dcm9wcGVyID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIGNvbmZpZy5jcm9wcGVyU2VsZWN0b3IgPSBjb25maWcuY3JvcHBlclNlbGVjdG9yIHx8ICcuaW1hZ2UtdXBsb2FkLXdyYXBwZXIgPiBpbWcnO1xuXG4gICAgdmFyIGlkID0gRXh0LmlkKCk7XG5cbiAgICBFeHQuYXBwbHlJZihjb25maWcse1xuICAgICAgICBtb2RhbDogZmFsc2VcbiAgICAgICAgLGxheW91dDogJ2F1dG8nXG4gICAgICAgICxjbG9zZUFjdGlvbjogJ2hpZGUnXG4gICAgICAgICxzaGFkb3c6IHRydWVcbiAgICAgICAgLHJlc2l6YWJsZTogdHJ1ZVxuICAgICAgICAsY29sbGFwc2libGU6IHRydWVcbiAgICAgICAgLG1heGltaXphYmxlOiBmYWxzZVxuICAgICAgICAsYXV0b0hlaWdodDogZmFsc2VcbiAgICAgICAgLGF1dG9TY3JvbGw6IHRydWVcbiAgICAgICAgLGFsbG93RHJvcDogdHJ1ZVxuICAgICAgICAsd2lkdGg6IDgwMFxuICAgICAgICAsbW9iaWxlOiAwXG4gICAgICAgICx0aXRsZTogXygnbWFya2Rvd25lZGl0b3IuY3JvcHBlci5jcm9wX2ltYWdlJylcbiAgICAgICAgLGNsczogJ21vZHgtd2luZG93IG1hcmtkb3duZWRpdG9yLWNyb3BwZXItd2luZG93J1xuICAgICAgICAsaXRlbXM6W3tcbiAgICAgICAgICAgIGxheW91dDogJ2NvbHVtbidcbiAgICAgICAgICAgICxib3JkZXI6IGZhbHNlXG4gICAgICAgICAgICAsZGVmYXVsdHM6IHtcbiAgICAgICAgICAgICAgICBsYXlvdXQ6ICdmb3JtJ1xuICAgICAgICAgICAgICAgICxsYWJlbEFsaWduOiAndG9wJ1xuICAgICAgICAgICAgICAgICxsYWJlbFNlcGFyYXRvcjogJydcbiAgICAgICAgICAgICAgICAsYW5jaG9yOiAnMTAwJSdcbiAgICAgICAgICAgICAgICAsYm9yZGVyOiBmYWxzZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLGl0ZW1zOiBbe1xuICAgICAgICAgICAgICAgIGNvbHVtbldpZHRoOiAwLjFcbiAgICAgICAgICAgICAgICAsZGVmYXVsdHM6IHtcbiAgICAgICAgICAgICAgICAgICAgbXNnVGFyZ2V0OiAndW5kZXInXG4gICAgICAgICAgICAgICAgICAgICxhbmNob3I6ICcxMDAlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAsY2xzOiAnbWFya2Rvd25lZGl0b3ItdG9vbGJhcidcbiAgICAgICAgICAgICAgICAsaXRlbXM6IFt7XG4gICAgICAgICAgICAgICAgICAgIHh0eXBlOiAnYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICAsdGV4dDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLWFycm93cyBpY29uLWxhcmdlXCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgLHRvb2x0aXA6IF8oJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIubW92ZScpXG4gICAgICAgICAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAscGFyYW06ICdtb3ZlJ1xuICAgICAgICAgICAgICAgICAgICAsYWN0aW9uOiAnc2V0RHJhZ01vZGUnXG4gICAgICAgICAgICAgICAgICAgICxoYW5kbGVyOiB0aGlzLmNhbGxDcm9wcGVyQWN0aW9uXG4gICAgICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgICAgIHh0eXBlOiAnYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICAsdGV4dDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLWNyb3AgaWNvbi1sYXJnZVwiPjwvaT4nXG4gICAgICAgICAgICAgICAgICAgICx0b29sdGlwOiBfKCdtYXJrZG93bmVkaXRvci5jcm9wcGVyLmNyb3AnKVxuICAgICAgICAgICAgICAgICAgICAsc2NvcGU6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgLHBhcmFtOiAnY3JvcCdcbiAgICAgICAgICAgICAgICAgICAgLGFjdGlvbjogJ3NldERyYWdNb2RlJ1xuICAgICAgICAgICAgICAgICAgICAsaGFuZGxlcjogdGhpcy5jYWxsQ3JvcHBlckFjdGlvblxuICAgICAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgICAgICB4dHlwZTogJ2J1dHRvbidcbiAgICAgICAgICAgICAgICAgICAgLHRleHQ6ICc8aSBjbGFzcz1cImljb24gaWNvbi1zZWFyY2gtcGx1cyBpY29uLWxhcmdlXCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgLHRvb2x0aXA6IF8oJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIuem9vbV9pbicpXG4gICAgICAgICAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAscGFyYW06IDAuMVxuICAgICAgICAgICAgICAgICAgICAsYWN0aW9uOiAnem9vbSdcbiAgICAgICAgICAgICAgICAgICAgLGhhbmRsZXI6IHRoaXMuY2FsbENyb3BwZXJBY3Rpb25cbiAgICAgICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICAgICAgeHR5cGU6ICdidXR0b24nXG4gICAgICAgICAgICAgICAgICAgICx0ZXh0OiAnPGkgY2xhc3M9XCJpY29uIGljb24tc2VhcmNoLW1pbnVzIGljb24tbGFyZ2VcIj48L2k+J1xuICAgICAgICAgICAgICAgICAgICAsdG9vbHRpcDogXygnbWFya2Rvd25lZGl0b3IuY3JvcHBlci56b29tX291dCcpXG4gICAgICAgICAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAscGFyYW06IC0wLjFcbiAgICAgICAgICAgICAgICAgICAgLGFjdGlvbjogJ3pvb20nXG4gICAgICAgICAgICAgICAgICAgICxoYW5kbGVyOiB0aGlzLmNhbGxDcm9wcGVyQWN0aW9uXG4gICAgICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgICAgIHh0eXBlOiAnYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICAsdGV4dDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLXJvdGF0ZS1sZWZ0IGljb24tbGFyZ2VcIj48L2k+J1xuICAgICAgICAgICAgICAgICAgICAsdG9vbHRpcDogXygnbWFya2Rvd25lZGl0b3IuY3JvcHBlci5yb3RhdGVfbGVmdCcpXG4gICAgICAgICAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAscGFyYW06IC05MFxuICAgICAgICAgICAgICAgICAgICAsYWN0aW9uOiAncm90YXRlJ1xuICAgICAgICAgICAgICAgICAgICAsaGFuZGxlcjogdGhpcy5jYWxsQ3JvcHBlckFjdGlvblxuICAgICAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgICAgICB4dHlwZTogJ2J1dHRvbidcbiAgICAgICAgICAgICAgICAgICAgLHRleHQ6ICc8aSBjbGFzcz1cImljb24gaWNvbi1yb3RhdGUtcmlnaHQgaWNvbi1sYXJnZVwiPjwvaT4nXG4gICAgICAgICAgICAgICAgICAgICx0b29sdGlwOiBfKCdtYXJrZG93bmVkaXRvci5jcm9wcGVyLnJvdGF0ZV9yaWdodCcpXG4gICAgICAgICAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAscGFyYW06IDkwXG4gICAgICAgICAgICAgICAgICAgICxhY3Rpb246ICdyb3RhdGUnXG4gICAgICAgICAgICAgICAgICAgICxoYW5kbGVyOiB0aGlzLmNhbGxDcm9wcGVyQWN0aW9uXG4gICAgICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgICAgIHh0eXBlOiAnYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICAsdGV4dDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLXJlbW92ZSBpY29uLWxhcmdlXCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgLHRvb2x0aXA6IF8oJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIuY2xlYXJfY3JvcHBlcicpXG4gICAgICAgICAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAscGFyYW06IG51bGxcbiAgICAgICAgICAgICAgICAgICAgLGFjdGlvbjogJ2NsZWFyJ1xuICAgICAgICAgICAgICAgICAgICAsaGFuZGxlcjogdGhpcy5jYWxsQ3JvcHBlckFjdGlvblxuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICBjb2x1bW5XaWR0aDogMC45XG4gICAgICAgICAgICAgICAgLGRlZmF1bHRzOiB7XG4gICAgICAgICAgICAgICAgICAgIG1zZ1RhcmdldDogJ3VuZGVyJ1xuICAgICAgICAgICAgICAgICAgICAsYW5jaG9yOiAnMTAwJSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLGNsczogJ21hcmtkb3duZWRpdG9yLWNyb3BwZXInXG4gICAgICAgICAgICAgICAgLGl0ZW1zOiBbe1xuICAgICAgICAgICAgICAgICAgICBodG1sOiAnPGRpdiBjbGFzcz1cImltYWdlLXVwbG9hZC13cmFwcGVyXCI+PGltZyBzcmM9XCInICsgVVJMLmNyZWF0ZU9iamVjdFVSTChjb25maWcuZmlsZSkgKyAnXCI+PC9kaXY+J1xuICAgICAgICAgICAgICAgIH1dXG4gICAgICAgICAgICB9XVxuICAgICAgICB9XVxuICAgICAgICAsYmJhcjogW3tcbiAgICAgICAgICAgIHh0eXBlOiAnbWFya2Rvd25lZGl0b3ItY29tYm8tY3JvcHBlci1wcm9maWxlJ1xuICAgICAgICAgICAgLGlkOiBpZCArICctY3JvcHBlci1wcm9maWxlJ1xuICAgICAgICAgICAgLGxpc3RlbmVyczoge1xuICAgICAgICAgICAgICAgIHNlbGVjdDoge1xuICAgICAgICAgICAgICAgICAgICBmbjogZnVuY3Rpb24oY29tYm8sIHZhbHVlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlQ3JvcHBlclByb2ZpbGUodmFsdWUuZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LCctPicse1xuICAgICAgICAgICAgdGV4dDogXygnY2FuY2VsJylcbiAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgLGhhbmRsZXI6IHRoaXMuY2xvc2VcbiAgICAgICAgfSx7XG4gICAgICAgICAgICB0ZXh0OiBfKCdtYXJrZG93bmVkaXRvci5jcm9wcGVyLnVwbG9hZCcpXG4gICAgICAgICAgICAsY2xzOiAncHJpbWFyeS1idXR0b24nXG4gICAgICAgICAgICAsc2NvcGU6IHRoaXNcbiAgICAgICAgICAgICxjcm9wOiAwXG4gICAgICAgICAgICAsaGFuZGxlcjogdGhpcy51cGxvYWRcbiAgICAgICAgfSx7XG4gICAgICAgICAgICB0ZXh0OiBfKCdtYXJrZG93bmVkaXRvci5jcm9wcGVyLmNyb3BfdXBsb2FkJylcbiAgICAgICAgICAgICxjbHM6ICdwcmltYXJ5LWJ1dHRvbidcbiAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgLGNyb3A6IDFcbiAgICAgICAgICAgICxoYW5kbGVyOiB0aGlzLnVwbG9hZFxuICAgICAgICB9XVxuICAgICAgICAsbGlzdGVuZXJzOiB7XG4gICAgICAgICAgICAnc2hvdyc6IHtcbiAgICAgICAgICAgICAgICBmbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjcm9wcGVyT3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRjcm9wcGVyRWwgPSAkKCcjJyArIHRoaXMuaWQgKyAnICcgKyBjb25maWcuY3JvcHBlclNlbGVjdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgY3JvcHBlck9wdGlvbnMuc3RyaWN0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgY3JvcHBlck9wdGlvbnMuY3JvcCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmltYWdlRGF0YSA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAne1wieFwiOicgKyBkYXRhLngsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1wieVwiOicgKyBkYXRhLnksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1wiaGVpZ2h0XCI6JyArIGRhdGEuaGVpZ2h0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdcIndpZHRoXCI6JyArIGRhdGEud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1wicm90YXRlXCI6JyArIGRhdGEucm90YXRlICsgJ30nXG4gICAgICAgICAgICAgICAgICAgICAgICBdLmpvaW4oKTtcbiAgICAgICAgICAgICAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGNyb3BwZXJFbC5jcm9wcGVyKGNyb3BwZXJPcHRpb25zKTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHJvZmlsZSA9IEV4dC5nZXRDbXAoaWQgKyAnLWNyb3BwZXItcHJvZmlsZScpLnN0b3JlLmdldEF0KDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoYW5nZUNyb3BwZXJQcm9maWxlKHByb2ZpbGUuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzY29wZTogdGhpc1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgbWFya2Rvd25FZGl0b3Iud2luZG93LkNyb3BwZXIuc3VwZXJjbGFzcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsY29uZmlnKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcblxufTtcbkV4dC5leHRlbmQobWFya2Rvd25FZGl0b3Iud2luZG93LkNyb3BwZXIsIEV4dC5XaW5kb3cse1xuICAgIGltYWdlRGF0YTogJydcbiAgICAsY3JvcHBlclByb2ZpbGU6IHtuYW1lOiAnJ31cblxuICAgICxjaGFuZ2VDcm9wcGVyUHJvZmlsZTogZnVuY3Rpb24ocHJvZmlsZSl7XG4gICAgICAgIHZhciByYXRpbztcblxuICAgICAgICBpZiAocHJvZmlsZS5yYXRpbyAhPSBcIlwiKSB7XG4gICAgICAgICAgICByYXRpbyA9IHByb2ZpbGUucmF0aW87XG4gICAgICAgICAgICByYXRpby5yZXBsYWNlKC9bXi06eCgpXFxkLyorLl0vZywgJycpO1xuICAgICAgICAgICAgcmF0aW8gPSBldmFsKHJhdGlvKSB8fCBOYU47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAocHJvZmlsZS53aWR0aCAmJiBwcm9maWxlLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IHBhcnNlSW50KHByb2ZpbGUud2lkdGgpO1xuICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSBwYXJzZUludChwcm9maWxlLmhlaWdodCk7XG4gICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gMCAmJiBoZWlnaHQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJhdGlvID0gd2lkdGggLyBoZWlnaHQ7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmF0aW8gPSBOYU47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByYXRpbyA9IE5hTjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3JvcHBlclByb2ZpbGUgPSBwcm9maWxlO1xuXG4gICAgICAgIHRoaXMuY2FsbENyb3BwZXJBY3Rpb24oe2FjdGlvbjogJ3NldEFzcGVjdFJhdGlvJywgcGFyYW06IHJhdGlvfSk7XG4gICAgfVxuXG4gICAgLHVwbG9hZDogZnVuY3Rpb24oYnV0dG9uKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IHRoaXMuY29uZmlnLm1kLmNyZWF0ZVVwbG9hZGVyKCdpbWFnZScsIHRoaXMuY29uZmlnLmZpbGUubmFtZSk7XG5cbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnZmlsZScsIHRoaXMuY29uZmlnLmZpbGUpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ2FjdGlvbicsICdtZ3IvZWRpdG9yL2ltYWdldXBsb2FkJyk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnaW1hZ2VEYXRhJywgdGhpcy5pbWFnZURhdGEpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ25hbWUnLCB0aGlzLmNvbmZpZy5maWxlLm5hbWUpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ2Nyb3AnLCBidXR0b24uY3JvcCk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgncmVzb3VyY2UnLCB0aGlzLmNvbmZpZy5tZC5jb25maWcucmVzb3VyY2UpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ21vYmlsZScsIHRoaXMuY29uZmlnLm1vYmlsZSk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgncHJvZmlsZScsIHRoaXMuY3JvcHBlclByb2ZpbGUubmFtZSk7XG5cbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB4aHIub3BlbignUE9TVCcsIG1hcmtkb3duRWRpdG9yLmNvbmZpZy5jb25uZWN0b3JVcmwpO1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignUG93ZXJlZC1CeScsICdNT0R4Jyk7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdtb2RBdXRoJywgRXh0LkFqYXguZGVmYXVsdEhlYWRlcnMubW9kQXV0aCk7XG5cbiAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIHZhciBjb21wbGV0ZSA9IChldmVudC5sb2FkZWQgLyBldmVudC50b3RhbCAqIDEwMCB8IDApO1xuICAgICAgICAgICAgICAgIHVwbG9hZGVyLmNoaWxkKCcucHJvZ3Jlc3MnKS5zZXRXaWR0aChjb21wbGV0ZSArICclJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlcy5zdWNjZXNzID09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdXBsb2FkZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm1kLmVkaXRvci5pbnNlcnQoJyFbJyArIHJlcy5vYmplY3QubmFtZSArICddKCcgKyByZXMub2JqZWN0LnBhdGggKyAnIFwiJyArIHJlcy5vYmplY3QubmFtZSArICdcIilcXG5cXG4nKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZy5tZC5mYWlsVXBsb2FkZXIodXBsb2FkZXIsIHJlcy5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB4aHIuc2VuZChmb3JtRGF0YSk7XG5cbiAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgIH1cblxuICAgICxjYWxsQ3JvcHBlckFjdGlvbjogZnVuY3Rpb24oYnRuKSB7XG4gICAgICAgIHRoaXMuJGNyb3BwZXJFbC5jcm9wcGVyKGJ0bi5hY3Rpb24sIGJ0bi5wYXJhbSk7XG4gICAgfVxuXG4gICAgLGNsb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy4kY3JvcHBlckVsLmNyb3BwZXIoXCJkZXN0cm95XCIpO1xuXG4gICAgICAgIG1hcmtkb3duRWRpdG9yLndpbmRvdy5Dcm9wcGVyLnN1cGVyY2xhc3MuY2xvc2UuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5jb25maWcubWQuZWRpdG9yLmZvY3VzKCk7XG4gICAgfVxufSk7XG5FeHQucmVnKCdtYXJrZG93bmVkaXRvci13aW5kb3ctY3JvcHBlcicsbWFya2Rvd25FZGl0b3Iud2luZG93LkNyb3BwZXIpO1xuIiwibWFya2Rvd25FZGl0b3Iud2luZG93Lk9FbWJlZCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB7fTtcbiAgICBFeHQuYXBwbHlJZihjb25maWcse1xuICAgICAgICB0aXRsZTogXygnbWFya2Rvd25lZGl0b3Iub2VtYmVkLmVtYmVkX3VybCcpXG4gICAgICAgICxjbG9zZUFjdGlvbjogJ2Nsb3NlJ1xuICAgICAgICAscmVzaXphYmxlOiBmYWxzZVxuICAgICAgICAsY29sbGFwc2libGU6IGZhbHNlXG4gICAgICAgICxtYXhpbWl6YWJsZTogZmFsc2VcbiAgICAgICAgLGhlaWdodDogMTg1XG4gICAgICAgICxtb2RhbDogdHJ1ZVxuICAgICAgICAsZmllbGRzOiB0aGlzLmdldEZpZWxkcyhjb25maWcpXG4gICAgfSk7XG4gICAgbWFya2Rvd25FZGl0b3Iud2luZG93Lk9FbWJlZC5zdXBlcmNsYXNzLmNvbnN0cnVjdG9yLmNhbGwodGhpcyxjb25maWcpO1xufTtcbkV4dC5leHRlbmQobWFya2Rvd25FZGl0b3Iud2luZG93Lk9FbWJlZCxNT0R4LldpbmRvdywge1xuICAgIGdldEZpZWxkczogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHJldHVybiBbe1xuICAgICAgICAgICAgeHR5cGU6ICd0ZXh0ZmllbGQnXG4gICAgICAgICAgICAsbmFtZTogJ3VybCdcbiAgICAgICAgICAgICxmaWVsZExhYmVsOiBfKCdtYXJrZG93bmVkaXRvci5vZW1iZWQudXJsJylcbiAgICAgICAgICAgICxhbGxvd0JsYW5rOiBmYWxzZVxuICAgICAgICAgICAgLGFuY2hvcjogJzEwMCUnXG4gICAgICAgICAgICAsdnR5cGU6ICd1cmwnXG4gICAgICAgIH1dO1xuICAgIH1cblxuICAgICxzdWJtaXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBmID0gdGhpcy5mcC5nZXRGb3JtKCk7XG5cbiAgICAgICAgaWYgKGYuaXNWYWxpZCgpKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5jb25maWcuc3VjY2Vzcykge1xuICAgICAgICAgICAgICAgIEV4dC5jYWxsYmFjayh0aGlzLmNvbmZpZy5zdWNjZXNzLHRoaXMuY29uZmlnLnNjb3BlIHx8IHRoaXMsW2YuZ2V0VmFsdWVzKCldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxufSk7XG5FeHQucmVnKCdtYXJrZG93bmVkaXRvci13aW5kb3ctb2VtYmVkJyxtYXJrZG93bkVkaXRvci53aW5kb3cuT0VtYmVkKTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=