var MarkdownEditor = function(config) {
    config = config || {};
    MarkdownEditor.superclass.constructor.call(this,config);
};
Ext.override(MODx.panel.Resource, {});

Ext.extend(MarkdownEditor,Ext.Component,{
    window: {}
    ,remarkable: ''
    ,initComponent: function() {
        MarkdownEditor.superclass.initComponent.call(this);

        Ext.onReady(this.render, this);
    }

    ,parseRequest: ''
    ,parse: function(input) {
        var output = this.remarkable.render(input);

        output = output.replace(/%5B/g, '[');
        output = output.replace(/%5D/g, ']');

        if (this.parseRequest) {
            clearTimeout(this.parseRequest);
        }

        this.parseRequest = setTimeout(function(){
            MODx.Ajax.request({
                url: MarkdownEditor_config.connectorUrl
                ,params: {
                    action: 'mgr/editor/processcontent'
                    ,content: output
                    ,resource: MODx.request.id
                },
                isUpload : true,
                listeners: {
                    'success': {
                        fn: function(r) {
                            Ext.get('preview-md').update(r.data);
                        },
                        scope: this
                    }
                }
            });
        }, 150);

        this.taMarkdown.dom.value = this.editor.getValue();
        this.textarea.dom.value = output;

        return output;
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
            html: '<input class="hidden" id="inputFile" name="file" type="file" multiple>Attach images by dragging & dropping or <label for="inputFile" class="link">selecting them</label>.'
        });

        Ext.get('inputFile').on('change', function(e, input) {
            this.handleFiles(input.files);
        }, this);

        Ext.DomHelper.append(wrapper,{
            tag: 'span',
            style: 'clear: both'
        });
    }

    ,registerAce: function() {
        var mde = this;
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
        this.editor.setTheme("ace/theme/monokai");

        var langTools = ace.require("ace/ext/language_tools");
        var rhymeCompleter = {
            getCompletions: function(editor, session, pos, prefix, callback) {
                if (prefix.length === 0) { callback(null, []); return }
                MODx.Ajax.request({
                    url: MarkdownEditor_config.connectorUrl
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
        langTools.addCompleter(rhymeCompleter);

        this.editor.container.addEventListener("dragenter", this.catchAndDoNothing, false);
        this.editor.container.addEventListener("dragover", this.catchAndDoNothing, false);
        this.editor.container.addEventListener("drop", this.drop.bind(this), false);
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
                MODx.load({
                    xtype: 'markdowneditor-window-cropper'
                    ,file: file
                    ,md: this
                }).show();
            } else {
                var sb = Ext.get('status-bar');
                var uploader = Ext.DomHelper.insertFirst(sb,{
                    tag: 'div',
                    id: 'upload_progress',
                    html: '<div class="progress"></div><i class="icon icon-spinner icon-spin"></i> Uploading file: ' + file.name
                });

                var formData = new FormData();
                formData.append('file', file);
                formData.append('action', 'mgr/editor/fileupload');
                formData.append('name', file.name);

                var xhr = new XMLHttpRequest();
                xhr.open('POST', MarkdownEditor_config.connectorUrl);
                xhr.setRequestHeader('Powered-By', 'MODx');
                xhr.setRequestHeader('modAuth', Ext.Ajax.defaultHeaders.modAuth);

                xhr.upload.onprogress = function (event) {
                    if (event.lengthComputable) {
                        var complete = (event.loaded / event.total * 100 | 0);
                        sb.child('.progress').setWidth(complete + '%');
                    }
                };

                xhr.onload = function () {
                    if (xhr.status === 200) {
                        var res = JSON.parse(xhr.responseText);
                        if (res.success == true) {
                            uploader.remove();
                            this.editor.insert('[' + res.name + '](' + res.path + ' "' + res.name + '")\n');
                        }
                    }
                }.bind(this);

                xhr.send(formData);
            }

        }, this);
    }

    ,registerMarked: function() {
        var mde = this;
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

                return ''; // use external default escaping
            }
        });
        this.remarkable.inline.ruler.disable([ 'backticks' ]);
    }

    ,render: function() {
        var mde = this;
        this.textarea = Ext.get('ta');

        this.buildUI();
        this.registerAce();
        this.registerMarked();

        var previewButton = Ext.get('preview-button');
        var fullscreenButton = Ext.get('fullscreen-button');
        var preview = Ext.get('preview-md');
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
            if (preview.isVisible()) {
                preview.setDisplayed('none');
                content.setDisplayed('block');

                previewButton.child('i').removeClass('icon-toggle-on');
                previewButton.child('i').addClass('icon-toggle-off');
            } else {
                preview.setDisplayed('block');
                content.setDisplayed('none');

                previewButton.child('i').removeClass('icon-toggle-off');
                previewButton.child('i').addClass('icon-toggle-on');
            }
        });

        fullscreenButton.addListener('click', function () {
            var icon = fullscreenButton.child('i');

            if (icon.hasClass('icon-expand')) {
                icon.removeClass('icon-expand');
                icon.addClass('icon-compress');

                preview.setDisplayed('block');
                content.setDisplayed('block');

                previewButton.hide();

                wrapper.addClass('fullscreen');

                this.editor.setOption('maxLines', null);
                //this.editor.setAutoScrollEditorIntoView(false);

            } else {
                icon.addClass('icon-expand');
                icon.removeClass('icon-compress');

                preview.setDisplayed('none');
                content.setDisplayed('block');

                previewButton.show();

                wrapper.removeClass('fullscreen');

                this.editor.setOption('maxLines', Infinity);
                //this.editor.setAutoScrollEditorIntoView(true);

            }

            this.editor.resize(true);
        }, this);

        if (MarkdownEditor_content.content) {
            this.editor.setValue(MarkdownEditor_content.content);
        }
        this.editor.selection.clearSelection();

        preview.update(this.parse(this.editor.getValue()));

        this.editor.getSession().on('change', function(e){
            var parsed = mde.parse(mde.editor.getValue());


            //mde.textarea.dom.value = parsed;
            //mde.taMarkdown.dom.value = mde.editor.getValue();
            //preview.update(parsed);
        });
    }
});
MarkdownEditor = new MarkdownEditor();