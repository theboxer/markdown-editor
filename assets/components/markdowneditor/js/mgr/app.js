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
            that.editor.resize();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImNvbWJvLmpzIiwibWFya2Rvd25lZGl0b3Iud2luZG93LmpzIiwib2VtYmVkLndpbmRvdy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNuN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiRXh0Lm5zKCdNYXJrZG93bkVkaXRvcicpO1xuTWFya2Rvd25FZGl0b3IgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgTWFya2Rvd25FZGl0b3Iuc3VwZXJjbGFzcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsY29uZmlnKTtcbn07XG5FeHQuZXh0ZW5kKE1hcmtkb3duRWRpdG9yLEV4dC5Db21wb25lbnQse1xuICAgIHdpbmRvdzp7fSxjb21ibzp7fSxjb25maWc6IHt9XG59KTtcbkV4dC5yZWcoJ21hcmtkb3duZWRpdG9yJyxNYXJrZG93bkVkaXRvcik7XG5tYXJrZG93bkVkaXRvciA9IG5ldyBNYXJrZG93bkVkaXRvcigpO1xuXG5tYXJrZG93bkVkaXRvci5sb2FkZWRFbGVtZW50cyA9IHt9O1xuXG5tYXJrZG93bkVkaXRvci5FZGl0b3IgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uZmlnLnJlc291cmNlID0gTU9EeC5yZXF1ZXN0LmlkIHx8IDA7XG4gICAgbWFya2Rvd25FZGl0b3IuRWRpdG9yLnN1cGVyY2xhc3MuY29uc3RydWN0b3IuY2FsbCh0aGlzLGNvbmZpZyk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG59O1xuRXh0LmV4dGVuZChtYXJrZG93bkVkaXRvci5FZGl0b3IsRXh0LkNvbXBvbmVudCx7XG4gICAgcmVtYXJrYWJsZTogJydcbiAgICAsZnVsbFNjcmVlbjogZmFsc2VcbiAgICAsbG9jYWxDYWNoZToge1xuICAgICAgICBvRW1iZWQ6IHt9XG4gICAgfVxuICAgICxpbml0Q29tcG9uZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgTWFya2Rvd25FZGl0b3Iuc3VwZXJjbGFzcy5pbml0Q29tcG9uZW50LmNhbGwodGhpcyk7XG5cbiAgICAgICAgaWYgKHRoaXMubWRFbGVtZW50SWQpe1xuICAgICAgICAgICAgRXh0Lm9uUmVhZHkodGhpcy5yZW5kZXIsIHRoaXMpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLGRlc3Ryb3k6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMuZWRpdG9yLmRlc3Ryb3koKTtcblxuICAgICAgICB0aGlzLm1kQ29udGFpbmVyLnJlbW92ZSgpO1xuICAgICAgICB0aGlzLnRhTWFya2Rvd24ucmVtb3ZlKCk7XG5cbiAgICAgICAgdGhpcy50ZXh0YXJlYS5kb20uc3R5bGUuZGlzcGxheSA9IG51bGw7XG4gICAgICAgIHRoaXMudGV4dGFyZWEuZG9tLnN0eWxlLndpZHRoID0gbnVsbDtcbiAgICAgICAgdGhpcy50ZXh0YXJlYS5kb20uc3R5bGUuaGVpZ2h0ID0gbnVsbDtcblxuICAgICAgICBNYXJrZG93bkVkaXRvci5zdXBlcmNsYXNzLmRlc3Ryb3kuY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICAscmVuZGVyOiBmdW5jdGlvbihjb250YWluZXIsIHBvc2l0aW9uKSB7XG4gICAgICAgIHRoaXMudGV4dGFyZWEgPSBFeHQuZ2V0KHRoaXMubWRFbGVtZW50SWQpO1xuICAgICAgICB0aGlzLm1kRWxlbWVudE5hbWUgPSB0aGlzLnRleHRhcmVhLmRvbS5uYW1lO1xuXG4gICAgICAgIGlmICghdGhpcy50ZXh0YXJlYSkgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuYnVpbGRVSSgpO1xuICAgICAgICB0aGlzLnJlZ2lzdGVyQWNlKCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJSZW1hcmthYmxlKCk7XG4gICAgICAgIHRoaXMuYnVpbGRUb29sYm94KCk7XG5cbiAgICAgICAgdmFyIHByZXZpZXdCdXR0b24gPSB0aGlzLnRvb2xCb3guY2hpbGQoJy5wcmV2aWV3LWJ1dHRvbicpO1xuICAgICAgICB2YXIgZnVsbHNjcmVlbkJ1dHRvbiA9IHRoaXMudG9vbEJveC5jaGlsZCgnLmZ1bGxzY3JlZW4tYnV0dG9uJyk7XG4gICAgICAgIHZhciBzcGxpdHNjcmVlbkJ1dHRvbiA9IHRoaXMudG9vbEJveC5jaGlsZCgnLnNwbGl0c2NyZWVuLWJ1dHRvbicpO1xuXG4gICAgICAgIHZhciBjb250ZW50ID0gdGhpcy5jb250ZW50TUQ7XG5cbiAgICAgICAgdmFyIHByZXZpZXdCdXR0b25PZmYgPSBFeHQuZ2V0KEV4dC5Eb21IZWxwZXIuYXBwZW5kKGNvbnRlbnQucGFyZW50KCkse1xuICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgIGNsYXNzOiAncHJldmlldy1idXR0b24tb2ZmJyxcbiAgICAgICAgICAgIGh0bWw6ICc8aSBjbGFzcz1cImljb24gaWNvbi1leWUtc2xhc2ggaWNvbi1sYXJnZVwiPjwvaT4nLFxuICAgICAgICAgICAgaGlkZGVuOiB0cnVlXG4gICAgICAgIH0pKTtcblxuICAgICAgICB2YXIgZHJvcFRhcmdldCA9IE1PRHgubG9hZCh7XG4gICAgICAgICAgICB4dHlwZTogJ21vZHgtdHJlZWRyb3AnLFxuICAgICAgICAgICAgdGFyZ2V0OiBjb250ZW50LFxuICAgICAgICAgICAgdGFyZ2V0RWw6IGNvbnRlbnQsXG4gICAgICAgICAgICBvbkluc2VydDogKGZ1bmN0aW9uKHMpe1xuICAgICAgICAgICAgICAgIHRoaXMuaW5zZXJ0KHMpO1xuICAgICAgICAgICAgICAgIHRoaXMuZm9jdXMoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0pLmJpbmQodGhpcy5lZGl0b3IpLFxuICAgICAgICAgICAgaWZyYW1lOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnRleHRhcmVhLm9uKCdkZXN0cm95JywgZnVuY3Rpb24oKSB7ZHJvcFRhcmdldC5kZXN0cm95KCk7fSk7XG5cbiAgICAgICAgdmFyIGRlZmF1bHRTcGxpdCA9IHBhcnNlSW50KE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci5nZW5lcmFsLnNwbGl0J10gfHwgMCk7XG4gICAgICAgIGlmIChkZWZhdWx0U3BsaXQgPT0gMSkge1xuICAgICAgICAgICAgc3BsaXRzY3JlZW5CdXR0b24udHVybk9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgcHJldmlld0J1dHRvbi5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnNob3dQcmV2aWV3KCk7XG4gICAgICAgICAgICB0aGlzLmhpZGVDb250ZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c0Jhci5zZXREaXNwbGF5ZWQoJ25vbmUnKTtcblxuICAgICAgICAgICAgdGhpcy5jb250ZW50TUQucGFyZW50KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3ByZXZpZXcnKTtcblxuICAgICAgICAgICAgcHJldmlld0J1dHRvbk9mZi5zaG93KClcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcHJldmlld0J1dHRvbk9mZi5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmhpZGVQcmV2aWV3KCk7XG4gICAgICAgICAgICB0aGlzLnNob3dDb250ZW50KCk7XG4gICAgICAgICAgICB0aGlzLnN0YXR1c0Jhci5zZXREaXNwbGF5ZWQoJ2Jsb2NrJyk7XG5cbiAgICAgICAgICAgIHRoaXMuY29udGVudE1ELnBhcmVudCgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdwcmV2aWV3Jyk7XG5cbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmZvY3VzKCk7XG5cbiAgICAgICAgICAgIHByZXZpZXdCdXR0b25PZmYuaGlkZSgpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBzcGxpdHNjcmVlbkJ1dHRvbi5hZGRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgaWYgKHNwbGl0c2NyZWVuQnV0dG9uLmNoaWxkKCdpJykuaGFzQ2xhc3MoJ2ljb24tcGF1c2UnKSkge1xuICAgICAgICAgICAgICAgIHNwbGl0c2NyZWVuQnV0dG9uLnR1cm5PbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzcGxpdHNjcmVlbkJ1dHRvbi50dXJuT2ZmKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIGZ1bGxzY3JlZW5CdXR0b24uYWRkTGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGlmICh0aGlzLmZ1bGxTY3JlZW4gPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBmdWxsc2NyZWVuQnV0dG9uLnR1cm5PbigpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmdWxsc2NyZWVuQnV0dG9uLnR1cm5PZmYoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5zdGF0dXNCYXIuc2V0RGlzcGxheWVkKCdibG9jaycpO1xuICAgICAgICAgICAgdGhpcy5lZGl0b3IucmVzaXplKHRydWUpO1xuXG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIGlmIChtYXJrZG93bkVkaXRvci5jb250ZW50W3RoaXMubWRFbGVtZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLnNldFZhbHVlKG1hcmtkb3duRWRpdG9yLmNvbnRlbnRbdGhpcy5tZEVsZW1lbnROYW1lXSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lZGl0b3Iuc2VsZWN0aW9uLmNsZWFyU2VsZWN0aW9uKCk7XG5cbiAgICAgICAgdGhpcy5wcmV2aWV3LnVwZGF0ZSh0aGlzLnBhcnNlKHRoaXMuZWRpdG9yLmdldFZhbHVlKCkpKTtcblxuICAgICAgICB0aGlzLnByZXZpZXcuZml4SGVpZ2h0KCk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3IuZ2V0U2Vzc2lvbigpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbihlLGIsYyxkKXtcbiAgICAgICAgICAgIGlmIChlLmRhdGEuYWN0aW9uID09ICdpbnNlcnRUZXh0JyAmJiB0aGlzLmVkaXRvci5nZXRTZXNzaW9uKCkuZ2V0RG9jdW1lbnQoKS5pc05ld0xpbmUoZS5kYXRhLnRleHQpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLmVkaXRvci5nZXRTZXNzaW9uKCk7XG4gICAgICAgICAgICAgICAgdmFyIGRvY3VtZW50ID0gc2Vzc2lvbi5nZXREb2N1bWVudCgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKC9eXFxzKig/OlsqKy1dfFxcZCtcXC4pXFxzKiQvLmV4ZWMoZG9jdW1lbnQuZ2V0TGluZShlLmRhdGEucmFuZ2Uuc3RhcnQucm93KSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVMaW5lcyhlLmRhdGEucmFuZ2Uuc3RhcnQucm93LCBlLmRhdGEucmFuZ2Uuc3RhcnQucm93KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucGFyc2UodGhpcy5lZGl0b3IuZ2V0VmFsdWUoKSk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuXG4gICAgLHNob3dDb250ZW50OiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmNvbnRlbnRNRC5zZXREaXNwbGF5ZWQoJ2Jsb2NrJyk7XG4gICAgfVxuXG4gICAgLGhpZGVDb250ZW50OiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLmNvbnRlbnRNRC5zZXREaXNwbGF5ZWQoJ25vbmUnKTtcbiAgICB9XG5cbiAgICAsc2hvd1ByZXZpZXc6IGZ1bmN0aW9uKCl7XG4gICAgICAgIHRoaXMucHJldmlldy5zZXREaXNwbGF5ZWQoJ2Jsb2NrJyk7XG4gICAgfVxuXG4gICAgLGhpZGVQcmV2aWV3OiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnByZXZpZXcuc2V0RGlzcGxheWVkKCdub25lJyk7XG4gICAgfVxuXG4gICAgLGJ1aWxkVUk6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLnRleHRhcmVhLnNldERpc3BsYXllZCgnbm9uZScpO1xuICAgICAgICB0aGlzLnRleHRhcmVhLnNldFdpZHRoKDApO1xuICAgICAgICB0aGlzLnRleHRhcmVhLnNldEhlaWdodCgwKTtcblxuICAgICAgICB0aGlzLnRhTWFya2Rvd24gPSBFeHQuZ2V0KEV4dC5Eb21IZWxwZXIuaW5zZXJ0QmVmb3JlKHRoaXMudGV4dGFyZWEsIHtcbiAgICAgICAgICAgIHRhZzogJ3RleHRhcmVhJyxcbiAgICAgICAgICAgIG5hbWU6IHRoaXMubWRFbGVtZW50TmFtZSArICdfbWFya2Rvd24nLFxuICAgICAgICAgICAgY2xhc3M6IHRoaXMubWRFbGVtZW50TmFtZSArICdfbWFya2Rvd24nXG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLnRhTWFya2Rvd24uc2V0RGlzcGxheWVkKCdub25lJyk7XG4gICAgICAgIHRoaXMudGFNYXJrZG93bi5zZXRXaWR0aCgwKTtcbiAgICAgICAgdGhpcy50YU1hcmtkb3duLnNldEhlaWdodCgwKTtcblxuICAgICAgICB0aGlzLm1kQ29udGFpbmVyID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmluc2VydEJlZm9yZSh0aGlzLnRleHRhcmVhLCB7XG4gICAgICAgICAgICB0YWc6ICdkaXYnLFxuICAgICAgICAgICAgY2xhc3M6ICdtYXJrZG93bi1jb250YWluZXIgYWNlLScgKyAoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmdlbmVyYWwudGhlbWUnXSB8fCAnbW9ub2thaScpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXy9nLCAnLScpXG4gICAgICAgIH0pKTtcblxuICAgICAgICB2YXIgZnVsbFNjcmVlbkhlYWRlciA9IEV4dC5nZXQoRXh0LkRvbUhlbHBlci5hcHBlbmQodGhpcy5tZENvbnRhaW5lci5kb20se1xuICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgIGNsYXNzOiAnZnVsbHNjcmVlbi1oZWFkZXIgYWNlX2d1dHRlcicsXG4gICAgICAgICAgICBodG1sOiAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgLz4nXG4gICAgICAgIH0pKTtcblxuICAgICAgICB2YXIgcGFnZVRpdGxlID0gRXh0LmdldENtcCgnbW9keC1yZXNvdXJjZS1wYWdldGl0bGUnKTtcbiAgICAgICAgaWYgKHBhZ2VUaXRsZSkge1xuICAgICAgICAgICAgdmFyIGhlYWRlcklucHV0ID0gZnVsbFNjcmVlbkhlYWRlci5jaGlsZCgnaW5wdXQnKTtcbiAgICAgICAgICAgIGhlYWRlcklucHV0LmRvbS52YWx1ZSA9IHBhZ2VUaXRsZS5nZXRWYWx1ZSgpO1xuXG4gICAgICAgICAgICBoZWFkZXJJbnB1dC5vbignY2hhbmdlJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBwYWdlVGl0bGUuc2V0VmFsdWUodGhpcy5kb20udmFsdWUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHBhZ2VUaXRsZS5vbignY2hhbmdlJywgZnVuY3Rpb24oZmllbGQsdmFsdWUpe1xuICAgICAgICAgICAgICAgIGhlYWRlcklucHV0LmRvbS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd3JhcHBlciA9IEV4dC5nZXQoRXh0LkRvbUhlbHBlci5hcHBlbmQodGhpcy5tZENvbnRhaW5lci5kb20se1xuICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgIGNsYXNzOiAnbWFya2Rvd24td3JhcHBlcidcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHRoaXMuY29udGVudE1EID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmFwcGVuZCh3cmFwcGVyLHtcbiAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICBjbGFzczogdGhpcy50ZXh0YXJlYS5kb20uY2xhc3NOYW1lICsgJyBjb250ZW50LW1kICcgKyB0aGlzLm1kRWxlbWVudE5hbWUgKyAnX21hcmtkb3duJ1xuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5wcmV2aWV3ID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmFwcGVuZCh3cmFwcGVyLHtcbiAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICBjbGFzczogJ21hcmtkb3duLWJvZHkgcHJldmlldy1tZCdcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhpcy5wcmV2aWV3LmZpeEhlaWdodCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoYXQuZWRpdG9yLnJlc2l6ZSgpO1xuICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRoYXQuZWRpdG9yLmdldFNlc3Npb24oKS5nZXRTY3JlZW5MZW5ndGgoKSAqIHRoYXQuZWRpdG9yLnJlbmRlcmVyLmxpbmVIZWlnaHQgKyB0aGF0LmVkaXRvci5yZW5kZXJlci5zY3JvbGxCYXIuZ2V0V2lkdGgoKSAgKyAyNTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLnVwbG9hZC5lbmFibGVfaW1hZ2VfdXBsb2FkJ10gPT0gMSB8fCBNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IudXBsb2FkLmVuYWJsZV9maWxlX3VwbG9hZCddID09IDEpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzQmFyID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmFwcGVuZCh0aGlzLm1kQ29udGFpbmVyLmRvbSx7XG4gICAgICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ3N0YXR1cy1iYXIgYWNlX2d1dHRlcidcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNNb2JpbGVEZXZpY2UoKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzQmFyLmRvbS5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInVwbG9hZC1iYXJcIj4gPGlucHV0IGNsYXNzPVwiaGlkZGVuXCIgbmFtZT1cIm1kX2ZpbGVfJysgdGhpcy5zdGF0dXNCYXIuaWQgKydcIiBpZD1cIicgKyB0aGlzLnN0YXR1c0Jhci5pZCArICctZmlsZVwiIHR5cGU9XCJmaWxlXCIgbXVsdGlwbGUgLz48aW5wdXQgY2xhc3M9XCJoaWRkZW5cIiBuYW1lPVwibWRfZmlsZV8nKyB0aGlzLnN0YXR1c0Jhci5pZCArJy1tb2JpbGVcIiBpZD1cIicgKyB0aGlzLnN0YXR1c0Jhci5pZCArICctZmlsZS1tb2JpbGVcIiB0eXBlPVwiZmlsZVwiIGFjY2VwdD1cImltYWdlLypcIiBjYXB0dXJlPVwiY2FtZXJhXCIgLz4nICsgXygnbWFya2Rvd25lZGl0b3Iuc3RhdHVzX2Jhcl9tZXNzYWdlX21vYmlsZScsIHtpZDogdGhpcy5zdGF0dXNCYXIuaWQgKyAnLWZpbGUnLCBpZF9tb2JpbGU6IHRoaXMuc3RhdHVzQmFyLmlkICsgJy1maWxlLW1vYmlsZSd9KSArICc8L2Rpdj4nO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXNCYXIuY2hpbGQoJyMnICsgdGhpcy5zdGF0dXNCYXIuaWQgKyAnLWZpbGUtbW9iaWxlJykub24oJ2NoYW5nZScsIGZ1bmN0aW9uKGUsIGlucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRmlsZXMoaW5wdXQuZmlsZXMsIDEpO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzQmFyLmRvbS5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cInVwbG9hZC1iYXJcIj4gPGlucHV0IGNsYXNzPVwiaGlkZGVuXCIgbmFtZT1cIm1kX2ZpbGVfJysgdGhpcy5zdGF0dXNCYXIuaWQgKydcIiBpZD1cIicgKyB0aGlzLnN0YXR1c0Jhci5pZCArICctZmlsZVwiIHR5cGU9XCJmaWxlXCIgbXVsdGlwbGU+JyArIF8oJ21hcmtkb3duZWRpdG9yLnN0YXR1c19iYXJfbWVzc2FnZScsIHtpZDogdGhpcy5zdGF0dXNCYXIuaWQgKyAnLWZpbGUnfSkgKyAnPC9kaXY+JztcblxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzQmFyLmNoaWxkKCcjJyArIHRoaXMuc3RhdHVzQmFyLmlkICsgJy1maWxlJykub24oJ2NoYW5nZScsIGZ1bmN0aW9uKGUsIGlucHV0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlRmlsZXMoaW5wdXQuZmlsZXMpO1xuICAgICAgICAgICAgICAgICAgICBpbnB1dC52YWx1ZSA9IFwiXCI7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzQmFyID0gRXh0LmdldChFeHQuRG9tSGVscGVyLmFwcGVuZCh0aGlzLm1kQ29udGFpbmVyLmRvbSx7XG4gICAgICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ3N0YXR1cy1iYXInLFxuICAgICAgICAgICAgICAgIGh0bWw6IF8oJ21hcmtkb3duZWRpdG9yLnN0YXR1c19iYXJfZGlzYWJsZWQnKVxuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgRXh0LkRvbUhlbHBlci5hcHBlbmQodGhpcy5tZENvbnRhaW5lci5kb20se1xuICAgICAgICAgICAgdGFnOiAnc3BhbicsXG4gICAgICAgICAgICBzdHlsZTogJ2NsZWFyOiBib3RoJ1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAsYnVpbGRUb29sYm94OiBmdW5jdGlvbigpe1xuICAgICAgICB0aGlzLnRvb2xCb3ggPSBFeHQuZ2V0KEV4dC5Eb21IZWxwZXIuYXBwZW5kKHRoaXMuc3RhdHVzQmFyLHtcbiAgICAgICAgICAgIHRhZzogJ2RpdicsXG4gICAgICAgICAgICBjbGFzczogJ3Rvb2xib3gnLFxuICAgICAgICAgICAgY246IFt7XG4gICAgICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ3ByZXZpZXctYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBodG1sOiAnPGkgY2xhc3M9XCJpY29uIGljb24tZXllIGljb24tbGFyZ2VcIj48L2k+J1xuICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ3NwbGl0c2NyZWVuLWJ1dHRvbicsXG4gICAgICAgICAgICAgICAgaHRtbDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLXBhdXNlIGljb24tbGFyZ2VcIj48L2k+J1xuICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgICAgICBjbGFzczogJ2Z1bGxzY3JlZW4tYnV0dG9uJyxcbiAgICAgICAgICAgICAgICBodG1sOiAnPGkgY2xhc3M9XCJpY29uIGljb24tZXhwYW5kIGljb24tbGFyZ2VcIj48L2k+J1xuICAgICAgICAgICAgfV1cbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgICAgICB0aGlzLnRvb2xCb3guY2hpbGQoJy5zcGxpdHNjcmVlbi1idXR0b24nKS50dXJuT24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5yZW1vdmVDbGFzcygnaWNvbi1wYXVzZScpO1xuICAgICAgICAgICAgdGhpcy5jaGlsZCgnaScpLmFkZENsYXNzKCdpY29uLXN0b3AnKTtcblxuICAgICAgICAgICAgdGhhdC5jb250ZW50TUQucGFyZW50KCkucGFyZW50KCkuYWRkQ2xhc3MoJ3NwbGl0Jyk7XG4gICAgICAgICAgICB0aGF0LmVkaXRvci5yZXNpemUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnRvb2xCb3guY2hpbGQoJy5zcGxpdHNjcmVlbi1idXR0b24nKS50dXJuT2ZmID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmNoaWxkKCdpJykuYWRkQ2xhc3MoJ2ljb24tcGF1c2UnKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5yZW1vdmVDbGFzcygnaWNvbi1zdG9wJyk7XG5cbiAgICAgICAgICAgIHRoYXQuY29udGVudE1ELnBhcmVudCgpLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdzcGxpdCcpO1xuICAgICAgICAgICAgdGhhdC5lZGl0b3IucmVzaXplKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy50b29sQm94LmNoaWxkKCcuZnVsbHNjcmVlbi1idXR0b24nKS50dXJuT24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5yZW1vdmVDbGFzcygnaWNvbi1leHBhbmQnKTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGQoJ2knKS5hZGRDbGFzcygnaWNvbi1jb21wcmVzcycpO1xuXG4gICAgICAgICAgICB2YXIgbW9keEJ1dHRvbnMgPSBFeHQuZ2V0KCdtb2R4LWFjdGlvbi1idXR0b25zJyk7XG4gICAgICAgICAgICBpZiAobW9keEJ1dHRvbnMpIHtcbiAgICAgICAgICAgICAgICBtb2R4QnV0dG9ucy5hZGRDbGFzcygnbWFya2Rvd25lZGl0b3ItZnVsbHNjcmVlbicpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LmZ1bGxTY3JlZW4gPSB0cnVlO1xuXG4gICAgICAgICAgICBpZiAocGFyc2VJbnQoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmdlbmVyYWwuc3BsaXRfZnVsbHNjcmVlbiddIHx8IDEpID09IDEpIHtcbiAgICAgICAgICAgICAgICB0aGF0LnRvb2xCb3guY2hpbGQoJy5zcGxpdHNjcmVlbi1idXR0b24nKS50dXJuT24oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhhdC50b29sQm94LmNoaWxkKCcuc3BsaXRzY3JlZW4tYnV0dG9uJykudHVybk9mZigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGF0LnNob3dQcmV2aWV3KCk7XG4gICAgICAgICAgICB0aGF0LnNob3dDb250ZW50KCk7XG5cbiAgICAgICAgICAgIHRoYXQuZWRpdG9yLmZvY3VzKCk7XG5cbiAgICAgICAgICAgIHRoYXQuY29udGVudE1ELnBhcmVudCgpLnBhcmVudCgpLmFkZENsYXNzKCdmdWxsc2NyZWVuJyk7XG5cbiAgICAgICAgICAgIHRoYXQuZWRpdG9yLnNldE9wdGlvbignbWF4TGluZXMnLCBudWxsKTtcbiAgICAgICAgICAgIHRoYXQuZWRpdG9yLnJlc2l6ZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudG9vbEJveC5jaGlsZCgnLmZ1bGxzY3JlZW4tYnV0dG9uJykudHVybk9mZiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5jaGlsZCgnaScpLmFkZENsYXNzKCdpY29uLWV4cGFuZCcpO1xuICAgICAgICAgICAgdGhpcy5jaGlsZCgnaScpLnJlbW92ZUNsYXNzKCdpY29uLWNvbXByZXNzJyk7XG5cbiAgICAgICAgICAgIHZhciBtb2R4QnV0dG9ucyA9IEV4dC5nZXQoJ21vZHgtYWN0aW9uLWJ1dHRvbnMnKTtcbiAgICAgICAgICAgIGlmIChtb2R4QnV0dG9ucykge1xuICAgICAgICAgICAgICAgIG1vZHhCdXR0b25zLnJlbW92ZUNsYXNzKCdtYXJrZG93bmVkaXRvci1mdWxsc2NyZWVuJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoYXQuZnVsbFNjcmVlbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICBpZiAocGFyc2VJbnQoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmdlbmVyYWwuc3BsaXQnXSB8fCAwKSA9PSAxKSB7XG4gICAgICAgICAgICAgICAgdGhhdC50b29sQm94LmNoaWxkKCcuc3BsaXRzY3JlZW4tYnV0dG9uJykudHVybk9uKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoYXQudG9vbEJveC5jaGlsZCgnLnNwbGl0c2NyZWVuLWJ1dHRvbicpLnR1cm5PZmYoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhhdC5oaWRlUHJldmlldygpO1xuICAgICAgICAgICAgdGhhdC5zaG93Q29udGVudCgpO1xuXG4gICAgICAgICAgICB0aGF0LmVkaXRvci5mb2N1cygpO1xuXG4gICAgICAgICAgICB0aGF0LmNvbnRlbnRNRC5wYXJlbnQoKS5wYXJlbnQoKS5yZW1vdmVDbGFzcygnZnVsbHNjcmVlbicpO1xuXG4gICAgICAgICAgICB0aGF0LmVkaXRvci5zZXRPcHRpb24oJ21heExpbmVzJywgSW5maW5pdHkpO1xuXG4gICAgICAgICAgICB0aGF0LnByZXZpZXcuZml4SGVpZ2h0KCk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgLHJlZ2lzdGVyQWNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBhY2UuZWRpdChFeHQuRG9tUXVlcnkuc2VsZWN0Tm9kZSgnZGl2LicgKyB0aGlzLm1kRWxlbWVudE5hbWUgKyAnX21hcmtkb3duJykpO1xuICAgICAgICBhY2UucmVxdWlyZShcImFjZS9sYXllci9ndXR0ZXJfdG9vbGJhclwiKTtcblxuICAgICAgICB0aGlzLmVkaXRvci5zZXRPcHRpb25zKHtcbiAgICAgICAgICAgIG1heExpbmVzOiBJbmZpbml0eSxcbiAgICAgICAgICAgIG1pbkxpbmVzOiAyNSxcbiAgICAgICAgICAgIGVuYWJsZUJhc2ljQXV0b2NvbXBsZXRpb246IHRydWUsXG4gICAgICAgICAgICBwcmludE1hcmdpbjogZmFsc2UsXG4gICAgICAgICAgICBzaG93R3V0dGVyOiB0cnVlLFxuICAgICAgICAgICAgdXNlU29mdFRhYnM6IHRydWUsXG4gICAgICAgICAgICBzaG93Rm9sZFdpZGdldHM6IGZhbHNlLFxuICAgICAgICAgICAgc2hvd0xpbmVOdW1iZXJzOiBmYWxzZSxcbiAgICAgICAgICAgIGZvbnRTaXplOiBwYXJzZUludChNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IuZ2VuZXJhbC5mb250X3NpemUnXSkgfHwgMTIsXG4gICAgICAgICAgICBmb250RmFtaWx5OiBNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IuZ2VuZXJhbC5mb250X2ZhbWlseSddIHx8ICcnXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVkaXRvci4kYmxvY2tTY3JvbGxpbmcgPSBJbmZpbml0eTtcbiAgICAgICAgdGhpcy5lZGl0b3IuZ2V0U2Vzc2lvbigpLnNldFVzZVdyYXBNb2RlKHRydWUpO1xuICAgICAgICB0aGlzLmVkaXRvci5nZXRTZXNzaW9uKCkuc2V0V3JhcExpbWl0UmFuZ2UoKTtcbiAgICAgICAgdGhpcy5lZGl0b3IucmVuZGVyZXIuc2V0U2Nyb2xsTWFyZ2luKDEwLCAxMCk7XG4gICAgICAgIHRoaXMuZWRpdG9yLmdldFNlc3Npb24oKS5zZXRWYWx1ZSh0aGlzLnRleHRhcmVhLmdldFZhbHVlKCkpO1xuICAgICAgICB0aGlzLmVkaXRvci5nZXRTZXNzaW9uKCkuc2V0TW9kZShcImFjZS9tb2RlL21hcmtkb3duZWRpdG9yXCIpO1xuICAgICAgICB0aGlzLmVkaXRvci5zZXRUaGVtZShcImFjZS90aGVtZS9cIiArIChNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IuZ2VuZXJhbC50aGVtZSddIHx8ICdtb25va2FpJykpO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbnRlbnRNRC5oYXNDbGFzcygnYWNlX2RhcmsnKSkge1xuICAgICAgICAgICAgdGhpcy5tZENvbnRhaW5lci5hZGRDbGFzcygndGhlbWUtZGFyaycpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5tZENvbnRhaW5lci5hZGRDbGFzcygndGhlbWUtbGlnaHQnKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgXG4gICAgICAgIHRoaXMuZWRpdG9yLnNlbGVjdGlvbi5vbignY2hhbmdlQ3Vyc29yJywgZnVuY3Rpb24gKGUsIHNlbGVjdGlvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuZ3V0dGVyVG9vbGJhcikge1xuICAgICAgICAgICAgICAgIHRoaXMuZ3V0dGVyVG9vbGJhci51cGRhdGUoJycpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2UoKTtcbiAgICAgICAgICAgIGlmIChyYW5nZS5zdGFydC5yb3cgIT0gcmFuZ2UuZW5kLnJvdykgcmV0dXJuO1xuXG4gICAgICAgICAgICB0aGlzLmVkaXRvci5zZXNzaW9uLmFkZEd1dHRlckRlY29yYXRpb24ocmFuZ2Uuc3RhcnQucm93LCAnJyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgdGhpcy5lZGl0b3Iuc2Vzc2lvbi5ndXR0ZXJSZW5kZXJlciA9ICB7XG4gICAgICAgICAgICBnZXRXaWR0aDogZnVuY3Rpb24oc2Vzc2lvbiwgbGFzdExpbmVOdW1iZXIsIGNvbmZpZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb25maWcuY2hhcmFjdGVyV2lkdGg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0VGV4dDogZnVuY3Rpb24oc2Vzc2lvbiwgcm93LCBjZWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGNlbGwuZWxlbWVudCAmJiB0aGlzLmVkaXRvci5nZXRDdXJzb3JQb3NpdGlvbigpLnJvdyA9PSByb3cgJiYgc2Vzc2lvbi5kb2MuJGxpbmVzW3Jvd10gPT0gXCJcIikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZEd1dHRlclRvb2xiYXIoY2VsbC5lbGVtZW50KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjZWxsLmVsZW1lbnQuaW5uZXJIVE1MID0gJyc7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5lZGl0b3IuY29tbWFuZHMuYWRkQ29tbWFuZCh7XG4gICAgICAgICAgICBuYW1lOiBcIkluZGVudCBsaXN0XCIsXG4gICAgICAgICAgICBiaW5kS2V5OiB7d2luOiBcIlRhYlwiLCBtYWM6IFwiVGFiXCJ9LFxuICAgICAgICAgICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmUgPSBlZGl0b3Iuc2Vzc2lvbi5nZXRMaW5lKGVkaXRvci5nZXRDdXJzb3JQb3NpdGlvbigpLnJvdyk7XG4gICAgICAgICAgICAgICAgdmFyIG1hdGNoID0gL14oXFxzKikoPzooWy0rKl0pfChcXGQrKVxcLikoXFxzKykvLmV4ZWMobGluZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVkaXRvci5zZXNzaW9uLmluZGVudFJvd3MoZWRpdG9yLmdldEN1cnNvclBvc2l0aW9uKCkucm93LCBlZGl0b3IuZ2V0Q3Vyc29yUG9zaXRpb24oKS5yb3csICdcXHQnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGl0b3IuaW5kZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmVkaXRvci5jb21tYW5kcy5hZGRDb21tYW5kKHtcbiAgICAgICAgICAgIG5hbWU6IFwiRXhpdCBmdWxsc2NyZWVuXCIsXG4gICAgICAgICAgICBiaW5kS2V5OiB7d2luOiBcIkVzY1wiLCBtYWM6IFwiRXNjXCJ9LFxuICAgICAgICAgICAgZXhlYzogZnVuY3Rpb24oZWRpdG9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZnVsbFNjcmVlbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvb2xCb3guY2hpbGQoJy5mdWxsc2NyZWVuLWJ1dHRvbicpLnR1cm5PZmYoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LmJpbmQodGhpcylcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGxhbmdUb29scyA9IGFjZS5yZXF1aXJlKFwiYWNlL2V4dC9sYW5ndWFnZV90b29sc1wiKTtcbiAgICAgICAgdmFyIHJlc291cmNlc0NvbXBsZXRlciA9IHtcbiAgICAgICAgICAgIGdldENvbXBsZXRpb25zOiBmdW5jdGlvbihlZGl0b3IsIHNlc3Npb24sIHBvcywgcHJlZml4LCBjYWxsYmFjaykge1xuICAgICAgICAgICAgICAgIGlmIChwcmVmaXgubGVuZ3RoID09PSAwKSB7IGNhbGxiYWNrKG51bGwsIFtdKTsgcmV0dXJuIH1cblxuICAgICAgICAgICAgICAgIE1PRHguQWpheC5yZXF1ZXN0KHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBtYXJrZG93bkVkaXRvci5jb25maWcuY29ubmVjdG9yVXJsXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ21nci9yZXNvdXJjZS9nZXRsaXN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgLHByZWZpeDogcHJlZml4XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3N1Y2Nlc3MnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm46IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCwgci5yZXN1bHRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBsYW5nVG9vbHMuYWRkQ29tcGxldGVyKHJlc291cmNlc0NvbXBsZXRlcik7XG5cbiAgICAgICAgdGhpcy5lZGl0b3IuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW50ZXJcIiwgdGhpcy5jYXRjaEFuZERvTm90aGluZywgZmFsc2UpO1xuICAgICAgICB0aGlzLmVkaXRvci5jb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIHRoaXMuY2F0Y2hBbmREb05vdGhpbmcsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5lZGl0b3IuY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIHRoaXMuZHJvcC5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLGFkZEd1dHRlclRvb2xiYXI6IGZ1bmN0aW9uKGNlbGwpe1xuICAgICAgICB0aGlzLmd1dHRlclRvb2xiYXIgPSBFeHQuZ2V0KGNlbGwpO1xuXG4gICAgICAgIGlmICh0aGlzLmlzTW9iaWxlRGV2aWNlKCkpIHtcbiAgICAgICAgICAgIHRoaXMuZ3V0dGVyVG9vbGJhci51cGRhdGUoJzxpIGNsYXNzPVwiaWNvbiBpY29uLXBsdXMgaWNvbi1maXhlZC13aWR0aFwiPjwvaT4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaW5saW5lLXRvb2xiYXJcIj4nICtcbiAgICAgICAgICAgICAgICAnPGxhYmVsIGZvcj1cIicrdGhpcy5zdGF0dXNCYXIuaWQrJy1maWxlXCI+PGkgY2xhc3M9XCJpY29uIGljb24tdXBsb2FkIGljb24tZml4ZWQtd2lkdGhcIj48L2k+PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAnPGxhYmVsIGZvcj1cIicrdGhpcy5zdGF0dXNCYXIuaWQrJy1maWxlLW1vYmlsZVwiPjxpIGNsYXNzPVwiaWNvbiBpY29uLWNhbWVyYSBpY29uLWZpeGVkLXdpZHRoXCI+PC9pPjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgJzxpIGNsYXNzPVwiaWNvbiBpY29uLWNvZGUgaWNvbi1maXhlZC13aWR0aFwiPjwvaT4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZ3V0dGVyVG9vbGJhci51cGRhdGUoJzxpIGNsYXNzPVwiaWNvbiBpY29uLXBsdXMgaWNvbi1maXhlZC13aWR0aFwiPjwvaT4nICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiaW5saW5lLXRvb2xiYXJcIj4nICtcbiAgICAgICAgICAgICAgICAnPGxhYmVsIGZvcj1cIicrdGhpcy5zdGF0dXNCYXIuaWQrJy1maWxlXCI+PGkgY2xhc3M9XCJpY29uIGljb24tdXBsb2FkIGljb24tZml4ZWQtd2lkdGhcIj48L2k+PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAnPGkgY2xhc3M9XCJpY29uIGljb24tY29kZSBpY29uLWZpeGVkLXdpZHRoXCI+PC9pPicgK1xuICAgICAgICAgICAgJzwvZGl2PicpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHN3aXRjaGVyID0gdGhpcy5ndXR0ZXJUb29sYmFyLmNoaWxkKCdpLmljb24tcGx1cycpO1xuICAgICAgICB2YXIgaW5saW5lVG9vbGJhciA9IHRoaXMuZ3V0dGVyVG9vbGJhci5jaGlsZCgnLmlubGluZS10b29sYmFyJyk7XG5cbiAgICAgICAgc3dpdGNoZXIudHVybk9uID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHN3aXRjaGVyLmFkZENsYXNzKCdtZC1pY29uLXJvdGF0ZS00NScpO1xuICAgICAgICAgICAgaW5saW5lVG9vbGJhci5zaG93KCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgc3dpdGNoZXIudHVybk9mZiA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBzd2l0Y2hlci5yZW1vdmVDbGFzcygnbWQtaWNvbi1yb3RhdGUtNDUnKTtcbiAgICAgICAgICAgIGlubGluZVRvb2xiYXIuaGlkZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHN3aXRjaGVyLm9uKCdjbGljaycsIGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBpZighc3dpdGNoZXIuaGFzQ2xhc3MoJ21kLWljb24tcm90YXRlLTQ1JykpIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2hlci50dXJuT24oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoZXIudHVybk9mZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcykpO1xuXG4gICAgICAgIHRoaXMuZ3V0dGVyVG9vbGJhci5jaGlsZCgnaS5pY29uLWNvZGUnKS5vbignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBNT0R4LmxvYWQoe1xuICAgICAgICAgICAgICAgIHh0eXBlOiAnbWFya2Rvd25lZGl0b3Itd2luZG93LW9lbWJlZCdcbiAgICAgICAgICAgICAgICAsc3VjY2VzczogZnVuY3Rpb24odmFsdWVzKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3IuaW5zZXJ0KCdbZW1iZWQgJyArIHZhbHVlcy51cmwgKyAnXScpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvci5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAsc2NvcGU6IHRoaXNcbiAgICAgICAgICAgIH0pLnNob3coKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbiAgICAscmVnaXN0ZXJSZW1hcmthYmxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5yZW1hcmthYmxlID0gbmV3IFJlbWFya2FibGUoe1xuICAgICAgICAgICAgaHRtbDogdHJ1ZSxcbiAgICAgICAgICAgIGhpZ2hsaWdodDogZnVuY3Rpb24gKHN0ciwgbGFuZykge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChsYW5nICYmIGhsanMuZ2V0TGFuZ3VhZ2UobGFuZykpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gaGxqcy5oaWdobGlnaHQobGFuZywgc3RyKS52YWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9cXFtcXFsvZywgJyYjOTE7JiM5MTsnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUucmVwbGFjZSgvXV0vZywgJyYjOTM7JiM5MzsnKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHt9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBobGpzLmhpZ2hsaWdodEF1dG8oc3RyKS52YWx1ZTtcblxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL1xcW1xcWy9nLCAnJiM5MTsmIzkxOycpO1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL11dL2csICcmIzkzOyYjOTM7Jyk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge31cblxuICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMucmVtYXJrYWJsZS5pbmxpbmUucnVsZXIuZGlzYWJsZShbICdiYWNrdGlja3MnIF0pO1xuXG4gICAgICAgIHZhciBvRW1iZWRSZW5kZXJlciA9IGZ1bmN0aW9uKHRva2VucywgaWR4LCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5sb2NhbENhY2hlLm9FbWJlZFt0b2tlbnNbaWR4XS51cmxdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubG9jYWxDYWNoZS5vRW1iZWRbdG9rZW5zW2lkeF0udXJsXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGVtYmVkSUQgPSBFeHQuaWQoKTtcblxuICAgICAgICAgICAgICAgIE1PRHguQWpheC5yZXF1ZXN0KHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBtYXJrZG93bkVkaXRvci5jb25maWcuY29ubmVjdG9yVXJsXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ21nci9lZGl0b3Ivb2VtYmVkJ1xuICAgICAgICAgICAgICAgICAgICAgICAgLHVybDogdG9rZW5zW2lkeF0udXJsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgJ3N1Y2Nlc3MnOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm46IGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGVtYmVkRGl2ID0gRXh0LmdldChlbWJlZElEKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVtYmVkRGl2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbWJlZERpdi51cGRhdGUoci5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVtYmVkRGl2LmRvbS5yZW1vdmVBdHRyaWJ1dGUoJ2lkJyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubG9jYWxDYWNoZS5vRW1iZWRbdG9rZW5zW2lkeF0udXJsXSA9IGVtYmVkRGl2LmRvbS5vdXRlckhUTUw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ZXh0YXJlYUNvbnRlbnQgPSBFeHQuZ2V0KEV4dC5Eb21IZWxwZXIuY3JlYXRlRG9tKHt0YWc6ICdkaXYnLCBodG1sOiB0aGlzLnRleHRhcmVhLmRvbS52YWx1ZX0pKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRhcmVhQ29udGVudC5jaGlsZCgnIycgKyBlbWJlZElEKS51cGRhdGUoci5kYXRhKS5kb20ucmVtb3ZlQXR0cmlidXRlKCdpZCcpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRleHRhcmVhLmRvbS52YWx1ZSA9IHRleHRhcmVhQ29udGVudC5kb20uaW5uZXJIVE1MO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXYgaWQ9XCInICsgZW1iZWRJRCArICdcIiBjbGFzcz1cIm1hcmtkb3duZWRpdG9yLW9lbWJlZC1jb250ZW50XCI+W2VtYmVkICcgKyB0b2tlbnNbaWR4XS51cmwgKyAnXTwvZGl2Pic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB2YXIgb0VtYmVkID0gZnVuY3Rpb24obWQpIHtcbiAgICAgICAgICAgIG1kLmlubGluZS5ydWxlci5wdXNoKCdvRW1iZWQnLCB0aGlzLm9FbWJlZFBhcnNlcik7XG4gICAgICAgICAgICBtZC5yZW5kZXJlci5ydWxlcy5vRW1iZWQgPSBvRW1iZWRSZW5kZXJlcjtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHRoaXMucmVtYXJrYWJsZS51c2Uob0VtYmVkKTtcbiAgICB9XG5cbiAgICAscGFyc2U6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHZhciBvdXRwdXQgPSB0aGlzLnJlbWFya2FibGUucmVuZGVyKGlucHV0KTtcblxuICAgICAgICBvdXRwdXQgPSBvdXRwdXQucmVwbGFjZSgvJTVCL2csICdbJyk7XG4gICAgICAgIG91dHB1dCA9IG91dHB1dC5yZXBsYWNlKC8lNUQvZywgJ10nKTtcblxuICAgICAgICBpZiAoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmxwLnBhcnNlX21vZHhfdGFncyddID09IDEpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhcnNlUmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnBhcnNlUmVxdWVzdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB0aW1lb3V0ID0gcGFyc2VJbnQoTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLmxwLnBhcnNlX21vZHhfdGFnc190aW1lb3V0J10gfHwgMzAwKTtcblxuICAgICAgICAgICAgdGhpcy5wYXJzZVJlcXVlc3QgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgTU9EeC5BamF4LnJlcXVlc3Qoe1xuICAgICAgICAgICAgICAgICAgICB1cmw6IG1hcmtkb3duRWRpdG9yLmNvbmZpZy5jb25uZWN0b3JVcmxcbiAgICAgICAgICAgICAgICAgICAgLHBhcmFtczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnbWdyL2VkaXRvci9wcm9jZXNzY29udGVudCdcbiAgICAgICAgICAgICAgICAgICAgICAgICxjb250ZW50OiBvdXRwdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICxyZXNvdXJjZTogTU9EeC5yZXF1ZXN0LmlkXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGlzVXBsb2FkIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnc3VjY2Vzcyc6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbjogZnVuY3Rpb24ocikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZpZXcudXBkYXRlKHIuZGF0YSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCh0aGlzLmVkaXRvci5nZXRDdXJzb3JQb3NpdGlvbigpLnJvdyArIDIpID49IHRoaXMuZWRpdG9yLmdldFNlc3Npb24oKS5nZXREb2N1bWVudCgpLmdldExlbmd0aCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZpZXcuZG9tLnNjcm9sbFRvcCA9IHRoaXMucHJldmlldy5kb20uc2Nyb2xsSGVpZ2h0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByZXZpZXcuZml4SGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcyksIHRpbWVvdXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wcmV2aWV3LnVwZGF0ZShvdXRwdXQpO1xuXG4gICAgICAgICAgICBpZiAoKHRoaXMuZWRpdG9yLmdldEN1cnNvclBvc2l0aW9uKCkucm93ICsgMikgPj0gdGhpcy5lZGl0b3IuZ2V0U2Vzc2lvbigpLmdldERvY3VtZW50KCkuZ2V0TGVuZ3RoKCkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXZpZXcuZG9tLnNjcm9sbFRvcCA9IHRoaXMucHJldmlldy5kb20uc2Nyb2xsSGVpZ2h0XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucHJldmlldy5maXhIZWlnaHQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGFNYXJrZG93bi5kb20udmFsdWUgPSB0aGlzLmVkaXRvci5nZXRWYWx1ZSgpO1xuICAgICAgICB0aGlzLnRleHRhcmVhLmRvbS52YWx1ZSA9IG91dHB1dDtcblxuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH1cblxuICAgICxvRW1iZWRQYXJzZXI6IGZ1bmN0aW9uKHN0YXRlKSB7XG4gICAgICAgIC8vIEdpdmVuIHN0YXRlLnNyYyBbZW1iZWQgdXJsXVxuICAgICAgICAvLyBXZSBhcmUgaGVyZTogICAgXlxuICAgICAgICB2YXIgcG9zID0gc3RhdGUucG9zO1xuICAgICAgICB2YXIgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQoc3RhdGUucG9zKTtcbiAgICAgICAgaWYgKG1hcmtlciAhPT0gMHg1Qi8qIFsgKi8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdpdmVuIHN0YXRlLnNyYyBbZW1iZWQgdXJsXVxuICAgICAgICAvLyBXZSBhcmUgaGVyZTogICAgIF5cbiAgICAgICAgcG9zKys7XG4gICAgICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmIChtYXJrZXIgIT09IDB4NjUvKiBlICovKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHaXZlbiBzdGF0ZS5zcmMgW2VtYmVkIHVybF1cbiAgICAgICAgLy8gV2UgYXJlIGhlcmU6ICAgICAgXlxuICAgICAgICBwb3MrKztcbiAgICAgICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKG1hcmtlciAhPT0gMHg2RC8qIG0gKi8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdpdmVuIHN0YXRlLnNyYyBbZW1iZWQgdXJsXVxuICAgICAgICAvLyBXZSBhcmUgaGVyZTogICAgICAgXlxuICAgICAgICBwb3MrKztcbiAgICAgICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKG1hcmtlciAhPT0gMHg2Mi8qIGIgKi8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdpdmVuIHN0YXRlLnNyYyBbZW1iZWQgdXJsXVxuICAgICAgICAvLyBXZSBhcmUgaGVyZTogICAgICAgIF5cbiAgICAgICAgcG9zKys7XG4gICAgICAgIG1hcmtlciA9IHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcyk7XG4gICAgICAgIGlmIChtYXJrZXIgIT09IDB4NjUvKiBlICovKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHaXZlbiBzdGF0ZS5zcmMgW2VtYmVkIHVybF1cbiAgICAgICAgLy8gV2UgYXJlIGhlcmU6ICAgICAgICAgXlxuICAgICAgICBwb3MrKztcbiAgICAgICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKG1hcmtlciAhPT0gMHg2NC8qIGQgKi8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdpdmVuIHN0YXRlLnNyYyBbZW1iZWQgdXJsXVxuICAgICAgICAvLyBXZSBhcmUgaGVyZTogICAgICAgICAgXlxuICAgICAgICBwb3MrKztcbiAgICAgICAgbWFya2VyID0gc3RhdGUuc3JjLmNoYXJDb2RlQXQocG9zKTtcbiAgICAgICAgaWYgKG1hcmtlciAhPT0gMHgyMC8qICAgKi8pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBvcysrO1xuXG4gICAgICAgIHZhciBzdGFydCA9IHBvcztcbiAgICAgICAgdmFyIG1heCA9IHN0YXRlLnBvc01heDtcbiAgICAgICAgdmFyIGVuZEZvdW5kID0gZmFsc2U7XG4gICAgICAgIHdoaWxlIChwb3MgPCBtYXgpIHtcbiAgICAgICAgICAgIGlmIChzdGF0ZS5zcmMuY2hhckNvZGVBdChwb3MpID09PSAweDVELyogXSAqLykge1xuICAgICAgICAgICAgICAgIGVuZEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHN0YXRlLnNyYy5jaGFyQ29kZUF0KHBvcykgPT09IDB4MjAvKiAgKi8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBvcysrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFlbmRGb3VuZCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHN0YXRlLnBvcyA9IHBvcysxO1xuXG4gICAgICAgIGlmIChzdGF0ZS5wb3MgPiBzdGF0ZS5wb3NNYXgpIHtcbiAgICAgICAgICAgIHN0YXRlLnBvcyA9IHN0YXRlLnBvc01heDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB1cmwgPSBzdGF0ZS5zcmMuc2xpY2Uoc3RhcnQsIHBvcyk7XG5cbiAgICAgICAgLy8gSGF2aW5nIG1hdGNoZWQgYWxsIHRocmVlIGNoYXJhY3RlcnMgd2UgYWRkIGEgdG9rZW4gdG8gdGhlIHN0YXRlIGxpc3RcbiAgICAgICAgdmFyIHRva2VuID0ge1xuICAgICAgICAgICAgdHlwZTogXCJvRW1iZWRcIixcbiAgICAgICAgICAgIGxldmVsOiBzdGF0ZS5sZXZlbCxcbiAgICAgICAgICAgIGNvbnRlbnQ6IG1hcmtlcixcbiAgICAgICAgICAgIHVybDogdXJsXG4gICAgICAgIH07XG5cbiAgICAgICAgc3RhdGUucHVzaCh0b2tlbik7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgLGNhdGNoQW5kRG9Ob3RoaW5nOiBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9XG5cbiAgICAsZHJvcDogZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci51cGxvYWQuZW5hYmxlX2ltYWdlX3VwbG9hZCddID09IDEgfHwgTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLnVwbG9hZC5lbmFibGVfZmlsZV91cGxvYWQnXSA9PSAxKSB7XG4gICAgICAgICAgICB0aGlzLmhhbmRsZUZpbGVzKGUuZGF0YVRyYW5zZmVyLmZpbGVzKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICxoYW5kbGVGaWxlczogZnVuY3Rpb24oZmlsZXMsIG1vYmlsZSkge1xuICAgICAgICBtb2JpbGUgPSBtb2JpbGUgfHwgMDtcblxuICAgICAgICBFeHQuZWFjaChmaWxlcywgZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgICAgdmFyIGlzSW1hZ2UgPSAvXmltYWdlXFwvLy50ZXN0KGZpbGUudHlwZSk7XG5cbiAgICAgICAgICAgIGlmIChpc0ltYWdlKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci51cGxvYWQuZW5hYmxlX2ltYWdlX3VwbG9hZCddID09IDApIHJldHVybiB0cnVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNoZWNrVHlwZShNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IudXBsb2FkLmltYWdlX3R5cGVzJ10sIGZpbGUpKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mYWlsTWVzc2FnZShmaWxlLCAnaW1hZ2UnLCBfKCdtYXJrZG93bmVkaXRvci5lcnIudXBsb2FkLnVuc3VwcG9ydGVkX2ltYWdlJykpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNoZWNrU2l6ZShmaWxlLnNpemUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZmFpbE1lc3NhZ2UoZmlsZSwgJ2ltYWdlJywgXygnbWFya2Rvd25lZGl0b3IuZXJyLnVwbG9hZC50b29fYmlnJykpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IuY3JvcHBlci5lbmFibGVfY3JvcHBlciddID09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgTU9EeC5sb2FkKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHh0eXBlOiAnbWFya2Rvd25lZGl0b3Itd2luZG93LWNyb3BwZXInXG4gICAgICAgICAgICAgICAgICAgICAgICAsZmlsZTogZmlsZVxuICAgICAgICAgICAgICAgICAgICAgICAgLG1kOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICAgICAsbW9iaWxlOiBtb2JpbGVcbiAgICAgICAgICAgICAgICAgICAgfSkuc2hvdygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBsb2FkRmlsZShmaWxlLCAnaW1hZ2UnLCBtb2JpbGUpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVkaXRvci5mb2N1cygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci51cGxvYWQuZW5hYmxlX2ZpbGVfdXBsb2FkJ10gPT0gMCkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuY2hlY2tUeXBlKE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci51cGxvYWQuZmlsZV90eXBlcyddLCBmaWxlKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWxNZXNzYWdlKGZpbGUsICdmaWxlJywgXygnbWFya2Rvd25lZGl0b3IuZXJyLnVwbG9hZC51bnN1cHBvcnRlZF9maWxlJykpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5jaGVja1NpemUoZmlsZS5zaXplKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWxNZXNzYWdlKGZpbGUsICdmaWxlJywgXygnbWFya2Rvd25lZGl0b3IuZXJyLnVwbG9hZC50b29fYmlnJykpO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMudXBsb2FkRmlsZShmaWxlLCAnZmlsZScpO1xuICAgICAgICAgICAgICAgIHRoaXMuZWRpdG9yLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLGNoZWNrU2l6ZTogZnVuY3Rpb24oc2l6ZSl7XG4gICAgICAgIHZhciBtYXhTaXplID0gTU9EeC5jb25maWdbJ21hcmtkb3duZWRpdG9yLnVwbG9hZC5tYXhfc2l6ZSddO1xuICAgICAgICBpZiAoIW1heFNpemUgfHwgbWF4U2l6ZSA9PSAnJykgbWF4U2l6ZSA9IChNT0R4LmNvbmZpZ1sndXBsb2FkX21heHNpemUnXSB8fCAnMjA5NzE1MicpO1xuXG4gICAgICAgIG1heFNpemUgPSBwYXJzZUludChtYXhTaXplKTtcblxuICAgICAgICBpZiAobWF4U2l6ZSA9PSAwKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICByZXR1cm4gc2l6ZSA8PSBtYXhTaXplO1xuICAgIH1cblxuICAgICxjaGVja1R5cGU6IGZ1bmN0aW9uKGFsbG93ZWRUeXBlcywgZmlsZSkge1xuICAgICAgICBhbGxvd2VkVHlwZXMgPSBhbGxvd2VkVHlwZXMuc3BsaXQoJywnKTtcblxuICAgICAgICByZXR1cm4gYWxsb3dlZFR5cGVzLmluZGV4T2YoZmlsZS5uYW1lLnNwbGl0KCcuJykucG9wKCkpICE9IC0xO1xuICAgIH1cblxuICAgICx1cGxvYWRGaWxlOiBmdW5jdGlvbihmaWxlLCB0eXBlLCBtb2JpbGUpIHtcbiAgICAgICAgdHlwZSA9IHR5cGUgfHwgJ2ZpbGUnO1xuICAgICAgICBtb2JpbGUgPSBtb2JpbGUgfHwgMDtcblxuICAgICAgICB2YXIgdXBsb2FkZXIgPSB0aGlzLmNyZWF0ZVVwbG9hZGVyKCk7XG5cbiAgICAgICAgdmFyIGZvcm1EYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnZmlsZScsIGZpbGUpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ2FjdGlvbicsICdtZ3IvZWRpdG9yLycgKyB0eXBlICsgJ3VwbG9hZCcpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ25hbWUnLCBmaWxlLm5hbWUpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ3Jlc291cmNlJywgdGhpcy5jb25maWcucmVzb3VyY2UpO1xuICAgICAgICBmb3JtRGF0YS5hcHBlbmQoJ21vYmlsZScsIG1vYmlsZSk7XG5cbiAgICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICB4aHIub3BlbignUE9TVCcsIG1hcmtkb3duRWRpdG9yLmNvbmZpZy5jb25uZWN0b3JVcmwpO1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcignUG93ZXJlZC1CeScsICdNT0R4Jyk7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdtb2RBdXRoJywgRXh0LkFqYXguZGVmYXVsdEhlYWRlcnMubW9kQXV0aCk7XG5cbiAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICBpZiAoZXZlbnQubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIHZhciBjb21wbGV0ZSA9IChldmVudC5sb2FkZWQgLyBldmVudC50b3RhbCAqIDEwMCB8IDApO1xuICAgICAgICAgICAgICAgIHVwbG9hZGVyLmNoaWxkKCcucHJvZ3Jlc3MnKS5zZXRXaWR0aChjb21wbGV0ZSArICclJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKHhoci5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIGlmIChyZXMuc3VjY2VzcyA9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIHVwbG9hZGVyLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW1hZ2VQcmVmaXggPSAodHlwZSA9PSAnaW1hZ2UnKSA/ICchJyA6ICcnO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZW5kTGluZSA9ICh0eXBlID09ICdpbWFnZScpID8gJ1xcblxcbicgOiAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lZGl0b3IuaW5zZXJ0KGltYWdlUHJlZml4ICsgJ1snICsgcmVzLm9iamVjdC5uYW1lICsgJ10oJyArIHJlcy5vYmplY3QucGF0aCArICcgXCInICsgcmVzLm9iamVjdC5uYW1lICsgJ1wiKScgKyBlbmRMaW5lKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmZhaWxVcGxvYWRlcih1cGxvYWRlciwgcmVzLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHhoci5zZW5kKGZvcm1EYXRhKTtcbiAgICB9XG5cbiAgICAsY3JlYXRlVXBsb2FkZXI6IGZ1bmN0aW9uKHR5cGUsIGZpbGVOYW1lKSB7XG4gICAgICAgIHZhciB1cGxvYWRlciA9IEV4dC5Eb21IZWxwZXIuaW5zZXJ0Rmlyc3QodGhpcy5zdGF0dXNCYXIse1xuICAgICAgICAgICAgdGFnOiAnZGl2JyxcbiAgICAgICAgICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3NcIj48aSBjbGFzcz1cImljb24gaWNvbi1zcGlubmVyIGljb24tc3BpblwiPjwvaT4gPHNwYW4+JyArIF8oJ21hcmtkb3duZWRpdG9yLnVwbG9hZGluZ18nICsgdHlwZSkgKyBmaWxlTmFtZSArICc8L3NwYW4+PC9kaXY+J1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gRXh0LmdldCh1cGxvYWRlcik7XG4gICAgfVxuXG4gICAgLGZhaWxVcGxvYWRlcjogZnVuY3Rpb24odXBsb2FkZXIsIG1lc3NhZ2UpIHtcbiAgICAgICAgdXBsb2FkZXIuY2hpbGQoJy5wcm9ncmVzcycpLmFkZENsYXNzKCdlcnJvcicpO1xuICAgICAgICB1cGxvYWRlci5jaGlsZCgnLnByb2dyZXNzJykuc2V0V2lkdGgoJzEwMCUnKTtcblxuICAgICAgICB1cGxvYWRlci5jaGlsZCgnaScpLmFkZENsYXNzKCdyZW1vdmUtbWVzc2FnZScpO1xuICAgICAgICB1cGxvYWRlci5jaGlsZCgnaScpLnJlcGxhY2VDbGFzcygnaWNvbi1zcGlubmVyJywgJ2ljb24tcmVtb3ZlJyk7XG4gICAgICAgIHVwbG9hZGVyLmNoaWxkKCdpJykucmVtb3ZlQ2xhc3MoJ2ljb24tc3BpbicpO1xuXG4gICAgICAgIHVwbG9hZGVyLmNoaWxkKCdzcGFuJykuZG9tLmlubmVySFRNTCArPSAnIGZhaWxlZC4gJyArIG1lc3NhZ2U7XG4gICAgICAgIHVwbG9hZGVyLmNoaWxkKCcucmVtb3ZlLW1lc3NhZ2UnKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHVwbG9hZGVyLnJlbW92ZSgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAsZmFpbE1lc3NhZ2U6IGZ1bmN0aW9uKGZpbGUsIHR5cGUsIG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5jcmVhdGVVcGxvYWRlcih0eXBlLCBmaWxlLm5hbWUpO1xuICAgICAgICB0aGlzLmZhaWxVcGxvYWRlcih1cGxvYWRlciwgbWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLGlzTW9iaWxlRGV2aWNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICh0eXBlb2Ygd2luZG93Lm9yaWVudGF0aW9uICE9PSBcInVuZGVmaW5lZFwiKSB8fCAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdJRU1vYmlsZScpICE9PSAtMSk7XG4gICAgfVxufSk7XG5cbk1PRHgubG9hZFJURSA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgbmV3IG1hcmtkb3duRWRpdG9yLkVkaXRvcih7XG4gICAgICAgIG1kRWxlbWVudElkOiBpZFxuICAgIH0pO1xufTtcblxuTU9EeC5hZnRlclRWTG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBlbHMgPSBFeHQucXVlcnkoJ3RleHRhcmVhLm1vZHgtcmljaHRleHQnKTtcblxuICAgIEV4dC5lYWNoKGVscywgZnVuY3Rpb24oZWxlbWVudCl7XG4gICAgICAgIGVsZW1lbnQgPSBFeHQuZ2V0KGVsZW1lbnQpO1xuICAgICAgICBpZiAoIWVsZW1lbnQpIHJldHVybiB0cnVlO1xuXG4gICAgICAgIGlmIChtYXJrZG93bkVkaXRvci5sb2FkZWRFbGVtZW50c1tlbGVtZW50LmlkXSkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgbWFya2Rvd25FZGl0b3IubG9hZGVkRWxlbWVudHNbZWxlbWVudC5pZF0gPSBuZXcgbWFya2Rvd25FZGl0b3IuRWRpdG9yKHtcbiAgICAgICAgICAgIG1kRWxlbWVudElkOiBlbGVtZW50LmlkXG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn07XG5cbk1PRHgudW5sb2FkVFZSVEUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgZWxzID0gRXh0LnF1ZXJ5KCcubW9keC1yaWNodGV4dCcpO1xuXG4gICAgRXh0LmVhY2goZWxzLCBmdW5jdGlvbihlbGVtZW50KXtcbiAgICAgICAgZWxlbWVudCA9IEV4dC5nZXQoZWxlbWVudCk7XG4gICAgICAgIGlmICghZWxlbWVudCkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgaWYgKCFtYXJrZG93bkVkaXRvci5sb2FkZWRFbGVtZW50c1tlbGVtZW50LmlkXSkgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgbWFya2Rvd25FZGl0b3IubG9hZGVkRWxlbWVudHNbZWxlbWVudC5pZF0uZGVzdHJveSgpO1xuXG4gICAgfSk7XG59OyIsIm1hcmtkb3duRWRpdG9yLmNvbWJvLkNyb3BwZXJQcm9maWxlID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKE1PRHguY29uZmlnWydtYXJrZG93bmVkaXRvci5jcm9wcGVyLnByb2ZpbGVzJ10gfHwgJ1tdJyk7XG5cbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgRXh0LmFwcGx5SWYoY29uZmlnLHtcbiAgICAgICAgc3RvcmU6IG5ldyBFeHQuZGF0YS5Kc29uU3RvcmUoe1xuICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICAgICAgLGZpZWxkczogWyduYW1lJywgJ3dpZHRoJywgJ2hlaWdodCcsICdyYXRpbyddXG4gICAgICAgIH0pXG4gICAgICAgICxkaXNwbGF5RmllbGQ6ICduYW1lJ1xuICAgICAgICAsbW9kZTogJ2xvY2FsJ1xuICAgICAgICAsdmFsdWVGaWVsZDogJ25hbWUnXG4gICAgICAgICxlZGl0YWJsZTogZmFsc2VcbiAgICAgICAgLHZhbHVlOiBkYXRhWzBdID8gZGF0YVswXS5uYW1lIDogJydcbiAgICB9KTtcblxuICAgIHZhciBzaG93RGVzY3JpcHRpb24gPSBwYXJzZUludChNT0R4LmNvbmZpZ1snbWFya2Rvd25lZGl0b3IuY3JvcHBlci5zaG93X2Rlc2NyaXB0aW9uJ10gfHwgMCk7XG4gICAgaWYgKHNob3dEZXNjcmlwdGlvbikge1xuICAgICAgICBjb25maWcudHBsID0gbmV3IEV4dC5YVGVtcGxhdGUoJzx0cGwgZm9yPVwiLlwiPjxkaXYgY2xhc3M9XCJ4LWNvbWJvLWxpc3QtaXRlbVwiPjxzcGFuIHN0eWxlPVwiZm9udC13ZWlnaHQ6IGJvbGRcIj57bmFtZX08L3NwYW4+J1xuICAgICAgICAgICAgLCc8YnIgLz48dHBsIGlmPVwid2lkdGhcIj5XOnt3aWR0aH0gPC90cGw+PHRwbCBpZj1cImhlaWdodFwiPkg6e2hlaWdodH0gPC90cGw+PHRwbCBpZj1cInJhdGlvXCI+Ujp7cmF0aW99PC90cGw+PC9kaXY+PC90cGw+Jyk7XG4gICAgfVxuXG4gICAgbWFya2Rvd25FZGl0b3IuY29tYm8uQ3JvcHBlclByb2ZpbGUuc3VwZXJjbGFzcy5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsY29uZmlnKTtcbn07XG5FeHQuZXh0ZW5kKG1hcmtkb3duRWRpdG9yLmNvbWJvLkNyb3BwZXJQcm9maWxlLE1PRHguY29tYm8uQ29tYm9Cb3gpO1xuRXh0LnJlZygnbWFya2Rvd25lZGl0b3ItY29tYm8tY3JvcHBlci1wcm9maWxlJyxtYXJrZG93bkVkaXRvci5jb21iby5Dcm9wcGVyUHJvZmlsZSk7IiwibWFya2Rvd25FZGl0b3Iud2luZG93LkNyb3BwZXIgPSBmdW5jdGlvbihjb25maWcpIHtcbiAgICBjb25maWcgPSBjb25maWcgfHwge307XG4gICAgY29uZmlnLmNyb3BwZXJTZWxlY3RvciA9IGNvbmZpZy5jcm9wcGVyU2VsZWN0b3IgfHwgJy5pbWFnZS11cGxvYWQtd3JhcHBlciA+IGltZyc7XG5cbiAgICB2YXIgaWQgPSBFeHQuaWQoKTtcblxuICAgIEV4dC5hcHBseUlmKGNvbmZpZyx7XG4gICAgICAgIG1vZGFsOiBmYWxzZVxuICAgICAgICAsbGF5b3V0OiAnYXV0bydcbiAgICAgICAgLGNsb3NlQWN0aW9uOiAnaGlkZSdcbiAgICAgICAgLHNoYWRvdzogdHJ1ZVxuICAgICAgICAscmVzaXphYmxlOiB0cnVlXG4gICAgICAgICxjb2xsYXBzaWJsZTogdHJ1ZVxuICAgICAgICAsbWF4aW1pemFibGU6IGZhbHNlXG4gICAgICAgICxhdXRvSGVpZ2h0OiBmYWxzZVxuICAgICAgICAsYXV0b1Njcm9sbDogdHJ1ZVxuICAgICAgICAsYWxsb3dEcm9wOiB0cnVlXG4gICAgICAgICx3aWR0aDogODAwXG4gICAgICAgICxtb2JpbGU6IDBcbiAgICAgICAgLHRpdGxlOiBfKCdtYXJrZG93bmVkaXRvci5jcm9wcGVyLmNyb3BfaW1hZ2UnKVxuICAgICAgICAsY2xzOiAnbW9keC13aW5kb3cgbWFya2Rvd25lZGl0b3ItY3JvcHBlci13aW5kb3cnXG4gICAgICAgICxpdGVtczpbe1xuICAgICAgICAgICAgbGF5b3V0OiAnY29sdW1uJ1xuICAgICAgICAgICAgLGJvcmRlcjogZmFsc2VcbiAgICAgICAgICAgICxkZWZhdWx0czoge1xuICAgICAgICAgICAgICAgIGxheW91dDogJ2Zvcm0nXG4gICAgICAgICAgICAgICAgLGxhYmVsQWxpZ246ICd0b3AnXG4gICAgICAgICAgICAgICAgLGxhYmVsU2VwYXJhdG9yOiAnJ1xuICAgICAgICAgICAgICAgICxhbmNob3I6ICcxMDAlJ1xuICAgICAgICAgICAgICAgICxib3JkZXI6IGZhbHNlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAsaXRlbXM6IFt7XG4gICAgICAgICAgICAgICAgY29sdW1uV2lkdGg6IDAuMVxuICAgICAgICAgICAgICAgICxkZWZhdWx0czoge1xuICAgICAgICAgICAgICAgICAgICBtc2dUYXJnZXQ6ICd1bmRlcidcbiAgICAgICAgICAgICAgICAgICAgLGFuY2hvcjogJzEwMCUnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICxjbHM6ICdtYXJrZG93bmVkaXRvci10b29sYmFyJ1xuICAgICAgICAgICAgICAgICxpdGVtczogW3tcbiAgICAgICAgICAgICAgICAgICAgeHR5cGU6ICdidXR0b24nXG4gICAgICAgICAgICAgICAgICAgICx0ZXh0OiAnPGkgY2xhc3M9XCJpY29uIGljb24tYXJyb3dzIGljb24tbGFyZ2VcIj48L2k+J1xuICAgICAgICAgICAgICAgICAgICAsdG9vbHRpcDogXygnbWFya2Rvd25lZGl0b3IuY3JvcHBlci5tb3ZlJylcbiAgICAgICAgICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbTogJ21vdmUnXG4gICAgICAgICAgICAgICAgICAgICxhY3Rpb246ICdzZXREcmFnTW9kZSdcbiAgICAgICAgICAgICAgICAgICAgLGhhbmRsZXI6IHRoaXMuY2FsbENyb3BwZXJBY3Rpb25cbiAgICAgICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICAgICAgeHR5cGU6ICdidXR0b24nXG4gICAgICAgICAgICAgICAgICAgICx0ZXh0OiAnPGkgY2xhc3M9XCJpY29uIGljb24tY3JvcCBpY29uLWxhcmdlXCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgLHRvb2x0aXA6IF8oJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIuY3JvcCcpXG4gICAgICAgICAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgICAgICAgICAscGFyYW06ICdjcm9wJ1xuICAgICAgICAgICAgICAgICAgICAsYWN0aW9uOiAnc2V0RHJhZ01vZGUnXG4gICAgICAgICAgICAgICAgICAgICxoYW5kbGVyOiB0aGlzLmNhbGxDcm9wcGVyQWN0aW9uXG4gICAgICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgICAgIHh0eXBlOiAnYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICAsdGV4dDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLXNlYXJjaC1wbHVzIGljb24tbGFyZ2VcIj48L2k+J1xuICAgICAgICAgICAgICAgICAgICAsdG9vbHRpcDogXygnbWFya2Rvd25lZGl0b3IuY3JvcHBlci56b29tX2luJylcbiAgICAgICAgICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbTogMC4xXG4gICAgICAgICAgICAgICAgICAgICxhY3Rpb246ICd6b29tJ1xuICAgICAgICAgICAgICAgICAgICAsaGFuZGxlcjogdGhpcy5jYWxsQ3JvcHBlckFjdGlvblxuICAgICAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgICAgICB4dHlwZTogJ2J1dHRvbidcbiAgICAgICAgICAgICAgICAgICAgLHRleHQ6ICc8aSBjbGFzcz1cImljb24gaWNvbi1zZWFyY2gtbWludXMgaWNvbi1sYXJnZVwiPjwvaT4nXG4gICAgICAgICAgICAgICAgICAgICx0b29sdGlwOiBfKCdtYXJrZG93bmVkaXRvci5jcm9wcGVyLnpvb21fb3V0JylcbiAgICAgICAgICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbTogLTAuMVxuICAgICAgICAgICAgICAgICAgICAsYWN0aW9uOiAnem9vbSdcbiAgICAgICAgICAgICAgICAgICAgLGhhbmRsZXI6IHRoaXMuY2FsbENyb3BwZXJBY3Rpb25cbiAgICAgICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICAgICAgeHR5cGU6ICdidXR0b24nXG4gICAgICAgICAgICAgICAgICAgICx0ZXh0OiAnPGkgY2xhc3M9XCJpY29uIGljb24tcm90YXRlLWxlZnQgaWNvbi1sYXJnZVwiPjwvaT4nXG4gICAgICAgICAgICAgICAgICAgICx0b29sdGlwOiBfKCdtYXJrZG93bmVkaXRvci5jcm9wcGVyLnJvdGF0ZV9sZWZ0JylcbiAgICAgICAgICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbTogLTkwXG4gICAgICAgICAgICAgICAgICAgICxhY3Rpb246ICdyb3RhdGUnXG4gICAgICAgICAgICAgICAgICAgICxoYW5kbGVyOiB0aGlzLmNhbGxDcm9wcGVyQWN0aW9uXG4gICAgICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgICAgIHh0eXBlOiAnYnV0dG9uJ1xuICAgICAgICAgICAgICAgICAgICAsdGV4dDogJzxpIGNsYXNzPVwiaWNvbiBpY29uLXJvdGF0ZS1yaWdodCBpY29uLWxhcmdlXCI+PC9pPidcbiAgICAgICAgICAgICAgICAgICAgLHRvb2x0aXA6IF8oJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIucm90YXRlX3JpZ2h0JylcbiAgICAgICAgICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbTogOTBcbiAgICAgICAgICAgICAgICAgICAgLGFjdGlvbjogJ3JvdGF0ZSdcbiAgICAgICAgICAgICAgICAgICAgLGhhbmRsZXI6IHRoaXMuY2FsbENyb3BwZXJBY3Rpb25cbiAgICAgICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICAgICAgeHR5cGU6ICdidXR0b24nXG4gICAgICAgICAgICAgICAgICAgICx0ZXh0OiAnPGkgY2xhc3M9XCJpY29uIGljb24tcmVtb3ZlIGljb24tbGFyZ2VcIj48L2k+J1xuICAgICAgICAgICAgICAgICAgICAsdG9vbHRpcDogXygnbWFya2Rvd25lZGl0b3IuY3JvcHBlci5jbGVhcl9jcm9wcGVyJylcbiAgICAgICAgICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAgICAgICAgICxwYXJhbTogbnVsbFxuICAgICAgICAgICAgICAgICAgICAsYWN0aW9uOiAnY2xlYXInXG4gICAgICAgICAgICAgICAgICAgICxoYW5kbGVyOiB0aGlzLmNhbGxDcm9wcGVyQWN0aW9uXG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgIGNvbHVtbldpZHRoOiAwLjlcbiAgICAgICAgICAgICAgICAsZGVmYXVsdHM6IHtcbiAgICAgICAgICAgICAgICAgICAgbXNnVGFyZ2V0OiAndW5kZXInXG4gICAgICAgICAgICAgICAgICAgICxhbmNob3I6ICcxMDAlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAsY2xzOiAnbWFya2Rvd25lZGl0b3ItY3JvcHBlcidcbiAgICAgICAgICAgICAgICAsaXRlbXM6IFt7XG4gICAgICAgICAgICAgICAgICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwiaW1hZ2UtdXBsb2FkLXdyYXBwZXJcIj48aW1nIHNyYz1cIicgKyBVUkwuY3JlYXRlT2JqZWN0VVJMKGNvbmZpZy5maWxlKSArICdcIj48L2Rpdj4nXG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIH1dXG4gICAgICAgIH1dXG4gICAgICAgICxiYmFyOiBbe1xuICAgICAgICAgICAgeHR5cGU6ICdtYXJrZG93bmVkaXRvci1jb21iby1jcm9wcGVyLXByb2ZpbGUnXG4gICAgICAgICAgICAsaWQ6IGlkICsgJy1jcm9wcGVyLXByb2ZpbGUnXG4gICAgICAgICAgICAsbGlzdGVuZXJzOiB7XG4gICAgICAgICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICAgICAgICAgIGZuOiBmdW5jdGlvbihjb21ibywgdmFsdWUpe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGFuZ2VDcm9wcGVyUHJvZmlsZSh2YWx1ZS5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc2NvcGU6IHRoaXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sJy0+Jyx7XG4gICAgICAgICAgICB0ZXh0OiBfKCdjYW5jZWwnKVxuICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAsaGFuZGxlcjogdGhpcy5jbG9zZVxuICAgICAgICB9LHtcbiAgICAgICAgICAgIHRleHQ6IF8oJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIudXBsb2FkJylcbiAgICAgICAgICAgICxjbHM6ICdwcmltYXJ5LWJ1dHRvbidcbiAgICAgICAgICAgICxzY29wZTogdGhpc1xuICAgICAgICAgICAgLGNyb3A6IDBcbiAgICAgICAgICAgICxoYW5kbGVyOiB0aGlzLnVwbG9hZFxuICAgICAgICB9LHtcbiAgICAgICAgICAgIHRleHQ6IF8oJ21hcmtkb3duZWRpdG9yLmNyb3BwZXIuY3JvcF91cGxvYWQnKVxuICAgICAgICAgICAgLGNsczogJ3ByaW1hcnktYnV0dG9uJ1xuICAgICAgICAgICAgLHNjb3BlOiB0aGlzXG4gICAgICAgICAgICAsY3JvcDogMVxuICAgICAgICAgICAgLGhhbmRsZXI6IHRoaXMudXBsb2FkXG4gICAgICAgIH1dXG4gICAgICAgICxsaXN0ZW5lcnM6IHtcbiAgICAgICAgICAgICdzaG93Jzoge1xuICAgICAgICAgICAgICAgIGZuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNyb3BwZXJPcHRpb25zID0ge307XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGNyb3BwZXJFbCA9ICQoJyMnICsgdGhpcy5pZCArICcgJyArIGNvbmZpZy5jcm9wcGVyU2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICBjcm9wcGVyT3B0aW9ucy5zdHJpY3QgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICBjcm9wcGVyT3B0aW9ucy5jcm9wID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VEYXRhID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICd7XCJ4XCI6JyArIGRhdGEueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXCJ5XCI6JyArIGRhdGEueSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXCJoZWlnaHRcIjonICsgZGF0YS5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1wid2lkdGhcIjonICsgZGF0YS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnXCJyb3RhdGVcIjonICsgZGF0YS5yb3RhdGUgKyAnfSdcbiAgICAgICAgICAgICAgICAgICAgICAgIF0uam9pbigpO1xuICAgICAgICAgICAgICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kY3JvcHBlckVsLmNyb3BwZXIoY3JvcHBlck9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBwcm9maWxlID0gRXh0LmdldENtcChpZCArICctY3JvcHBlci1wcm9maWxlJykuc3RvcmUuZ2V0QXQoMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlQ3JvcHBlclByb2ZpbGUocHJvZmlsZS5kYXRhKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNjb3BlOiB0aGlzXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBtYXJrZG93bkVkaXRvci53aW5kb3cuQ3JvcHBlci5zdXBlcmNsYXNzLmNvbnN0cnVjdG9yLmNhbGwodGhpcyxjb25maWcpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuXG59O1xuRXh0LmV4dGVuZChtYXJrZG93bkVkaXRvci53aW5kb3cuQ3JvcHBlciwgRXh0LldpbmRvdyx7XG4gICAgaW1hZ2VEYXRhOiAnJ1xuICAgICxjcm9wcGVyUHJvZmlsZToge25hbWU6ICcnfVxuXG4gICAgLGNoYW5nZUNyb3BwZXJQcm9maWxlOiBmdW5jdGlvbihwcm9maWxlKXtcbiAgICAgICAgdmFyIHJhdGlvO1xuXG4gICAgICAgIGlmIChwcm9maWxlLnJhdGlvICE9IFwiXCIpIHtcbiAgICAgICAgICAgIHJhdGlvID0gcHJvZmlsZS5yYXRpbztcbiAgICAgICAgICAgIHJhdGlvLnJlcGxhY2UoL1teLTp4KClcXGQvKisuXS9nLCAnJyk7XG4gICAgICAgICAgICByYXRpbyA9IGV2YWwocmF0aW8pIHx8IE5hTjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChwcm9maWxlLndpZHRoICYmIHByb2ZpbGUuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gcGFyc2VJbnQocHJvZmlsZS53aWR0aCk7XG4gICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHBhcnNlSW50KHByb2ZpbGUuaGVpZ2h0KTtcbiAgICAgICAgICAgICAgICBpZiAod2lkdGggPiAwICYmIGhlaWdodCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmF0aW8gPSB3aWR0aCAvIGhlaWdodDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByYXRpbyA9IE5hTjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJhdGlvID0gTmFOO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jcm9wcGVyUHJvZmlsZSA9IHByb2ZpbGU7XG5cbiAgICAgICAgdGhpcy5jYWxsQ3JvcHBlckFjdGlvbih7YWN0aW9uOiAnc2V0QXNwZWN0UmF0aW8nLCBwYXJhbTogcmF0aW99KTtcbiAgICB9XG5cbiAgICAsdXBsb2FkOiBmdW5jdGlvbihidXR0b24pIHtcbiAgICAgICAgdmFyIHVwbG9hZGVyID0gdGhpcy5jb25maWcubWQuY3JlYXRlVXBsb2FkZXIoJ2ltYWdlJywgdGhpcy5jb25maWcuZmlsZS5uYW1lKTtcblxuICAgICAgICB2YXIgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdmaWxlJywgdGhpcy5jb25maWcuZmlsZSk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnYWN0aW9uJywgJ21nci9lZGl0b3IvaW1hZ2V1cGxvYWQnKTtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdpbWFnZURhdGEnLCB0aGlzLmltYWdlRGF0YSk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnbmFtZScsIHRoaXMuY29uZmlnLmZpbGUubmFtZSk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnY3JvcCcsIGJ1dHRvbi5jcm9wKTtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdyZXNvdXJjZScsIHRoaXMuY29uZmlnLm1kLmNvbmZpZy5yZXNvdXJjZSk7XG4gICAgICAgIGZvcm1EYXRhLmFwcGVuZCgnbW9iaWxlJywgdGhpcy5jb25maWcubW9iaWxlKTtcbiAgICAgICAgZm9ybURhdGEuYXBwZW5kKCdwcm9maWxlJywgdGhpcy5jcm9wcGVyUHJvZmlsZS5uYW1lKTtcblxuICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICAgIHhoci5vcGVuKCdQT1NUJywgbWFya2Rvd25FZGl0b3IuY29uZmlnLmNvbm5lY3RvclVybCk7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdQb3dlcmVkLUJ5JywgJ01PRHgnKTtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIoJ21vZEF1dGgnLCBFeHQuQWpheC5kZWZhdWx0SGVhZGVycy5tb2RBdXRoKTtcblxuICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIGlmIChldmVudC5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbXBsZXRlID0gKGV2ZW50LmxvYWRlZCAvIGV2ZW50LnRvdGFsICogMTAwIHwgMCk7XG4gICAgICAgICAgICAgICAgdXBsb2FkZXIuY2hpbGQoJy5wcm9ncmVzcycpLnNldFdpZHRoKGNvbXBsZXRlICsgJyUnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzLnN1Y2Nlc3MgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB1cGxvYWRlci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWcubWQuZWRpdG9yLmluc2VydCgnIVsnICsgcmVzLm9iamVjdC5uYW1lICsgJ10oJyArIHJlcy5vYmplY3QucGF0aCArICcgXCInICsgcmVzLm9iamVjdC5uYW1lICsgJ1wiKVxcblxcbicpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLm1kLmZhaWxVcGxvYWRlcih1cGxvYWRlciwgcmVzLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHhoci5zZW5kKGZvcm1EYXRhKTtcblxuICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgLGNhbGxDcm9wcGVyQWN0aW9uOiBmdW5jdGlvbihidG4pIHtcbiAgICAgICAgdGhpcy4kY3JvcHBlckVsLmNyb3BwZXIoYnRuLmFjdGlvbiwgYnRuLnBhcmFtKTtcbiAgICB9XG5cbiAgICAsY2xvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLiRjcm9wcGVyRWwuY3JvcHBlcihcImRlc3Ryb3lcIik7XG5cbiAgICAgICAgbWFya2Rvd25FZGl0b3Iud2luZG93LkNyb3BwZXIuc3VwZXJjbGFzcy5jbG9zZS5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLmNvbmZpZy5tZC5lZGl0b3IuZm9jdXMoKTtcbiAgICB9XG59KTtcbkV4dC5yZWcoJ21hcmtkb3duZWRpdG9yLXdpbmRvdy1jcm9wcGVyJyxtYXJrZG93bkVkaXRvci53aW5kb3cuQ3JvcHBlcik7XG4iLCJtYXJrZG93bkVkaXRvci53aW5kb3cuT0VtYmVkID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgY29uZmlnID0gY29uZmlnIHx8IHt9O1xuICAgIEV4dC5hcHBseUlmKGNvbmZpZyx7XG4gICAgICAgIHRpdGxlOiBfKCdtYXJrZG93bmVkaXRvci5vZW1iZWQuZW1iZWRfdXJsJylcbiAgICAgICAgLGNsb3NlQWN0aW9uOiAnY2xvc2UnXG4gICAgICAgICxyZXNpemFibGU6IGZhbHNlXG4gICAgICAgICxjb2xsYXBzaWJsZTogZmFsc2VcbiAgICAgICAgLG1heGltaXphYmxlOiBmYWxzZVxuICAgICAgICAsaGVpZ2h0OiAxODVcbiAgICAgICAgLG1vZGFsOiB0cnVlXG4gICAgICAgICxmaWVsZHM6IHRoaXMuZ2V0RmllbGRzKGNvbmZpZylcbiAgICB9KTtcbiAgICBtYXJrZG93bkVkaXRvci53aW5kb3cuT0VtYmVkLnN1cGVyY2xhc3MuY29uc3RydWN0b3IuY2FsbCh0aGlzLGNvbmZpZyk7XG59O1xuRXh0LmV4dGVuZChtYXJrZG93bkVkaXRvci53aW5kb3cuT0VtYmVkLE1PRHguV2luZG93LCB7XG4gICAgZ2V0RmllbGRzOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgcmV0dXJuIFt7XG4gICAgICAgICAgICB4dHlwZTogJ3RleHRmaWVsZCdcbiAgICAgICAgICAgICxuYW1lOiAndXJsJ1xuICAgICAgICAgICAgLGZpZWxkTGFiZWw6IF8oJ21hcmtkb3duZWRpdG9yLm9lbWJlZC51cmwnKVxuICAgICAgICAgICAgLGFsbG93Qmxhbms6IGZhbHNlXG4gICAgICAgICAgICAsYW5jaG9yOiAnMTAwJSdcbiAgICAgICAgICAgICx2dHlwZTogJ3VybCdcbiAgICAgICAgfV07XG4gICAgfVxuXG4gICAgLHN1Ym1pdDogZnVuY3Rpb24oKXtcbiAgICAgICAgdmFyIGYgPSB0aGlzLmZwLmdldEZvcm0oKTtcblxuICAgICAgICBpZiAoZi5pc1ZhbGlkKCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbmZpZy5zdWNjZXNzKSB7XG4gICAgICAgICAgICAgICAgRXh0LmNhbGxiYWNrKHRoaXMuY29uZmlnLnN1Y2Nlc3MsdGhpcy5jb25maWcuc2NvcGUgfHwgdGhpcyxbZi5nZXRWYWx1ZXMoKV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbkV4dC5yZWcoJ21hcmtkb3duZWRpdG9yLXdpbmRvdy1vZW1iZWQnLG1hcmtkb3duRWRpdG9yLndpbmRvdy5PRW1iZWQpOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==