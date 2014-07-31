<?php
include_once dirname(__FILE__).'/../xml_manager.php';

//echo out the correct JSON string
switch ($_POST['load']) 
{
case "points":
	$resultXml = new XmlManager(realpath(dirname(__FILE__)."/../../sav/str.xml"), true);
	echo $resultXml->pointsJs();
	break;

case "elements":
	$resultXml = new XmlManager(realpath(dirname(__FILE__)."/../../sav/str.xml"), true);
	echo $resultXml->elementsJs();
	break;

case "options":
	$optXml = new XmlManager(realpath(dirname(__FILE__)."/../../sav/opt.xml"), true);
	echo $optXml->genericJs();
	break;
}
?>