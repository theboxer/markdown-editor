markdownEditor.window.OEmbed = function(config) {
    config = config || {};
    Ext.applyIf(config,{
        title: _('markdowneditor.oembed.embed_url')
        ,closeAction: 'close'
        ,resizable: false
        ,collapsible: false
        ,maximizable: false
        ,height: 180
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

        if (this.config.success) {
            Ext.callback(this.config.success,this.config.scope || this,[f.getValues()]);
        }

        this.close();
    }
});
Ext.reg('markdowneditor-window-oembed',markdownEditor.window.OEmbed);