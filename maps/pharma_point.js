var map;
var lyrCarto;
var WFSLayer;


        
    $(document).ready(function(){

        map = L.map('map', {center:[53.577430, -7.812125], zoom:7,minZoom:6});
                
        lyrCarto = L.tileLayer.provider('CartoDB.Positron');
        map.addLayer(lyrCarto);
        
        var owsrootUrl = 'http://ec2-34-244-125-157.eu-west-1.compute.amazonaws.com:8080/geoserver/ows';

        var defaultParameters = {
            service : 'WFS',
            version : '2.0',
            request : 'GetFeature',
            typeName : 'pop_density:counties_pharmacies',
            outputFormat : 'text/javascript',
            format_options : 'callback:getJson',
            SrsName : 'EPSG:4326'
        };

        var parameters = L.Util.extend(defaultParameters);
        var URL = owsrootUrl + L.Util.getParamString(parameters);

        var mki = L.icon.mapkey({icon:"mki mki-pharmacy",color:'white',background:'#008000',size:25});
        
        var ajax = $.ajax({
            url : URL,
            dataType : 'jsonp',
            jsonpCallback : 'getJson',
            success : function (response) {
                WFSLayer = L.geoJson(response,{
                    pointToLayer:function(feature, latlng){
                        return L.marker(latlng,{icon:mki});
                    }, onEachFeature: function(feature,layer){
                        var att = feature.properties
                        layer.bindPopup("Pharmacy Name: "+att.name);
                    }
                }).addTo(map);
            }
        });
        
    });
        
