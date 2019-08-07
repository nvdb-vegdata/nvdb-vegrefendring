"""
Henter historikk for vegreferanser fra visveginfo-tjenesten 

Konverterer resultatene til geojson, med følgende attributter

vegreferanse : tekst på formen 5000 Ev6 hp80 m32475
fradato : dato på formen 2019-01-31
tildato : dato på formen 9999-12-31
fremhev : Tekst, en av verdiene idag, forrige, gammalt, fremhev, fremhevidag
            Planlagt brukt for symbolisering. 
            Verdiene betyr: 
                idag = vegreferanse som er gyldig i dag
                forrige = Den vegreferansen som var gyldig før dagens
                gammalt = Alle foregående vegreferanser
                fremhev = Hvis dato er angitt: Dette er den verdien som 
                          stemmer med angitt dato
                fremhevidag = Dagens vegreferanse var også gyldig på angitt dato


"""
import requests
import xmltodict
import re
import datetime
from copy import deepcopy 
import pdb 
# from pyproj import Proj, transform


def sjekkdatoer( fra, til, dato): 
    """
    sjekker om datoe er innafor intervallet [fra, til>
    """
    
    fra = int( re.sub( '\D+', '', fra  ) )
    til = int( re.sub( '\D+', '', til  ) )
    dato= int( re.sub( '\D+', '', dato ) )
    
    if dato >= fra and dato < til: 
        return True
    else: 
        return False 
    
    
def vegref2geojson( vegref):
    """
    Konverterer et vegreferanse-element til geojson-struktur
    """ 
    
    
    vegstr = vegref['TextualRoadReference'][0:4] + ' ' + \
             vegref['RoadCategory'] + vegref['RoadStatus'].lower() + \
             vegref['RoadNumber'] + ' ' + \
              'hp' + str( vegref['RoadNumberSegment'] ) + \
              ' m' + str( vegref['RoadNumberSegmentDistance'])
        
    fradato = vegref['ValidFrom'][0:10]
    tildato = vegref['ValidTo'][0:10]
    veglenkeid = vegref['ReflinkOID']
    veglenkeposisjon = round( float( vegref['Measure'] ), 8) 
    
    X = float( vegref['RoadNetPosition']['X'] ) 
    Y = float( vegref['RoadNetPosition']['Y'] ) 
    coordinates = [X, Y]
    if 'Z' in vegref['RoadNetPosition']:
        coordinates.append( float( vegref['RoadNetPosition']['Z'] )   )
    
    geoj = {  "type": "Feature",
              "geometry": {
                "type": "Point",
                "coordinates": coordinates
              },
              "properties": {
                "vegref"            : vegstr, 
                "fradato"           : fradato, 
                "tildato"           : tildato,
                "veglenkeid"        : veglenkeid, 
                "veglenkeposisjon" : veglenkeposisjon
              }
            }
    
    return geoj
    
def vegrefkoordinat( easting=214858, northing=6687762, valgtdato='', crs=25833, fjerndubletter=False): 
    resultatliste = []
    gjcollection = {    "type": "FeatureCollection",
                        "features": []
                    }

    url = 'http://visveginfo-static.opentns.org/RoadInfoService3d/GetRoadReferenceHistoryForLocation'
    params = { 'easting' : easting, 'northing' : northing, 
                'TopologyLevel' : 'Overview', 
                'searchRoadStatus' : 'V,W,T,G,A,B,H,S,M,P,X,E,U,Q' }
                
    r = requests.get( url, params=params)
    if r.ok and '<RoadPointReferenceWithTimePeriod>' in r.text: 

        data = r.text

        data = xmltodict.parse( data)    
        p1 = 'ArrayOfRoadPointReferenceWithTimePeriod'
        p2 = 'RoadPointReferenceWithTimePeriod'
        
        
        if   isinstance( data[p1][p2], dict  ): 
            
            resultatliste.append( vegref2geojson( data[p1][p2]  ))
        
        elif isinstance( ['a', 'b'], list):
            
            for envegref in data[p1][p2]: 
                
                resultatliste.append( vegref2geojson( envegref  ))
            

        resultatliste = sorterdato( resultatliste, valgtdato=valgtdato) 
        gjcollection['features'] = resultatliste
        
    else:
        pass 
        # print( r.text)
        # pdb.set_trace()


    if fjerndubletter: 
        gjcollection = fjerndobbelt( gjcollection) 

    if str( crs ) == '25833':
        gjcollection["crs"] = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::25833" } }    
    else: 
        gjcollection = reprojiser( gjcollection, crs2=crs) 
        
    
    return gjcollection

def sammenlign( kandidat, neste, koordinattoleranse = 1e-6): 
    """
    Regler for nå to oppføringer kan slås sammen: Samme koordinat, samme vegref-verdi og tilstøtende datoer
    """
    
    dx = kandidat['geometry']['coordinates'][0] - neste['geometry']['coordinates'][0]
    dy = kandidat['geometry']['coordinates'][1] - neste['geometry']['coordinates'][1]
    
    if abs( dx) < koordinattoleranse and abs( dy) < koordinattoleranse and \
        kandidat['properties']['vegref'] == neste['properties']['vegref'] and \
        kandidat['properties']['fradato'] == neste['properties']['tildato']: 
        
            # Sjekker veglenkeID og posisjon, om de finnes
            if 'veglenkeid' in kandidat['properties'].keys(): 
                if kandidat['properties']['veglenkeid'] == neste['properties']['veglenkeid'] and \
                        round( kandidat['properties']['veglenkeposisjon'], 8) == \
                        round( neste['properties']['veglenkeposisjon'], 8): 
                    return True
                else: 
                    return False 
                
        
            else: 
                return True
        
    else: 
    
        return False 

def velgfremhev( A, B): 
    """
    Velger den 'fremhev'-teksten som har størst informasjonsverdi
    
    Ideen er at vi slår sammen to features til ett når de har identisk vegreferanse og posisjon
    og tilstøtende datoer. Da må vi også overføre den "fremhev" - teksten som matcher best vårt problem
    """ 
    
    AB = A + B 
    if  'fremhev' in AB and 'idag' in AB: 
        return 'fremhevidag'
    elif 'fremhev' in AB: 
        return 'fremhev'
    elif 'idag' in AB: 
        return 'idag' 
    elif 'forrige' in AB: 
        return 'forrige' 
    else: 
        return 'gammalt' 


def fjerndobbelt( vegrefliste ): 
    """
    Fjerner dubletter fra listen. Disse kommer sortert på dato i omvendt rekkefølge, 
    dvs nyeste først. 
    """
    
    
    nyliste = deepcopy( vegrefliste )
    nyliste['features'] = []
    
    antall = len( vegrefliste['features'] )
    if antall == 0: 
        return vegrefliste 
        
    kandidat = deepcopy( vegrefliste['features'][0] ) 
    for index in range( 1, len( vegrefliste['features'])): 
        neste = deepcopy( vegrefliste['features'][index] ) 
            
        if sammenlign( kandidat, neste): 
            # Overfør relevante egenskaper og utvid dato-intervallet. 
            # Kandidaten med utvidet datointervall gjenbrukes på neste "neste" - datasett. 
            kandidat['properties']['fradato'] = neste['properties']['fradato']  
            kandidat['properties']['fremhev'] = velgfremhev( kandidat['properties']['fremhev'], 
                                                                neste['properties']['fremhev'] ) 
            
            
        else: 
            nyliste['features'].append( deepcopy ( kandidat ))
            kandidat = deepcopy( neste) 
            
    nyliste['features'].append( neste) 
    
    return nyliste 
    

def sorterdato( vegrefliste, valgtdato='' ): 
    """ 
    Sorterer på fradato og markere den som stemmer overens 
    """ 
    
    idag = datetime.datetime.now().strftime( '%Y-%m-%d') 
    p = 'properties' # Shortcut 
    baklengs_sortert = sorted(vegrefliste, reverse=True, key = lambda r: r[p]['fradato'] )
    resultat = []
    
    if not valgtdato: 
        valgtdato = '1905-06-07'
    
    # Dårlig stil å endre det man iterer over, pluss unngå "copy-by-reference" kluss
    # Derfor kopierer vi eksplisitt inn i ny liste
    for idx, veg in enumerate( baklengs_sortert): 
        nyveg = deepcopy( veg )
        fra = nyveg[p]['fradato']
        til = nyveg[p]['tildato']
        
        # Fremtidig dato? Lite sannsynlig, men vi tar høyde for det
        if int( re.sub( '\D+', '', fra) ) > int( re.sub( '\D+', '', idag)): 
            nyveg[p]['fremhev'] = 'imorgen' 
        
        # Gyldig i dag OG stemmer med den datoen du har valgt: 
        elif sjekkdatoer( fra, til, idag) and sjekkdatoer( fra, til, valgtdato): 
            nyveg[p]['fremhev'] = 'fremhevidag'
        elif sjekkdatoer( fra, til, idag): # Gyldig i dag
            nyveg[p]['fremhev'] = 'idag'
        elif sjekkdatoer( fra, til, valgtdato): # Valgt dato 
            nyveg[p]['fremhev'] = 'fremhev'
        elif idx == 1: 
            nyveg[p]['fremhev'] = 'forrige'
        else: 
            nyveg[p]['fremhev'] = 'gammalt'
                
        resultat.append( nyveg) 
        
    return resultat

def reprojiser( gjcollection, crs1=25833, crs2=4326):
    """
    """ 

    return gjcollection

    # try: 
        # inProj = Proj(init= 'epsg:' + str(crs1))
        # outProj = Proj(init= 'epsg:' + str(crs2))
    # except RuntimeError: 
        # return gjcollection 
    # else: 
    
        # retdata = deepcopy( gjcollection) 
        # retdata['features'] = []
        # for feat in gjcollection['features']: 
            # (x2,y2) = transform(inProj, outProj, feat['geometry']['coordinates'][0], feat['geometry']['coordinates'][1] )
            # nyfeat = deepcopy( feat) 
            # nyfeat['geometry']['coordinates'][0] = x2
            # nyfeat['geometry']['coordinates'][1] = y2
            
            # retdata['features'].append( nyfeat) 
        
        # if str( crs2 ) == '4326':
            # if 'crs' in retdata.keys(): 
                # junk = retdata.pop('crs') 
        # else: 
            # retdata['crs'] = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::" + str( crs2 ) } } 
            
        # return retdata 

def henthistorikk( fylke=15, kommune=0, kat='E', stat='V', 
                  vegnr=39, hp=29, meter=7618, valgtdato='', fjerndubletter=False, crs=25833):
 
    vegref = str(fylke).zfill(2) + str(kommune).zfill(2) + \
            kat.upper() + stat.upper() + \
            str(vegnr).zfill(5) + str(hp).zfill(3) + str(meter).zfill(5)
    
    resultatliste = []
    gjcollection = {    "type": "FeatureCollection",
                            "features": [] 
                            }



    url = 'http://visveginfo-static.opentns.org/RoadInfoService3d/GetRoadReferenceHistoryForReference'
    params = { 'roadReference' : vegref }
    r = requests.get( url, params=params)
    if r.ok and '<RoadPointReferenceWithTimePeriod>' in r.text: 

        data = r.text

        data = xmltodict.parse( data)    
        p1 = 'ArrayOfRoadPointReferenceWithTimePeriod'
        p2 = 'RoadPointReferenceWithTimePeriod'
        
        
        if   isinstance( data[p1][p2], dict  ): 
            
            resultatliste.append( vegref2geojson( data[p1][p2]  ))
        
        elif isinstance( ['a', 'b'], list):
            
            for envegref in data[p1][p2]: 
                
                resultatliste.append( vegref2geojson( envegref  ))
            

        resultatliste = sorterdato( resultatliste, valgtdato=valgtdato) 
        gjcollection['features'] = resultatliste
        
    else:
        pass 
        # print( r.text)
        # pdb.set_trace()
        
    if fjerndubletter: 
        gjcollection = fjerndobbelt( gjcollection) 
    
    if str( crs ) == '25833':
        gjcollection["crs"] = { "type": "name", "properties": { "name": "urn:ogc:def:crs:EPSG::25833" } } 
    else: 
        gjcollection = reprojiser( gjcollection, crs2=crs) 
    
    return gjcollection