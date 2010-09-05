dojo.provide("dojoc.dmachi.virtual.Scrollbar");
dojo.require("dojoc.dmachi.virtual.Component");

dojo.declare("dojoc.dmachi.virtual.Scrollbar", [dijit._Widget, dojoc.dmachi.virtual.Component], {
	componentType: "Controller",
	buildRendering: function(){
		this.inherited(arguments);
		this.scrollBox = dojo.doc.createElement("div");
		dojo.addClass(this.scrollBox, "virtualScrollBox");
		this.fakeContent = dojo.doc.createElement("div");
		dojo.addClass(this.fakeContent, "virtualScrollFake");
		this.scrollBox.appendChild(this.fakeContent);
		var scroll = this.getScrollBarDims();
		dojo.style(this.domNode, "width", scroll.w+1 + "px");
		dojo.style(this.scrollBox, "width", scroll.w+1 + "px");
		this.domNode.appendChild(this.scrollBox);
		dojo.addClass(this.domNode, "virtualScrollbar");
		this.fakeContent.innerHTML="&nbsp;";
		console.log("Scrollbar buildrendering");
		this.subscribeInternalEvent("onSetContentHeight", this, function(h){
			this.set("contentHeight", h);
		});

		this.subscribeInternalEvent("onSetViewportHeight", this, function(h){
			dojo.style(this.scrollBox, "height", h + "px");
		});

		this.subscribeInternalEvent("onSetRowHeight", this, function(h){
			this.rowHeight=h;
		});

		this.subscribeInternalEvent("onSetOffset", this, "updateScrollPos");
		this.subscribeInternalEvent("onSetTopIndex", this, "updateScrollPos");
	
	
	},

	postCreate: function(){
		this.inherited(arguments);
		this.connect(this.scrollBox, "onscroll", "onScroll");
		this.connect(this.domNode.parentNode, !dojo.isMozilla ? "onmousewheel" : "DOMMouseScroll", "onMouseScroll");
		console.log("finish scroll postCreate");
	},

	contentHeight: 0,
	_setContentHeightAttr: function(height) {
		//console.log(this.id, "_setContentHeight", height);
		dojo.style(this.fakeContent, "height", height + "px");	
	},

	onMouseScroll: function(/*DomEvent*/evt){
		//	summary:
		//		Fired on Mouse Wheel spin
		//	tags:
		//		private
		//
		//console.log("onMouseScroll: ",evt);
		dojo.stopEvent(evt);
		var rawDelta =  (evt.detail ? (evt.detail * -1) : (evt.wheelDelta / 120) );
		var delta = rawDelta * (this.rowHeight) ||  10;   // *.5||10);
		//console.log("initial delta: ",delta, rawDelta);
		if (!delta){return;}
		var t = this.scrollBox.scrollTop;
		var newTop = t - delta;
		//console.log("adjusting scrollTop by: ", delta, t, newTop);
		this.scrollBox.scrollTop = newTop;
	},

	getScrollBarDims: function(){
		//	summary:
		//		Helper function to get the width of the browser scrollbars.
		//	tags:
		//		getScrollbar metrics node
		if (this._scrollDims){
			return this._scrollDims;
		}
		var scroll = {};
		try{
			var n=dojo.doc.createElement("div");
			n.style.cssText = "top:0;left:0;width:100px;height:100px;overflow:scroll;position:absolute;visibility:hidden;";
			dojo.body().appendChild(n);
			scroll.w = (n.offsetWidth - n.clientWidth) || 15;
			scroll.h = (n.offsetHeight - n.clientHeight) || 15;
			dojo.body().removeChild(n);
			delete n;
		}catch(e){console.warn(e);}

		this._scrollDims = scroll;
		return scroll;
	},


	//enable smooth scrolling
	smoothScrolling: true,

	onScroll: function(e){
		// this is the raw scroll event
		// TODO: reconcile this with the need to know rowHeight and move
		// as much of the scroll specific behavior into scrolling component.
		if (!e){return;}
		var p = this.parent;
		var tv = this.getTopVisible(e.target.scrollTop) || 0;

		//console.log("tv: ", tv);

		// the index we're headed to   
		var targetIndex = parseInt(tv,10);

		//console.log("targetIndex: ", targetIndex);

		// How much we should offset the whole table based on the positioning
		var offset=0;

		// row height //TODO memoizing should be done via getRowHeight, not here, check on it
		//var rh = this._rowHeight || this.getRowHeight();
		var rh = this.rowHeight;

		//calculate the offset by percentage of rowHeight that should be obscured
		if (targetIndex>0) {
			offset = (tv % targetIndex)*rh;
		}else{
			offset = tv * rh;
		}

		// if we have an offset, reposition the offset container to
		// achieve a smooth scrolling effect.
		var x;
		if (this.smoothScrolling) { //&& offset){
			x = -(offset) ;
			//dojo.style(this.offsetContainer, "top", x);
			//p.attr("offset", x);
		}//else{
		//	p.attr("offset", 0);
		//}

		// set both topIndex and offset
		//set ignore offset exists so we can ignore the setOffset that exists due to this scroll
		this._ignoreUpdateScroll=true;
		p.set("topIndex", [Math.floor(tv), x]);
		this._ignoreUpdateScroll=false;
	},

	updateScrollPos: function() {
		// when the offset is set by another component or event, we need to update the scroll bar
		if (this._ignoreUpdateScroll){return true;}
		//console.log('updateScrollPos', arguments);
		var p = this.getParent();
		var top = this.scrollBox.scrollTop;
		var topIndex= p.get("topIndex");	
		var offset = p.get("offset"); 
		//console.log("topIndex: ", topIndex, " offset: ", offset);
		var calcTop = Math.round((topIndex * this.rowHeight) - offset);
		//console.log("top: ", top, topIndex, calcTop);
		if (calcTop != top){
			this.scrollBox.scrollTop=calcTop;
		}
	},

	getTopVisible: function(scrollTop){
		// returns what the top index should be
		// based on the scroll height and row height
		// todo: use getRowHeight() and probably move to scrolling component
		//console.log(this.id, "getTopVisible()", scrollTop, this.rowHeigh);
		return scrollTop/this.rowHeight;
	}
});
