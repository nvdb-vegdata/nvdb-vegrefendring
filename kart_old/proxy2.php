<?php function getData($lat, $lon) {
    $url = 'https://jansimple.pythonanywhere.com/sjekkvegreferanser?lon='.$lon.'&lat='.$lat;	$output = file_get_contents( $url); 	return $output;
}
$data = getData($_GET['lat'], $_GET['lon']);
print_r($data);

?>