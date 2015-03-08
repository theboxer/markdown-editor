Ext.ns('MarkdownEditor');
MarkdownEditor = function(config) {
    config = config || {};
    MarkdownEditor.superclass.constructor.call(this,config);
};
Ext.extend(MarkdownEditor,Ext.Component,{
    window:{},config: {}
});
Ext.reg('markdowneditor',MarkdownEditor);
markdownEditor = new MarkdownEditor();

markdownEditor.Editor = function(config) {
    config = config || {};
    markdownEditor.Editor.superclass.constructor.call(this,config);
};
Ext.extend(markdownEditor.Editor,Ext.Component,{
    window: {}
    ,remarkable: ''
    ,initComponent: function() {
        MarkdownEditor.superclass.initComponent.call(this);

        Ext.onReady(this.render, this);
    }

    ,render: function() {
        this.textarea = Ext.get('ta');

        this.buildUI();
        this.registerAce();
        this.registerMarked();

        this.statusBar = Ext.get('status-bar');
        this.preview = Ext.get('preview-md');

        var previewButton = Ext.get('preview-button');
        var fullscreenButton = Ext.get('fullscreen-button');
        var content = Ext.get('content-md');
        var wrapper = content.parent();

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

        previewButton.addListener('click', function () {
            if (this.preview.isVisible()) {
                this.preview.setDisplayed('none');
                content.setDisplayed('block');
                this.statusBar.setDisplayed('block');

                previewButton.child('i').removeClass('icon-toggle-on');
                previewButton.child('i').addClass('icon-toggle-off');
            } else {
                this.preview.setDisplayed('block');
                content.setDisplayed('none');
                this.statusBar.setDisplayed('none');

                previewButton.child('i').removeClass('icon-toggle-off');
                previewButton.child('i').addClass('icon-toggle-on');
            }
        }, this);

        fullscreenButton.addListener('click', function () {
            var icon = fullscreenButton.child('i');

            if (icon.hasClass('icon-expand')) {
                icon.removeClass('icon-expand');
                icon.addClass('icon-compress');

                this.preview.setDisplayed('block');
                content.setDisplayed('block');

                previewButton.hide();

                wrapper.addClass('fullscreen');

                this.editor.setOption('maxLines', null);

            } else {
                icon.addClass('icon-expand');
                icon.removeClass('icon-compress');

                this.preview.setDisplayed('none');
                content.setDisplayed('block');

                previewButton.show();

                wrapper.removeClass('fullscreen');

                this.editor.setOption('maxLines', Infinity);
            }

            this.statusBar.setDisplayed('block');

            this.editor.resize(true);
        }, this);

        if (markdownEditor.content.content) {
            this.editor.setValue(markdownEditor.content.content);
        }
        this.editor.selection.clearSelection();

        this.preview.update(this.parse(this.editor.getValue()));

        this.editor.getSession().on('change', function(e){
            this.parse(this.editor.getValue());
        }.bind(this));
    }

    ,buildUI: function() {
        this.textarea.setDisplayed('none');
        this.textarea.setWidth(0);
        this.textarea.setHeight(0);

        Ext.DomHelper.insertBefore(this.textarea, {
            tag: 'textarea',
            name: 'ta_markdown',
            id: 'ta_markdown'
        });

        this.taMarkdown = Ext.get('ta_markdown');
        this.taMarkdown.setDisplayed('none');
        this.taMarkdown.setWidth(0);
        this.taMarkdown.setHeight(0);

        var wrapper = Ext.DomHelper.insertBefore(this.textarea, {
            tag: 'div',
            class: 'markdown-container'
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'content-md',
            class: this.textarea.dom.className
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'preview-md',
            class: 'markdown-body'
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'toolbox',
            cn: [{
                tag: 'span',
                id: 'preview-button',
                html: '<i class="icon icon-toggle-off"></i> Preview'
            },{
                tag: 'span',
                id: 'fullscreen-button',
                html: '<i class="icon icon-expand"></i>'
            }]
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'status-bar',
            html: '<input class="hidden" id="inputFile" name="file" type="file" multiple>Attach files by dragging & dropping or <label for="inputFile" class="link">selecting them</label>.'
        });

        Ext.get('inputFile').on('change', function(e, input) {
            this.handleFiles(input.files);
            input.value = "";
        }, this);

        Ext.DomHelper.append(wrapper,{
            tag: 'span',
            style: 'clear: both'
        });
    }

    ,registerAce: function() {
        this.editor = ace.edit(Ext.DomQuery.selectNode('div#content-md'));
        this.editor.setOptions({
            maxLines: Infinity,
            minLines: 25,
            enableBasicAutocompletion: true
        });
        this.editor.renderer.setShowGutter(true);
        this.editor.renderer.setScrollMargin(10, 10);
        this.editor.getSession().setValue(this.textarea.getValue());
        this.editor.getSession().setMode("ace/mode/markdown");
        this.editor.setTheme("ace/theme/" + (MODx.config['markdowneditor.general.theme'] || 'monokai'));

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

    ,registerMarked: function() {
        this.remarkable = new Remarkable({
            html: true,
            highlight: function (str, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    try {
                        return hljs.highlight(lang, str).value;
                    } catch (err) {}
                }

                try {
                    return hljs.highlightAuto(str).value;
                } catch (err) {}

                return '';
            }
        });
        this.remarkable.inline.ruler.disable([ 'backticks' ]);
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
                            },
                            scope: this
                        }
                    }
                });
            }, timeout);
        } else {
            this.preview.update(output);
        }

        this.taMarkdown.dom.value = this.editor.getValue();
        this.textarea.dom.value = output;

        return output;
    }

    ,catchAndDoNothing: function(e) {
        e.stopPropagation();
        e.preventDefault();
    }

    ,drop: function(e) {
        e.stopPropagation();
        e.preventDefault();

        this.handleFiles(e.dataTransfer.files);
    }

    ,handleFiles: function(files) {
        Ext.each(files, function(file) {
            var isImage = /^image\//.test(file.type);

            if (isImage) {
                if (MODx.config['markdowneditor.cropper.enable_cropper'] == 1) {
                    MODx.load({
                        xtype: 'markdowneditor-window-cropper'
                        ,file: file
                        ,md: this
                    }).show();
                } else {
                    this.uploadFile(file, 'image');
                }
            } else {
                this.uploadFile(file, 'file');
            }

        }, this);
    }

    ,uploadFile: function(file, type) {
        if (!type) type = 'file';

        var uploader = Ext.DomHelper.insertFirst(this.statusBar,{
            tag: 'div',
            id: 'upload_progress',
            html: '<div class="progress"></div><i class="icon icon-spinner icon-spin"></i> Uploading ' + type + ': ' + file.name
        });

        var formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'mgr/editor/' + type + 'upload');
        formData.append('name', file.name);

        var xhr = new XMLHttpRequest();
        xhr.open('POST', markdownEditor.config.connectorUrl);
        xhr.setRequestHeader('Powered-By', 'MODx');
        xhr.setRequestHeader('modAuth', Ext.Ajax.defaultHeaders.modAuth);

        xhr.upload.onprogress = function (event) {
            if (event.lengthComputable) {
                var complete = (event.loaded / event.total * 100 | 0);
                this.statusBar.child('.progress').setWidth(complete + '%');
            }
        }.bind(this);

        xhr.onload = function () {
            if (xhr.status === 200) {
                var res = JSON.parse(xhr.responseText);
                if (res.success == true) {
                    uploader.remove();
                    var imagePrefix = (type == 'image') ? '!' : '';
                    this.editor.insert(imagePrefix + '[' + res.object.name + '](' + res.object.path + ' "' + res.object.name + '")\n');
                }
            }
        }.bind(this);

        xhr.send(formData);
    }
});

MODx.loadRTE = function(id) {
    new markdownEditor.Editor();
};
