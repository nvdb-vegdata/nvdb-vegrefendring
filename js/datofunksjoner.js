function fylldatovelger(valgtdato) {
    var mindato = ''; 

/*
    // Sjekker URL hvis ikke dato er oppgitt
    if (valgtdato === undefined) { 
        var myUrl = window.location.href; 
        mindato = getUrlParameter(myUrl, "dato");
        console.log( 'Prøver å hente dato fra URL parameter: ' + mindato);
    } else {
        mindato = valgtdato; 
        console.log( 'Bruker angitt dato:' + mindato); 
    }
*/    

    if (!sjekkdato( valgtdato)) { 

        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        valgtdato = yyyy + '-' + mm + '-' + dd; 

    }

    $(dato).val( valgtdato); 

}

/* Sjekker om vi har endret dato-tekstfeltet */
$("#dato").on("input", function(){
     var mindato = document.getElementById("dato").value;
     if (sjekkdato(mindato)) {

        // console.log( "Dato-tekstfelt endret" + mindato);  
        $(datostatus).removeClass('datoFeil').addClass('datoOK');
        $(datostatus).html('&#10004;'); 
        
     } else { 
     
        $(datostatus).removeClass('datoOK').addClass('datoFeil');
        $(datostatus).html('Skriv inn dato på formen ÅÅÅÅ-MM-DD'); 
     
     }
})

function formatterdato(mindato) {
    if (sjekkdato(mindato)) {
        
        var dsplit = mindato.split('-'); 
   
//        var dd = dsplit[2].padStart(2, '0');
//        var mm = dsplit[1].padStart(2, '0'); //January is 0!
        mindato = dsplit[0] + '-' + dsplit[1].padStart(2, '0') + '-' + dsplit[2].padStart(2, '0');  
      
        
    } else {
    
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();
        mindato = yyyy + '-' + mm + '-' + dd; 
    
    }
    
    return mindato 
}


function sjekkdato( mystring) {
// Sjekker om dato er på format 2018-12-30 

    var godkjent = false;     
    if (mystring === undefined)  {
        // Do nothing. Log to console? Nah... 
    } else { 
    

        var myArr = mystring.split( '-'); 
        if (myArr.length == 3) {
            var yyyy = parseInt( myArr[0] ); 
            var mm = parseInt( myArr[1] ); 
            var dd = parseInt( myArr[2] ); 
            
            if (!isNaN( yyyy ) && !isNaN( mm ) && !isNaN( dd)  && 
                yyyy > 1949 && yyyy < 1e4 && mm > 0 && mm < 13 && dd > 0 && dd < 32) {
                    godkjent = true; 
            }
            
        }
    }
    return godkjent

}