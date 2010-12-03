define(["dojo", "./Component"], function(dojo, Component){
return dojo.declare([Component], {
	constructor: function(params){
		dojo.mixin(this, params);
		this.adjusted = false;

		this.subscribeInternalEvent("onGetDataPage", this, "onGetDataPage");
		this.subscribeInternalEvent("onSetQuery", this, "clearAdjust");

		if (this.getParent()._setStoreAttr) {
			this.subscribeInternalEvent("onSetStore", this, "clearAdjust");
		}
	},

	clearAdjust: function(){
		console.log("DynamicStructure clearAdjust()");
		this.adjusted=false;
	},	

	onGetDataPage: function(items){
		console.log("DynamicStructure onGetDataPage(): ", items, this.adjusted, arguments);
		if (items && items.length>0 && !this.adjusted) { 
			console.log("adjust structure to new query");
			var rawf = this.getParent().adjustStructure;
			if (dojo.isFunction(rawf)) { 
				var f = dojo.hitch(this.getParent(), rawf);
				f(items);
			}
			this.adjusted = true;
		}		
	}	
});

//dojo.extend(dojoc.dmachi.VirtualList, {adjustStructure: null});

});
