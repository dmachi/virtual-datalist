define(["dojo", "./Component", "dijit", "dijit._Widget"], function(dojo, Component, dijit){

	return dojo.declare([dijit._Widget, Component], {
		_defaultContent: ["div", {innerHTML: "<button>Some Button</button>"}],
	
		// Four ways to get shared content. We try, in order:
		// 	* this.widget, an existing widget (or at least something with a .domNode property)
		// 	* this.node, an existing DOM node to use
		// 	* this.nodeDef, an array of arguments to pass to dojo.create to build the shared content
		// 	* if all else fails, use this._defaultContent as our nodeDef
	
		buildRendering: function(){
			this.domNode = this.containerNode = this.widget && this.widget.domNode || this.node || dojo.create.apply(dojo.global, this.nodeDef || this._defaultContent);
			dojo.style(this.domNode, "display", "none");
			this.expose("placeSharedContent", "placeSharedContent");
			this.subscribeInternalEvent("claimSharedContent", this, "placeSharedContent");
			this.subscribeInternalEvent("releaseSharedContent", this, "hide");
		},
	
		placeSharedContent: function(node, position){
			this.placeAt(node, position);
			dojo.style(this.domNode, "display", "");
		},
	
		hide: function(){
			dojo.style(this.domNode, "display", "none");
			this.placeAt(dojo.doc.body);
		}
	});

});
