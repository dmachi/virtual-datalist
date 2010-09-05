dojo.provide("dojoc.dmachi.VirtualDataList");
dojo.require("dojoc.dmachi.VirtualList");

dojo.require("dojoc.dmachi.virtual.Scrollbar");
dojo.require("dojoc.dmachi.virtual.DataRow");
dojo.require("dojoc.dmachi.virtual.Header");
dojo.require("dojoc.dmachi.virtual.StateManager");
dojo.require("dojoc.dmachi.virtual.SelectionManager");
dojo.require("dojoc.dmachi.virtual.KeyboardManager");
//dojo.require("dojoc.dmachi.virtual.DnD");
//dojo.require("dojoc.dmachi.virtual.DynamicStructure");

dojo.declare("dojoc.dmachi.VirtualDataList", dojoc.dmachi.VirtualList, {
	baseComponents: [
		["dojoc.dmachi.virtual.KeyboardManager", {}],
	//	["dojoc.dmachi.virtual.DnD", {}],
		["dojoc.dmachi.virtual.StateManager", {}],
		["dojoc.dmachi.virtual.SelectionManager", {}],
		["dojoc.dmachi.virtual.Scrollbar", {}, "scrollContainer"],
		["dojoc.dmachi.virtual.Header", {}, "virtualListHeaderContainer"],
	//	["dojoc.dmachi.virtual.DynamicStructure", {}],
		["dojoc.dmachi.virtual.DataRow", {}]
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
			child.attr("store", store);
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
		var cleanupDeferred = dojo.hitch(this, function(){
			delete this._deferredDataRequest;
		});
		var def = this._deferredDataRequest = new dojo.Deferred(cleanupDeferred);

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

		this.store.fetch({query: this.query, queryOptions: this.queryOptions, sort: this.sortProps, start: Math.floor(start), count: count, scope: def, onBegin: dojo.hitch(this,"_onBegin"),onComplete: def.callback, onError: def.errback, requestNumber: this.requestNumber++, topIndex: this.topIndex}); 
		def.addBoth(cleanupDeferred);
		//def.addCallback(dojo.hitch(this, function(res){this.publishInternalEvent("onGetDataPage",res);}));
		def.addCallback(this, "onGetDataPage");
		return def;
	},

	onGetDataPage: function(res) {
		this.publishInternalEvent("onGetDataPage", [res]);
	},

	_onBegin: function(count){
		console.log("_onBegin: ", count);
		this.set("rowCount", count);
	},

	_setRowCountAttr: function(count){
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

	_onFetchError: function(err){
		console.warn("_onFetchError: ", err);
	},

	_getRowCountAttr: function(){
		// get the total number of rows we have in our data
		return this.rowCount;
	}
});
