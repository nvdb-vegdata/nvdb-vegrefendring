from flask import Flask, request, jsonify
import hentvegref
app = Flask(__name__)

@app.route("/")
def bruksanvisning():
    mappe = '/home/jan/vegrefhistorikkproxy/vegrefendring/pythonbackend/'
    with open( mappe + 'infotekst.html', encoding='utf-8') as f: 
        myTekst = f.read()
    
    return myTekst

@app.route("/vegreferanse")
def sjekkvegreferanser(): 
    fylke = request.args.get('fylke', default='')
    kommune = request.args.get('kommune', default='00')
    kat = request.args.get('kat', default='')
    stat = request.args.get('stat', default='V')
    vegnr = request.args.get('vegnr', default='')
    hp = request.args.get('hp', default=1)
    meter = request.args.get('meter', default=0)
    valgtdato = request.args.get('dato', default='')
    fjerndubletter = request.args.get('fjerndubletter', default='')
    hentdagensverdi = request.args.get('hentdagensverdi', default='')
    crs = request.args.get('crs', default=25833)

    if fjerndubletter.lower() == 'true':
        fjerndubletter = True
    else: 
        fjerndubletter = False 

    try: 
        fylke = int( fylke) 
        vegnr = int( vegnr) 
    except ValueError: 
        fylke = None 
    
    if hentdagensverdi.lower() == 'true':
        hentdagensverdi = True
    else: 
        hentdagensverdi = False 
    
    
    
    if fylke and kat and vegnr:
        vegref = hentvegref.henthistorikk( fylke=fylke, 
                kommune=kommune, kat=kat, stat=stat, 
                vegnr=vegnr, hp=hp, meter=meter, valgtdato=valgtdato, crs=crs, fjerndubletter=fjerndubletter, dagensverdi=hentdagensverdi) 

        return jsonify(**vegref)

    else:
    
        vegref =  {'type': 'FeatureCollection', 'features': []}
        return jsonify(**vegref)  

@app.route("/posisjon") 
def posisjon():
    easting = request.args.get( 'ost', default='')
    northing = request.args.get( 'nord', default='') 
    valgtdato = request.args.get( 'dato', default='')
    fjerndubletter = request.args.get('fjerndubletter', default='')
    crs = request.args.get('crs', default=25833)

    if fjerndubletter.lower() == 'true':
        fjerndubletter = True   
    else: 
        fjerndubletter = False 
        
    
    try: 
        easting = float( easting) 
        northing = float( northing) 
    except ValueError: 
        easting = None
        
    if easting and northing: 
        
        vegref = hentvegref.vegrefkoordinat( easting=easting, 
                              northing=northing, valgtdato=valgtdato, crs=crs, fjerndubletter=fjerndubletter) 
                                                
    else: 
        vegref =  {'type': 'FeatureCollection', 'features': [] }
        
    return jsonify(**vegref) 


if __name__ == "__main__":
    app.run()
    

