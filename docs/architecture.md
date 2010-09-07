# Virtual Data List Architecture

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

    <div id='VirtualDataList1' dojoType="dojoc.dmachi.VirtualDataList" store="testDataStore" structure="dynStruct"></div> 


## Base Widget - VirtualList and VirtualDataList

## Component Manager

## Components

### Scrollbar

### Row/DataRow

### Header/Footer

### KeyboardManager

### DnD

### DynamicStructure

### State Manager

### Selection Manager

### Cache Manager


# Creating Custom Virtual Widgets

# Additional Info/Links


