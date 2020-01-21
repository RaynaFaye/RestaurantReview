var markers = [],
    i,
    j,
    emptyStar = '\u2606',
    fullstar = '\u2605',
    prev_infowindow = false,
    optionChoiceOne = document.getElementById('startRange'),
    optionChoiceTwo = document.getElementById('endRange');

//Star rating creation of stars.
function starRating(commentRating) {
    var rating = '';
    for (j = 0; j < 5; j += 1) {
        if (j < Math.round(commentRating)) {
            rating += fullstar;
        } else {
            rating += emptyStar;
        }
    }
    return rating;
}
//Remove all the markers and the restaurants from the list when new search.
function removeMarkers() {
    for (i = 0; i < markers.length; i += 1) {
        markers[i].setMap(null);
    }
    markers = [];
}
function removeList() {
    $('#restaurant_list div').remove('div');
}

//Creation of the Map. Map is centered on Paris while asking the user's position and puts a marker at that location that will will for 5 seconds.
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 48.864716, lng: 2.349014},
        zoom: 15
    });
    
    var infoWindow = new google.maps.InfoWindow({map: map});

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            $('#intro_info').hide();
            $('#restaurant_list').css('display', 'block');
            $('#autocompleteCity').css('display', 'block');
            $('#autocompleteRestaurant').css('display', 'block');
            
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos);

            var marker = new google.maps.Marker({
                position: pos,
                map: map,
                title: 'Vous êtes ici',
                icon: 'images/pink_marker.png'
            });
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function () {
                marker.setAnimation(null);
            }, 5000);

            marker.addListener('click', function () {
                map.setZoom(15);
                map.setCenter(marker.getPosition());
            });
            //GooglePlace API search that will be called when map dragged or star rating selected.
            function search() {
                removeMarkers();
                removeList();
                var service = new google.maps.places.PlacesService(map);
                
                service.nearbySearch({
                    location: pos,
                    bounds: map.getBounds(),
                    radius: 1000,
                    type: ['restaurant']
                }, callback);
                
                function callback(results, status) {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        for (i = 0; i < results.length; i += 1) {
                            createMarkerAndList(results[i]);
                        }
                        getReviews();
                    }
                }
                //Show reviews of the place clicked on in the window below the map.
                function getReviews() {
                    $('.avis').on('click', function (e) {
                        $('#restaurant_review').css('display', 'block');
                        service.getDetails({
                            placeId: $(e.target).data("id")
                        }, function (place, status) {
                            $('#restaurant_Name').html(place.name);
                            $('#adresse').html(place.vicinity);
                            $('#telephone').html(place.formatted_phone_number);
                            if (!place.website) {
                                $('#website').html('');
                            } else {
                                $('#website').attr('href', place.website);
                                $('#website').html('Visiter le site du Restaurant');
                            }
                            $('#comments').html('');
                            var comment = '';
                            for (i = 0; i < place.reviews.length; i += 1) {
                                var stars = place.reviews[i].rating;
                                var commentRating = starRating(stars);
                                comment += '<p class="star">' + commentRating + '</p><p>' + place.reviews[i].text + '</p><hr>';
                                commentRating = '';
                            }
                            $('#comments').html(comment);
                            panorama = new google.maps.StreetViewPanorama(document.getElementById('photo_view'), {
                                position: place.geometry.location,
                                zoom: 1
                            });
                        });
                    });
                }
                //Retrieving the first photo from the array of photos available from google places to show in the list info and infowindow.
                function createPhoto(place) {
                    var photos = place.photos;
                    var photo;
                    if (!photos) {
                        photo = place.icon;
                    } else {
                        photo = photos[0].getUrl({'maxWidth': 200, 'maxHeight': 200});
                    }
                    return photo;
                }
                //Create the markers and list of the restaurants, and change if ask for specific rating. Show info window with information for each restaurant.
                function addGooglePlacesRestaurant(place) {
                    var newRestaurant = document.createElement('div');
                    $(newRestaurant).append('<h3>' + place.name + '</h3>');
                    var newRestaurantInfo = document.createElement('div');
                    $(newRestaurantInfo).attr('class', 'list_info');
                    $(newRestaurantInfo).append('<img src="' + createPhoto(place) + '">');
                    $(newRestaurantInfo).append('<p class="star">' + starRating(place.rating) + '</p>');
                    $(newRestaurant).append(newRestaurantInfo);
                    $(newRestaurant).append('<a href="#restaurant_review" class="avis" data-id="' + place.place_id + '">Voir Avis</a>');
                    $(newRestaurant).append('<hr>');
                    $('#restaurant_list').append(newRestaurant);
                }
                function createMarkerAndList(place) {
                    var marker = new google.maps.Marker({
                        map: map,
                        position: place.geometry.location,
                        icon: 'images/blue_marker.png'
                    });
                    
                    markers.push(marker);
                    
                    google.maps.event.addListener(marker, 'click', function () {
                        var averageRating;
                        if (!place.rating) {
                            averageRating = '';
                        } else {
                            averageRating = place.rating;
                        }

                        var infowindow = new google.maps.InfoWindow({
                            content: '<div class="window_info"><p class="infoWindowName">' + place.name + '</p>' + '<img src="' + createPhoto(place) + '">' + '<p>' + place.vicinity + '</p><p class="star2">' + averageRating + ' ' + starRating(place.rating) + '</p><a href="#restaurant_review" class="avis" data-id="' + place.place_id + '">Voir Avis</a></div>'
                        });
                        if (prev_infowindow) {
                            prev_infowindow.close();
                        }
                        prev_infowindow = infowindow;
                        infowindow.open(map, marker);
                        getReviews();
                    });
                    
                    if(Math.round(place.rating) >= optionChoiceOne.value && Math.round(place.rating) <= optionChoiceTwo.value) {
                        addGooglePlacesRestaurant(place);
                    } else if (Math.round(place.rating) >= optionChoiceTwo.value && Math.round(place.rating) <= optionChoiceOne.value) {
                        addGooglePlacesRestaurant(place);
                    } else {
                        marker.setMap(null);
                    }
                }
            }            
            //Autocomplete section to seek specific town or establishment.
            var inputCity = document.getElementById('autocompleteCity'),
                inputRestaurant = document.getElementById('autocompleteRestaurant');
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputCity); map.controls[google.maps.ControlPosition.TOP_LEFT].push(inputRestaurant);
            
            var autocompleteCity = new google.maps.places.Autocomplete(inputCity, {
                types: ['(cities)']
            });            
            autocompleteCity.addListener('place_changed', function() {
                var placeCity = autocompleteCity.getPlace();
                if (placeCity.geometry) {
                    map.panTo(placeCity.geometry.location);
                    map.setZoom(15);
                    search();
                    inputCity.value = '';
                } else {
                    document.getElementById('autocompleteCity').placeholder = 'Nom de ville';
                }
            });
            
            var autocompleteRestaurant = new google.maps.places.Autocomplete(inputRestaurant);
            autocompleteRestaurant.bindTo('bounds', map);
            autocompleteRestaurant.addListener('place_changed', function() {
                var placeRestaurant = autocompleteRestaurant.getPlace();
                if (!placeRestaurant.geometry) {
                    window.alert("No details available for : '" + placeRestaurant.name + "'");
                    return;
                }
                // If the place has a geometry, then zoom on it.
                if (placeRestaurant.geometry.viewport) {
                    map.setCenter(placeRestaurant.geometry.location);
                    map.setZoom(18);
                    search();
                    inputRestaurant.value = '';
                }
            });

            //Change markers and restaurant list when the map has been dragged or if user selects specific star rating 
            google.maps.event.addListener(map, 'dragend', function () {
                search();
            });
            optionChoiceOne.addEventListener('change', function () {
                search();
            });
            optionChoiceTwo.addEventListener('change', function () {
                search();
            });
            //Add a marker to the map to add a new restaurant when user right clicks. Once form filled out the new info info appears with all the info and can see info in the review area below the map. If right clicking marker again the marker is taken away.
            google.maps.event.addListener(map, 'rightclick', function (mouseEvent) {
                var newMarker = new google.maps.Marker({
                    position: mouseEvent.latLng,
                    map: map,
                    icon: 'images/green_marker.png'
                });
                
                var addNewRestaurant = '<div id="newRestaurant"><h4>Ajouter un Restaurant</h4><form id="addNewRestaurant"><label>Nom du restaurant</label><br><input type="text" name="newName" id="newName" required><br><label>Adresse</label><br><input type="text" name="newAddress" id="newAddress" required><br><label>Telephone</label><br><input type="text" name="newTel"><br><label>Website</label><br><input type="text" name="newWebsite"><br><input type="submit" id="submitNewRestaurant"></form></div>';
                
                var infowindow = new google.maps.InfoWindow({
                    content: addNewRestaurant
                });
                
                infowindow.open(map, newMarker);
                
                var inputAddress = document.getElementById('newAddress')
                var autocompleteAddress = new google.maps.places.Autocomplete(inputAddress);
                autocompleteAddress.bindTo('bounds', map);
                
                var inputName = document.getElementById('newName')
                var autocompleteName = new google.maps.places.Autocomplete(inputName);
                autocompleteName.bindTo('bounds', map);
                
                var form = document.getElementById('addNewRestaurant');
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    var newName = form.elements.newName.value;
                    var newAdresse = form.elements.newAddress.value;
                    var newTel = form.elements.newTel.value;
                    var newWebsite = form.elements.newWebsite.value;
                    var newHref;
                    if ((newWebsite.indexOf('http://') !== 0) && (newWebsite.indexOf('https://') !== 0)) {
                        newHref = 'http://' + newWebsite;
                    }
                    infowindow.setContent('<div class="window_info"><p class="infoWindowName">' + newName + '</p><p>' + newAdresse + '</p><p>' + newTel + '</p><a href="' + newHref + '">' + newWebsite + '</a><br><a href="#restaurant_review" class="avisRestaurant">Voir Avis</a></div>');
                    
                    $('.avisRestaurant').on('click', function () {
                        $('#restaurant_review').css('display', 'block');
                        $('#restaurant_Name').html(newName);
                        $('#adresse').html(newAdresse);
                        $('#telephone').html(newTel);
                        $('#website').html(newWebsite);
                        var comment = '';
                        $('#comments').html(comment);
                        panorama = new google.maps.StreetViewPanorama(document.getElementById('photo_view'), {
                            position: mouseEvent.latLng,
                            zoom: 1
                        });
                    });
                });
                
                newMarker.addListener('click', function () {
                    infowindow.open(map, newMarker);
                });
                
                newMarker.addListener('rightclick', function () {
                    newMarker.setMap(null);
                });
            });
            
            search();
            
        }, function () {
            handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        handleLocationError(false, infoWindow, map.getCenter());
    }
}
function handleLocationError(browserHasGeolocation, infoWindow, pos) {
    $('#intro_info').html('<p>Vous avez refusé la géolocalisation ou une erreur est survenue. Actualisez votre navigateur pour essayer de nouveau.</p>');
    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                            'Error: The Geolocation service failed.' :
                            'Error: Your browser doesn\'t support geolocation.');
}
//Add review when submitting form in the restaurant review section.
var formReview = document.getElementById('review_form');
formReview.addEventListener('submit', function (e) {
    e.preventDefault();
    var userName = formReview.elements.nom.value;
    var userRating = formReview.elements.numberstars.value;
    var userComment = formReview.elements.fullcomment.value;
    var userStars = starRating(userRating);
    $('#comments').append('<p>' + userName + '</p><p class="star">' + userStars + '</p><p>' + userComment + '</p><hr>');
    formReview.reset();
});
//Smooth scroll back up to map from review section
$('#scroll').on('click', function () {
    window.scroll({
        top: 0, 
        behavior: 'smooth' 
    });
});