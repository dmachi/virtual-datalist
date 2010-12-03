define(["dojo", "./Component"], function(dojo, Component){
	return {
		tag: {
			A: {
				update: function(node, val, options){
					node.innerHTML='<A HREF="' + val + '">' + ((options.property)?this.getValue(options.property):val) + '</a>';  
				}
			}
		},

		Widget: {
			update: function(col, node, val, options, reference){
				if (reference) {
					reference.set('value', val, false);
					return reference;
				}

				if (options.dojoType){
					var widget = dojo.getObject(options.dojoType);
					var w = new widget(options);
					if (col && w.onChange) {
						var field = col;
						dojo.connect(w, "onChange", this, function(newVal, oldVal){
							this.store.setValue(this.item, field, newVal);
						});	
					}	
					node.appendChild(w.domNode);
					return w.set('value', val, false);
				}

				return null;
			}

		}
	}
});
