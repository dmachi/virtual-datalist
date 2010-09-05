# VirtualDataList

*IMPORTANT* Note that this repository is an in progress port from http://svn.dojotoolkit.org/dojoc/dmachi/.  While the files have been moved around, the guts of them have not been updated in this repository yet, as the final package/module structure is being debated amount the Dojo Committers.  Currently, I am only updating the documentation, so if you want to use the code, check it out from the above svn repository.  After the package/module decisions are finalized, I will port the code to the new structure.

VirtualDataList (VDL) is a set of widgets and components used to create customized virtual scrolling capabilities for Dojo/Dijit. While there is some amount of overlap between common functions of the dojox.grid infrastructure and the VDL, VDL isn't meant to have all of the capabilities the dojox grid contains.  It is primary purpose is as a base framework for creating other 'lazy' representation of potentially large sets of data.  Common examples would virtually scrolled table and a paged table.

A few common widgets, including the base widget in this system, are included in this package.  The VirtualList and VirtualDataList widgets are the base widgets (the latter depends on dojo.data stores). These include an essentially arbitrary set of features (in reality what is being worked on or tested at any modment).  In practice, a developer would generally extend one of these components minimally including the set of base components they want their widget to consume.  There are a number of ways these components can be combined to be optimal for a number of different situations, and the goal is to provide the minimal framework so that these components can be tied together to achieve that ooptimum.  Currently included in this package is an example PagedDataList, which allows a table/list to be viewed by page rather than scrolling.  

Example Pages can be found in dmachi/virtual-datalist/tree/master/tests/ 

## Overview

The base VDL widget, VirtualList, is simple in its capabilities.  Given an array of js objects, it provides a view of the array appropriate to the size it has available.  It has little functionality on its own outside of rendering a page of data.  The various VDL components, which may or may not be visual/widgets, are instantiated by the VirtualList to add in additional functionality and controls. For example, the Scrollbar component provides a scrollbar to the list allowing the user to scroll through the entire array of items.  It is a graphical element (the scrollbar itself) and a controller. As a controller it interprets the scrollbar position and then instructs the List to go to that position by passing it a new starting index.  A paging component does the same thing, except without a scrollbar. It determines the new starting index based on the page number clicked.  

One of the keys to any virtual viewing widget is of course in its rendering process. The VDL strives to not only minimize the number of nodes being rendered initially, but also to minimize the amount of dom that gets re-rendered.  To this end, the VDL widgets render X children "row" widgets where X is the number of visible children (plus a few extra).  The number of children widgets is fixed for any particular size of a VDL widget. When the size changes, then the children are reduced (if the VDL is made smaller) or increased as necessary to accomodate the new view.  When the view changes to a new page, each child row is assigned the item it is now responsible for representing.  Each child row is responsible for updating its content in the most efficient way it can.  It is preferable to update only the specific data elements within if possible rather than re-rendering the entire html for each row. 

Custom virtual widgets are primary composed by using one of the base widgets (VirtualList or VirtualDataList) and extending it to define the list of desired components.  Typically, this is some subset of the existing general components, and a customized Row component designed to render each row efficiently. 

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
                {field: "shortDesc", label: "Short Desc", type: "dojoc.dmachi.virtual.types.Widget", options: {dojoType: 'dijit.form.TextBox'}, className: "descColumn"}
        },

        footer: {
            className: "virtualfooter"
        }

The lists themselves are instantiated and used as any other Dijit widget, here is a declarative example

    <div id='VirtualDataList1' dojoType="dojoc.dmachi.VirtualDataList" store="testDataStore" title="Test Store" structure="dynStruct" estimatedRowHeight="31"></div> 

More detailed architecture documentation and notes can be found in the dmachi/virtual-datalist/tree/master/lib/docs .

