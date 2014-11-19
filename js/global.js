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
var arrayCores = ["#FF0000","#0000FF","#00FF00","#FF0000","#00FF00","#0000FF","#FF0000","#0000FF"];
var linhas = [];
var checkOpcoes;
var trafficLayer = new google.maps.TrafficLayer();
var bikeMarkers = [];
var bikeMarkersPositions = [];

function addBikeMarker(location, data) {
  bikeMarkersPositions.push(location);

  var iconUrl = iconBase + "bikeriopin.png";
  //"BAIRRO","ESTACAO","CODIGO","ENDERECO","NUMERO","LATITUDE","LONGITUDE"
  var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: data[3],
        icon: new google.maps.MarkerImage(iconUrl)
  });

  marker.info = new google.maps.InfoWindow({
      content: '<div style="line-height:1.35;overflow:hidden;white-space:nowrap;">' +
               "Bairro: " + data[0] + "</br>" +
               "Estação: " + data[1] + "</br>" +
               "Endereço: " + data[3] + "</br>" +
               "</div>"
  });
  google.maps.event.addListener(marker, 'click', function() {
      marker.info.close();
      marker.info.open(map, marker);
  });

  bikeMarkers.push(marker);
}

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
                 "Direção: "+ data[6] +"</br>"+
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
    $.getJSON("http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/onibus/" + currentLine,{
        },
        function(data, status){
			      console.log (status);
			      mudaBotao(false);
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
                //console.log("A busca retornou "+data.DATA.length+" resultados.");
            }
    }).error(function(e){
		  console.log(e);
		  mudaBotao(false);
		  if (e.responseText.indexOf("Server Error") > -1)
			  console.log("O servidor da prefeitura está fora do ar neste momento. Tente novamente mais tarde.");
		  else
  			console.log("Desculpe, ocorreu algum erro. Tente novamente.");
    });
}

function mudaBotao(onOff) {
  if(onOff) {
    $(".icon").attr("src","img/flipflop.gif");
    $(".icon").css("width","32px").css("height","32px");
  } else {
    $(".icon").attr("src","img/searchw.png");
    $(".icon").css("width","34px").css("height","34px");
  }
}

function gerarCookie(strCookie, strValor, lngDias) {
  /*
  $.cookie(strCookie, strValor, {
    expires : lngDias
  });
  */
  localStorage.setItem(strCookie, strValor);
}

function mudaClass(span, valor) {
    if(valor == "ck ckoff"){
      $(span).removeClass("ckon");
      $(span).addClass("ckoff");
    } else {
      $(span).removeClass("ckoff");
      $(span).addClass("ckon");
    }
}

function lerCookie(nomeCookie) {
  //var piraque = $.cookie(nomeCookie);
  var piraque = localStorage[nomeCookie];
  if (piraque) {
    checkOpcoes = JSON.parse(piraque);
    //tg tj pt
    mudaClass($("#tg").children("span"), checkOpcoes.tg);
    mudaClass($("#tj").children("span"), checkOpcoes.tj);
    mudaClass($("#pt").children("span"), checkOpcoes.pt);
    mudaClass($("#br").children("span"), checkOpcoes.br);
  }
}
/*
function apagarCookie(strCookie) {
  $.cookie(strCookie, null);
}
*/

function gravarOpcoes(){
  var options = {};
  $(".lista li").each(function(index){
    var id = $(this).attr("id");
    var span = $(this).children("span");
    var classe = span.attr('class');
    options[id] = classe;
  });
  var json = JSON.stringify(options);
  checkOpcoes = options;
  gerarCookie("dadosRJ", json, 30);
}

$( document ).ready(function() {

  /*
  if(typeof(Storage) !== "undefined") {
    alert("Code for localStorage/sessionStorage.");
  } else {
    alert("Sorry! No Web Storage support..");
  }
  */

  lerCookie("dadosRJ");

  $("#searchBox").submit(function(event){
      event.preventDefault();
      $("#busLine").blur();
      mudaBotao(true);
      findBus(true);
      desenhaShape();
  });

  $("#searchBox input").hover(
    function(){
      $(this).css("background","rgba(255,255,255,.25)");
    },
    function(){
      $(this).css("background","rgba(255,255,255,.15)");
    }
  );

  $(".menu-box").click(function (){
    $("#menu").toggleClass("open");
    $("#menuBox").toggleClass("openmenu");
  });

  $(".menu-box").hover(
    function(){
      $(this).css("opacity","1.0");
    },
    function(){
      $(this).css("opacity","0.6");
    }
  );

  $(".lista li").click(function(){
    var id = $(this).attr("id");
    var span = $(this).children("span");
    if($(span).hasClass("ckon")){
      $(span).removeClass("ckon");
      $(span).addClass("ckoff");
    } else {
      $(span).removeClass("ckoff");
      $(span).addClass("ckon");
    }
    gravarOpcoes();
    atualizaMapa();
  });

});

function atualizaMapa(){
  if(checkOpcoes) {
    if(checkOpcoes.tg == "ck ckon") {
      trafficLayer.setMap(map);
    } else {
      trafficLayer.setMap(null);
    }

    if(checkOpcoes.tj == "ck ckon") {
      if(currentLine) {
        desenhaShape();
      }
    } else {
      limparCoordenadas();
    }

    if(checkOpcoes.br == "ck ckon") {
      desenharBikeRio();
    } else {
      limparBikeRio();
    }
  }
}

function desenharBikeRio(){
  limparBikeRio();

  $.getJSON("http://dadosabertos.rio.rj.gov.br/apiTransporte/apresentacao/rest/index.cfm/estacoesBikeRio",{
      },
      function(data, status){
		      console.log (status);
		      mudaBotao(false);
          if(data.DATA.length==0)
              console.log("nenhum dado");
          else{

              for (var i = 0; i < data.DATA.length; i++) {
                  var latLng = new google.maps.LatLng(data.DATA[i][5], data.DATA[i][6]);
                  addBikeMarker(latLng, data.DATA[i]);
              }
          }
  }).error(function(e){
	  console.log(e);
	  if (e.responseText.indexOf("Server Error") > -1)
		  console.log("O servidor da prefeitura está fora do ar neste momento. Tente novamente mais tarde.");
	  else
			console.log("Desculpe, ocorreu algum erro. Tente novamente.");
  });

}

function limparBikeRio(){
    for (var i = 0; i < bikeMarkers.length; i++) {
        bikeMarkers[i].setMap(null);
    }
    bikeMarkers = [];
    bikeMarkersPositions = []
}

function verificaSelecaoTrajeto() {
  if(checkOpcoes) {
    if(checkOpcoes.tj == "ck ckon") {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

function limparCoordenadas() {
  for(var i = 0; i < linhas.length; i++) {
    if(linhas) {
      linhas[i].setMap(null);
    }
  }
}

function desenhaShape(){

  if(verificaSelecaoTrajeto()) {

    currentLine = $("#busLine").val();
    $.ajax("http://dadosabertos.rio.rj.gov.br/apiTransporte/Apresentacao/csv/gtfs/onibus/percursos/gtfs_linha"+ currentLine +"-shapes.csv")
    .success(function (data, status, jqXHR){
      //fazer o shape do caminho do onibus
      var obj = Papa.parse(data);

      var arrayDados = obj.data;
      //removo o cabeçalho
      arrayDados.shift();

      limparCoordenadas();

      var ordens = [[]];
      var indiceOrdens = 0;

      var coordenadas = [];

      for(var i = 0; i < arrayDados.length; i++) {
        var ponto = arrayDados[i];
        var lat = ponto[5];
        var lng = ponto[6];
        var ordem = ponto[3];

        var coordenada = new google.maps.LatLng(lat, lng)

        if(i > 0 && ordem == 0) {
          indiceOrdens++;
          ordens[indiceOrdens] = [];
        }

        ordens[indiceOrdens].push(coordenada);

      }

      for(var a = 0; a < ordens.length; a++) {
        var array = ordens[a];
        var cor = arrayCores[a];
        var caminho = new google.maps.Polyline({
          path: array,
          geodesic: true,
          strokeColor: cor,
          strokeOpacity: 1.0,
          strokeWeight: 3
        });

        caminho.setMap(map);
        linhas.push(caminho);
      }
    });

  }
}