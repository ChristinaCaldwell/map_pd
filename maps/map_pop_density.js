var map;
var lyrCarto;
var lyrPopDensity;
var owsrootUrl;
var defaultParameters;
var parameters;
var URL;
var objBasemaps;
var objOverlays;
var info;
var uri;
        
    $(document).ready(function(){

        map = L.map('map', {center:[53.577430, -7.812125], zoom:7, minZoom:6});
                
        lyrCarto = L.tileLayer.provider('CartoDB.Positron');
        map.addLayer(lyrCarto);
  
        owsrootUrl = 'http://ec2-34-244-125-157.eu-west-1.compute.amazonaws.com:8080/geoserver/ows';
        defaultParameters = {
                service : 'WFS',
                version : '2.0',
                request : 'GetFeature',
                typeName : 'pop_density:counties_popdensity',
                outputFormat : 'text/javascript',
                format_options : 'callback:getJson',
                SrsName : 'EPSG:4326',
        };
        parameters = L.Util.extend(defaultParameters);
        URL = owsrootUrl + L.Util.getParamString(parameters);

        $.ajax({
          url : URL,
          dataType : 'jsonp',
          jsonpCallback : 'getJson',
          success : function (response) {
            lyrPopDensity = L.geoJson(response, {
                style: popdenStyle,
                onEachFeature: onEachFeature
                }).addTo(map);
            }
        });
        // control that shows state info on hover
        info = L.control({position:'topleft'});

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info');
            this.update();
            return this._div;
        };

        info.update = function (props) {
            this._div.innerHTML = '<h4>Irish Population Density 2016</h4>' +  (props ?
                '<b>' + props.county + '</b><br />' + props.pop_densit + ' people / km<sup>2</sup>'
                : 'Hover over a county to begin and click to zoom');
        };

        info.addTo(map);

        uri = "http://ec2-34-244-125-157.eu-west-1.compute.amazonaws.com:8080/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=pop_density:counties_popdensity",
        L.wmsLegend(uri);

        });
        
    function getpopColor(d) {
        return d > 156 ? '#810f7c' :
               d > 83  ? '#8856a7' :
               d > 49  ? '#8c96c6' :
               d > 34  ? '#b3cde3' :
                         '#edf8fb' ;
    }
        
    function popdenStyle(feature) {
        return {
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7, 
            fillColor: getpopColor(feature.properties.pop_densit)
        };
    }

    function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 4,
            color: '#666',
            fillOpacity: 0.9
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
            }
        info.update(layer.feature.properties);
    }
    function resetHighlight(e) {
        lyrPopDensity.resetStyle(e.target);
        info.update();
    }

    function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature,
    });
}
    function zoomToFeature(e){
        map.fitBounds(e.target.getBounds());
    }
    