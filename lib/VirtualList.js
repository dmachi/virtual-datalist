dojo.provide("dojoc.dmachi.VirtualList");
dojo.require("dijit.layout._LayoutWidget");
dojo.require("dojoc.dmachi.virtual.ComponentManagerMixin");
dojo.require("dojoc.dmachi.virtual.Component");
dojo.require("dojoc.dmachi.cache");
dojo.declare("dojoc.dmachi.VirtualList", [dijit.layout._LayoutWidget, dojoc.dmachi.virtual.ComponentManagerMixin], {
	// array of simple javascript objects.  One for each realrow
	items: [],

	baseComponents: [
		["dojoc.dmachi.virtual.StateManager", {}],
		["dojoc.dmachi.virtual.SelectionManager", {}],
		["dojoc.dmachi.virtual.Scrollbar", {}, "scrollContainer"],
		["dojoc.dmachi.virtual.Header", {}, "virtualListHeaderContainer"],
		["dojoc.dmachi.virtual.Row", {}]
	],

	// extraComponents: Array?
	// 		Optional array of additional components to augment (rather than replace) 
	// 		the default list in this.components
	extraComponents: null,

	// if you know what the height of a row is going to be, setting this will allow faster initial
	// painting of the table.  Strictly optional, but a significant performance difference
	// for the initial paint.
	estimatedRowHeight: 32,

	// Limit for virtual child rows.  This is more of a safety catch for dev than anything at the moment
	maxVisibleRows: 50,

	//Default Structure.  This will get used as the list structure if none is provided.
	defaultStructure: {
		header: {
			className: "listHeader"
		},

		row: {
			className: "listRow",
			columns: [
				{field: "name"}
			]
		},

		footer: {
			className: "listFooter"
		}
	},

	//template (not _Templated though!) for the List itself
	templateString: dojo.cache("dojoc.dmachi.virtual", "templates/VirtualList.html"),

	postMixInProperties: function(){
		this.inherited(arguments);
		this.buildRenderingDeferred = new dojo.Deferred();
		this.initComponents();
	},

	buildRendering: function(){
		//create the main layout for this widget.
		//Note that it is build from a templte string, but it is not a
		//templated widget. It only recognizes dojoAttachPoints currently

		this.inherited(arguments);
		//assign the template via inner html
		this.domNode.innerHTML = this.templateString;

		//wire up any dojoAttachPoints (simplified, one node only currently)
		dojo.query("[dojoAttachPoint]", this.domNode).forEach(function(n){
			//console.log("Attaching ", dojo.attr(n, "dojoAttachPoint"),n);
			this[dojo.attr(n, "dojoAttachPoint")]=n;
		},this);

		dojo.addClass(this.domNode, "virtualList");

		this._visibleRows = 0;

		this.buildRenderingDeferred.callback(true);

		//var exposedEvents = ["onClick","onMouseDown","onMouseUp","onKeyDown","onKeyUp","onKeyPress","onMouseMove","onMouseOver"];
		var exposedEvents = ["onClick"];//,"onMouseDown","onMouseUp","onKeyDown","onKeyUp","onKeyPress","onMouseMove","onMouseOver"];
		//dojo.forEach(exposedEvents, function(evt){
		//	this.connect(this.domNode, evt.toLowerCase(),evt);
		//},this);
	},

	postCreate: function(){
		//if there isn't a structure, setup one.  The structure passed is in mixed with defaultStructure
		//passing in empty object means we are just using the default structure
		if (!this.structure) {
			this.set("structure", this.defaultStructure);
		}
	},

	startup: function(){
		// console.log("STARTUP");
		if (!this._started){
			this._started=true;
			this.resize();
		}
	},

	layout: function(){
		// layout the children.  This may get called repeatedly while rendering.  Due to the inability to
		// measure the height of a node until it has been painted in ie6/7, there is a deferred setup
		// to this function.  It gets repeatedly called until(or when) there aren't enough rows
		// present to fill the space.  Supplying the estimatedRowHeight parameter allows the initial
		// creation to create the correct number of rows before the row height may be detected.  Using
		// this parameters allows the layout method to guess and render that many at one time.   While 
		// it need not be accurate to the pixel, if it is accurate then the correct number of
		// rows will be generated reducing the number of creation loops at startup.  Once the widget
		// has been initially rendered, the number of rows will adjust automatically.  Since we
		// will know the height of the row by this time, the calculation can be spot on.  In short
		// the estimate is entirely optional, but providing when possible provides a useful
		// optimization.


		//console.log(this.id, "layout() ContentBox h/w ", this._contentBox.h, this._contentBox.w, this._started, this._contentBox);
		if (!this._started || this._contentBox.h < 1){return;}
		this.publishInternalEvent("onStartLayout",[]);

		this._visibleRows = this.getChildren().length;


		// measure to see if there is a need for any row components, and if so create them
		// This function will return a deferred, but launches within a setTimeout(f,0)
		// It if it returns an error with error.rerunLayout set, this function will be called again
		// otherwise it wil proceed with the remaining layout methods and rendering callbacks

		var createCompDef = this.createRowComponents();

		//console.log("createCompDef: ", createCompDef);

		// render
		createCompDef.addCallback(this, function(){ if (!this._started){ return true; } else { return this.render(); }});

		// on successfully created enough rows to fill our space...
		//scrolling content
		createCompDef.addCallback(this, function(){
			var headerHeight = 0;
			dojo.query(".listLayoutHeaderRow", this.domNode).forEach(function(r){
				headerHeight += dojo.style(r, 'height');
			});

			console.log("Publish HeaderHeight: ", headerHeight, this._contentBox.h - headerHeight);
			this.publishInternalEvent("onSetViewportHeight",this._contentBox.h-headerHeight);
		});


		// catch any errors from any of this, including the "expected" error that may come from createRowComponents
		// in order to trigger layout() again. maxVisibleRows exists to limit this mainly during development,
		// but may have other uses in the future.
		createCompDef.addErrback(this, function(err){
			if (err.rerunLayout){
				if (this._visibleRows < this.maxVisibleRows) {
					this.layout();
				}else{
					this.render();
					this.publishInternalEvent("onSetViewportHeight",this._contentBox.h-dojo.style(this.listLayoutHeaderRow, "height"));
				}
			}else{
				console.error(err);
			}
		});
	},

	createRowComponents: function(){
		// do this async with setTimeout in case we are in the same execution block as dom creation
		// this function calculates how many more rows are needed to fill up our space and then creates
		// them.  If there are currently no visible rows.  The estimatedRowHeight will be used (if it exists)
		// to calculate how many rows to create initially

		var def = new dojo.Deferred();

		//console.info("createRowComponents Begin");
		setTimeout(dojo.hitch(this,function(){
			var currentRowHeight = this.get("rowHeight");
			var headerHeight = 0;
			dojo.query(".listLayoutHeaderRow", this.domNode).forEach(function(r){
				headerHeight += dojo.style(r, 'height');
			});

			this._visibleRows = this.getChildren().length;
			//console.log("createRowComponents - currentRowHeight: ", currentRowHeight, " visibleRows: ", this._visibleRows);

			if ((currentRowHeight * this._visibleRows||0+1)<=this._contentBox.h-headerHeight + (currentRowHeight*2)){
				console.log("before");
				var error = new Error("AddRowsError: "+ this._visibleRows);
				error.rerunLayout = true;
				var toAddCount = 1;

				if (!this._visibleRows && this.estimatedRowHeight){
					toAddCount = Math.round((this._contentBox.h-headerHeight)/this.estimatedRowHeight)+2;
				}
				var i=0;
				var newRows = [];
				//console.log("Created ", toAddCount, " new VirtualRow Components");
				while(i < toAddCount){
					var row = this.createComponent("VirtualRow");
					//console.log("New Row: ", row, this.containerNode, row.domNode);
					if (row) {
						this.containerNode.appendChild(row.domNode);
					}
					i++;
				}
				def.errback(error);
				console.log("after");
			}else{
				//calculate how many children we should remove, keeping this accurate
				//minimizes the amount of work that needs to be done on a rendering cycle
				//and is also used for keyboard handling to know when we are at the end of the
				//current page
	
				var newRowCount = Math.round((this._contentBox.h - headerHeight) / currentRowHeight)+2;
				if (this._visibleRows > newRowCount){
					var remove = this._visibleRows - newRowCount;
					//console.log("remove " , remove, " child rows for resize");
					var children = this.getChildren();
					while (children.length > newRowCount){
						this.removeChild(children.pop());
					}
					//console.log("new children len: ", this.getChildren().length);	
				}
		
				def.callback(true);
			}
		}),0);
		return def;
	},

	getDataPage: function(start, count){
		//get a single page of data, callback to updateChildren with array of data when complete
		//console.warn(this.id, "getDataPage()", start, count);
		var def = new dojo.Deferred();

		var rowCount = this.rowCount;
		if (this.items) {
			var items= this.items.slice(Math.min(start, rowCount), Math.min(start+count, rowCount));
			def.callback(items);
		}else{
			def.errback(new Error("No Items"));
		}

		return def;
	},

	updateChildren: function(items){
		//When we get a page Of Data trigger this callback, its return
		//value will be used by the renderer
		//console.log(this.id,'updateChildren: ', items.length);
		var rows = this.getChildren();

		//for each of our rows, set the rows item
		//attribute to whatever item index it
		//should now be representing.
		dojo.forEach(rows, function(row, index){
			//console.log("updateChildren: ", index);
			if (items[index]){
				row.set("item", items[index]);
				row.show();
			}else{
				row.hide();
			}
		},this);
	},

	render: function(){
		//(re)render the current page of data, kicks off the rendering proces for a page
		//gets called as the page changes via controller (scrollbar, pager, etc)
		if (!this._started){return;}
		//console.log("render()");
		this.publishInternalEvent("onStartRender", []);

		//the topIndex is the value for the current
		//first item in the list.

		if (!this.topIndex){
			this.topIndex=0;
		}else if (this.topIndex > this.rowCount){
			this.topIndex = this.rowCount;
		}

		// kick off the data retrieval.  We want start==topIndex, and count==_visibleRows
		var def = this.getDataPage(this.topIndex, this._visibleRows);

		// this will update each child with the item it is representing
		def.addCallback(this, "updateChildren");

		//notify components of the contentHeight(for scrollbars and whatnot)
		def.addCallback(this, function(){

			var fc = this.getFirstChild();
			if (fc){
				this.publishInternalEvent("onSetColumnWidths", fc.getColumnWidths());
			}
			this.publishInternalEvent("onSetContentHeight", this.rowHeight * this.rowCount);
		});

		def.addCallback(this, function(){
			this.publishInternalEvent("onEndRender", []);
		});

		def.addErrback(this, function(err){
			console.error("Virtual List Render caught error: ", err);
		});

		return def;
	},

	publishInternalEvent: function(event, message){
		var name = "/" + this.id + "/" + event;
		//console.log(this.id, "publishInternalEvent()", name, message);
		dojo.publish(name, [message]);
	},

	subscribeInternalEvent: function(evt, scope, cb){
		var name = "/" + this.id + "/" + evt;
		//console.log(this.id, "subscribeInternalEvent()", name);
		return dojo.subscribe(name, this, cb);
	},

	_getRowCountAttr: function(){
		// get the total number of rows we have in our data
		return this.items.length;
	},

	_setRowCountAttr: function(count){
		if (count != this.rowCount){
			this.rowCount = count;
			this.onSetRowCount();
		}
	},

	onSetRowCount: function(count){
		this.publishInternalEvent("onSetRowCount", count);
	},

	rowHeight: 0,
	_getRowHeightAttr: function(){
		// get the height of our rows.  This requests the information
		// from the row class so it can be implmented in varying ways
		// However, it currently only asks the _first_ child row and
		// assumes the rest are the same. While some applications
		// may want to have variable row height, this is not likely
		// to change in the future for this set of virtual lists.
   
		var fc = this.getFirstChild();
		if (fc){
			var x = fc.get("height");
			if (x!=this.rowHeight){
				this.set("rowHeight", x||0);
			}
		}
		return this.rowHeight;
	},
	_setRowHeightAttr: function(height){
		if (height != this.rowHeight){
			this.rowHeight=height;
			this.onSetRowHeight(height);
		}
	},

	onSetRowHeight: function(height){
		this.publishInternalEvent("onSetRowHeight", height);
	},

	getFirstChild: function(){
		// get the first child..this shouldn't really change (though i guess it technically could somehow)
		// so we can memorize it after we get it. The first child is needed frequently for
		// "rowHeight", so we don't want it to do the full query if we don't have to.
		if (!this._firstChild) {
			var kids = this.getChildren(); 
			//console.log(this.declaredClass + " getFirstChild: #children: " + kids.length); 
			//this._firstChild = this.getChildren()[0];
			this._firstChild = kids[0];
		}
		return this._firstChild;
	},

	topIndex: 0,
	_setTopIndexAttr: function(index){
		///console.log("_setTopIndexAttr() ", index);
		if(!this._started){ return; }
		if (!index){
			index = 0;
		}

		// if we were given an array, set topIndex and offset simultaneously
		var offset, def, updatedOffset;
		if(dojo.isArray(index)){
			offset = index[1];
			index = index[0];
		}
		if(typeof offset != "undefined"){
			updatedOffset = this._setOffset(offset, false);
		}

		//console.log("_setTopIndexAttr TopIndex: ", this.topIndex, " Index: ", index);
		if (this.topIndex != index){
			this.topIndex = index;
			def = this.render();
		}

		if (def) {
			def.addCallback(dojo.hitch(this, "onSetTopIndex", index));
			return def;
		}else if (updatedOffset){
			this.onSetOffset(offset);	
		}

	},
	onSetTopIndex: function(index){
		//console.log("onSetTopIndex: ", index);
		this.publishInternalEvent("onSetTopIndex",index || 0);
	},

	addChild: function(child){
		// same as container addChild(), but memoizes the
		// length...
		this.inherited(arguments);
		this.set("visibleRows", this.getChildren().length);
	},

	structure: {},
	_setStructureAttr: function(structure){
		//parse the structure defintion and tell our children about it
		//console.log("_setStructure: ", structure);
		this.structure = structure;
		this.onSetStructure(structure);
	},
	onSetStructure: function(structure){
		//console.log(this.id, " onSetStructure: ", structure, dojo.clone(structure));
		this.publishInternalEvent("onSetStructure", structure);
	},

	_visibleRows: 0,
	_getVisibleRowsAttr: function(){
		return this._visibleRows; // should always reflect this.getChildren().length;
	},
	offset: 0,
	_setOffsetAttr: function(offset){
		//console.log("_setOffsetAttr() ", offset);
		return this._setOffset(offset, true);
	},
	_setOffset: function(offset, render){
		if(this._started){
			if (offset != this.offset){
				this.offset=offset;
				dojo.style(this.offsetContainer, "top", offset + "px");
				if(render){
					var def = this.render();
					if (def) {
						def.addCallback(dojo.hitch(this, "onSetOffset", offset));
					}
				}

				return true;
			}
		}
		return false;
	},

	onSetOffset: function(offset){
		//console.log("onSetOffset: ");
		this.publishInternalEvent("onSetOffset",offset);
	},

	focusChild: function(child, offsetOnly){
		//console.log("focusChild() ", child.id, offsetOnly);
		var cmb = dojo.marginBox(child.domNode);
		//var headerHeight = dojo.style(this.listLayoutHeaderRow, "height");
		var headerHeight = 0;
		dojo.query(".listLayoutHeaderRow", this.domNode).forEach(function(r){
			headerHeight += dojo.style(r, 'height');
		});


		//var headerHeigh= dojo.marginBox(this.listLayoutHeaderRow).h;
		//console.log("focusChild test: ", ((cmb.t + cmb.h - this.offset)>(this._contentBox.h - headerHeight)), cmb.t + cmb.h, this._contentBox.h - headerHeight - this.offset, this.offset);
		var children = this.getChildren();
		if ((child === children[0])&&this.offset!=0){
			this._setOffset(0, false);
			child.focus();	
		}else if ((cmb.t + cmb.h)>(this._contentBox.h-headerHeight - this.offset)) {
			// obscured below
			if (offsetOnly && child.getNextSibling()) {
				var offset = (cmb.t+cmb.h) - (this._contentBox.h - headerHeight) - this.offset;
				this._setOffset(-(offset),false);
				child.focus();
			}else{
				var childIdx = this.getIndexOfChild(child);
				var currentTop = this.get("topIndex");
				var newTop = currentTop + 1;
				this.set("topIndex", [newTop, 0]);
				var handle = dojo.subscribe(this, "onSetTopIndex", this, function(){
					this.focusChild(children[0]);
					dojo.disconnect(handle);
				});	
			}
		}else{
			child.focus();
		}
	}
});
