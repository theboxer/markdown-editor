markdownEditor.window.Cropper = function(config) {
    config = config || {};
    config.cropperSelector = config.cropperSelector || '.image-upload-wrapper > img';

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
        ,title: _('markdowneditor.cropper.crop_image')
        ,cls: 'modx-window'
        ,html: '<div class="image-upload-wrapper"><img src="' + URL.createObjectURL(config.file) + '"></div>'
        ,tbar: [{
            text: '<i class="icon icon-arrows"></i> ' + _('markdowneditor.cropper.move')
            ,scope: this
            ,param: 'move'
            ,action: 'setDragMode'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-crop"></i> ' + _('markdowneditor.cropper.crop')
            ,scope: this
            ,param: 'crop'
            ,action: 'setDragMode'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-search-plus"></i> ' + _('markdowneditor.cropper.zoom_in')
            ,scope: this
            ,param: 0.1
            ,action: 'zoom'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-search-minus"></i> ' + _('markdowneditor.cropper.zoom_out')
            ,scope: this
            ,param: -0.1
            ,action: 'zoom'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-rotate-left"></i> ' + _('markdowneditor.cropper.rotate_left')
            ,scope: this
            ,param: -90
            ,action: 'rotate'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-rotate-right"></i> ' + _('markdowneditor.cropper.rotate_right')
            ,scope: this
            ,param: 90
            ,action: 'rotate'
            ,handler: this.callCropperAction
        },{
            text: '<i class="icon icon-remove"></i> ' + _('markdowneditor.cropper.clear_cropper')
            ,scope: this
            ,param: null
            ,action: 'clear'
            ,handler: this.callCropperAction
        }]
        ,buttons: [{
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

                    var ratio = MODx.config['markdowneditor.cropper.aspect_ratio'];
                    if (ratio) {
                        ratio.replace(/[^-:x()\d/*+.]/g, '');
                        ratio = eval(ratio);

                        cropperOptions.aspectRatio = ratio;
                    }

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
    ,upload: function(button) {
        var uploader = this.config.md.createUploader('image', this.config.file.name);

        var formData = new FormData();
        formData.append('file', this.config.file);
        formData.append('action', 'mgr/editor/imageupload');
        formData.append('imageData', this.imageData);
        formData.append('name', this.config.file.name);
        formData.append('crop', button.crop);
        formData.append('resource', this.config.md.config.resource);

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
