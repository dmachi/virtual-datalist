define(["dojo", "dijit", "./component", "dijit._Widget"], function(dojo, dijit, Component){

	return dojo.declare([dijit._Widget, Component], {
		componentType: "Controller",
		constructor: function(){
			this.columns={};
		},

		buildRendering: function(){
			this.inherited(arguments);
			this.domNode=this.srcNodeRef;
			this.headerTable=dojo.doc.createElement("table");
			this.headerTbody=dojo.doc.createElement("tbody");
			this.headerRow=dojo.doc.createElement("tr");
			this.headerTable.appendChild(this.headerTbody);
			this.headerTbody.appendChild(this.headerRow);
			dojo.addClass(this.domNode, "virtualHeader");
			this.domNode.appendChild(this.headerTable);
			this.subscribeInternalEvent("onSetColumnWidths", this, "setColumnWidths");
			//this.subscribeInternalEvent("onStartLayout", this, "onParentStartLayout");
		},

		_setStructureAttr: function(structure){
			if (!structure || !structure.row) {
				this.structure = dojo.clone(this.getParent().defaultStructure);
			}else{
				this.structure = structure;
			}

			if (this.structure && this.structure.header && this.structure.header.className && dojo.hasClass(this.domNode, this.structure.className)){
				dojo.removeClass(this.domNode, this.structure.header.className);
	                }

			var row = this.structure.row;
			dojo.query("> *", this.headerRow).orphan();

			//setup the new structure
			if (row.className){
				dojo.addClass(this.domNode, row.className);
			}

			dojo.forEach(row.columns, this.buildColumn, this);

			//if (this.item) {
				//       this.set("item",this.item);
			//}
		},

		buildColumn: function(columnStructure, index){
			var field = columnStructure.field;
			//console.log("Adding ", field, " to header");
			var td = this.columns[field] = dojo.doc.createElement("th");

			if(columnStructure.className){
				dojo.addClass(td, columnStructure.className);
			}

			td.appendChild(dojo.doc.createTextNode(columnStructure.label || columnStructure.field || "Column " + index));
			this.headerRow.appendChild(td);
		},

		getColumnWidths: function(){
			return dojo.query("th", this.headerRow).map(function(node){
				return dojo.marginBox(node).w;
			});
		},

		setColumnWidths: function(widths){
			//console.log(this.id, "setColumnWidths()",widths);
			if (widths) {
				dojo.query("th", this.domNode).forEach(function(node,index){
					if (widths[index]){
						//console.log("Setting width of node: ", node, " to ", widths[index], this.headerTable);
						dojo.marginBox(node, {w: widths[index]});	
					}
				});
			}
		},

		onParentStartLayout: function(){
			//console.log(this.id, "onParentStartLayout() - Switching from fixed mode to allow proper re-layout");
			//dojo.style(this.headerTable, "table-layout", "");
		}

	});
});
