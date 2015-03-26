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
    markdownEditor.combo.CropperProfile.superclass.constructor.call(this,config);
};
Ext.extend(markdownEditor.combo.CropperProfile,MODx.combo.ComboBox);
Ext.reg('markdowneditor-combo-cropper-profile',markdownEditor.combo.CropperProfile);