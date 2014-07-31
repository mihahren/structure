<?php
include_once dirname(__FILE__).'/../xml_manager.php';

//execute structure command
$string = realpath(dirname(__FILE__)."/../../anal/structure")." ".realpath(dirname(__FILE__)."/../../sav/str.xml")." ".realpath(dirname(__FILE__)."/../../sav/res.xml");
exec($string, $blah);

//echo out the correct JSON string
$resultXml = new XmlManager(realpath(dirname(__FILE__)."/../../sav/res.xml"), true);

switch ($_POST['result']) 
{
case "points":
	echo $resultXml->resPoiJs();
	break;

case "elements":
	echo $resultXml->resElmJs();
	break;
}
?>