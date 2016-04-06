
	function initialize() {
	            var mapOptions = {
	                center: new google.maps.LatLng(40.7143528, -74.0059731),
	                zoom: 9,
	                mapTypeId: google.maps.MapTypeId.HYBRID,
	                scrollwheel: true,
	                draggable: true,
	                panControl: true,
	                zoomControl: true,
	                mapTypeControl: false,
	                scaleControl: true,
	                streetViewControl: true,
	                overviewMapControl: true,
	                rotateControl: true,
	                mapTypeId: google.maps.MapTypeId.ROADMAP

	            };

	            var stylez = [{"featureType":"all","elementType":"labels.text.fill","stylers":[{"saturation":36},{"color":"#000000"},{"lightness":40}]},{"featureType":"all","elementType":"labels.text.stroke","stylers":[{"visibility":"on"},{"color":"#000000"},{"lightness":16}]},{"featureType":"all","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":17},{"weight":1.2}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":20}]},{"featureType":"poi","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":21}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"},{"lightness":17}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#000000"},{"lightness":29},{"weight":0.2}]},{"featureType":"road.arterial","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":18}]},{"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":16}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":19}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#000000"},{"lightness":17}]}];
	var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	var mapType = new google.maps.StyledMapType(stylez, { name:"Grayscale" });    
	map.mapTypes.set('tehgrayz', mapType);
	map.setMapTypeId('tehgrayz');			
	
	        }
	google.maps.event.addDomListener(window, 'load', initialize);
	