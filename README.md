# node-red-contrib-ip-location-lite
Node-Red node to determine the geographic location of an IP address

:warning: ***This is an experimental version !!!!  This version is published on Github to be able to discuss it on the Discourse forum...*** 

## Install

Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install bartbutenaers/node-red-contrib-ip-location-lite
```

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Node usage

This node determines ***offline*** the geographic location (country, region and city) of a specified IP address, based on a local set of data files available from [Maxmind](http://maxmind.com/).

This node is a ***lite*** version, because the original (fully featured) Maxmind geoip npm package requires libgeoip to be installed on your system.  To avoid installation issues, this node uses the full Javascript [geoip-lite](https://github.com/geoip-lite/node-geoip) npm package (which has limited functionality).

CAUTION: 
+ Both IPv4 and IPv6 addresses are supported, however since the GeoLite IPv6 database does not currently contain any city or region information, city, region and postal code lookups are only supported for IPv4.
+ The geoip-lite package stores all data in RAM in order to be fast.
+ The data files will use about 110 Mb of space on your filesystem.

### Get IP address location

The following flow injects an input message, containing the IP address in `msg.payload`.  The output message will contain the geo location in `msg.location`:

![Get address flow](https://user-images.githubusercontent.com/14224149/83962331-d4656200-a89c-11ea-9b17-726f10b51d95.png)

```
[{"id":"ba82129c.3f62e","type":"ip-location-lite","z":"11289790.c89848","name":"","inputField":"payload","outputField":"location","x":410,"y":980,"wires":[["e4c29cf1.193ee"]]},{"id":"9cde4b1a.5e1998","type":"inject","z":"11289790.c89848","name":"Inject 207.97.227.239","topic":"","payload":"207.97.227.239","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":200,"y":980,"wires":[["ba82129c.3f62e"]]},{"id":"e4c29cf1.193ee","type":"debug","z":"11289790.c89848","name":"Geo IP location","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":600,"y":980,"wires":[]}]
```

The advantage of sending the geo location result in another msg field, is that the orginal IP address will still be available in the output message.  Which means the output message contains all data, both input and output:

![JSON result](https://user-images.githubusercontent.com/14224149/83962569-bc8edd80-a89e-11ea-9ceb-4543ffa80c53.png)

### Update local data

When this node is being installed, it already contains a set of data files.  So you can get started immediately.  However it is advised to update your local geo data from time to time, using following flow:

![Update data flow](https://user-images.githubusercontent.com/14224149/83962360-f19a3080-a89c-11ea-9f13-c450fc83376d.png)

```
[{"id":"ef6a184e.c7e998","type":"ip-location-lite","z":"11289790.c89848","name":"","inputField":"payload","outputField":"payload","x":430,"y":820,"wires":[[]]},{"id":"862e5358.84171","type":"inject","z":"11289790.c89848","name":"Download","topic":"","payload":"download","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":220,"y":820,"wires":[["ef6a184e.c7e998"]]},{"id":"80b455de.21d248","type":"inject","z":"11289790.c89848","name":"Reload","topic":"","payload":"reload","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":210,"y":860,"wires":[["ef6a184e.c7e998"]]}]
```

The following steps need to be executed:

1. Create a free Maxmind account [here](https://www.maxmind.com/en/geolite2/signup).

2. Generate a license key on your Maxmind account page.

3. Download the new data files, by injecting an input message with `msg.payload = "download"`.

4. Unfortunately this node currently ***cannot*** determine whether the download is complete.  See this [issue](https://github.com/geoip-lite/node-geoip/issues/205) for more information about that.  Which means you will need to watch manually whether the download of the files is complete:

   ![data files](https://user-images.githubusercontent.com/14224149/83962705-ebf21a00-a89f-11ea-8959-1eb1b979b353.png)

5. Load the downloaded data files into the system, by injecting an input message with `msg.payload = "reload"`.  After a fraction of a second, the node status will indicate that the load has been completed:

   ![Status loaded](https://user-images.githubusercontent.com/14224149/83962745-3d9aa480-a8a0-11ea-8a77-c17b6ac34fb5.png)

## Node configuration

### License key
A license key is only required to download data updates from Maxmind.  See above how to use it.

### Input field
The name of the field in the input message, where the IP address needs to be specified.  By default the input field will be `msg.payload`.

### Output field
The name of the field in the output message, where the geographic location information will be stored.  By default the output field will also be `msg.payload`.  But it might be advised to use another msg field, if you don't want to overwrite the original IP address from the input message.
