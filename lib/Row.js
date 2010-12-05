define(["dojo", "./Component","dijit", "./types", "dijit._Widget"], function(dojo, Component, dijit, types){
	return dojo.declare([dijit._Widget, Component], {
		constructor: function(){
			this.columns = {};
			this.columnStructure = {};
			this.connectedEventHandles = [];
			this.columnUpdateInstances = {};
			this.state = {};
		},
		selectedClassName: "selected",
		hoverClassName: "hover",

		componentType: "VirtualRow",

		defaultStructure: {
			row:{
				className: "virtualRow",
				columns: [
					{field: "name"}
				]
			}
		},

		connectEventsMap: {
			onclick: "onClick",
			onmouseover: "onMouseOver",
			onmouseout: "onMouseOut",
			onmouseenter: "onMouseEnter",
			onmouseleave: "onMouseLeave",
			onmousedown: "onMouseDown",
			onmouseup: "onMouseUp",
			onmousemove: "onMouseMove",
			onfocus: "onFocus",
			onblur: "onBlur"
		},
		
		connectEvents: [
			{node: "domNode", events: ["onclick", "onmouseover", "onmouseout", "onmouseenter", "onmouseleave","onmousedown","onmouseup","onmousemove","onfocus","onblur"]}
		],

		initConnects: function(){

		//TODO If we're going to have the map, lets switch to it instead of iterating over connectEvents
			dojo.forEach(this.connectEvents, function(def){
				if(def.node){
					dojo.forEach(def.events, function(eventName){
						this.connectedEventHandles.push(dojo.connect(this[def.node], eventName, this, this.connectEventsMap[eventName] ? function(evt){
							var method = this.connectEventsMap[eventName];
							var item = this.get("item");
							var result = this[method](item, evt);
	
							// FIXME: the method.substring(2) below depends on the methods on this
							//        object being named the same as the events we're propagating
							//        up to the VirtualList
							if(result || typeof result == "undefined"){
								this.publishInternalEvent("on" + this.componentType + method.substring(2), [this, item, evt]);
							}
							return false;
						} : "eventHandler"));
					}, this);
				}	
	
				if(def.query){
					console.log("TODO://connectEvents query");
				}
			},this);
		},

		eventHandler: function(evt){
			// generic event handler for things not in the connectEventsMap
			//console.log(this.id, "eventHandler", evt);
		},
	
		buildRendering: function(){
			//console.log(this.id, "buildRendering()");
			this.inherited(arguments);
			this.domNode = dojo.doc.createElement("tr");
			dojo.attr(this.domNode, {tabindex: "-1"});
			this.initConnects();
			//this.subscribeInternalEvent("onSetState", this, "handleSetState");
	
			var p = this.getParent();
			if (p && p["getStateManager"]){
				this.stateManager = p.getStateManager();
			}else{
				console.warn("No State Manager Found.");
			}
	
		},
		stateManager: null,
		_getStateManagerAttr: function(){
			if (this.stateManager) { return this.stateManager; }
	
			var p = this.getParent();
			if (p && p["getStateManager"]){
				this.stateManager = p.getStateManager();
			}
			return this.stateManager;	
		},
	
		state: null,
		_setStateAttr: function(state){
			if (!state){this._resetState();}
			//console.log("_setStateAttr: ", state);
			var hasSel = dojo.hasClass(this.domNode, this.selectedClassName);
			if (state.selected && !hasSel) {
				//console.log("Setting Node selected with class: ", this.selectedClassName);
				dojo.addClass(this.domNode, this.selectedClassName);
			}else if (hasSel && !state.selected ){
				dojo.removeClass(this.domNode, this.selectedClassName);
			}
			this.state = state;	
		},
	
		_resetState: function(){
			// set this widget back to its default state
			dojo.removeClass(this.domNode, this.selectedClassName);		
		},

		hide: function(){
			dojo.addClass(this.domNode, "dijitHidden");
		},

		show: function(){
			dojo.removeClass(this.domNode, "dijitHidden");
		},
	
		item: null,
		_setItemAttr: function(item){
			this.item = item;
			//console.log(this.id, "setItemAttr()", this.getItemIdentity(), item);
			var s = this.get("stateManager");
	
			try {
				var smgr = this.get("stateManager");
				var key = this.getItemIdentity();
				if (smgr && typeof key != "undefined") {
					this.set('state', smgr.getState(key));
	
					if (this._stateSub) {
						dojo.unsubscribe(this._stateSub);
					}
					this._stateSub = this.subscribeInternalEvent("onSetState/" + key, this, function(state){this.set('state', state);});	
				}
	
			}catch(err){
			//	console.warn("Error communicating with StateManager component, unable to get current state", err);
			}
	
			var val,
			    p = this.getParent(),
			    cmgr = p && p["getCacheManager"] && p.getCacheManager();
	
			for (var i in this.columns){
				if(cmgr){
					// fast track the column if the output is already cached
					var cached = cmgr.cache(this.getItemIdentity() + "-" + i);
					if(cached){
						this.columns[i].innerHTML = cached;
						continue;
					}
				}
				if(item && typeof item[i]!='undefined'){
					if(this.columnStructure[i].transformers){
						val = this.getTransformedValue(i, this.columnStructure[i].transformers);
					}else{
						try {	
							val = this.getValue(i);
						}catch (err){
							console.error(this.id + " Error in getValue(): ",err);
						}
					}
					this.updateColumnValue(i, val);
				}else{
					this.updateColumnValue(i, this);
				}
		
			}
		},

		updateColumnValue: function(col, val){
			var structure = this.columnStructure[col];
			if (structure.type) {
				//console.log("Type: ", structure.type);
				var type= dojo.getObject(structure.type);
				//console.log("   Type Funcs ", type, type.create);
				var update = dojo.hitch(this, type.update || type.create);
				//console.log("structure: ", structure);
				this.columnUpdateInstances[col] = update(col, this.columns[col], val, structure.options || {},  this.columnUpdateInstances[col]);
			}else{				 	
				this.columns[col].innerHTML=val;
			}
	
			// FIXME: need to make sure we know when to invalidate the cache
			var p = this.getParent(), cmgr = p && p["getCacheManager"] && p.getCacheManager();
			if(cmgr){
				cmgr.cache(this.getItemIdentity() + "-" + col, this.columns[col].innerHTML);
			}
		},
	
		getValue: function(prop){
			if(this.columnStructure[i] && this.columnStructure[i]['get'] && typeof this.columnStructure[i]['get'] == 'function'){
				return this.columnStructure[i]['get'](prop);
			}else if (this.columnStructure[i] && this.columnStructure[i]['field']) {
				if (this.item){
					return this.item[this.columnStructure[i]['field']];
				}
			}else{
				return this.item;
			}
			return undefined;	
		},
	
		getItemIdentity: function(){
			if (this.item && this.item.id){
				return this.item.id;
			}
			//throw new Error(this.id + " Unable to get ID of item: ", this.item);
			//console.warn("Unable to get ID of item: ", this.item);
			return null;
		},
	
		getTransformedValue: function(prop, transformers){
			var ctor;
			var val = this.getValue(prop);
			var current = val;
	
			this.memoizeTransformers(transformers);
	
			dojo.forEach(this._memTrans, function(t){
				var ctor = t[0]; var params=t[1];
				current = ctor(current,params);
			}, this);
		
			return current;		
		},
	
		memoizeTransformers: function(transformers){
			var ctor;
			if (this._memTrans){
				return;
			}
	
			this._memTrans = [];
	
			dojo.forEach(transformers, function(t){
				var ctor;
				if (typeof t == "string"){
					ctor = dojo.getObject(t);

					if (!ctor){
						ctor = dojo.getObject("dojoc.dmachi.transform." + t);
					}
	
					if (ctor){
						return this._memTrans.push([ctor, null]);
					}
					console.warn("Undefined Transform: ", t);
				}

				if (t.name || t.shortName) {
					var n = t.name || "dojoc.dmachi.transform." + t.shorName;
					ctor = dojo.getObject(n);
					if (ctor) {
						return this._memTrans.push(dojo.getObject(n), t);
					}
		
					console.warn("Undefined Transform: ", t);
				}
	
				if (dojo.isFunction(t)){
					return this._memTrans.push(t, null);
				}
			},this);
		},
	
		_setStructureAttr: function(structure){
			//console.log(this.id, "_setStructureAttr()", structure);
			if (!structure || !this.structure.row) {
				this.structure = this.defaultStructure;
			}
	
			if (this.structure && this.structure.row && dojo.hasClass(this.domNode, this.structure.row.className)){
				dojo.removeClass(this.domNode, this.structure.row.className);
			}
	
			var s = structure.row||this.defaultStructure.row;
	
			if (this._memTrans){
				delete this._memTrans;
			}
	
			dojo.query("> *", this.domNode).orphan();
	
			//setup the new structure
			if (s.className){
				dojo.addClass(this.domNode, s.className);
				dojo.forEach(s.columns, this.buildColumn, this);
			}	
			if (this.item) {
				this.set("item",this.item);
			}
		},
	
		focus: function(){
			//console.log(this.id, "Row Focus()");
			dijit.focus(this.domNode);
		},
	
		onFocus: function(item, DOMEvent){
			//console.log(this.id, "onFocus()");
			dojo.addClass(this.domNode, this.hoverClassName);
	                if (this.structure.row.sharedContentNodeQuery){
	                        var n = dojo.query(this.structure.row.sharedContentNodeQuery, this.domNode)[0];
	
				if (n){
					this._hasSharedContent=true;
					this.publishInternalEvent("claimSharedContent", [n,null]);
				}
			}
			this.publishInternalEvent("onVirtualRowFocus", [this, this.item, DOMEvent]);
		},

		onBlur: function(item, DOMEvent){
			dojo.removeClass(this.domNode, this.hoverClassName);
		},
	
		buildColumn: function(columnStructure){
			//console.log("columnStructure: ", columnStructure);
			var id = columnStructure.field || columnStructure.label;
			if (!id) {
				throw new Error("Row column structure must either define a label or a field");
			}
	
			var td = this.columns[id] = dojo.doc.createElement("td");
			td.innerHTML="&nbsp;";
			if (columnStructure.className){
				dojo.addClass(td, columnStructure.className);
			}
			this.columnStructure[id]=columnStructure;
			this.domNode.appendChild(td);
		},
	
		getColumnWidths: function(){
			return dojo.query("td", this.domNode).map(function(node){
				return dojo.marginBox(node).w;
			});
		},
	
		setColumnWidths: function(widths){
			//console.log(this.id, "setColumnWidths()",widths);
			if (widths) {
				dojo.query("td", this.domNode).forEach(function(node,index){
					if (widths[index]){
						dojo.marginBox(node, {w: widths[index]});
					}
				});
			}
		},

		_getEventsAttr: function(){
			var res = [];
			for (var prop in this){
				if ((prop.match(/[A-Z][a-z]*/g)[0]=="on") && dojo.isFunction(this[prop])){
					res.push(prop);
				}
			}
			return res;
		},

		_getHeightAttr: function(){
			//console.log("_getHeightAttr");
			//return dojo.marginBox(this.domNode).h;	
			return dojo.style(this.domNode, "height")+1; 
		}
	});

	transform = {
		upper: function(val){
			return val.toUpperCase(val);
		}
	};
});
