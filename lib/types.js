dojo.provide("dojoc.dmachi.virtual.types");
dojoc.dmachi.virtual.types.tag={};

dojoc.dmachi.virtual.types.tag.A = {
	update: function(node, val, options){
		node.innerHTML='<A HREF="' + val + '">' + ((options.property)?this.getValue(options.property):val) + '</a>';  
	}
};

dojoc.dmachi.virtual.types.Widget= {
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

};

dojoc.dmachi.virtual.types.DtlTemplate = {
	update: function(col, node, val, options, reference) {
		var template = reference || (options.template ? new dojox.dtl.Template(options.template, true) : null);
		// the extraContext gets passed to the template as 'env'
		if(options.extraContext){
			if(val.set){
				val.set("env", options.extraContext);
			}else{
				val.env = options.extraContext;
			}
		}
		if(template){
			var context = new dojox.dtl.Context(val);
			context.setThis(val); // so we can call row class methods in the template
			node.innerHTML = template.render(context);
		}
		return template;
	}
};

dojoc.dmachi.virtual.types.DtlDataTemplate = {
	update: function(col, node, val, options, reference) {
		// the dojox.dtl.contrib.data bind_data directive wants an array of
		// items, but we always have just one, so stuff it into an array
		this.set("items", [this.set("item")]);
		dojoc.dmachi.virtual.types.DtlTemplate.update.apply(this, arguments);
	}
};
