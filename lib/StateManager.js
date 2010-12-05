define(["dojo", "./Component"], function(dojo, Component){

	return dojo.declare([Component], {
		componentType: "StateManager",
	
		constructor: function(params){
			dojo.mixin(this, params);
			this.states = {};
			this.expose("getStateManager", "getStateManager");
			this.subscribeInternalEvent("setState", this, "setState");
			this.subscribeInternalEvent("updateAllStates", this, "updateAllStates");
		},
	
		getStateManager: function(){
			return this;
		},
	
		getState: function(key){
			// get the state object for a particular key
			// this isn't exposed through the VirtualList, Rows or other components, can get
			// a reference to this component by calling the exposed getStateManager() call
			// if it is something they are interested in
			if (!this.states[key]) {
				this.states[key]={};	
			}
			return this.states[key];
		},
	
		setState: function(key, state){
			// update the state object for a particular key
			if (typeof key == "undefined") {
				console.warn("Invalid key for setState()", key, state);
				return;
			}
			if (state == null) {
				this.states[key] = {};
			} else {
				this.states[key] = dojo.mixin(this.states[key]||{}, state);
			}
			this.onSetState(key, state);
		},
	
		updateAllStates: function(state){
			for (var itemId in this.states){
				for (var newStateProp in state){
					if(this.states[itemId][newStateProp]!=state[newStateProp]){
						this.setState(itemId, state);
					}
				}
			}
		},

		onSetState: function(key, state){
			// event called when a state is updated
			var n = "onSetState/" + key;
			this.publishInternalEvent(n, [state]);
		},
	
		getItemsByState: function(state){
			var matches = [];
			for (var i in this.states) {
				var itemState = this.states[i];
				var match=true;
				for (var prop in state){
					if (itemState[prop]!=state[prop]){
						match=false;
						break;	
					}
					if (match){matches.push([i, itemState]);}
				}
			}
			return matches;
		}
	});
});
