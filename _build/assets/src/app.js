var MarkdownEditor = function(config) {
    config = config || {};
    MarkdownEditor.superclass.constructor.call(this,config);
};
Ext.override(MODx.panel.Resource, {});

Ext.extend(MarkdownEditor,Ext.Component,{
    initComponent: function() {
        MarkdownEditor.superclass.initComponent.call(this);

        Ext.onReady(this.render, this);
    }

    ,buildUI: function() {
        this.textarea.setDisplayed('none');
        this.textarea.setWidth(0);
        this.textarea.setHeight(0);

        var wrapper = Ext.DomHelper.insertBefore(this.textarea, {tag: 'div'});

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'content-md',
            class: this.textarea.dom.className
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'preview-md'
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'div',
            id: 'toolbox',
            cn: [{
                tag: 'span',
                id: 'preview-button',
                html: '<i class="icon icon-toggle-off"></i> Preview'
            }]
        });

        Ext.DomHelper.append(wrapper,{
            tag: 'span',
            style: 'clear: both',
        });
    }

    ,registerAce: function() {
        this.editor = ace.edit(Ext.DomQuery.selectNode('div#content-md'));
        this.editor.setOptions({
            maxLines: Infinity,
            minLines: 15,
            showPrintMargin: false
        });
        this.editor.renderer.setShowGutter(false);
        this.editor.getSession().setValue(this.textarea.getValue());
        this.editor.getSession().setMode("ace/mode/markdown");
        this.editor.setTheme("ace/theme/monokai");
    }

    ,languageOverrides: {
        js: 'javascript'
        ,html: 'xml'
    }

    ,registerMarked: function() {
        var mde = this;
        var renderer = new marked.Renderer();

        renderer.code = function(code, lang, escaped) {
            if (this.options.highlight) {
                var out = this.options.highlight(code, lang);
                if (out != null && out !== code) {
                    escaped = true;
                    code = out;
                }
            }

            if (!lang) {
                return '<pre><code>'
                + (escaped ? code : escape(code, true))
                + '\n</code></pre>';
            }

            return '<pre><code class="hljs '
            + this.options.langPrefix
            + escape(lang, true)
            + '">'
            + (escaped ? code : escape(code, true))
            + '\n</code></pre>\n';
        };

        marked.setOptions({
            highlight: function(code, lang){
                if(mde.languageOverrides[lang]) lang = mde.languageOverrides[lang];
                return (hljs.listLanguages().indexOf(lang) != -1) ? hljs.highlight(lang, code).value : code;
            },
            renderer: renderer
        });
    }

    ,render: function() {
        var mde = this;
        this.textarea = Ext.get('ta');

        this.buildUI();
        this.registerAce();
        this.registerMarked();


        // copy back to textarea on form submit...
        //textarea.closest('form').submit(function () {
        //    textarea.val(editor.getSession().getValue());
        //});



        var previewButton = Ext.get('preview-button');
        var preview = Ext.get('preview-md');
        var content = Ext.get('content-md');

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

        previewButton.addListener('click', function (a,b,c,d) {
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

        preview.update(marked(this.editor.getValue()));
        this.editor.getSession().on('change', function(){
            preview.update(marked(mde.editor.getValue()));
        });
    }
});
MarkdownEditor = new MarkdownEditor();