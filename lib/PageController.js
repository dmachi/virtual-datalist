dojo.provide("dojoc.dmachi.virtual.PageController");
dojo.require("dojoc.dmachi.virtual.Component");

dojo.declare("dojoc.dmachi.virtual.PageController", [dijit._Widget,dojoc.dmachi.virtual.Component], {
	maxPageLinks: 10,
	componentType: "Controller",
	templateString: '<span id="${id}_prevButton" class="pageController_prev">Prev</span><span id="${id}_pages"></span><span id="${id}_nextButton">Next</span>',
	buildRendering: function(){
		this.inherited(arguments);
		console.log("PagedDataListController buildRendering");
		var content = dojo.string.substitute(this.templateString,this); 
		this.domNode.innerHTML=content;

		this.connect(this.domNode, "onclick", "_onClick");

		this.subscribeInternalEvent("onSetRowCount", this, function(count){
			this.set("rowCount", count);
		});

		this.subscribeInternalEvent("onSetRowHeight", this, function(h){
			this.rowHeight=h;
		});

		this.subscribeInternalEvent("onSetTopIndex", this, "updateSelectedPage");
	
	
	},

	updateSelectedPage: function(topIndex){
		console.log("updateSelectedPage: ", topIndex);
	},

	postCreate: function(){
		this.inherited(arguments);
		console.log("finish scroll postCreate");
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

	rowCount: 0,
	_setRowCountAttr: function(count){
		console.log("_setRowCountAttr: " + count);
		var p = this.getParent();
		var visiblePageLinks;
		var visible = (p.get('visibleRows')-3) || 0; 
		console.log("visible: " + visible);
		this.rowCount = count;
		console.log("rowCount: " + this.rowCount);

		var cid = this.id + "_pages";
		console.log("cid: " + cid);
		if (count>0 && visible>0){
			dojo.style(cid, "display", "");
			var numPages = count/visible;				
		}else{
			dojo.style(cid, "display", "none");
			var numPages=0;
		}

		if (numPages>0){
			if (numPages > this.maxPageLinks){
				this.hiddenPageLinks=true;	
				visiblePageLinks = this.maxPageLinks
			}else{
				this.hiddenPageLinks=false;
				visiblePageLinks = numPages; 
			}

			var pageLinks = "";
			for (var i=visible;i<visiblePageLinks*visible;i+=visible){
				pageLinks += '&nbsp;&nbsp;<span pageIndex="' + i + '">Page ' + i + '</span>';	
			}
			dojo.byId(cid).innerHTML = pageLinks;
		}
	},

	_onClick: function(e){
		console.log("e.target: ", e.target, e.currentTarget);
		var idx = dojo.attr(e.target, "pageIndex") || 0;
		this.getParent().set("topIndex", idx);
	}
});
