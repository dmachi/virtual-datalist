#Virtual Data List Architecture

##Overview

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
                {field: "shortDesc", label: "Short Desc", 
			type: "dojoc.dmachi.virtual.types.Widget", options: 
			{dojoType: 'dijit.form.TextBox'}, className: "descColumn"}
        },

        footer: {
            className: "virtualfooter"
        }

The lists themselves are instantiated and used as any other Dijit widget, here is a declarative example

    <div id='VirtualDataList1' dojoType="dojoc.dmachi.VirtualDataList" store="testDataStore" structure="dynStruct"></div> 


##Base Widgets: VirtualList and VirtualDataList 

The base widget, VirtualList, is composed of dijit._LayoutWidget, a component manager, and ultimately the list implementation.  As described in the overview, this widget's sole purpose is to render a page of the data and aggragate the events.  The component manager mixin, provides methods and structures to load, instantiate and interact with the various plugins.  The VirtualDataList is functionally equivalent to the VirualList, but uses dojo.data to provide access to more complex data sources.


###API 

Most of the interface is via w.get/set.  The key properties are listed below

*set/get Properties
** topIndex 
Set the topindex, which is essentially to say rerender with item X at the top

** offset 
Offset the whole table by X pixels.  This allows the scrolling movement to achieve smooth scrolling

** structure 
define the structure/configuration of the list

** items
Set an array of objects (items for DataList) to render in this table.  This bypasses paged queries.

** query (DataList only) 
Set the query to be used when fetching data from the store.

*get (readonly props)
** visibleRows 
The number of visibleRows(should always represent the number of children)

** rowCount
The total number of data rows

** rowHeight
All rows are the same height, this is calculated from the size of the first child and cached here for performance.

*Instantiation Only
** estimatedRowHeight 
An estimation of the height of each rows.  During the initial rendering, this value will be used to avoid calculating the height of an actual row.  This allows the correct number of rows to be created on a single pass, improving performance when provided.  It is strictly optional.

Components can expose additional methods and events.  The above is not a complete list, but rather a number of the key properties that are commonly used in the base widgets only.  


### Lifecycle
* postMixInProperties
Components are initialized in postMixinProperties.  Components can addCallback() onto this.buildRenderingDeferred in order to instantiate dom properties after this.domNode has been created.  Components are defined as an array on baseComponents and extraComponents, with the latter available for runtime addition.

* buildRendering
This phase creates the base dom structure from a template defined in templateString.  *Note that the template used here currently only does innerHTML and processing of dojoAttachPoints.* After creation of the template/this.domNode, the buildRenderingDeferred is triggered, allowing the components complete and DOM dependent instantiation 

* postCreate
Setup a default structure (configuration) if one wasn't provided.

* startup
Allow normal rendering cycle to proceed by triggering resize()

### Rendering life cycle

* resize() 
This is the standard LayoutWidget resize method, which triggers a call to layout() only when there is a change to the size of the contentBox.  The current content box settings are stored in this._contentBox

* layout()
The layout method ensures that the correct number of children exist (the number of fully visible rows + 3) by adding or removing from the existing set.  This is an asynchronous process currently to allow for rendering challenges in IE (TODO:see if it performs better making it sync again by inspecting offsetHeight).  An optional (but preferred) optimization for the initial rendering, is to provide the widget with an estimated row height, which allows the creation of all of the children at once.  If for some reason the value of this esitmate is incorrect, the widget will work fine, it will potentially be slightly slower for the initial rendering.  Upon completion of this process, the render() method is called, and finally it fires off an 'onSetViewportHeight' event.

** createRowComponents() does the work described above, and returns a deferred
		
** render()
*** Fire 'onStartRender'
*** Based on this.topIndex (index of the first item in the list), request a page of data to render (getDataPage()), return deferrred
** updateChildren() For Each child, tell it what item it now represents.
*** Based on the size of the children, fire onSetColumnWidths , and onSetContentHeight
*** fire 'onEndRender'	
	
### Updating Children

updateChildren(), called from render simply iterates through each child row calling child.set("item", currentItem); The child rows themselves are responsible for updating the html within those rows.

## Events
* Internal Events
** onStartRender
** onSetColumnWidgets
** onSetContentHeight
** onEndRender
** onStartLayout
	
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


