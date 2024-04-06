var connection;
var on_reason = 'START';
var map;
var MsgCounter = 0;
var infowindowConfirmGps;
var infowindow;
var wwwparams;
var markers = [];
var polygons = [];
var posmarker;
var colors = [];
var CENTER = new google.maps.LatLng(16.93319, 52.42137);
var TAXI = 0
var TXCLIENT = 0
var href = window.location.href;
//var href = "http://c2.altsoft.pl?ST=5&center=52.412493,16.923608&corp=POPHAW";
var raport;//extra raport mode
//var track;
var last_marked;
var hide_timeout = 5 * 60 * 1000;//5min

colors[1 + 0 * 0x100] = '#ff00ff';// _WAITING = 1;
colors[2 + 0 * 0x100] = '#00ffff';// _ARRIVING = 2;
colors[3 + 0 * 0x100] = '#0000ff';// _INCOURSE = 3;
colors[4 + 0 * 0x100] = '#ff8000';// _LEAVING2 = 4;
colors[4 + 1 * 0x100] = '#ff0000';
colors[4 + 3 * 0x100] = '#ff00ff';
colors[6 + 0 * 0x100] = '#000000';// _NOTWORKING2 = 6;
colors[6 + 3 * 0x100] = '#000000';//automat

var arrowSymbol = {
  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
  scale: 2
};
var circleSymbol = {
  path: google.maps.SymbolPath.CIRCLE,
  strokeColor: '#F00',
  fillColor: '#F00',
  fillOpacity: 1,
  scale: 4
};
var circle2Symbol = {
  path: google.maps.SymbolPath.CIRCLE,
  strokeColor: '#000',
  fillColor: '#000',
  fillOpacity: 1,
  scale: 3
};

function initializeMaps() {
  if (TAXI != 0) {
    map = new google.maps.Map(document.getElementById('map'), {
      center: CENTER,
      zoom: 15,
      mapTypeId: "OSM",
      mapTypeControl: false,
      streetViewControl: false,
      fullScreenControl: false
    });
  } else {
          if (TXCLIENT == 1) {
                map = new google.maps.Map(document.getElementById('map'), {
                  center: CENTER,
                  zoom: 13,
                  mapTypeId: "OSM",
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullScreenControl: false
                });
          } else {
                var mapTypeIds = [];
                for (var type in google.maps.MapTypeId) {
                        mapTypeIds.push(google.maps.MapTypeId[type]);
                }
                mapTypeIds.push("OSM");
                map = new google.maps.Map(document.getElementById('map'), {
                  center: CENTER,
                  zoom: 11,
                  mapTypeId: "OSM",
                  mapTypeControlOptions: {
                        mapTypeIds: mapTypeIds
                  }
                });
          }
  }
  map.mapTypes.set("OSM", new google.maps.ImageMapType({
    getTileUrl: function (coord, zoom) {
      // See above example if you need smooth wrapping at 180th meridian
      return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
    },
    tileSize: new google.maps.Size(256, 256),
    name: "OpenStreetMap",
    maxZoom: 18
  }));
  if (TAXI == 0) {
    infowindowConfirmGps = new google.maps.InfoWindow({});
    infowindowConfirmGps.setContent(
      '<b><p>Ustawić nową pozycję lokalizacyjną GPS</p>' +
      '<p>do aktualnego zlecenia ? <button class="buttonSet" onclick="setNewGps()">Ustaw</button><br><br><br></p>' +
      '<button class="buttonCancel" onclick="infowindowConfirmGps.close()">Nie</button></b>'
    );
    infowindow = new google.maps.InfoWindow({});
    posmarker = new google.maps.Marker({
      icon: '/mapa/Img/red-small.png',
      draggable: true,
      //label: '1',
      map: map
    });
    //google.maps.event.addListener(map, 'click', function(event) {
    //  console.log("CLICK");
    //  placeMarker(event.latLng);
    //});
    map.addListener('rightclick', function (e) {
      console.log("RIGHTCLICK latLng=" + e.latLng);
      infowindowConfirmGps.setPosition(e.latLng);
      infowindowConfirmGps.open(map, this);
    });
  }

  //  var bounds = new google.maps.LatLngBounds();
  //  bounds.extend(pos);

  //    markers.forEach(function(point) {
  //            generateIcon(point[0], function(src) {
  //              var pos = new google.maps.LatLng(point[1], point[2]);
  //
  //              new google.maps.Marker({
  //                    position: pos,
  //                      map: map,
  //                      icon: src
  //              });
  //            });
  //    });

  //    map.fitBounds(bounds);

}

function hexToR(h) { return parseInt((cutHex(h)).substring(0, 2), 16) }
function hexToG(h) { return parseInt((cutHex(h)).substring(2, 4), 16) }
function hexToB(h) { return parseInt((cutHex(h)).substring(4, 6), 16) }
function cutHex(h) { return (h.charAt(0) == "#") ? h.substring(1, 7) : h }
function ColorLuminance(color) {
  return 2 * hexToR(color) + 5 * hexToG(color) + 1 * hexToB(color);
}

var generateIconCache = [];

function generateIcon(state, number, callback) {

  var stateIcon = generateIconCache[state];
  if (stateIcon === undefined) {
    stateIcon = [];
    generateIconCache[state] = stateIcon;
  }

  if (stateIcon[number] !== undefined) {
    //console.log('state:' + state + ' number:' + number + '  from cache')
    callback(stateIcon[number]);
    return;
  }

  //console.log('state:' + state + ' number:' + number + '  new')

  var fontSize = 16;
  var imageWidth = 46;
  var imageHeight = 46;

  var color = colors[state];
  if (color === null || color === undefined) {
    color = '#555500';
  }

  var Luminance = ColorLuminance(color);
  var textcolor = (Luminance > 1000) ? '#000000' : '#ffffff';

  var svg = d3.select(document.createElement('div')).append('svg')
    //      .attr('viewBox', '0 0 54.4 54.4')
    .attr('width', 52).attr('height', 52)
    //      .attr('width', 60).attr('height', 60)
    //      .style('fill', '#222222')
    .append('g')

  var rectangle =
    svg.append("rect").attr("x", 0).attr("y", 28).attr("width", 32).attr("height", 24).style('fill', textcolor)
  svg.append("rect").attr("x", 1).attr("y", 29).attr("width", 30).attr("height", 22).style('fill', color);

  var text = svg.append('text').attr('dx', 16).attr('dy', 45).attr('text-anchor', 'middle').attr('style', 'font-size:' + fontSize + 'px; fill:' + textcolor + '; font-family: Arial, Verdana; font-weight: bold')
    .text(number);
  var svgNode = svg.node().parentNode.cloneNode(true),
    image = new Image();
  d3.select(svgNode).select('clippath').remove();
  var xmlSource = (new XMLSerializer()).serializeToString(svgNode);
  image.crossOrigin = 'anonymous';
  image.onload = (function (imageWidth, imageHeight) {
    image.crossOrigin = 'anonymous';
    var canvas = document.createElement('canvas'),
      context = canvas.getContext('2d'),
      dataURL;
    d3.select(canvas).attr('width', imageWidth).attr('height', imageHeight);
    context.drawImage(image, 0, 0, imageWidth, imageHeight);
    dataURL = canvas.toDataURL();
    stateIcon[number] = dataURL;
    callback(dataURL);
  }).bind(this, imageWidth, imageHeight);

  image.src = 'data:image/svg+xml;base64,' + btoa(encodeURIComponent(xmlSource).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    return String.fromCharCode('0x' + p1);
  }));
}
function StateInfo(marker) {
  return 'TAXI: <b>{' + marker.taxinr + '}</b><br>' + State(marker.state) + '<br>' + '\nod: ' + marker.state.time.substring(11);
}
function MarkerInfo(marker) {
  return '<b>' + marker.info + '<br>';
}
function StateRP(state) {
  if (state.p == state.r) {
    return "<b>r" + state.p + "</b>"
  } else {
    return "<b>r" + state.r + "/p" + state.p + "</b>";
  }
}
function State(state) {
  var sx = state.s % 256;
  var sy = state.s >> 8;
  switch (sx) {
    case 1:
      switch (sy) {
        case 0: return "zameldowany na " + StateRP(state);
        case 1: return "przerwa na " + StateRP(state);
        case 2: return "duga przerwa na " + StateRP(state);
      } break;
    case 2: return "dojazd do " + StateRP(state);
    case 3:
      switch (sy) {
        case 0: return "kursem do " + StateRP(state);
        case 1: return "konczy w " + StateRP(state);
      } break;
    case 4:
      switch (sy) {
        case 0: return "zjechal " + StateRP(state);
        case 1: return "zlecenie " + StateRP(state);
        case 2: return "oddal " + StateRP(state);
        case 3: return "nie bral " + StateRP(state);
        case 4: return "pod adresem " + StateRP(state);
        case 5: return "zjechal (automat) " + StateRP(state);
      } break;
    case 6:
      switch (sy) {
        case 0: return "nie pracuje";
        case 1: return "zablokowany";
        case 2: return "zablokowany";
        case 3: return "nie pracuje (automat)";
      } break;
  }
  return "s=" + state.s + " sx=" + sx + " sy=" + sy;
}
function handleTaxiState(taxistate) {
  if (TAXI != 0 && TAXI != taxistate.taxi) {
    return;
  }
  var marker = markers[taxistate.taxi];
  if (marker === undefined) {
    var pos = (taxistate.gps === undefined) ? new google.maps.LatLng(0.0, 0.0) : new google.maps.LatLng(taxistate.gps.pos[1], taxistate.gps.pos[0]);
    marker = new google.maps.Marker({
      position: pos,
      visible: (raport == null),
      map: map
    });
    marker.taxinr = taxistate.taxi;
    marker.state = (taxistate.state === undefined) ? { "s": 0, "p": 0, "r": 0, "time": "2016-01-01T22:30:12" } : taxistate.state;
    generateIcon(marker.state.s, marker.taxinr, function (src) {
      marker.setIcon(src);
    });
    //marker.setTitle(StateInfo(marker));//sets info
    markers[taxistate.taxi] = marker;
    if (TAXI == 0) {
      marker.addListener('mouseover', function () {
        infowindow.open(map, this);
        infowindow.setContent(StateInfo(this));
      });
      marker.addListener('mouseout', function () {
        infowindow.close();
      });
    }
  } else {
    if (taxistate.state !== undefined) {
      if (taxistate.state.s != marker.state.s) {
        generateIcon(taxistate.state.s, taxistate.taxi, function (src) {
          marker.setIcon(src);
        });
      }
      marker.state = taxistate.state;
      //marker.setTitle(StateInfo(marker));//sets info
    }
    if (taxistate.gps !== undefined) {
      marker.setPosition(new google.maps.LatLng(taxistate.gps.pos[1], taxistate.gps.pos[0]));
    }
  }
  marker.time = new Date();
  if (marker.map === null) {
    marker.setMap(map);
  }
  if (TAXI != 0) {
    map.setCenter(marker.getPosition());
  }
}


//=================================================================
function getUrlVars(href) {
  var vars = {};
  var parts = href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
    vars[key] = value;
  });
  return vars;
}
var par = getUrlVars(href);
if (par["center"] !== undefined) {
  var p = par["center"].split(',');
  //CENTER = [parseFloat(p[1]), parseFloat(p[0])];
  CENTER = new google.maps.LatLng(parseFloat(p[1]), parseFloat(p[0]));
}
TAXI = par["taxi"] || 0;
TXCLIENT = par["txclient"] || 0;
var ST = par["ST"] || 0;
//console.log("ST set to " + ST);
//if (par["ST"] !== undefined) {
//    ST = par["ST"];
//    console.log("ST set to " + ST + " (from params)");
//}
var rr = href.split('?');
var p = rr[1];
var params = '&mapver=2';
if (p) {
  params += '&' + p + '&mapa=' + rr[0];
}
function start() {
  var uri = 'ws://' + ((window.location.hostname == "localhost") ? 'mapa.altsoft.pl' : window.location.hostname) + ':1338?' + "&on=" + on_reason + params;
  //var uri = 'ws://c2.altsoft.pl:1338?' + "&on=" + on_reason + params;
  //var uri = (window.location.hostname == "localhost") ? 'ws://c2.altsoft.pl' : 'ws://' + window.location.hostname;
  //uri += ":1338" + params;
  //TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST
  //uri = 'ws://c2.altsoft.pl:1338?mapver=2&ST=5&center=52.412493,16.923608&corp=PORMI'
  //TEST  TdfgdfdEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST  TEST

  console.log('Connecting: ' + uri);
  connection = new WebSocket(uri);
  connection.onopen = function () {
    on_reason = 'ONCLOSE';
    console.log('Connection open');
    var msg = "Msg=&MR=1";
    connection.send(msg);//bezp. do TX (REQ_MAP:INIT)
  };
  connection.onerror = function (error) { console.log('Connection error'); };
  connection.onmessage = function (message) {
    var data;
    //console.log(message.data);
    if (message.data.indexOf('{"taxistate"=') === 0) {
      data = message.data.replace(/{"taxistate"=/, '{"taxistate":');
    } else {
      data = message.data;
    }
    try {
      MsgCounter++;
      if (!data) {
          return;
      }
      //console.log(">>"+data);
      var json = JSON.parse(data);
      if (json.taxistate) {
        handleTaxiState(json.taxistate);
      }
      if (json.wwwparams) {//przed taxistates! and only once
            handleWWWParams(json.wwwparams);
      }
      if (json.taxistates) {
        for (var i in json.taxistates) {
          handleTaxiState(json.taxistates[i]);
        }
      }
      if (json.rejtable) {
        handleRejTable(json.rejtable);
      }
      //dalej komunikaty tylko dla tej stacji!!!
      if (json.ST !== undefined && json.ST != ST) {//new format
        return;
      }
      if (json.setpos) {
        handleSetPos(json.setpos);
      }
      if (json.showtaxi) {
        handleShowTaxi(json.showtaxi)
      }
      if (json.gpstrack) {
        trackSet(json.gpstrack);
      }
      if (json.migawki) {//lista migawek
        migawkiSet(json.migawki, json.opis);
      }
      if (json.migawka) {//migawka
        migawkaSet(json.migawka, json.opis);
      }
      } catch (e) {
        console.log("("+data+")");
        console.log(e);
        return;
      }
      //console.log("=========");
    };
    connection.onclose = function () {
      console.log('Connection close');
      /*status.text('Disconnected');*/
      setTimeout(function () {
        start()
      }, 3000);
    };
  }

  function getErrorObject() {
    try { throw Error('') } catch (err) { return err; }
  }

  // the smooth zoom function
  function smoothZoom(max, cnt) {
    if (cnt >= max) {
      return;
    }
    else {
      z = google.maps.event.addListener(map, 'zoom_changed', function (event) {
        google.maps.event.removeListener(z);
        smoothZoom(max, cnt + 1);
      });
      setTimeout(function () { map.setZoom(cnt) }, 80); // 80ms is what I found to work well on my system -- it might not work well on all systems
    }
  }
  function animateMapZoomTo(targetZoom) {
    var currentZoom = arguments[1] || map.getZoom();
    if (currentZoom != targetZoom) {
      google.maps.event.addListenerOnce(map, 'zoom_changed', function (event) {
        animateMapZoomTo(targetZoom, currentZoom + (targetZoom > currentZoom ? 1 : -1));
      });
      setTimeout(function () { map.setZoom(currentZoom) }, 180);
    }
  }
  //Object.prototype.getName = function() {
  //   var funcNameRegex = /function (.{1,})\(/;
  //   var results = (funcNameRegex).exec((this).constructor.toString());
  //   return (results && results.length > 1) ? results[1] : "";
  //};
  function placeMarker(latLng) {
    posmarker.setPosition(latLng);
    //console.log("typeof latLng: " + latLng.getName());
    var gps = latLng.lat().toFixed(5) + "," + latLng.lng().toFixed(5);
    //console.log("gps=" + gps);
    var msg = "Msg=&MR=2" + "&ST=" + ST + "&gps=" + gps;
    connection.send(msg);//bezp. do TX (REQ_MAP:SET_NEWPOS)
  }
  function PosMarker(gps) {
    posmarker.setPosition(new google.maps.LatLng(gps[1], gps[0]));
  }
  function handleSetPos(setpos) {
    if (setpos.gps) {
      PosMarker(setpos.gps);
      map.setZoom(TXCLIENT ? 13 : 18);
      map.setCenter(posmarker.getPosition());
      //animateMapZoomTo(18);
    }
  }
  function setNewGps() {
    var latLng = infowindowConfirmGps.getPosition();
    console.log("setNewGps latLng=" + latLng);
    infowindowConfirmGps.close();
    placeMarker(latLng);
  }
  function handleShowTaxi(showtaxi) {
    var marker = markers[showtaxi.taxinr];
    if (marker) {
      map.setZoom(11);
      map.setCenter(marker.getPosition());
      animateMapZoomTo(18);
    }
  }
  function handleWWWParams(p) {
    wwwparams = p;
    CENTER = new google.maps.LatLng(p.HomeCityGps[1], p.HomeCityGps[0]);
    map.setCenter(CENTER);

    //      colors[1 + 0*0x100] = wwwparams.WaitingBkg;
    //      colors[1 + 1*0x100] = wwwparams.PauseBkg;
    //      colors[2 + 0*0x100] = wwwparams.ArrivingBkg;
    //      colors[3 + 0*0x100] = wwwparams.CourseBkg;
    //      colors[4 + 0*0x100] = wwwparams.LeavingBkg;
    //      colors[6 + 0*0x100] = wwwparams.NotWorkingBkg;

    colors[1 + 0 * 0x100] = wwwparams.WaitingBkg;
    colors[1 + 1 * 0x100] = wwwparams.PauseBkg;//krotka
    colors[1 + 2 * 0x100] = wwwparams.PauseBkg;//dluga
    colors[2 + 0 * 0x100] = wwwparams.ArrivingBkg;
    colors[3 + 0 * 0x100] = wwwparams.CourseBkg;
    colors[4 + 0 * 0x100] = wwwparams.LeavingBkg;
    if (wwwparams.LeavingZlecenieBkg) {
      colors[4 + 1 * 0x100] = wwwparams.LeavingZlecenieBkg;
    }
    if (wwwparams.LeavingOddalBkg) {
      colors[4 + 2 * 0x100] = wwwparams.LeavingOddalBkg;
    }
    if (wwwparams.LeavingNiebralBkg) {
      colors[4 + 3 * 0x100] = wwwparams.LeavingNiebralBkg;
    }
    if (wwwparams.LeavingPodAdresemBkg) {
      colors[4 + 4 * 0x100] = wwwparams.LeavingPodAdresemBkg;
    }
    if (wwwparams.LeavingAutomatBkg) {
      colors[4 + 5 * 0x100] = wwwparams.LeavingAutomatBkg;
    }
    colors[6 + 0 * 0x100] = wwwparams.NotWorkingBkg;
    if (wwwparams.NotWorkingBlockedBkg) {
      colors[6 + 1 * 0x100] = wwwparams.NotWorkingBlockedBkg;//radio
      colors[6 + 2 * 0x100] = wwwparams.NotWorkingBlockedBkg;//term
    }
    if (wwwparams.NotWorkingAutomatBkg) {
      colors[6 + 3 * 0x100] = wwwparams.NotWorkingAutomatBkg;
    }
  }
  google.maps.Polyline.prototype.getBounds = function () {
    var bounds = new google.maps.LatLngBounds();
    var path = this.getPath();
    for (var ii = 0; ii < path.getLength(); ii++) {
      bounds.extend(path.getAt(ii));
    }
    return bounds;
  }
  function getBounds(poly) {
    var bounds = new google.maps.LatLngBounds();
    var path = poly.getPath();
    for (var ii = 0; ii < path.getLength(); ii++) {
      bounds.extend(path.getAt(ii));
    }
    return bounds;
  }
  function RejonMod(rej) {
    var coordinates = [];
    for (var p in rej.polygon) {
      coordinates.push(new google.maps.LatLng(rej.polygon[p][1], rej.polygon[p][0]));
    }
    var Poly = new google.maps.Polygon({
      rnr: rej.pnr,
      path: coordinates,
      geodesic: true,
      strokeColor: rej.strokeColor || '#FF0000',
      strokeOpacity: rej.strokeOpacity || 0.9,
      strokeWeight: rej.strokeWeight || 1,
      strokeWeightOrg: rej.strokeWeight || 1,
      fillColor: rej.fillColor || '#FF0000',
      fillOpacity: rej.fillOpacity || 0.0
    });
    Poly.setMap(map);

    Poly.mymarker = new google.maps.Marker({
      position: getBounds(Poly).getCenter(),
      map: map,
      icon: 'img/empty.png',
      label: {
        color: 'red',
        text: ''+rej.pnr,
        fontSize: '16px',
      },
    });

    polygons.push(Poly);

    if (TAXI == 0) {
      Poly.addListener('rightclick', function (e) {
        console.log("RIGHTCLICK latLng=" + e.latLng);
        infowindowConfirmGps.setPosition(e.latLng);
        infowindowConfirmGps.open(map, this);
      });
    }

    google.maps.event.addListener(Poly, "mousemove", function () {
      //console.log("PNR="+this.rnr);
      this.setOptions({ strokeWeight: 5 });
      var label = this.mymarker.getLabel();
      label.fontSize = '26px';
      this.mymarker.setLabel(label);
    });
    google.maps.event.addListener(Poly, "mouseout", function () {
      this.setOptions({ strokeWeight: this.strokeWeightOrg });
      var label = this.mymarker.getLabel();
      label.fontSize = '16px';
      this.mymarker.setLabel(label);
    });
  }
  function DTStr(my, withdate) {
    var myDate = new Date(my);
    //return $.datepicker.formatDate("M d, yy", myDate);
    myDate.setMinutes(myDate.getMinutes() - myDate.getTimezoneOffset());
    //return '('+my+")="+myDate.toISOString();//2016-08-09T03:50:00.000Z
    if (withdate) {
      return myDate.toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).*/, '$4:$5:$5 $3.$2.$1');
    } else {
      return myDate.toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+).*/, '$4:$5:$5');
    }
    //return myDate.getHours() + ":" + myDate.getMinutes() + ":" + myDate.getSeconds() + "  " + myDate.getDate() + "." + (myDate.getMonth() + 1) + "." + myDate.getFullYear();
  }
  function find(x, i, j) {
    var k = Math.floor((i + j) / 2);
    if (k == i) {
      return (x <= (raport.track[i][2] + raport.track[j][2]) / 2) ? i : j;
    }
    if (x < raport.track[k][2]) {
      return find(x, i, k);
    } else {
      return find(x, k, j);
    }
  }

  var infoWindow = new google.maps.InfoWindow();

  var inputHandler = function (event) {
    var time_start = raport.track[0][2];
    var time_duration = raport.track[raport.track.length - 1][2] - time_start;

    var value = parseInt(this.value, 10) / 100;
    var m = time_start + (time_duration * value);
    var idx = find(m, 0, raport.track.length - 1);

    //var coordinate = ol.proj.transform(raport.track[idx], 'EPSG:4326', 'EPSG:3857');
    //var pos = new google.maps.LatLng(polygon[p][1], polygon[p][0])

    document.getElementById('timeinfo').innerHTML = DTStr(raport.track[idx][2], false);

    setCircle(idx);

    //if (last_marked) {
    //  last_marked.setIcon(circleSymbol);
    //}
    //last_marked = raport.track[idx].circle;
    //last_marked.setIcon(circle2Symbol);

    //last_marked.showInfoWindow();

    infoWindow.setContent('<h1>' + raport.track.circle.getTitle() + '</h1>');
    infoWindow.open(map, raport.track.circle);

    //Display[i] = '<table><tr><td>[[Title]]</td></tr><tr><td>[[Address]]<br />[[City]], [[State]] [[Zip]]</td></tr><tr><td>[[Phone]]</td></tr><tr><td>[[Email]]</td></tr><tr><td>[[WebURL]]</td></tr></table>';

    //var highlight = trackFeature.get('highlight');
    //if (highlight === undefined) {
    //    highlight = new ol.Feature(new ol.geom.Point(coordinate));
    //    trackFeature.set('highlight', highlight);
    //    featureOverlay.addFeature(highlight);
    //} else {
    //    highlight.getGeometry().setCoordinates(coordinate);
    //}
    //map.render();
  }
  document.getElementById('time').addEventListener("input", inputHandler);

  function setCircle(i) {
    raport.track.circle.setPosition(new google.maps.LatLng(raport.track[i][1], raport.track[i][0]));
    raport.track.circle.setTitle(DTStr(raport.track[i][2], false));
  }
  function ShowTaxis(visibility) {
    var i;
    for (i in markers) {
      markers[i].setVisible(visibility);
    }
  }
function removeOptions(select) {
  var i;
  for (i = select.options.length - 1; i >= 0; i--) {
    select.remove(i);
  }
}
function migawkiSet(migawki, opis) {
  ShowTaxis(false);
  raportRemove();
  raport = {};
  var select = document.getElementById("migawki");
  removeOptions(select);
  for (var i in migawki) {
    var opt = document.createElement('option');
    opt.value = opt.text = migawki[i];
    select.appendChild(opt);
  }
  document.getElementById("panel2").classList.add('panelactive');
  document.getElementById("opis").innerHTML = unescape(opis);
}
  function migawkaSet(migawka) {
    ShowTaxis(false);
    raportRemove();
    raport = {};
    raport.markers = [];
    for (var i in migawka.kurs) {
      var kurs = migawka.kurs[i];
      marker = new google.maps.Marker({
        icon: '/mapa/Img/yellow-flag-icon-39195.png',
        position: new google.maps.LatLng(kurs.pos[0], kurs.pos[1]),
        visible: true,
        label: kurs.label,
        info: unescape(kurs.title),
        map: map
      });
      marker.addListener('mouseover', function () {
        infowindow.open(map, this);
        infowindow.setContent(MarkerInfo(this));
      });
      marker.addListener('mouseout', function () {
        infowindow.close();
      });
      raport.markers.push(marker);
    }
    for (var i in migawka.taxi) {
      var taxi = migawka.taxi[i];
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(taxi.pos[0], taxi.pos[1]),
        visible: true,
        info: unescape(taxi.title),
        map: map
      });
      generateIcon(taxi.s, taxi.taxi, function (src) {
        marker.setIcon(src);
      });
      marker.addListener('mouseover', function () {
        infowindow.open(map, this);
        infowindow.setContent(MarkerInfo(this));
      });
      marker.addListener('mouseout', function () {
        infowindow.close();
      });
      raport.markers.push(marker);
    }
    //var latlngbounds = new google.maps.LatLngBounds();
    //for (var i in raport.markers) {
    //  latlngbounds.extend(raport.markers[i].position);
    //}
    //map.fitBounds(latlngbounds);
    //map.setZoom(map.getZoom() - 1);
  }
  function trackSet(gpstrack) {
    ShowTaxis(false);
    raportRemove();
    document.getElementById('taxinr').value = gpstrack.taxinr;
    document.getElementById('data_od').value = DTStr(gpstrack.od, true);
    document.getElementById('data_do').value = DTStr(gpstrack.do, true);
    raport = {};
    raport.track = gpstrack.track;
    if (raport.track.length > 1) {
      var coordinates = [];
      for (i = 0; i < raport.track.length; i++) {
        coordinates.push({ lat: raport.track[i][1], lng: raport.track[i][0] });
      }
      raport.track.polyline = new google.maps.Polyline({
        path: coordinates,
        strokeOpacity: 2,
        map: map
      });
      raport.track.circle = new google.maps.Marker({
        icon: circleSymbol,
        map: map,
      });
      setCircle(0);
    }
    map.fitBounds(raport.track.polyline.getBounds());
    document.getElementById('time').disabled = false;
    document.getElementById("panel1").classList.add('panelactive');
  }
  function raportRemove() {
    if (raport) {
      if (raport.markers) {
        for (var i in raport.markers) {
          raport.markers[i].setMap(null);
        }
      }
      if (raport.track) {
        raport.track.polyline.setMap(null);
        raport.track.circle.setMap(null);
      }
      //document.getElementById("panel").className = panel.className.replace(/\bpanelactive\b/, '');
      document.getElementById('time').disabled = true;
      document.getElementById('timeinfo').innerHTML = "";
      document.getElementById('info').innerHTML = "";
      raport = null;
    }
  }
  //$('#title').addEventListener('click', function (event) {
  //  var panel = $(this).closest('.panel');
  //  if (panel.classList.contains("panelactive")) {
  //    raportRemove();
  //    ShowTaxis(true);
  //  }
  //  panel.classList.toggle('panelactive');
  //});
  //document.getElementById('title1').addEventListener('click', function (event) {
  //  var panel = document.getElementById("panel1");
  //  if (panel.classList.contains("panelactive")) {
  //    raportRemove();
  //    ShowTaxis(true);
  //  }
  //  panel.classList.toggle('panelactive');
  //});
  //document.getElementById('title2').addEventListener('click', function (event) {
  //  var panel = document.getElementById("panel2");
  //  if (panel.classList.contains("panelactive")) {
  //    raportRemove();
  //    ShowTaxis(true);
  //  }
  //  panel.classList.toggle('panelactive');
  //});
  //$('#close').addEventListener('click', function (event) {
  //  var panel = $(this).closest('.panel');
  //  if (panel.classList.contains("panelactive")) {
  //    raportRemove();
  //    ShowTaxis(true);
  //  }
  //  panel.classList.toggle('panelactive');
  //});
  document.getElementById('close1').addEventListener('click', function (event) {
    var panel = document.getElementById("panel1");
    if (panel.classList.contains("panelactive")) {
      raportRemove();
      ShowTaxis(true);
    }
    panel.classList.toggle('panelactive');
  });
  document.getElementById('close2').addEventListener('click', function (event) {
    var panel = document.getElementById("panel2");
    if (panel.classList.contains("panelactive")) {
      raportRemove();
      ShowTaxis(true);
    }
    panel.classList.toggle('panelactive');
  });
  document.getElementById('migawki').addEventListener('change', function (event) {
    ShowTaxis(false);
    raportRemove();
    var msg = "Msg=&MR=6" + "&ST=" + ST + "&AddedTime=" + document.getElementById('migawki').value;
    connection.send(msg);//bezp. do TX (REQ_MAP:SET_NEWPOS)
  });
  function handleRejTable(rejtable) {
        for (i = 0; i < polygons.length; i++) {
          polygons[i].mymarker.setMap(null);
          polygons[i].setMap(null);
    }
        polygons = [];
    for (var r in rejtable) {
      RejonMod(rejtable[r]);
    }
  }
  setInterval(function () {
    if (MsgCounter == 0) {
      on_reason = 'NODATA';
      connection.close();
    }
    MsgCounter = 0;

    var now = new Date();
    var death = now.getTime() - hide_timeout;
    for (var i = markers.length - 1; i >= 0; i--) {
      var marker = markers[i];
      if (marker != null && marker.map !== null) {
        //if (marker != null) {
        //console.log('taxi:'+ marker.taxinr + ' map:'+marker.map + '  death:'+death);
        if ((marker.state.s % 256) == 6 || marker.time < death) {
          //console.log('remove:' + marker.taxinr);
          marker.setMap(null);
          //markers[i] = null;
          //markers.splice(i, 1);
        }
      }
    }
  }, 60000);

  //console.log('ver 3');
  document.getElementById('version').innerHTML = 'ver 3';

  initializeMaps();

  start();


