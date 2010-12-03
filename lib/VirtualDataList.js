define(["dojo", "./VirtualList","./Scrollbar", "./DataRow", "./Header", "./StateManager", "./SelectionManager", "./KeyboardManager"], function(dojo, VirtualList, Scrollbar, DataRow, Header, StateManager, SelectionManager, KeyboardManager){



dojo.global.KeyboardManager = KeyboardManager;
dojo.global.StateManager = StateManager;
dojo.global.SelectionManager= SelectionManager;
dojo.global.Scrollbar = Scrollbar;
dojo.global.Header = Header;
dojo.global.DataRow = DataRow;

///dojo.require("virtual.DnD");
//dojo.require("virtual.DynamicStructure");

return dojo.declare("VirtualDataList", VirtualList, {
	baseComponents: [
		["KeyboardManager", {}],
	//	["virtual.DnD", {}],
		["StateManager", {}],
		["SelectionManager", {}],
		["Scrollbar", {}, "scrollContainer"],
		["Header", {}, "virtualListHeaderContainer"],
	//	["virtual.DynamicStructure", {}],
		["DataRow", {}]
	],
	
	// sortProps: Array
	// 		an array of objects to indicate sort preferences, c.f. ItemFileReadStore
	sortProps: null,

	constructor: function(){
		this.sortProps = [];
	},

	buildRendering: function(){
		this.inherited(arguments);
		if(typeof this.noDataMessage !== "undefined"){
			this.messageNode = dojo.create("td", {innerHTML:this.noDataMessage});
			var tr = dojo.create("tr", {className:"virtualListMessage"});
			dojo.place(this.messageNode, tr);
			dojo.place(tr, this.containerNode, "first");
		}
	},

	showMessage: function(){
		if(this.messageNode){
			this.messageNode.innerHTML = this.noDataMessage;
			dojo.style(this.messageNode.parentNode, "display", "block");
		}
	},

	hideMessage: function(){
		if(this.messageNode){
			dojo.style(this.messageNode.parentNode, "display", "none");
		}
	},

	store: null,
	_setStoreAttr: function(store){
		//console.log(this.id, "_setStoreAttr");
		if(this._deferredDataRequest){
			this._deferredDataRequest.cancel();
		}
		this.store = store;
		if(!this._started){ return; }
		var children = this.getChildren();
		//console.log("Children: ", children.length);
		dojo.forEach(children, function(child){
			child.set("store", store);
		},this);
		this.set("rowCount", 0);
		this.render();
		this.onSetStore(store);
	},
	onSetStore: function(store){
		this.publishInternalEvent("onSetStore", store);
	},

	query: null,
	_setQueryAttr: function(query){
		this.query = query;
		if(this._deferredDataRequest){
			this._deferredDataRequest.cancel();
		}
		this.publishInternalEvent("onSetQuery", query);
		if(!this._started){ return; }
		this.render();
	},

	queryOptions: null,
	_setQueryOptionsAttr: function(queryOptions){
		this.queryOptions = queryOptions;
		if(this._deferredDataRequest){
			this._deferredDataRequest.cancel();
		}
		if(!this._started){ return; }
		this.render();
	},

	getDataPage: function(start, count){
		//console.log(this.id, "getDataPage()", start, count);
		this.publishInternalEvent("getDataPage", [start, count]);
		if (!count){
			count = this.maxVisibleRows;
		}

		if (!this.requestNumber){
			this.requestNumber=0;
		}

		//console.log(this.id, "getDataPage() start:", start, " count: ", count, " _visibleRows: ", this._visibleRows, " Request Number: ", this.requestNumber);

		if(!this.store){
			throw new Error("No store specified for " + this.declaredClass);
		}
		var queryOptions = {start: Math.floor(start), count: count};
		if (this.queryOptions && typeof queryOptions == 'object'){
			dojo.mixin(queryOptions, this.queryOptions);
		}
		return dojo.when(this.store.query(this.query || {}, queryOptions),dojo.hitch(this, "onGetDataPage"));
	},

	onGetDataPage: function(res) {
		//console.log("res: ", res);
		this.set("rowCount", res.total);
		this.publishInternalEvent("onGetDataPage", [res]);
		return res;
	},


	_setRowCountAttr: function(count){
		//console.log("this.setRowCount: ", count);
		this.rowCount=count||0;
		this.publishInternalEvent("onSetRowCount", [count]);
	},

	updateChildren: function(result, request){
		// this override makes sure thtat requests dont' get processed out of order
		// that doesn't guarantee they are processed, just that an older one won't be processed after a newer 
		// one
		//console.log("updateChildren() ResultLength: ", result.length);
		if (request) {
			if(request.requestNumber < this.lastProcessedRequest){
				return;
			}else{
				this.lastProcessRequest = request.requestNumber;
			}
		}
		this.inherited(arguments);
	},

	_getRowCountAttr: function(){
		// get the total number of rows we have in our data
		return this.rowCount;
	}
});

});
