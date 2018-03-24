var map;
var lyrCarto;
var WFSLayer;
var lyrPharma;
var lyrCounties;
var ctlDraw;
var fgpDrawnItems;
        
    $(document).ready(function(){

        map = L.map('map', {center:[53.577430, -7.812125], zoom:7,minZoom:6});
                
        lyrCarto = L.tileLayer.provider('CartoDB.Positron');
        map.addLayer(lyrCarto);
        fgpDrawnItems = new L.FeatureGroup();
        fgpDrawnItems.addTo(map);
        
        info = L.control({position:'topright'});

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };
        info.update = function (props) {
            this._div.innerHTML = '<h4>Click anywhere on the map to calculate your nearest pharmacy</h4>';
        };
        info.addTo(map);
        
        
        var owsrootUrl = 'http://ec2-34-244-125-157.eu-west-1.compute.amazonaws.com:8080/geoserver/ows';
        
        var pharmaParameters = {
            service : 'WFS',
            version : '2.0',
            request : 'GetFeature',
            typeName : 'pop_density:counties_pharmacies',
            outputFormat : 'text/javascript',
            format_options : 'callback:getJson',
            SrsName : 'EPSG:4326'
        };

        var groupMarkers = L.markerClusterGroup();
        var mki = L.icon.mapkey({icon:"mki mki-pharmacy",color:'white',background:'#008000',size:25});
        
        $.ajax({
        url : owsrootUrl + L.Util.getParamString(L.Util.extend(pharmaParameters)),
        dataType : 'jsonp',
        jsonpCallback : 'getJson',
        success : function (response) {
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
        });
// **********Map click function ************
        
            map.on('click', function(e){
                newMarker = L.marker(e.latlng).addTo(map);
                var llRef = (e.latlng);
                var strTable = "<table class ='table is-hoverable'>";
                strTable += "<tr><th>Name</th><th>Distance</th><th>Direction</th></tr>";
                var nrPharma = returnClosestLayer(lyrPharma, llRef);
                strTable += "<tr><td>"+nrPharma.att.name+"</td><td>"+nrPharma.distance.toFixed(0)+"m</td><td>"+nrPharma.bearing.toFixed(0)+"</td></tr>";
                strTable += "</table>"; 
                newMarker.bindTooltip(strTable, {maxWidth:400})
                
            });
    });

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

        
