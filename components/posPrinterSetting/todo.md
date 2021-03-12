[] PosPrinterSetting <br>
<ul>
    <li> </li>
</ul>
[] PosPrinterSettingForMultiple <br>
[] PosPrinterSettingGeneral <br>
[] PosPrinterSettingSidebar <br>


#logics
Singletons
###variables
<li> generalSetting:  </li>
<li> printerGroups: -> list of printer grouped by type: [kitchen | invoice | entire] </li>
<li> printerGroupsList: -> list of printers groups </li>
<li> printerGeneralSetting</li>
<li> printerHooks: fetchPrinterGroups,  </li>
<li> printerTypes: [network | usb | integrate |] </li>

###methods

<li> onCreatePrinterGroup </li>
<li> onRemovePrinterGroup </li>
<li> onUpdatePrinterGroup </li>
<li> onRemoveSelectingPrinter </li>
<li> onUpdateSelectingPrinterGroup</li>
<li> currentTarget: current view target</li>

#Factories

##PrinterSettingFactory
###Variables
<li> nameInputRef </li>
<li>ipInputRef </li>
<li> fontSizeList: [1, 2, 3] cons </li>
<li> marginSizeList: [] cons </li>
<li> hardwares: hardwares list </li>
<li> settings / printers </li>
<li> selectingPrinter </li>
<li> dineInTax </li>
<li> takeAwayTax</li>
<li> showDialog</li>
###Methods
<li> openDialog</li>
<li> onSelectPrinterType </li>

<li> addNewPrinter </li>
<li> removePrinter </li>
<li> updatePrinter </li>
<li> test printer </li>

##SidebarFactory

###variables

<li> sidebarData </li>
###methods
<li> </li>

```javascript
//Printer Group example
{"_id":"5e7864b186e3ec0997b5e48e",
  "name":"Bar",
  "printer":"HP M176n",
  "printers":[
    {"_id":"5e81774685fb2d03dda95cd0",
      "printerType":"ip",
      "ip":"192.168.10.60",
      "escPOS":true,
      "merge":"true"}
      ],
  "showDineInTax":false,
  "type":"kitchen",
  "_fake":true}
```
```javascript
[
    {
      icon: 'icon-restaurant',
      items: roomsStates.value.map((r) => ({
        title: r.room.name,
        icon: 'radio_button_unchecked',
        iconType: 'small',
        onClick() {
          dashboardHooks.emit('updateScreen', 'KeptAliveRoomViews')
          dashboardHooks.emit('selectRoom', r.room._id.toString())
          // onSelectRoom(r)
        }
      })),
      title: t('sidebar.restaurant'),
      feature: 'tablePlan'
    },
    {
      icon: 'icon-manual-table',
      title: t('sidebar.manualTable'),
      feature: 'manualTable',
      onClick() {
        dashboardHooks.emit('updateScreen', 'ManualTableView')
      }
    }
    ]
    
```
