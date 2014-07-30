//create svg node
function svgNode(elmName)
{
	return document.createElementNS('http://www.w3.org/2000/svg', elmName);
}

$(document).ready(function() {
	var structure = new LinearStructure("#svgCont", 0, 0, 1, -1, 1, 1);
	//draw the structure
	structure.drawSVG();
	//set events
	structure.setEvents();
});