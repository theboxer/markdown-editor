MarkdownEditor.window.Cropper = function(config) {
    config = config || {};
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
        ,width: 900
        ,cls: 'modx-window'
        ,html: '<div class="image-upload-wrapper"><img src="' + URL.createObjectURL(config.file) + '"></div>'
        ,buttons: [{
            text: _('cancel')
            ,scope: this
            ,handler: this.close
        },{
            text: _('save')
            ,cls: 'primary-button'
            ,scope: this
            ,handler: this.upload
        }]
    });
    MarkdownEditor.window.Cropper.superclass.constructor.call(this,config);
    this.config = config;

};
Ext.extend(MarkdownEditor.window.Cropper, Ext.Window,{
    upload: function() {
        var sb = Ext.get('status-bar');
        var uploader = Ext.DomHelper.insertFirst(sb,{
            tag: 'div',
            id: 'upload_progress',
            html: '<i class="icon icon-spinner icon-spin"></i> Uploading image'
        });
        MODx.Ajax.request({
            url: MarkdownEditor_config.connectorUrl
            ,params: {
                action: 'mgr/editor/imageupload'
                ,image: $('.image-upload-wrapper > img').cropper("getDataURL")
                ,type: this.config.file.type
                ,name: this.config.file.name
            },
            listeners: {
                'success': {
                    fn: function(r) {
                        uploader.remove();
                        this.config.md.editor.insert('![' + r.name + '](' + r.path + ' "' + r.name + '")');
                    },
                    scope: this
                }
            }
        });

        this.close();
    }
});
Ext.reg('markdowneditor-window-cropper',MarkdownEditor.window.Cropper);
