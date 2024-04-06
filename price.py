from shapely.geometry import Polygon, LineString
from shapely.ops import transform
import mygeolib
import pyproj
from functools import partial
from datetime import timedelta
from datetime import datetime
from datetime import date

project = partial(
    pyproj.transform,
    pyproj.Proj(init='epsg:4326'),
    pyproj.Proj('+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +no_defs'))

def price(myjson, citytxt, param):
    first_km = param.get('first_km', 1)
    price_start = param.get('price_start', 0)
    price_1km = param.get('price_1km', 0)
    discount = param.get('discount', 0)
    zam = param.get('zam', 0)
    holiday_mul = param.get('holiday_mul', 1.5)
    city_center = param.get('city_center', 0)
    kwota_za_kurs_minus = param.get('kwota_za_kurs_minus', 0)
    kwota_za_kurs_plus = param.get('kwota_za_kurs_plus', 0)
    price_1km_out = param.get('price_1km_out', 0)
    promo1_km = param.get('promo1_km', 0)

    path = mygeolib.decode_polyline(myjson["poly"])
    theDate = datetime.strptime(myjson["time"], "%Y-%m-%d %H:%M")
    path_line = transform(project, LineString(path))

    city = mygeolib.decode_polyline(citytxt)
    city_polygon = transform(project, Polygon(city))

    city_in = path_line.intersection(city_polygon)
    city_out = path_line.difference(city_polygon)

    korekta = (0.616 / 1000)
    in_length = city_in.length * korekta
    out_length = city_out.length * korekta

    if city_in.length == 0:
        dojazd_line = transform(project, LineString([city_center, path[0]]))
        dojazd_out = dojazd_line.difference(city_polygon)
        out_length += dojazd_out.length * korekta

    all_length = in_length + out_length

    response = {}
    response['zam'] = zam
    response['all_length'] = "{0:.1f}".format(all_length)
    dist = "dystans {0:.1f} km".format(all_length)
    if city_out.length > 0:
        dist += "  (w tym 2 strefa {0:.1f} km)".format(out_length)

    if promo1_km > 0 and promo1_km < all_length:
        promo1_price = param.get('promo1_price', 3.00)
        cena = promo1_price * all_length
        dist += "<br><b>promo1</b>"
    else:
        cena = price_start
        in_length -= first_km
        if in_length < 0:
            out_length += in_length
            in_length = 0
            if out_length < 0:
                out_length = 0
        cena += in_length * price_1km + out_length * price_1km_out
        dayoff = IsDayOffIsDayOff( theDate )
        if dayoff:
            cena = cena * holiday_mul
            dist += "<br><b>taryfa noc/święta</b>"
    #    logger.debug('PRICE cena:{0:.2f} holiday:{1}'.format(cena, dayoff))

    response['distance'] = dist
    response['cena'] = '{0:.0f}'.format(cena) # to pole dla mTaxiZ tylko
    cena_d = cena * discount
    # ponisze pola sa tylko dla strony ZAM
    if city_in.length > 0:
        if kwota_za_kurs_minus and kwota_za_kurs_plus:
            response['cena1'] = 'cena od <b>{0:.0f}</b> do <b>{1:.0f}</b> zł'.format(cena * kwota_za_kurs_minus / 100, cena * kwota_za_kurs_plus / 100)
            response['cena2'] = 'cena od <b>{0:.0f}</b> do <b>{1:.0f}</b> zł'.format(cena_d * kwota_za_kurs_minus / 100, cena_d * kwota_za_kurs_plus / 100)
        else:
            response['cena1'] = 'cena około <b>{0:.0f}</b> zł'.format(cena)
            response['cena2'] = 'cena około <b>{0:.0f}</b> zł'.format(cena_d)
    else:
        response['cena1'] = '<b>Kursu nie można zrealizować całkowicie poza granicami miasta !</b>'
        response['cena2'] = '<b>Kursu nie można zrealizować całkowicie poza granicami miasta !</b>'

    return response

def IsDayOffIsDayOff( theDate ):
    if theDate.hour >= 22 or theDate.hour < 6: return True # Noc
    #if theDate.weekday() == 5: return True #Sobota
    if theDate.weekday() == 6: return True #Niedziela
    if theDate.month == 1 and theDate.day == 1: return True #Nowy Rok
    if theDate.month == 1 and theDate.day == 6: return True #Trzech Kroli
    if theDate.month == 5 and theDate.day == 1: return True #1 maja 
    if theDate.month == 5 and theDate.day == 3: return True #3 maja
    if theDate.month == 8 and theDate.day == 15: return True #Wniebowziecie Najswietszej Marii Panny
    if theDate.month == 11 and theDate.day == 1: return True #Dzien Wszystkich Swietych
    if theDate.month == 11 and theDate.day == 11: return True #Dzien Niepodleglosci
    if theDate.month == 12 and theDate.day == 25: return True #Boze Narodzenie
    if theDate.month == 12 and theDate.day == 26: return True #Boze Narodzenie
    a = theDate.year % 19
    b = theDate.year % 4
    c = theDate.year % 7
    d = (a * 19 + 24) % 30
    e = (2 * b + 4 * c + 6 * d + 5) % 7
    if d == 29 and e == 6:
        d -= 7
    if d == 28 and e == 6 and a > 10:
        d -= 7
    #DateTime Easter = new DateTime(date.Year, 3, 22).AddDays(d + e)
    easter = date(theDate.year, 3, 22) + timedelta(days=d+e)
    if (theDate + timedelta(days=-1)) == easter: return True #Wielkanoc (poniedzialek)
    if (theDate + timedelta(days=-60)) == easter: return True #Boze Cialo
    return False

