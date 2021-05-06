/**
 * Copyright 2020 Bart Butenaers
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
module.exports = function(RED) {
    var geoip = require('geoip-lite');
    var path = require('path');
    var exec = require('child_process').exec;
    
    // -------------------------------------------------------------------------------------------------
    // Determining the path to the files in the dependent geoip-lite module once.
    // See https://discourse.nodered.org/t/use-files-from-dependent-npm-module/17978/5?u=bartbutenaers
    // -------------------------------------------------------------------------------------------------
    var geoipUpdateDbPath = require.resolve("geoip-lite");
    
    // For example suppose the require.resolved results in geoipUpdateDbPath = /home/pi/.node-red/node_modules/geoip-lite/lib/geoip.js
    // Then we need to strip the part after the /geoip-lite/ folder, which means geoipUpdateDbPath =  /home/pi/.node-red/node_modules/geoip-lite/
    // And then we need to find the /scripts subfolder, which means geoipUpdateDbPath = /home/pi/.node-red/node_modules/geoip-lite/scripts
    geoipUpdateDbPath = geoipUpdateDbPath.substring(0, geoipUpdateDbPath.indexOf(path.sep + "geoip-lite" + path.sep) + 11);
    geoipUpdateDbPath = path.join(geoipUpdateDbPath, 'scripts', 'updatedb.js');

    function IpLocationLiteNode(config) {
        RED.nodes.createNode(this, config);
        this.inputField    = config.inputField;
        this.outputField   = config.outputField;
        this.progressDots  = "";

        var node = this;
        
        node.on("input", function(msg) {   
            var inputValue = RED.util.getMessageProperty(msg, node.inputField);
            
            if(!inputValue){
                node.warn('An input value should be specified in the msg.' + node.inputField);
                return;
            }
            
            if (inputValue === "update") {
                if (node.updateProcess) {
                    node.warn('The node is already busy downloading the data');
                    return;
                }
                
                var command = "node " + geoipUpdateDbPath + " license_key=" + node.credentials.licenseKey;
                
                node.updateProcess = require('child_process').exec(command);

                // Keep track of the update process status, based on the stdout.
                // See https://github.com/geoip-lite/node-geoip/issues/205
                node.updateProcess.stdout.on('data', function(data) {
                    if (node.progressDots.length > 5) {
                        node.progressDots = "";
                    }
                    else {
                        node.progressDots += ".";
                    }
                    
                    node.status({fill:"blue",shape:"dot",text:"updating " + node.progressDots});
                    console.log(data);
                    
                    if (data.includes("Failed to Update Databases from MaxMind")) {
                        node.status({fill:"red",shape:"dot",text:"update failed"});
                        return;
                    }
                    
                    if (data.includes('Successfully Updated Databases from MaxMind')) {
                         // As soon as the data have been downloaded, it can be loaded.
                        // Pull the files from MaxMind and handle the conversion from CSV. 
                        // Please keep in mind this requires internet and MaxMind rate limits that amount of downloads on their servers.
                        // You will need, at minimum, a free license key obtained from maxmind.com to run the update script.
                        geoip.reloadDataSync();
                        
                        node.status({fill:"blue",shape:"dot",text:"updated"});
                        return;
                    }
                });
                
                node.updateProcess.on('close', function() {
                    node.updateProcess = null;
                });
                
                return;
            }
            
            // Test for valid ipv4 and ipv6 addresses (https://gist.github.com/pyrocat101/7568655#gistcomment-3208271)
            if (!/((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))/.test(inputValue)) {
                node.status({fill:"red",shape:"dot",text:"invalid format"});
                return;
            }
            
            var geoInfo = geoip.lookup(inputValue);
            
            try {
                // Set the converted value in the specified message field (of the original input message)
                RED.util.setMessageProperty(msg, node.outputField, geoInfo, true);
            } catch(err) {
                node.error("Error setting value in msg.payload: " + err.message);
                node.status({fill:"red",shape:"dot",text:"invalid format"});
                return;
            }
            
            var statusText = (geoInfo !== null) ? "country " + geoInfo.country + " (" + geoInfo.region + ")" : "Private or Invalid IP";
            node.status({fill:"blue",shape:"dot",text:statusText});
            
            node.send(msg);   
        });

        node.on("close", function() {
            // Interrupt the current update process
            if (node.updateProcess) {
                node.updateProcess.kill();
                node.updateProcess = null;
            }
            
            node.downloading = false;
            node.status({});
        });
    }

    RED.nodes.registerType("ip-location-lite", IpLocationLiteNode, {
        credentials: {
            licenseKey: {type: "password"}
        }
    });
}
