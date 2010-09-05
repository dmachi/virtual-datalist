dojo.provide("dojoc.dmachi.virtual.SelectionManager");

dojo.declare("dojoc.dmachi.virtual.SelectionManager", dojoc.dmachi.virtual.Component, {
	componentType: "SelectionManager",
	multipleSelect: true,

	constructor: function(params){
		dojo.mixin(this, params);
		this.selectedByIndex={};
		this.focused=null;
		//this.keyboardManager= this.getKeyboardManager();
		this.subscribeInternalEvent("onVirtualRowClick", this, "onVirtualRowClick");
		this.subscribeInternalEvent("onVirtualRowFocus", this, "onVirtualRowFocus");
		this.subscribeInternalEvent("onVirtualRowBlur", this, "onVirtualRowBlur");
		this.subscribeInternalEvent("onVirtualRowMouseEnter", this, "onVirtualRowMouseEnter");
		this.subscribeInternalEvent("onKeyDown", this, "onKeyDown");

		if (!this.id){
			this.id="SelectionManager";
		}
		this.expose("getSelectionManager", "getSelectionManager");
		this.expose("deselectAll","deselectAll");
		this.expose("selectAll","selectAll");
		this.expose("selectItem","selectItem");
		//this.expose("selectRange","selectRange");
		this.expose("getSelectedItems", "getSelectedItems");
	},

	getSelectionManager: function(){
		return this;
	},

	isSelector: function(domEvent){
		//	summary:
		//		Returns true if the passed event is allowed to change the selection
		//		state of the item (for example, by acting on a node that toggles
		//		selection, if clicking elsewhere should be ignored). Override this
		//		to implement your own logic.
		return true;
	},

	getSelectMode: function(){
		//	summary:
		//		Determines what kind of selection operation should happen. Returns
		//		"multi-item" (multi-select, one item at a time), "multi-range"
		//		(multi select, in a range of items), or "single" (single select).
		//		Override this to implement your own logic.
		var kbm = this.getParent().getKeyboardManager();

		if(!this.multipleSelect || !kbm){
			return "single";
		}else{
			return kbm.isKeyDown("shift") ? "multi-range" : (kbm.isKeyDown("control") ? "multi-item" : "single");
		}
	},

	onVirtualRowClick: function(row, item, domEvent){
		if(this.isSelector(domEvent)){
			var key = row.getItemIdentity();
			var smgr = this.getParent().getStateManager();
			if (smgr && typeof key != "undefined") {
				var current = smgr.getState(key);
				if (!current || !current.selected) {
					switch(this.getSelectMode()){
						case "multi-range":
							// SELECT RANGE
							break;
						case "multi-item":
							this.selectItem(key);
							break;
						default:
							this.deselectAll();
							this.selectItem(key);
					}
				}else{
					this.publishInternalEvent("setState",[key, {selected: false}]);
				}
			}
		}
	},
	onVirtualRowMouseEnter: function(row, item, domEvent){
		if(this.focusedRow !== row){
			this.getParent().focusChild(row, true);	
		}
	},

	onVirtualRowFocus: function(row, item, domEvent){
		this.focusedRow = row;
	},

	onVirtualRowBlur: function(row, item, domEvent){
		this.focusedRow = null;
	},

	onKeyDown: function(e){
		var next;
		var p = this.getParent();
		var key = e.keyCode;
		var topIndex, rowCount, ch;
		switch(key){
			case dojo.keys.HOME:
				this.getParent().attr("topIndex", [0,0]);
				this.focusedRow=p.getChildren()[0];
				p.focusChild(this.focusedRow);
				break;
			case dojo.keys.END:
				ch = p.getChildren();
				topIndex = p.attr("topIndex");
				rowCount = p.attr("rowCount");

				//this needs to be better to figured out what the last fully visible one is
				//its off on occasion
				var newTop = rowCount - ch.length + 2;
				p.attr('topIndex', [newTop,0]);
				p.focusChild(ch[ch.length-3]);	

				break;
			case dojo.keys.DOWN_ARROW:
				if (this.focusedRow){
					next = this.focusedRow.getNextSibling();
				}

				if (!next.getNextSibling()){
					next=null;
				}

				if (next) {
					p.focusChild(next);	
				}else {	
					topIndex = p.attr('topIndex');
					var focusIdx = p.getIndexOfChild(this.focusedRow);
					rowCount = p.attr("rowCount");
					//console.log("topIndex: ", topIndex, "focusIdx: ", focusIdx, " rowCount: ",rowCount);
					if (topIndex + focusIdx + 2 > rowCount){
						//console.log("end of the road jack", this.focusedRow.id, this.focusedRow);
						p.focusChild(this.focusedRow);
						return;	
					}	
					var def = p.attr('topIndex', [topIndex + 1, 0]);					
					if (this.focusedRow) {	
						//console.log("postSet callback", this.focusedRow);
						p.focusChild(this.focusedRow.getPreviousSibling());
					}else{
						//console.log("postSet callback get last child");
						ch = p.getChildren();
						p.focusChild(ch[ch.length-2]);
						//console.log(" 	last child", ch[ch.length-2]);
					}
				}
				break;
			case dojo.keys.UP_ARROW:
				var children = p.getChildren();

				if (this.focusedRow){
					if (this.focusedRow == children[0]) {
						topIndex = p.attr('topIndex');
						if (topIndex == 0){break;}
						p.attr('topIndex', [topIndex-1,0]);
						next=this.focusedRow;
					}else{
						next = this.focusedRow.getPreviousSibling();
					}

					p.focusChild(next);	
				}
				break;

			case dojo.keys.SPACE:
				if(this.focusedRow){
					key = this.focusedRow.getItemIdentity();
					var smgr = this.getParent().getStateManager();
					var current = smgr.getState(key);
					if (!current || !current.selected) {
						switch(this.getSelectMode()){
							case "multi-range":
								// SELECT RANGE
								break;
							case "multi-item":
								this.selectItem(key);
								break;
							default:
								this.deselectAll();
								this.selectItem(key);
						}
					}else{
						this.deselectItem(key);
					}
				}
				break;
		
		}
	},

	deselectAll: function(){
		this.publishInternalEvent("updateAllStates", [{selected: false}]);
	},

	deselectItem: function(id){
		this.publishInternalEvent("setState",[id, {selected: false}]);
	},

	selectItem: function(id){
		this.publishInternalEvent("setState",[id, {selected: true}]);
	},

	selectAll: function(){
		var p = this.getParent();
		if (p.store) {
	
			var store = p.store;
			var query = p.query || {};
			var qopts = p.queryOptions || {};
			store.fetch({query: query, queryOptions: qopts, scope: this, onItem: function(item){
					var id = store.getIdentity(item);
					this.selectItem(id);
			}});
		}else{
			console.log("no store defined");
			//TODO List based Select All from p.items
		}
	},

	getSelectedItems: function(){
			var smgr = this.getParent().getStateManager();
			var items = smgr.getItemsByState({selected: true});
			return items;
	}
});
