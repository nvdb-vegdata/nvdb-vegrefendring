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
              'hp' + str( vegref['RoadNumberSegment'] ) + \
              ' m' + str( vegref['RoadNumberSegmentDistance'])
        
    fradato = vegref['ValidFrom'][0:10]
    tildato = vegref['ValidTo'][0:10]
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
                "vegref": vegstr, 
                "fradato" : fradato, 
                "tildato" : tildato

              }
            }
    
    return geoj

def sorterdato( resultatliste, dato ): 
    """ 
    Sorterer på fradato og markere den som stemmer overens 
    """ 
    pass 


def henthistorikk( fylke=15, kommune=0, kat='E', stat='V', 
                  vegnr=39, hp=29, meter=7618, dato=''):
 
    vegref = str(fylke).zfill(2) + str(kommune).zfill(2) + \
            kat.upper() + stat.upper() + \
            str(vegnr).zfill(5) + str(hp).zfill(3) + str(meter).zfill(5)
    
    resultatliste = []

    url = 'http://visveginfo-static.opentns.org/RoadInfoService3d/GetRoadReferenceHistoryForReference?roadReference=1500EV0003902907618'
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
            

        return resultatliste
        
    else:
        print( r.text)