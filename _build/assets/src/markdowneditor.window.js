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
