var map;
var lyrHOT;
var lyrImagery;
var WFSLayer;
var lyrPharma;
var lyrCounties;
var ctlLayers;
var mki;
var groupMarkers;
var objOverlays;
var objBasemaps;

        
    $(document).ready(function(){
//***********initialise map *************************
        map = L.map('map', {center:[53.577430, -7.812125], zoom:7,minZoom:6});
        lyrHOT = L.tileLayer.provider('OpenStreetMap.HOT');
        lyrImagery = L.tileLayer.provider('Esri.WorldImagery');
        map.addLayer(lyrHOT);
        
        var comp = new L.Control.Compass({autoActive: true});
	    map.addControl(comp);
//**********Leaflet control, creates div that has instructions for use        
        info = L.control({position:'topright'});
        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };
        info.update = function (props) {
            this._div.innerHTML = '<h4>Click on the map to locate the nearest pharmacy</h4>';
        };
        info.addTo(map);
        
//**********************Div for directions to point
        directions = L.control({position:'bottomright'});

        directions.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'directions');
            this.update();
            return this._div;
        };
//**************Calls WFS from GeoServer. Two layers.
        var owsrootUrl = 'http://ec2-34-244-125-157.eu-west-1.compute.amazonaws.com:8080/geoserver/ows';
        
        var pharmaParameters = {
            service : 'WFS',
            version : '2.0',
            request : 'GetFeature',
            typeName : 'pop_density:counties_pharmacies',
            outputFormat : 'text/javascript',
            format_options : 'callback:getJson1',
            SrsName : 'EPSG:4326',
            
        };
        var countiesParameters = {
            service : 'WFS',
            version : '2.0',
            request : 'GetFeature',
            typeName : 'pop_density:counties_popdensity',
            outputFormat : 'text/javascript',
            format_options : 'callback:getJson2',
            SrsName : 'EPSG:4326'
        };

        $.when(
            $.ajax({
            url : owsrootUrl + L.Util.getParamString(L.Util.extend(pharmaParameters)),
            dataType : 'jsonp',
            jsonpCallback : 'getJson1',
            success : function (response){
                layer1 = response;
                }
            }),
            
            $.ajax({
            url : owsrootUrl + L.Util.getParamString(L.Util.extend(countiesParameters)),
            dataType : 'jsonp',
            jsonpCallback : 'getJson2',
            success : function (response){
                layer2 = response;
                }
            })
        ).then (function(){
                stylePharamacies (layer1);
                styleCounties (layer2);
            }
        );
//************ custom symbols *****************
        groupMarkers = L.markerClusterGroup();
        mki = L.icon.mapkey({icon:"mki mki-pharmacy",color:'white',background:'#008000',size:25});
                      
// **********Map click function ************
        
        map.on('click', function(e){
            newMarker = L.marker(e.latlng).addTo(map);
            var llRef = (e.latlng);
            var strTable = "<table class ='table is-hoverable'>";
            strTable += "<tr><th>Name</th><th>Distance</th><th>Direction</th></tr>";
            var nrPharma = returnClosestLayer(lyrPharma, llRef);
            strTable += "<tr><td>"+nrPharma.att.name+"</td><td>"+(nrPharma.distance/1000).toFixed(1)+"km</td><td>"+nrPharma.bearing.toFixed(0)+"</td></tr>";
            strTable += "</table>"; 
            newMarker.bindTooltip(strTable, {maxWidth:400});
            comp.setAngle(nrPharma.bearing);
        });
        
// **********create the ESRI geocoding control and add it to the map
        var searchControl = L.esri.Geocoding.geosearch().addTo(map);
        
 // **********Toggle between basemaps          
        objBasemaps = {
            "Aerial Imagery":lyrImagery,
            "Open Street Map":lyrHOT
        };
        ctlLayers = L.control.layers(objBasemaps).addTo(map);
  });          

//****************nearest calculation function***************
function returnClosestLayer(lyrGroup, llRef){
    var arLyrs = lyrGroup.getLayers();
    var nearest = L.GeometryUtil.closestLayer(map, arLyrs, llRef);
    nearest.distance = llRef.distanceTo(nearest.latlng);
    nearest.bearing = L.GeometryUtil.bearing(llRef, nearest.latlng);
    if (nearest.bearing<0){
        nearest.bearing = nearest.bearing + 360;
    }
    nearest.att = nearest.layer.feature.properties;
    return nearest;
}
//****************style functions
function stylePharamacies (response) {
    lyrPharma = L.geoJson(response,{
        pointToLayer:function(feature, latlng){
            return L.marker(latlng,{icon:mki});
        }, onEachFeature: function(feature,layer){
            var att = feature.properties
            layer.bindPopup("<b>Pharmacy Name: </b>"+att.name);
        }
    });
    groupMarkers.addLayer(lyrPharma);
    map.addLayer(groupMarkers);
    }

function styleCounties (response){
    lyrCounties = L.geoJson(response, {
        style: countyStyle
        }).addTo(map);
    }

function countyStyle(feature) {
    return {
        color: 'navy',
        weight: 1,
        opacity: 1,
        fillOpacity: 0,
    };
}
        
