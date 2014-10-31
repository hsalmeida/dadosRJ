var map;
var markers = [];
var markersPositions = [];
var bounds = new google.maps.LatLngBounds();
var iconBase = "img/"; //'https://maps.google.com/mapfiles/kml/shapes/';
var markerColors = ['red', 'yellow', 'green'];
var loadTimeout = 0;
var currentLine = '';
var userLocation = false;
var modalOpen = false;
var browserSupportFlag = new Boolean();

function addMarker(location, data) {
    markersPositions.push(location);
    var dataBR = data[0].substring(3,6) + data[0].substring(0,2) + data[0].substring(5);
    var gpsTime = new Date(Date.parse(dataBR));

	  gpsTime.setHours((gpsTime.getHours() + 1));

    var iconUrl;
    if ((new Date() - gpsTime)/1000/60 > 10) {
        iconUrl = iconBase+"bus_" + markerColors[0] + ".png";
    } else if ((new Date() - gpsTime)/1000/60 > 5) {
        iconUrl = iconBase+"bus_" + markerColors[1] + ".png";
    } else {
        iconUrl = iconBase+"bus_" + markerColors[2] + ".png";
    }

    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: data[1] + " (" + data[0] + ")" ,
        icon: new google.maps.MarkerImage(iconUrl)
    });
    marker.info = new google.maps.InfoWindow({
        content: '<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">' +
                 "Código: " + data[1] + "</br>" +
                 "Hora: " + gpsTime.toLocaleString('pt-BR') + "</br>" +
                 "Velocidade: " + data[5] + " Km/h</br>" +
                 "</div>"
    });
    google.maps.event.addListener(marker, 'click', function() {
        marker.info.close();
        marker.info.open(map, marker);
    });
    markers.push(marker);
}

function addInfowindow(marker, line, date, velocity) {
    var contentString = '<div class="infowindow">' +
        '<div class="line"><b>Linha: </b>' + line + '</div>' +
        '<div class="date"><b>Data/Hora: </b>' + date + '</div>' +
        '<div class="velocity"><b>Velocidade: </b>' + velocity + 'Km/h</div>' +
        '</div>';
    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.close();
        infowindow.open(map,marker);
    });
}

function in_array(needle, group){
    var ret = false;
    for(g in group){
        if(g==needle){
            ret = true;
            break;
        }
    }
    return ret;
}

function setAllMap(map) {
    for (var i = 0; i < markers.length; i++)
        markers[i].setMap(map);
}

function clearMarkers() {
    setAllMap(null);
}

function clearMarkersPositions() {
    markersPositions = [];
}

function showMarkers() {
    setAllMap(map);
}

function deleteMarkers() {
    clearMarkers();
    markers = [];
    markersPositions = [];
}

google.maps.Map.prototype.clearMarkers = function() {
    for(var i=0; i < this.markers.length; i++)
        this.markers[i].setMap(null);
    this.markers = new Array();
};

function findBus(clicked){
    currentLine = $("#busLine").val();
    $.getJSON("http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/obterPosicoesDaLinha/" + currentLine,{
        },
        function(data, status){
			      console.log (status);
            if(data.DATA.length==0)
                console.log("nenhum dado");
            else{
                setAllMap(null);
                clearMarkersPositions();
                for (var i = 0; i < data.DATA.length; i++) {
                    var latLng = new google.maps.LatLng(data.DATA[i][3], data.DATA[i][4]);
                    addMarker(latLng, data.DATA[i]);
                }
                if(clicked){
                    for (var i = 0, LtLgLen = markersPositions.length; i < LtLgLen; i++)
                        bounds.extend(markersPositions[i]);
                     map.fitBounds(bounds);
                }

                clearTimeout(loadTimeout);
                loadTimeout = setTimeout(function(){ findBus(false); }, 15000);
                console.log("A busca retornou "+data.DATA.length+" resultados.");
            }
    }).error(function(e){
		console.log(e);
		if (e.responseText.indexOf("Server Error") > -1)
			console.log("O servidor da prefeitura está fora do ar neste momento. Tente novamente mais tarde.");
		else
			console.log("Desculpe, ocorreu algum erro. Tente novamente.");
    });
}

function btnClick() {
	$("#busLine").blur();
    findBus(true);
    desenhaShape();
}

$("#search").on("click", function(event){
    event.preventDefault();
    $("#busLine").blur();
    findBus(true);
});

function desenhaShape(){
  currentLine = $("#busLine").val();
  $.ajax("http://dadosabertos.rio.rj.gov.br/apiTransporte/Apresentacao/csv/gtfs/onibus/percursos/gtfs_linha"+ currentLine +"-shapes.csv")
  .success(function (data, status, jqXHR){
    //fazer o shape do caminho do onibus
    var obj = Papa.parse(data);

    var arrayDados = obj.data;
    //removo o cabeçalho
    arrayDados.shift();
    var ida = false;
    var coordenadasIda = [];
    var coordenadasVolta = [];

    for(var i = 0; i < arrayDados.length; i++) {
      var ponto = arrayDados[i];
      var lat = ponto[5];
      var lng = ponto[6];
      var ordem = ponto[3];

      var coordenada = new google.maps.LatLng(lat, lng)

      if(i == 0 && ordem == 0) {
        ida = true;
      }
      if(i > 0 && ordem == 0) {
        ida = false
      }

      if(ida) {
        coordenadasIda.push(coordenada);
      } else {
        coordenadasVolta.push(coordenada);
      }
    }

    var caminhoIda = new google.maps.Polyline({
      path: coordenadasIda,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });

    var caminhoVolta = new google.maps.Polyline({
      path: coordenadasVolta,
      geodesic: true,
      strokeColor: '#0000FF',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });

    caminhoIda.setMap(map);
    caminhoVolta.setMap(map);
    console.log(obj);
  });
}