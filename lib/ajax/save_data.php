<?php
include_once dirname(__FILE__).'/../xml_manager.php';

switch ($_POST['save']) 
{
case "structure":
	$structXml = new XmlManager('<structure/>');
	$structXml->parsePoints($_POST['points']);
	$structXml->parseElements($_POST['elements']);
	$structXml->SaveData("../../sav/str.xml");
	break;

case "options":
	$optXml = new XmlManager('<options/>');
	$optXml->parseGeneric($_POST['options'], "");
	$optXml->SaveData("../../sav/opt.xml");
	break;
}
?>