//constructor
function Point(poi)
{
	this.id = poi.id;
	this.angle = poi.angle;
	this.x = poi.x;
	this.y = poi.y;
	this.dof = poi.dof;
	this.pload = poi.pload;
	this.e = {'sL':false, 'sR':false};
	this.result = null;
	this.maxRes = null;
	this.elms = Array();
}

//check if two points are equal
Point.prototype.equals = function(point)
{
	if (this == point) return true;
	if (this.x == point.x && this.y == point.y) return true;
	return false;
}

//add connected element to point
Point.prototype.addElm = function(element)
{
	for (var i = 0; i < this.elms.length; i++) {
		if (this.elms[i].equals(element)) { return false; }
	}
	
	this.elms[this.elms.length] = element;
	return true;
}

//remove connected element from point
Point.prototype.removeElm = function(element)
{
	var elm = this.elms.indexOf(element);
	
	if (elm  == -1) { 
		return false;
	} else {
		this.elms.splice(elm, 1);
		return true;
	}
}

//get restraint type string
Point.prototype.getRestType = function()
{
	var type = "";
	
	for (var i = 0; i < 3; i++){
		if (this.dof[i].rest) {type += "1";} else {type += "0";}
	}
	
	return type;
}

//output point in JSON object
Point.prototype.outJSON = function()
{
	return {'angle':this.angle, 'x':this.x, 'y':this.y, 'dof':this.dof, 'pload':this.pload};
}

//---------------------------------------- SVG ----------------------------------------//

//SVG main point
Point.prototype.svgPoint = function()
{	
	var g = $(svgNode('g')).attr({'class':'poi'});
		g.append($(svgNode('circle')).attr({'cx':this.x, 'cy':this.y, 'r':3.5}));																		//displayed point
		g.append($(svgNode('circle')).attr({'class':"snap snap-point", 'cx':this.x, 'cy':this.y, 'r':6, 'stroke-opacity':0.0, 'fill-opacity':0.0}));	//hover point
		g.append($(svgNode('text')).attr({'class':"res-poi-text", 'x':this.x+10, 'y':-this.y-10,'transform':"scale(1,-1)", 'style':"display:none"}));	//result poi text
	
	return g;
}

//SVG point label
Point.prototype.svgLabel = function(disp_index)
{
	var g = $(svgNode('g')).attr({'class':"poi-label"});
		g.append($(svgNode('text')).attr({'class':"poi-index", 'x':this.x+5, 'y':-this.y-5, 'transform':"scale(1,-1)"}).text(this.id));
		if (disp_index) {g.css({'display':"block"});} else {g.css({'display':"none"});}		//set display point label
	
	return g;
}

//SVG restraint
Point.prototype.svgRest = function()
{
	var g = $(svgNode('g')).attr({'class':"restraint", 'transform':"translate("+this.x+","+this.y+") rotate("+this.angle+")"});
	
	switch (this.getRestType())
	{
	case '111':
		g.append($(svgNode('line')).attr({'x1':0, 'y1':0, 'x2':0, 'y2':-5, 'style':"stroke-width:4"}));
		g.append($(svgNode('line')).attr({'x1':-20, 'y1':-5, 'x2':20, 'y2':-5, 'style':"stroke-width:4"}));
		g.append($(svgNode('line')).attr({'x1':-10, 'y1':-5, 'x2':-16, 'y2':-13}));
		g.append($(svgNode('line')).attr({'x1':-2, 'y1':-5, 'x2':-8, 'y2':-13}));
		g.append($(svgNode('line')).attr({'x1':6, 'y1':-5, 'x2':0, 'y2':-13}));
		g.append($(svgNode('line')).attr({'x1':14, 'y1':-5, 'x2':8, 'y2':-13}));
		break;
		
	case '110':
		g.append($(svgNode('circle')).attr({'cx':0, 'cy':0, 'r':2, 'style':"fill:white"}));
		g.append($(svgNode('polygon')).attr({'points':'0,-2 -20,-25 20,-25', 'style':"fill:grey"}));
		g.append($(svgNode('line')).attr({'x1':-11, 'y1':-25, 'x2':-17, 'y2':-33}));
		g.append($(svgNode('line')).attr({'x1':-3, 'y1':-25, 'x2':-9, 'y2':-33}));
		g.append($(svgNode('line')).attr({'x1':5, 'y1':-25, 'x2':-1, 'y2':-33}));
		g.append($(svgNode('line')).attr({'x1':13, 'y1':-25, 'x2':7, 'y2':-33}));
		break;
		
	case '100':
	case '010':
		g.append($(svgNode('circle')).attr({'cx':0, 'cy':0, 'r':2, 'style':"stroke:black;fill:white"}));
		g.append($(svgNode('polygon')).attr({'points':"0,-2 -20,-25 20,-25"}));
		g.append($(svgNode('line')).attr({'x1':-25, 'y1':-30, 'x2':25, 'y2':-30}));
		g.append($(svgNode('line')).attr({'x1':-15, 'y1':-30, 'x2':-21, 'y2':-38}));
		g.append($(svgNode('line')).attr({'x1':-7, 'y1':-30, 'x2':-13, 'y2':-38}));
		g.append($(svgNode('line')).attr({'x1':1, 'y1':-30, 'x2':-5, 'y2':-38}));
		g.append($(svgNode('line')).attr({'x1':9, 'y1':-30, 'x2':3, 'y2':-38}));
		g.append($(svgNode('line')).attr({'x1':17, 'y1':-30, 'x2':11, 'y2':-38}));
		break;
		
	case '000':
		break;
	}
	
	return g;
}

//SVG point display DOFs
Point.prototype.svgDofs = function(disp_dof)
{
	var g = $(svgNode('g')).attr({'class':"poi-dofs", 'transform':"translate("+this.x+","+this.y+") rotate("+this.angle+")"});
	var g1;

	g1 = $(svgNode('g')).attr({'class':"dof-1", 'transform':"translate(20,0)"});
		g1.append($(svgNode('line')).attr({'x1':-15, 'y1':0, 'x2':15, 'y2':0}));
		g1.append($(svgNode('line')).attr({'x1':15-8, 'y1':-5, 'x2':15, 'y2':0}));
		g1.append($(svgNode('line')).attr({'x1':15-8, 'y1':5, 'x2':15, 'y2':0}));
		g1.append($(svgNode('text')).attr({'x':18, 'y':14, 'transform':"scale(1,-1)"}).text(1));
	g.append(g1);
	
	g1 = $(svgNode('g')).attr({'class':"dof-2", 'transform':"translate(0,20)"});
		g1.append($(svgNode('line')).attr({'x1':0, 'y1':-15, 'x2':0, 'y2':15}));
		g1.append($(svgNode('line')).attr({'x1':-5, 'y1':15-8, 'x2':0, 'y2':15}));
		g1.append($(svgNode('line')).attr({'x1':5, 'y1':15-8, 'x2':0, 'y2':15}));
		g1.append($(svgNode('text')).attr({'x':-16, 'y':-16, 'transform':"scale(1,-1)"}).text(2));
	g.append(g1);
	
	g1 = $(svgNode('g')).attr({'class':"dof-3", 'transform':"scale(1,1)"});
		g1.append($(svgNode('path')).attr({'d':"M -10.606601 10.606601 A 15 15 0 1 0 0 -15", 'style':"fill:none"}));
		g1.append($(svgNode('line')).attr({'x1':1, 'y1':15, 'x2':8, 'y2':18, 'transform':"rotate(45)"}));
		g1.append($(svgNode('line')).attr({'x1':1, 'y1':15, 'x2':6, 'y2':10, 'transform':"rotate(45)"}));
		g1.append($(svgNode('text')).attr({'x':15, 'y':-15, 'transform':"scale(1,-1)"}).text(3));
	g.append(g1);

	if (disp_dof) {g.css({'display':"block"});} else {g.css({'display':"none"});}		//set display dof
	
	return g;
}

//SVG point display load
Point.prototype.svgLoad = function(disp_px, disp_py, disp_pmz)
{
	var g = $(svgNode('g')).attr({'class':"poi-load", 'transform':"translate("+this.x+","+this.y+") rotate("+this.angle+")"});
	var g1;
	
	if (this.pload.px != 0) {
		g1 = $(svgNode('g')).attr({'class':"px", 'transform':"translate(32,0) scale("+(this.pload.px/Math.abs(this.pload.px))+",1)"});
			g1.append($(svgNode('line')).attr({'x1':-25, 'y1':0, 'x2':25, 'y2':0}));
			g1.append($(svgNode('line')).attr({'x1':25-8, 'y1':-5, 'x2':25, 'y2':0}));
			g1.append($(svgNode('line')).attr({'x1':25-8, 'y1':5, 'x2':25, 'y2':0}));
			g1.append($(svgNode('text')).attr({'x':-8, 'y':-6, 'transform':"scale("+(this.pload.px/Math.abs(this.pload.px))+",-1)"}).text(Math.abs(this.pload.px)));
			if (disp_px) {g1.css({'display':"block"});} else {g1.css({'display':"none"});}		// set display px
		g.append(g1);
	}
	
	if (this.pload.py != 0) {
		g1 = $(svgNode('g')).attr({'class':"py", 'transform':"translate(0,32) scale(1,"+(this.pload.py/Math.abs(this.pload.py))+")"});
			g1.append($(svgNode('line')).attr({'x1':0, 'y1':-25, 'x2':0, 'y2':25}));
			g1.append($(svgNode('line')).attr({'x1':-5, 'y1':25-8, 'x2':0, 'y2':25}));
			g1.append($(svgNode('line')).attr({'x1':5, 'y1':25-8, 'x2':0, 'y2':25}));
			g1.append($(svgNode('text')).attr({'x':10, 'y':-13, 'transform':"scale(1,"+(-this.pload.py/Math.abs(this.pload.py))+")"}).text(Math.abs(this.pload.py)));
			if (disp_py) {g1.css({'display':"block"});} else {g1.css({'display':"none"});}		//set display py
		g.append(g1);
	}
	
	if (this.pload.pmz != 0) {
		g1 = $(svgNode('g')).attr({'class':"pmz", 'transform':"scale(1,"+(this.pload.pmz/Math.abs(this.pload.pmz))+")"});
			g1.append($(svgNode('path')).attr({'d':"M -14.14213562 14.14213562 A 20 20 0 1 0 0 -20", 'style':"fill:none"}));
			g1.append($(svgNode('line')).attr({'x1':1, 'y1':20, 'x2':8, 'y2':23, 'transform':"rotate(45)"}));
			g1.append($(svgNode('line')).attr({'x1':1, 'y1':20, 'x2':6, 'y2':15, 'transform':"rotate(45)"}));
			g1.append($(svgNode('text')).attr({'x':0, 'y':0, 'transform':"translate("+(-18 - Math.abs(this.pload.pmz).toString().length*9)+",14.14213562) scale(1,"+(-this.pload.pmz/Math.abs(this.pload.pmz))+")"}).text(Math.abs(this.pload.pmz)));
			if (disp_pmz) {g1.css({'display':"block"});} else {g1.css({'display':"none"});}		//set display pmz
		g.append(g1);
	}
	
	return g;
}

//SVG point results
Point.prototype.svgRes = function(disp_react)
{
	var g = $(svgNode('g')).attr({'class':"poi-res", 'transform':"translate("+this.x+","+this.y+") rotate("+this.angle+")"});
	var g1;

	if (Math.abs(this.result.react[0].value) > 0.001) {
		g1 = $(svgNode('g')).attr({'class':"rx", 'transform':"translate(-32,0) scale("+(this.result.react[0].value/Math.abs(this.result.react[0].value))+",1)"});
			g1.append($(svgNode('line')).attr({'x1':-25, 'y1':0, 'x2':25, 'y2':0}));
			g1.append($(svgNode('line')).attr({'x1':25-8, 'y1':-5, 'x2':25, 'y2':0}));
			g1.append($(svgNode('line')).attr({'x1':25-8, 'y1':5, 'x2':25, 'y2':0}));
			g1.append($(svgNode('text')).attr({'x':12 - Math.abs(Math.round(this.result.react[0].value * 10)/10).toString().length*9, 'y':-10, 'transform':"scale("+(this.result.react[0].value/Math.abs(this.result.react[0].value))+",-1)"}).text(Math.abs(Math.round(this.result.react[0].value * 100)/100)));
		g.append(g1);
	}
	
	if (Math.abs(this.result.react[1].value) > 0.001) {
		g1 = $(svgNode('g')).attr({'class':"ry", 'transform':"translate(0,-32) scale(1,"+(this.result.react[1].value/Math.abs(this.result.react[1].value))+")"});
			g1.append($(svgNode('line')).attr({'x1':0, 'y1':-25, 'x2':0, 'y2':25}));
			g1.append($(svgNode('line')).attr({'x1':-5, 'y1':25-8, 'x2':0, 'y2':25}));
			g1.append($(svgNode('line')).attr({'x1':5, 'y1':25-8, 'x2':0, 'y2':25}));
			g1.append($(svgNode('text')).attr({'x':10, 'y':25, 'transform':"scale(1,"+(-this.result.react[1].value/Math.abs(this.result.react[1].value))+")"}).text(Math.abs(Math.round(this.result.react[1].value * 100)/100)));
		g.append(g1);
	}
	
	if (Math.abs(this.result.react[2].value) > 0.001) {
		g1 = $(svgNode('g')).attr({'class':"rmz", 'transform':"scale(1,"+(this.result.react[2].value/Math.abs(this.result.react[2].value))+")"});
			g1.append($(svgNode('path')).attr({'d':"M -14.14213562 14.14213562 A 20 20 0 1 0 0 -20", 'style':"fill:none"}));
			g1.append($(svgNode('line')).attr({'x1':1, 'y1':20, 'x2':8, 'y2':23, 'transform':"rotate(45)"}));
			g1.append($(svgNode('line')).attr({'x1':1, 'y1':20, 'x2':6, 'y2':15, 'transform':"rotate(45)"}));
			g1.append($(svgNode('text')).attr({'x':28, 'y':0, 'transform':"scale(1,"+(-this.result.react[2].value/Math.abs(this.result.react[2].value))+")"}).text(Math.abs(Math.round(this.result.react[2].value * 100)/100)));
		g.append(g1);
	}
	if (disp_react) {g.css({'display':"block"});} else {g.css({'display':"none"});}		//display reactions

	return g;
}

//SVG point draw
Point.prototype.svgAdd = function(disp_pindex, disp_dof, disp_px, disp_py, disp_pmz)
{
	var g = $(svgNode('g')).attr({'id':"point"+this.id});
		g.append(this.svgRest());
		g.append(this.svgPoint());
		g.append(this.svgLabel(disp_pindex));
		g.append(this.svgLoad(disp_px, disp_py, disp_pmz));
		g.append(this.svgDofs(disp_dof));
	
	return g;
}

//SVG point remove
Point.prototype.svgRemove = function()
{
	$('#point'+this.id).remove();
}

//---------------------------------------- EVENTS ----------------------------------------//

//enable or disable events
Point.prototype.events = function(value)
{
	if (value) {
		$('#point'+this.id+' > g:eq(1)').attr({'class':"poi"});
		$('#point'+this.id+' > g:eq(1) > circle:eq(1)').attr({'class':"snap snap-point"});
	} else {
		$('#point'+this.id+' > g:eq(1)').attr({'class':""});
		$('#point'+this.id+' > g:eq(1) > circle:eq(1)').attr({'class':""});
	}
}

//change point ID
Point.prototype.changeID = function(value)
{
	var old_id = this.id;
	this.id += value;
	$('#point'+old_id).attr({'id':"point"+this.id});
	$('#point'+this.id+' > g:eq(2) > text:eq(0)').text(this.id);
}

//reposition point
Point.prototype.reposition = function(x, y)
{
	this.x = x;
	this.y = y;
	
	$('#point'+this.id).children('g:eq(0), g:eq(3), g:eq(4)').attr({'transform':"translate("+this.x+","+this.y+") rotate("+this.angle+")"});
	$('#point'+this.id+' > g:eq(1) > circle').attr({'cx':this.x, 'cy':this.y});
	$('#point'+this.id+' > g:eq(2) > text').attr({'x':this.x+5, 'y':-this.y-5});
}

//rotate point
Point.prototype.rotate = function(angle, x, y)
{	
	if (angle !== undefined && angle !== null) {
		this.angle = angle;
	} else if (x !== undefined && x !== null && y !== undefined && y !== null) {
		var dx = x - this.x;
		var dy = y - this.y;
		var L = Math.sqrt(Math.pow(dx,2) + Math.pow(dy,2));
		
		if (L == 0) {
			this.angle = 0;
		} else {	
			if (dy >= 0) {
				if (dx >= 0) { this.angle = 180 * Math.asin(dy/L) / Math.PI; }
				else { this.angle = -180 * Math.asin(dy/L) / Math.PI + 180; }
			} else {
				if (dx <= 0) { this.angle = -180 * Math.asin(dy/L) / Math.PI + 180; }
				else { this.angle = 180 * Math.asin(dy/L) / Math.PI + 360; }
			}
		}
	}
	
	$('#point'+this.id).children('g:eq(0), g:eq(3), g:eq(4)').attr({'transform':"translate("+this.x+","+this.y+") rotate("+this.angle+")"});
}

//mousover point display
Point.prototype.mOverDisp = function()
{
	$('#point'+this.id+' > g:eq(2)').css({'stroke':"#484848", 'fill':"#484848"});							//default hover label color
	if (this.e.sL === true) {
		$('#point'+this.id+' > g:eq(1) > circle:eq(0)').attr({'stroke':"black", 'fill':"red", 'r':"5"});	//default selected point
	} else {
		$('#point'+this.id+' > g:eq(1) > circle:eq(0)').attr({'stroke':"black", 'fill':"white", 'r':"5"});	//default hover point
	}
}

//mousover point display
Point.prototype.mOutDisp = function(dips_res)
{
	$('#point'+this.id+' > g:eq(2)').css({'stroke':"#808080", 'fill':"#808080"});								//default label color
	if (this.e.sL === true) {
		$('#point'+this.id+' > g:eq(1) > circle:eq(0)').attr({'stroke':"black", 'fill':"red", 'r':"5"});		//default selected point
	} else {
		$('#point'+this.id+' > g:eq(1) > circle:eq(0)').attr({'stroke':"black", 'fill':"black", 'r':"3.5"});	//default point
	}
	if (dips_res) { $('#point'+this.id+' .res-poi-text').css({'display':"none"}); }
}

//left mouseup event
Point.prototype.mUpLeft = function()
{
	if (this.e.sL === true) {this.e.sL = false;} else {this.e.sL = true;}	//LMB point select
	//LMB change point select style
	if (this.e.sL === true){
		$('#point'+this.id+' > g:eq(1) > circle:eq(0)').attr({'stroke':"black", 'fill':"red", 'r':"5"});		//default selected point
	} else {
		$('#point'+this.id+' > g:eq(1) > circle:eq(0)').attr({'stroke':"black", 'fill':"white", 'r':"5"});	//default hover point
	}
}

//right mouseup event
Point.prototype.mUpRight = function()
{
	if (this.e.sR === true) {this.e.sR = false;} else {this.e.sR = true;}	//LMB point select
}

//mousover result point display
Point.prototype.resTextDisp = function(values)
{
	$('#point'+this.id+' .res-poi-text').empty();	//empty previous text
	
	for (var i = 0; i < values.length; i++) {
		$('#point'+this.id+' .res-poi-text').append($(svgNode('tspan')).attr({'x':this.x + 10, 'dy':16}).text(values[i]));
	}
	
	$('#point'+this.id+' .res-poi-text').attr({'y':-this.y - 16*values.length - 10}).css({'display':"block"});	//display text	
}

//edit restraints
Point.prototype.editRestraint = function(p1, p2, p3)
{
	this.dof[0].rest = p1;
	this.dof[1].rest = p2;
	this.dof[2].rest = p3;
	
	$('#point'+this.id+' g:eq(0)').remove();			//remove previous restraint
	$('#point'+this.id).prepend(this.svgRest());		//add new restraint
}

//set new loads
Point.prototype.setLoad = function(disp_px, disp_py, disp_pmz)
{
	this.pload.px = $('#pxEdit input').val();			//set px load
	this.pload.py = $('#pyEdit input').val();			//set py load
	this.pload.pmz = $('#pmzEdit input').val();			//set pmz load
	
	$('#point'+this.id+' > g:eq(3)').remove();						//remove loads
	this.svgLoad(disp_px, disp_py, disp_pmz).insertAfter('#point'+this.id+' > g:eq(2)');	//create and insert new loads
}