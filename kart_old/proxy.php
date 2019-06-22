<?php 

function getData($lat, $lon) {
    $url = 'https://www.vegvesen.no/nvdb/api/vegreferanse?lat='.$lat.'&lon='.$lon;
    $options = array(
        'http'=>array(
        'method'=>"GET",
        'header'=>"Accept: application/vnd.vegvesen.nvdb-v1+json"
        )
    );
    $context = stream_context_create($options);
      
    $output = file_get_contents($url, false, $context); 
      
    return $output;
}

$data = getData($_GET['lat'], $_GET['lon']);
print_r($data);

?>