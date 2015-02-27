# CartoDB Chrome extension

This Chrome extension allows to *import data tables and supported file extension download links into CartoDB with one click*. It does its best in order to parse html tables, please be understanding with its limitations ;) If you report any table that doesn't work as you expected we'll try to improve the extension. And you can contribute as well, too :-)

## Screenshots

### User info popup

![](https://raw.githubusercontent.com/juanignaciosl/cartodb-chrome-extension/master/screenshots/popup.png)

### Icon overlay at web tables

![](https://raw.githubusercontent.com/juanignaciosl/cartodb-chrome-extension/master/screenshots/table-example.png)

### Import result

![](https://raw.githubusercontent.com/juanignaciosl/cartodb-chrome-extension/master/screenshots/import-list.png)

![](https://raw.githubusercontent.com/juanignaciosl/cartodb-chrome-extension/master/screenshots/import-table.png)

![](https://raw.githubusercontent.com/juanignaciosl/cartodb-chrome-extension/master/screenshots/import-map.png)

Note that CartoDB detect country information and geolocate our data automagically :)

## Installation

### The hard way, if you want to contribute

Clone this repo and in Chrome pick More tools --> extensions, enable 'Developer mode' and click 'Load unpacked extension...' choosing the 'src' directory.

### The easy way, for everybody else

Click <a href="https://github.com/juanignaciosl/cartodb-chrome-extension/raw/master/dist/latest/cartodb-chrome-extension.crx">download link</a> in Chrome. Open Extensions (Window menu --> Extensions, or More tools --> Extensions from the right menu) and drop it from your download folder (Chrome has disabled direct installations because of security concerns).

## Usage

Click the icon in order to set your user and apikey.

You will see CartoDB icon on top of every table that we think you'd like to import to CartoDB. If there's a table without the icon you can right click on it.

You'll also see the icon next to download links of supported extensions, like this <a href="https://raw.githubusercontent.com/juanignaciosl/cartodb-chrome-extension/master/test/file.csv">CSV</a>. Zip files doesn't display the icon, but if there's a zip with geometries (SHPs, other supported extensions, etc) you can import it by right clicking on it.
