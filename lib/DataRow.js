define(["dojo", "./Row"], function(dojo, Row){
return dojo.declare(Row, {
        store: null,

	buildRendering: function(){
		this.inherited(arguments);
                this.subscribeInternalEvent("onSetStore", this, function(store){
                        this.set("store", store);
                });
	},

        getValue: function(property){
                return this.store.getValue(this.item, property);
        },

	getItemIdentity: function(){
		if (this._itemIdentity) {
			return this._itemIdentity;
		}
		if (this.item && this.store) {
			return this._itemIdentity = this.store.getIdentity(this.item);
		}
		//console.warn(this.id,"Unable to get Identity of: ", this.item);
		return null;
	},

	_setItemAttr: function(){
		this.store=this.parent.store;
		this._itemIdentity = null;
		this.inherited(arguments);
	}
});
});
