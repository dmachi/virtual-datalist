#VirtualList Architecture Notes

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

*  set/get Properties

   *  topIndex 

      Set the topindex, which is essentially to say rerender with item X at the top

   *  offset 

      Offset the whole table by X pixels.  This allows the scrolling movement to achieve smooth scrolling

   *  structure 

      define the structure/configuration of the list

   *  items

      Set an array of objects (items for DataList) to render in this table.  This bypasses paged queries.

   *  query (DataList only) 

      Set the query to be used when fetching data from the store.

*  get (readonly props)

   *  visibleRows 

      The number of visibleRows(should always represent the number of children)

   *  rowCount

      The total number of data rows

   *  rowHeight

      All rows are the same height, this is calculated from the size of the first child and cached here for performance.

*  Instantiation Only

   *   estimatedRowHeight 

     An estimation of the height of each rows.  During the initial rendering, this value will be used to avoid calculating the height of an actual row.  This allows the correct number of rows to be created on a single pass, improving performance when provided.  It is strictly optional.


Components can expose additional methods and events.  The above is not a complete list, but rather a number of the key properties that are commonly used in the base widgets only.  


### Lifecycle

*  postMixInProperties

   Components are initialized in postMixinProperties.  Components can addCallback() onto this.buildRenderingDeferred in order to instantiate dom properties after this.domNode has been created.  Components are defined as an array on baseComponents and extraComponents, with the latter available for runtime addition.

*  buildRendering

   This phase creates the base dom structure from a template defined in templateString.  *Note that the template used here currently only does innerHTML and processing of dojoAttachPoints.* After creation of the template/this.domNode, the buildRenderingDeferred is triggered, allowing the components complete and DOM dependent instantiation 

*  postCreate

   Setup a default structure (configuration) if one wasn't provided.

*  startup

   Allow normal rendering cycle to proceed by triggering resize()


### Rendering life cycle

*  resize() 

   This is the standard LayoutWidget resize method, which triggers a call to layout() only when there is a change to the size of the contentBox.  The current content box settings are stored in this._contentBox

*  layout()

   The layout method ensures that the correct number of children exist (the number of fully visible rows + 3) by adding or removing from the existing set.  This is an asynchronous process currently to allow for rendering challenges in IE **(TODO:see if it performs better making it sync again by inspecting offsetHeight)**.  An optional (but preferred) optimization for the initial rendering, is to provide the widget with an estimated row height, which allows the creation of all of the children at once.  If for some reason the value of this esitmate is incorrect, the widget will work fine, it will potentially be slightly slower for the initial rendering.  Upon completion of this process, the render() method is called, and finally it fires off an 'onSetViewportHeight' event.

   *  createRowComponents() does the work described above, and returns a deferred
		
*  render()

   * Fire 'onStartRender'

   * Based on this.topIndex (index of the first item in the list), request a page of data to render (getDataPage()), return deferrred

   * updateChildren() For Each child, tell it what item it now represents.

   * Based on the size of the children, fire onSetColumnWidths , and onSetContentHeight

   * fire 'onEndRender'	

	
### Updating Children

updateChildren(), called from render simply iterates through each child row calling child.set("item", currentItem); The child rows themselves are responsible for updating the html within those rows.

## Events

** TODO Add in the rest of the events **

   * onStartRender
   * onSetColumnWidgets
   * onSetContentHeight
   * onEndRender
   * onStartLayout
   * onSetTopIndex
   * onSetOffset
   * onSetStructure

## Component Manager

The Component Manager is a mixin included in the two base widgets.  It provides an infrastructure for components to be instantiated and method for communicating with the core widget and each other.

**TODO: describe the utilities and conventions used here**

## Components

*  Scrollbar

   The Scrollbar Component is a controller component.  It should be provided with a domNode by the consuming widget, and will create a native scrollbar inside of this domNode.  The scrollbar essentially works by creating a couple of nested Div 1px wider than the native scrollbar. The inner div (with content &nbsp;) has its height set to number of rows * rowHeight.  This basically creates an empy scrolling container.  As onscroll events happen, the scrollbar component calculates the index that should now be at the top, and calls set("topIndex", id); to scroll to that position. 'In reality it calls set("topIndex", [id, offset]) in order to provide smooth scrolling'

*  Row/DataRow
  
   This class should be a widget and is responsible for representing a single row at any one time.  A number of these rows get created to fill the viewport.  When re-rendering occurs, the container will call set("items", item)  on the row, so it can update the content within.  It should strive to avoid modifying and rerendering when it is not necessary. The base Row class is for non dojo.data aware widgets, while DataRow extends it to support dojo.data items. Custom row classes can (and should!) be used to allow for the most efficient re-rendering process possible.  The standard row classes read the data structure to know how to set themselves up within the widget infrastructure.  For example, by default each field will be a <td></td> in the final row.  A custom row, can be pretty much anything wrapped in <tr><td></td></tr>.  
  
   The current implementation has each row handle the processing of its own event, and then fire an event through the parent widget for consumption.  It is also possible, with a bit more work, to remove the per row event handling, and place this on the containing row itself.  Generally speaking, because there is a limit to the number of physical rows and they do not get recreated, the number of connections isnt too bad and not a problem.  The advantage is that it allows for easier identification of subrow events, and allows them to map to the parent in differing ways

*  Header/Footer

   The Header and Footer components act similiarly to the Row/DataRow components but are used for rendering the header rows and processing and emitting events related to these areas.  

*  KeyboardManager
 
   The KeyboardManager handles all of the keyboard events, potentially normalizing them, and then emits them as internal widget events.  Components are still free to perform their own connections to the widget's various domNodes, however this allows for easier separation and control of the order by which events will run.  Components are wired up in the order they exist within the baseComponents array.
  
*  DnD

   DnD controller provides dojo.dnd capabilities to the List widgets. 

*  State Manager

   Allows grid meta/state information to be stored in reference to a particular item in the index.  For example, the Selection Manager component, uses the state manager to represent when an item is selected. 

*  Selection Manager

   Manage the state and selection of items in the lists.

##  Creating Custom Virtual Widgets

**TODO: Write this and show some more examples.**

There is a test in [tests](dmachi/virtual-datalist/tree/master/tests)

# Additional Info/Links

None.

