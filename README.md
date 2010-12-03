# VirtualDataList

VirtualDataList (VDL) is a set of widgets and components used to create customized virtual scrolling capabilities for Dojo/Dijit. While there is some amount of overlap between common functions of the dojox.grid infrastructure and the VDL, VDL isn't meant to have all of the capabilities the dojox grid contains.  It is primary purpose is as a base framework for creating other 'lazy' representation of potentially large sets of data.  Common examples would virtually scrolled table and a paged table.

A few common widgets, including the base widget in this system, are included in this package.  The VirtualList and VirtualDataList widgets are the base widgets (the latter depends on dojo.data stores). These include an essentially arbitrary set of features (in reality what is being worked on or tested at any modment).  In practice, a developer would generally extend one of these components minimally including the set of base components they want their widget to consume.  There are a number of ways these components can be combined to be optimal for a number of different situations, and the goal is to provide the minimal framework so that these components can be tied together to achieve that ooptimum.  Currently included in this package is an example PagedDataList, which allows a table/list to be viewed by page rather than scrolling.  

Example Pages can be found in the [tests](virtual-datalist/tree/master/tests/)

VirtualLists are passed a structure definition which is used to control various behaviors or components.  

    dynStruct={
        header: {
            className: "virtualHeader"
        },

        row: {
            className: "virtualRow",
            columns: [
                {field: "id", label: "ID", className: "numberColumn"},
                {field: "name", label: "Name", className: "descColumn"},
                {field: "shortDesc", label: "Short Desc", 
			type: "dojoc.dmachi.virtual.types.Widget", 
			options: {dojoType: 'dijit.form.TextBox'}, className: "descColumn"}
        },

        footer: {
            className: "virtualfooter"
        }

The lists themselves are instantiated and used as any other Dijit widget:

    <div id='VirtualDataList1' dojoType="dojoc.dmachi.VirtualDataList" store="testDataStore" structure="dynStruct"></div> 

More detailed architecture documentation and notes can be found in the [docs/](virtual-datalist/tree/master/docs).

