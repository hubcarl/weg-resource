var fs = require('fs');
var path = require('path');
var log=console.log;

/**
 * weg 资源映射查找
 * @param www 应用根目录
 * @param client 前端静态资源根目录文件夹名称
 * @constructor
 */
function ResourceMap(www, client) {
    this.www = www;
    this.client = client;
    this.lazyload();
}

/**
 * Conver source map id to source url.
 * @see /config/ns-map.json file.
 * @param  {[type]} id [description]
 * @return {[type]}    [description]
 */
ResourceMap.prototype.resolve = function(id) {
    var info = this.getInfo(id);
    
    return info ? info.uri : '';
};

ResourceMap.prototype.getInfo = function(id, ignorePkg) {

    // resId:widget/pagelets/async/async.tpl
    var info;
    //console.log('getInfo[resId]0:' + id);
    if (id && this.maps || this.lazyload()) {
        var resId = id.replace(this.www + '/', "");
        //console.log('getInfo[resId]1:' + resId);
        if(!new RegExp('^'+this.client).test(resId) ){
            if(new RegExp('.tpl$').test(resId)){
                resId = path.join(path.join(this.client , 'views'), resId);
            }else{
                resId = path.join(this.client, resId);
            }
        }
        //console.log('getInfo[resId]2:' + resId);
        info = this.maps['res'][resId];
        if (!ignorePkg && info && info['pkg']) {
            info = this.maps['pkg'][info['pkg']];
        }
        //console.log('getInfo[id]:' + id + ' [resId]:' + resId + ' [info]:' + JSON.stringify(info));
    }
    return info;
};

ResourceMap.prototype.getPkgInfo = function(id) {

    var info;

    if (this.maps || this.lazyload()) {
        info = this.maps['pkg'][id];
    }

    return info;
};


ResourceMap.prototype.lazyload = function () {

    var mapFilePath = path.join(path.join(this.www, this.client), 'map.json');

    //console.log('---mapFilePath:' + mapFilePath);

    try {
        var mapJSONStr =  fs.readFileSync(mapFilePath);
        this.maps = JSON.parse(mapJSONStr);
        //console.log('>>>>mapJSONStr:'+ mapJSONStr);
    } catch (e) {
        console.log('---read map error:' + e.toString());
        return false;
    }
    return true;
};

ResourceMap.prototype.destroy = function (id) {
    this.maps = null;
};


module.exports = function (options) {
    options = options || {};

    var www = options.www||'';
    var client = options.client||'';
    var cache = options.cache;
    var singlon = new ResourceMap(www, client);

    return function (req, res, next) {
        var destroy;

        res.resourceMap = cache ? singlon : new ResourceMap(www, client);

        destroy = function() {
            res.removeListener('finish', destroy);
            //res.removeListener('close', destroy);

            cache && res.resourceMap.destroy();
            res.resourceMap = null;
        };

        res.on('finish', destroy);
        //res.on('close', destroy);

        next();
    };
};

module.exports.ResourceMap = ResourceMap;