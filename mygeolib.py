from math import radians, cos, sin, asin, sqrt

def haversine(point1, point2, miles=False):
    """ Calculate the great-circle distance bewteen two points on the Earth surface.

    :input: two 2-tuples, containing the latitude and longitude of each point
    in decimal degrees.

    Example: haversine((45.7597, 4.8422), (48.8567, 2.3508))

    :output: Returns the distance bewteen the two points.
    The default unit is kilometers. Miles can be returned
    if the ``miles`` parameter is set to True.

    """
    # unpack latitude/longitude
    lat1, lng1 = point1
    lat2, lng2 = point2

    # convert all latitudes/longitudes from decimal degrees to radians
    lat1, lng1, lat2, lng2 = map(radians, (lat1, lng1, lat2, lng2))

    # calculate haversine
    lat = lat2 - lat1
    lng = lng2 - lng1
    d = sin(lat * 0.5) ** 2 + cos(lat1) * cos(lat2) * sin(lng * 0.5) ** 2
    AVG_EARTH_RADIUS = 6371  # in km
    h = 2 * AVG_EARTH_RADIUS * asin(sqrt(d))
    if miles:
        return h * 0.621371  # in miles
    else:
        return h  # in kilometers

#lyon = (52.352461, 16.921083)
#paris = (52.352126, 16.925541)
#print haversine2(lyon, paris)

def decode_polyline(polyline_str):
    index, lat, lng = 0, 0, 0
    coordinates = []
    changes = {'latitude': 0, 'longitude': 0}

    # Coordinates have variable length when encoded, so just keep
    # track of whether we've hit the end of the string. In each
    # while loop iteration, a single coordinate is decoded.
    while index < len(polyline_str):
        # Gather lat/lon changes, store them in a dictionary to apply them later
        for unit in ['latitude', 'longitude']:
            shift, result = 0, 0

            while True:
                byte = ord(polyline_str[index]) - 63
                index += 1
                result |= (byte & 0x1f) << shift
                shift += 5
                if not byte >= 0x20:
                    break

            if (result & 1):
                changes[unit] = ~(result >> 1)
            else:
                changes[unit] = (result >> 1)

        lat += changes['latitude']
        lng += changes['longitude']

        coordinates.append((lng / 100000.0, lat / 100000.0))

    return coordinates

