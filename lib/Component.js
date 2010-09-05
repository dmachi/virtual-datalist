dojo.provide("dojoc.dmachi.virtual.Component");

dojo.declare("dojoc.dmachi.virtual.Component", [dijit._Contained], {
	componentType: "BaseComponent",

	buildRendering: function(){
		this.inherited(arguments);

		this.subscribeInternalEvent("onSetStructure", this, function(structure){
				this.set("structure", structure);
		});

	},

	getParent: function(){
		// summary:
		//              Returns the parent widget of this widget, assuming the parent
		//              specifies isContainer
		return this.parent;
	},

	expose: function(name, f){
		//console.log("Exposing API Method on Table: ", name, f);
		var p = this.getParent();

		if (!p[name]) {
			p[name] = dojo.hitch(this, f);
		}
	},

	subscribeInternalEvent: function(evt, scope, cb){
		var name = "/" + this.getParent().id + "/" + evt;
		//console.log(this.id, "Subscribe: ", name);
		return dojo.subscribe(name, this, cb);
	},

	publishInternalEvent: function(evt, args ){
		var name = "/" + this.getParent().id + "/" + evt;
		//console.log(this.id, "Publishing Internal Event: ", name, args);
		return dojo.publish(name, args);
	}
});
