dojo.provide("dojoc.dmachi.virtual.CacheManager");

dojo.declare("dojoc.dmachi.virtual.CacheManager", [dojoc.dmachi.virtual.Component], {
	componentType: "CacheManager",

	constructor: function(params){
		dojo.mixin(this, params);
		this._cache = {};
		this.expose("getCacheManager", "getCacheManager");
	},

	getCacheManager: function(){
		return this;
	},

	cache: function(key, value){
		//	summary:
		//		Get or set a cached value. This is intentionally a very simplistic
		//		implementation; it relies on components to determine how they wish
		//		to cache themselves.
		if(typeof value != "undefined"){
			this._cache[key] = value;
		}
		return this._cache[key];
	},

	invalidate: function(key){
		//	summary:
		//		Remove an item from the cache.
		if(key){
			delete this._cache[key];
		}
	}
});
