# node-red-contrib-ip-location-lite
Node-Red node to determine ***(locally)*** the geographic location of an IP address

## Install

Run the following npm command in your Node-RED user directory (typically ~/.node-red):
```
npm install node-red-contrib-ip-location-lite
```

## Support my Node-RED developments

Please buy my wife a coffee to keep her happy, while I am busy developing Node-RED stuff for you ...

<a href="https://www.buymeacoffee.com/bartbutenaers" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy my wife a coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>

## Node usage

This node determines ***offline*** the geographic location (country, region and city) of a specified IP address, based on a local set of data files available from [Maxmind](http://maxmind.com/).

This node is a ***lite*** version, because the original (fully featured) Maxmind geoip npm package requires libgeoip to be installed on your system.  To avoid installation issues, this node uses the full Javascript [geoip-lite](https://github.com/geoip-lite/node-geoip) npm package (which has limited functionality).

Remarks:
+ Both IPv4 and IPv6 addresses are supported, however since the GeoLite IPv6 database does not currently contain any city or region information, city, region and postal code lookups are only supported for IPv4.
+ The geoip-lite package stores all data in RAM in order to be fast.

### Get IP address location

The following flow injects an input message, containing the IP address in `msg.payload`.  The output message will contain the geo location in `msg.location`:

![Get address flow](https://user-images.githubusercontent.com/14224149/83962331-d4656200-a89c-11ea-9b17-726f10b51d95.png)

```
[{"id":"ba82129c.3f62e","type":"ip-location-lite","z":"11289790.c89848","name":"","inputField":"payload","outputField":"location","x":410,"y":980,"wires":[["e4c29cf1.193ee"]]},{"id":"9cde4b1a.5e1998","type":"inject","z":"11289790.c89848","name":"Inject 207.97.227.239","topic":"","payload":"207.97.227.239","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":200,"y":980,"wires":[["ba82129c.3f62e"]]},{"id":"e4c29cf1.193ee","type":"debug","z":"11289790.c89848","name":"Geo IP location","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"true","targetType":"full","x":600,"y":980,"wires":[]}]
```

The advantage of sending the geo location result in another msg field, is that the orginal IP address will still be available in the output message.  Which means the output message contains all data, both input and output:

![JSON result](https://user-images.githubusercontent.com/14224149/83962569-bc8edd80-a89e-11ea-9ceb-4543ffa80c53.png)

### Update local database

:warning: CAUTION: 
+ The 'update' command will download about ***110 Mb*** data files to your filesystem.
+ The 'update' command will take about ***35 minutes*** on a Raspberry Pi 3. 

When this node is being installed, it already contains a set of data files.  So you can get started immediately.  However it is advised to update your local geo database from time to time, using following flow:

![Update db flow](https://user-images.githubusercontent.com/14224149/84084200-4b0c7780-a9e3-11ea-9436-68b77d599d2b.png)

```
[{"id":"ef6a184e.c7e998","type":"ip-location-lite","z":"11289790.c89848","name":"","inputField":"payload","outputField":"payload","x":450,"y":820,"wires":[[]]},{"id":"862e5358.84171","type":"inject","z":"11289790.c89848","name":"Update database","topic":"","payload":"update","payloadType":"str","repeat":"","crontab":"","once":false,"onceDelay":0.1,"x":240,"y":820,"wires":[["ef6a184e.c7e998"]]}]
```

The following steps need to be executed:

1. Create a free Maxmind account [here](https://www.maxmind.com/en/geolite2/signup).

2. Generate a license key on your Maxmind account page.

3. Download the new data files, by injecting an input message with `msg.payload = "update"`.

4. The node status will change to *"updating ..."*, where the dots will be animated to visualize the database progress.

5. As soon as the database is updated, the node status will change to *"updated"*.  
   
6. At the end, the data files will be up-to-date:   

   ![data files](https://user-images.githubusercontent.com/14224149/83962705-ebf21a00-a89f-11ea-8959-1eb1b979b353.png)
   
Remark: when the database is already up-to-date, then the status will change very fast from *"updating"* to *"updated"*.

## Node configuration

### License key
A license key is only required to download data updates from Maxmind.  See above how to use it.

### Input field
The name of the field in the input message, where the IP address needs to be specified.  By default the input field will be `msg.payload`.

### Output field
The name of the field in the output message, where the geographic location information will be stored.  By default the output field will also be `msg.payload`.  But it might be advised to use another msg field, if you don't want to overwrite the original IP address from the input message.
