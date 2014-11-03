var app = {
    openModal: false,
    initialize: function(){
      if(navigator.geolocation) {
        app.createMap();
        browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position) {
          app.geolocationSuccess(position),
          app.geolocationError
        });
      } else {
    		app.createMap();
    		var url = (document.URL).split("?");
    		if (url.length > 1) {
    			$("#busLine").val(url[1]);
    			findBus(true);
    		}
      }
    },
    geolocationSuccess: function(position){
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        userLocation = new google.maps.LatLng(lat, lon);
        app.createMap();
        app.showDevicePosition(userLocation);
    },
    geolocationError: function(error){
        console.log('[ERROR '+ error.code + '] ' + error.message);
        app.createMap();
    },
    createMap: function(){
        var mapDiv = document.getElementById("map_canvas");

		var noPoi = [
		{
			featureType: "poi",
			stylers: [
			  { visibility: "off" }
			]
		  }
		];

        var location = (userLocation)? userLocation : new google.maps.LatLng(-22.9083, -43.1964);
        map = new google.maps.Map(mapDiv, {
            center: location,
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
			mapTypeControl: false,
			streetViewControl: false,
			disableDefaultUI: true,
			styles: noPoi
        });
    },
    showDevicePosition: function(location){
        var marker = new google.maps.Marker({
            position: location,
            map: map,
            icon: iconBase + 'pegman.png',
        });
    }
};

//google.maps.event.addDomListener(window, 'load', app.initialize);