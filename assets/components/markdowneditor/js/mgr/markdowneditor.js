var MarkdownEditor = function(config) {
    config = config || {};
MarkdownEditor.superclass.constructor.call(this,config);
};
Ext.extend(MarkdownEditor,Ext.Component,{
    page:{},window:{},grid:{},tree:{},panel:{},combo:{},config: {}
});
Ext.reg('markdowneditor',MarkdownEditor);
MarkdownEditor = new MarkdownEditor();