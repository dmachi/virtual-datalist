dojo.provide("dojoc.dmachi.virtual.DnD");
dojo.require("dojoc.dmachi.virtual.Component");
dojo.require('dojo.dnd.Manager');

dojo.declare("dojoc.dmachi.virtual.DnD", dojoc.dmachi.virtual.Component, {
	componentType: "DnD",
	isSource: true,
	isTarget: false,
	dndType: ["DojoDataItem"],
	accepts: [],
	delay: 0, // pixels

	constructor: function(params){
		dojo.mixin(this, params);
		this.mouseDown=false;
		this._dndMap = {};
		this._connects=[];
		if (!this.id) { this.id="DnDSource"; }

		this.expose("getDnD", "getDnD");
		this.subscribeInternalEvent("onVirtualRowMouseMove", this, "onMouseMove");
		this.subscribeInternalEvent("onVirtualRowMouseUp", this, "onMouseUp");
		this.subscribeInternalEvent("onVirtualRowMouseDown", this, "onMouseDown");

		dojo.subscribe("/dnd/start", this, "onDndStart");
		dojo.subscribe("/dnd/drop", this, "onDndDrop");
		dojo.subscribe("/dnd/cancel", this, "onDndCancel");
		dojo.subscribe("/dnd/source/over", this, "onDndSourceOver");

		this._connects.push(dojo.connect(this.node, "ondragstart",   dojo.stopEvent));
		this._connects.push(dojo.connect(this.node, "onselectstart", dojo.stopEvent));
	},

	getDnD: function(){
		return this;
	},

	onMouseDown: function(row, item, evt){
		this.mouseDown = true;
		this._lastX = evt.pageX;
		this._lastY = evt.pageY;
		if(evt.button === dojo.dnd._lmb){
			dojo.stopEvent(evt);
		}
	},
	onMouseMove: function(row, item, evt){
		//console.log("onMouseMove");
		if (dojo.hasClass(evt.target, "virtualScrollBox")){return;}
		if (!this.isDragging && this.mouseDown) {
			var sel = this.getParent().getSelectedItems();
			if((sel && sel.length>0) && (Math.abs(evt.pageX - this._lastX) > this.delay || Math.abs(evt.pageY - this._lastY) > this.delay)){
				this.startDrag(sel, evt);
			}
		}

		//if(this.isDragging){
			// calculate before/after
			//var m = dojo.dnd.manager();
			//m.canDrop(m.source != this);
		//}

	},

	createDndItems: function(selected){
		return dojo.map(selected, function(s){
			var item = {
				id: s[0],
				data: {identity :s[0]},
				type: this.dndType
			};
			this._dndMap[s[0]] = item;
			return item;
		},this);
	},

	startDrag: function(selected, evt){
		if (!this.isDragging){
			this.isDragging=true;
		}
		var p = this.getParent();
		var mgr = dojo.dnd.manager();
		this._dndMap = {};

		var sel = this.createDndItems(selected);

		mgr.startDrag(this, sel, true/* only copy right now */);
	},

	onMouseUp: function(row, item, /*DomEvent*/e){
		// summary:
		//              Event fires on key up.
		//
		//console.log("onMouseUp() ", arguments);
		this.mouseDown=false;
		this.isDragging=false;
        },

	isMouseDown: function(){
		return this.mouseDown;
	},

	onDndStart: function(){
		this.isDragging=true;

		//mouse isn't really down, but we don't care about it anymore
		//and we dont' want to miss the mouseup event
		this.mouseDown=false;
	},

	onDndSourceOver: function(){
	},

	onDndDrop: function(){
		this.onDndCancel();
	},

	onDndCancel: function(){
		this.isDragging=false;
	},

	onDrop: function(source, nodes, copy){
	},

	onDropExternal: function(source, nodes, copy){
	},

	onDropInternal: function(source, nodes, copy){
	},

	onDraggingOver: function(){
	},

	onDraggingOut: function(){
	},

	checkAcceptance: function(source ,nodes){
		return true;
	},

	getItem: function(id){		
			var res = this._dndMap[id];
			return res;
	},

	_markDndStatus: function(copy){
		this._changeState("Source", copy ? "Copied" : "Moved");
	},

	copyState: function(keypressed){
		return true;
	},

	_normalizedCreator: function(/*dojo.dnd.Item*/ item, /*String*/ hint){
		// summary:
		//              adds all necessary data to the output of the user-supplied creator function
		var t = this.creator.call(this, item, hint);
		if(!dojo.isArray(t.type)){ t.type = this.dndType; }
		if(!t.node.id){ t.node.id = item.id; }
		dojo.addClass(t.node, "dojoDndItem");
		return t;
	},

	creator: function(item){
		var n= dojo.create("div", {innerHTML: "Item " + item.identity});
		return {node: n, data: item, type: item.type};
	},

	_changeState: function(type, newState){
		// summary:
		//              changes a named state to new state value
		// type: String
		//              a name of the state to change
		// newState: String
		//              new state
		var prefix = "dojoDnd" + type;
		var state  = type.toLowerCase() + "State";
		var node = this.getParent().domNode;
		//dojo.replaceClass(this.node, prefix + newState, prefix + this[state]);
		dojo.removeClass(node, prefix + this[state]);
		dojo.addClass(node, prefix + newState);
		this[state] = newState;
	},
	destroy: function(){
		dojo.forEach(this._connects, dojo.disconnect);
	}
});

