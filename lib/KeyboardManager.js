define(["dojo", "./Component"], function(dojo, Component){

	return dojo.declare(Component, {
		constructor: function(params){
			dojo.mixin(this, params);
			this.shiftDown=false;
			this.controlDown=false;
			this.expose("getKeyboardManager", "getKeyboardManager");
			var p = this.getParent();
			dojo.addOnLoad(dojo.hitch(this, function(){
				dojo.connect(p.domNode, "onkeydown", this, "onKeyDown");
				dojo.connect(p.domNode, "onkeyup", this, "onKeyUp");
				dojo.connect(p.domNode, "onkeypress", this, "onKeyPress");
			}));
		},

		onKeyPress: function(evt){
			//console.log("onKeyPress", evt);
		},

		onKeyDown: function(/*DomEvent*/e){
			// summary:
			//              Event firs on key down.
			//
			//console.log("onKeyDown");
			var key = e.keyCode;
			switch(key){
				case dojo.keys.SHIFT:
					this.shiftDown=true;
					break;
				case 91: // Mac Safari COMMAND
				case 224: // Mac FF COMMAND
				case dojo.keys.CTRL:
					this.controlDown=true;
					break;
				}
	
			this.publishInternalEvent("onKeyDown", [e]);
		},

		onKeyUp: function(/*DomEvent*/e){
			//console.log('onKeyUp');
			// summary:
			//              Event fires on key up.
			//
			var key = e.keyCode;
			switch(key){
				case dojo.keys.SHIFT:
					this.shiftDown=false;
					break;
				case 91: // Mac Safari COMMAND
				case 224: // Mac FF COMMAND
				case dojo.keys.CTRL:
					this.controlDown=false;
					break;
			}
			this.publishInternalEvent("onKeyUp", [e]);
		},

		getKeyboardManager: function(){
			return this;
		},

		isKeyDown: function(key){
			return this[key + "Down"];
		}
	});
});
