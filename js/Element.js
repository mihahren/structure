//constructor
function Element(elm)
{
	this.id = elm.id;
	this.E = elm.E;
	this.A = elm.A;
	this.Iz = elm.Iz;
	this.p1 = elm.p1;
	this.p2 = elm.p2;
	this.L = this.setLength();
	this.arc = this.realArc();
	this.dof = elm.dof;
	this.eload = elm.eload;
	this.e = {'sL':false, 'sR':false};
	this.result = null;
	this.maxRes = null;
}

//check if two elements are equal
Element.prototype.equals = function(element)
{
	if (this == element) return true;
	if (this.p1 == element.p1 && this.p2 == element.p2) return true;
	return false;
}

//get release type string
Element.prototype.getRelType = function(first)
{
	var type = "";
	if (first) {
		for (var i = 0; i < 3; i++) {
			if (this.dof[i].exist) {type += "1";} else {type += "0";}
		}
	} else {
		for (var i = 0; i < 3; i++) {
			if (this.dof[3+i].exist) {type += "1";} else {type += "0";}
		}
	}
	
	return type;
}

//return real element arc
Element.prototype.setLength = function()
{
	var length = Math.sqrt(Math.pow(this.p2.x - this.p1.x, 2) + Math.pow(this.p2.y - this.p1.y, 2));;
	
	return length;
}

//return real element arc
Element.prototype.realArc = function()
{
	var dx = this.p2.x - this.p1.x;
	var dy = this.p2.y - this.p1.y;
	var angle;
	
	if (this.L == 0) { return 0; }	
	
	if (dy >= 0) {
		if (dx >= 0) {angle = 180 * Math.asin(dy/this.L) / Math.PI;}
		else {angle = -180 * Math.asin(dy/this.L) / Math.PI + 180;}
	} else {
		if (dx <= 0) {angle = -180 * Math.asin(dy/this.L) / Math.PI + 180;}
		else {angle = 180 * Math.asin(dy/this.L) / Math.PI + 360;}
	}
	
	return angle;
}

Element.prototype.outJSON = function()
{
	return {'E':this.E, 'A':this.A, 'Iz':this.Iz, 'p1':this.p1.id, 'p2':this.p2.id, 'dof':this.dof, 'eload':this.eload};
}

//---------------------------------------- SVG ----------------------------------------//

//SVG element main
Element.prototype.svgElement = function()
{
	var xc = (this.p1.x + this.p2.x)/2;
	var yc = (this.p1.y + this.p2.y)/2;
	var string;
	
	var g = $(svgNode('g')).attr({'class':"elm", 'transform':"translate("+xc+","+yc+") rotate("+this.arc+")"});
		g.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':2, 'x2':this.L/2, 'y2':2, 'style':"display:none"}));								//background element
		g.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':-2, 'x2':this.L/2, 'y2':-2, 'style':"display:none"}));							//background element
		g.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':0, 'x2':this.L/2, 'y2':0}));														//displayed element
		g.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':0, 'x2':this.L/2, 'y2':0, 'stroke-opacity':0.0, 'stroke-width':16}));			//hover element
		g.append($(svgNode('circle')).attr({'class':"res-elm-marker", 'cx':0, 'cy':0, 'r':2, 'style':"display:none"}));							//result marker
		g.append($(svgNode('line')).attr({'class':"res-elm-line", 'x1':0, 'y1':-3, 'x2':0, 'y2':-10, 'style':"display:none"}));					//result marker line
		if (this.arc > 90 && this.arc <= 270) {string = "scale(-1,1)";} else {string = "scale(1,-1)";}
		g.append($(svgNode('text')).attr({'class':"res-elm-text", 'x':0, 'y':-5, 'transform':string, 'style':"display:none"}).text("0"));		//result marker text
		
	return g;
}

//SVG element label
Element.prototype.svgLabel = function(disp_index){
	var xc = (this.p1.x + this.p2.x)/2;
	var yc = (this.p1.y + this.p2.y)/2;
	var angle = (this.arc > 90 && this.arc <= 270) ? this.arc + 180 : this.arc;
	
	var g = $(svgNode('g')).attr({'class':"elm-label", 'transform':"translate("+xc+","+yc+") rotate("+angle+")"});
		g.append($(svgNode('text')).attr({'class':"elm-index", 'x':0, 'y':25, 'transform':"scale(1,-1)"}).text(this.id));
		var g1 = $(svgNode('g')).attr({'class':"elm-length"});
			g1.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':10, 'x2':this.L/2, 'y2':10}));
			g1.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':5, 'x2':-this.L/2, 'y2':15}));
			g1.append($(svgNode('line')).attr({'x1':this.L/2, 'y1':5, 'x2':this.L/2, 'y2':15}));
			g1.append($(svgNode('text')).attr({'x':-13, 'y':-20, 'transform':"scale(1,-1)"}).text(Math.round(this.L*10)/10+" cm"));
		g.append(g1);
		if (disp_index) {g.css({'display':"block"});} else {g.css({'display':"none"});}		//display element label

	return g;
}

//SVG element releases
Element.prototype.svgRel = function(){
	var xc = (this.p1.x + this.p2.x)/2;
	var yc = (this.p1.y + this.p2.y)/2;
	var dx = this.p2.x - this.p1.x;
	var dy = this.p2.y - this.p1.y;
	var type;
	
	var g = $(svgNode('g')).attr({'class':"release", 'transform':"translate("+xc+","+yc+") rotate("+this.arc+")"});
	
	for (var i=0; i<2; i++){
		type = this.getRelType(i == 0);
		switch (type)
		{
		case '110':
			g.append($(svgNode('circle')).attr({'class':"side"+i, 'cx':-this.L/2+7 + i*(this.L-14), 'cy':0, 'r':4, 'style':"fill:white; stroke:black"}));
			break;
			
		case '111':
			g.append($(svgNode('circle')).attr({'class':"side"+i, 'cx':-this.L/2+7 + i*(this.L-14), 'cy':0, 'r':0, 'style':"fill:white; stroke:black"}));
			break;
		}
	}
	
	return g;
}

//SVG element display load
Element.prototype.svgLoad = function(disp_linx, disp_liny){
	var xc = (this.p1.x + this.p2.x)/2;
	var yc = (this.p1.y + this.p2.y)/2;
	var dx = this.p2.x - this.p1.x;
	var dy = this.p2.y - this.p1.y;
	var angle = (this.arc > 90 && this.arc <= 270) ? this.arc + 180 : this.arc;
	var type;
	var ind = (dx < 0 || (dx == 0 && dy < 0)) ? -1 : 1;
	
	var g = $(svgNode('g')).attr({'class':"elm-load", 'transform':"translate("+xc+","+yc+") rotate("+angle+")"});
	var g1;
	
	if (this.eload.linx != 0) {
		g1 = $(svgNode('g')).attr({'class':"linx", 'transform':"translate(0,18) scale("+ind*(this.eload.linx/Math.abs(this.eload.linx))+",1)"});
			g1.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':13, 'x2':this.L/2, 'y2':13}));
			g1.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':-13, 'x2':this.L/2, 'y2':-13}));
			g1.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':-13, 'x2':-this.L/2, 'y2':13}));
			g1.append($(svgNode('line')).attr({'x1':this.L/2, 'y1':-13, 'x2':this.L/2, 'y2':13}));
			for (var i = -this.L/2+2; i < this.L/2-26; i += 30) {
				g1.append($(svgNode('line')).attr({'x1':i, 'y1':0, 'x2':i+26, 'y2':0}));
				g1.append($(svgNode('line')).attr({'x1':i+21, 'y1':-5, 'x2':i+26, 'y2':0}));
				g1.append($(svgNode('line')).attr({'x1':i+21, 'y1':5, 'x2':i+26, 'y2':0}));
			}
			g1.append($(svgNode('text')).attr({'x':this.L/2 - Math.abs(this.eload.linx).toString().length*9.5, 'y':-18, 'transform':"scale("+ind*(this.eload.linx/Math.abs(this.eload.linx))+",-1)"}).text(Math.abs(this.eload.linx)));
			if (disp_linx) {g1.css({'display':"block"});} else {g1.css({'display':"none"});}	//display linx
		g.append(g1);
	}
	
	if (this.eload.liny != 0) {
		g1 = $(svgNode('g')).attr({'class':"liny", 'transform':"translate(0,18) scale(1,"+ind*(this.eload.liny/Math.abs(this.eload.liny))+")"});
			g1.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':13, 'x2':this.L/2, 'y2':13}));
			g1.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':-13, 'x2':-this.L/2, 'y2':13}));
			g1.append($(svgNode('line')).attr({'x1':this.L/2, 'y1':-13, 'x2':this.L/2, 'y2':13}));
			g1.append($(svgNode('line')).attr({'x1':-this.L/2, 'y1':-13, 'x2':this.L/2, 'y2':-13}));
			for (var i = -this.L/2+15; i < this.L/2-10; i += 30) {
				g1.append($(svgNode('line')).attr({'x1':i, 'y1':-13, 'x2':i, 'y2':13}));
				g1.append($(svgNode('line')).attr({'x1':i-5, 'y1':8, 'x2':i, 'y2':13}));
				g1.append($(svgNode('line')).attr({'x1':i+5, 'y1':8, 'x2':i, 'y2':13}));
			}
			g1.append($(svgNode('text')).attr({'x':-this.L/2, 'y':-18, 'transform':"scale(1,"+ind*(-this.eload.liny/Math.abs(this.eload.liny))+")"}).text(Math.abs(this.eload.liny)));
			if (disp_liny) {g1.css({'display':"block"});} else {g1.css({'display':"none"});}	//display liny
		g.append(g1);
	}
	
	return g;
}

//SVG point display DOFs
Element.prototype.svgDofs = function(disp_dof)
{
	var xc = (this.p1.x + this.p2.x)/2;
	var yc = (this.p1.y + this.p2.y)/2;	
	
	var g = $(svgNode('g')).attr({'class':"elm-dofs", 'transform':"translate("+xc+","+yc+")"});
	var g1 = $(svgNode('g')).attr({'transform':"rotate("+this.arc+")"});
	var g2;

		g2 = $(svgNode('g')).attr({'class':"dof-1", 'transform':"translate(20,4)"});
			g2.append($(svgNode('line')).attr({'x1':-15, 'y1':0, 'x2':15, 'y2':0}));
			g2.append($(svgNode('line')).attr({'x1':15-8, 'y1':-5, 'x2':15, 'y2':0}));
			g2.append($(svgNode('line')).attr({'x1':15-8, 'y1':5, 'x2':15, 'y2':0}));
			g2.append($(svgNode('text')).attr({'x':18, 'y':14, 'transform':"scale(1,-1)"}).text(1));
		g1.append(g2);
		
		g2 = $(svgNode('g')).attr({'class':"dof-2", 'transform':"translate(0,24)"});
			g2.append($(svgNode('line')).attr({'x1':0, 'y1':-15, 'x2':0, 'y2':15}));
			g2.append($(svgNode('line')).attr({'x1':-5, 'y1':15-8, 'x2':0, 'y2':15}));
			g2.append($(svgNode('line')).attr({'x1':5, 'y1':15-8, 'x2':0, 'y2':15}));
			g2.append($(svgNode('text')).attr({'x':-16, 'y':-16, 'transform':"scale(1,-1)"}).text(2));
		g1.append(g2);
		
		g2 = $(svgNode('g')).attr({'class':"dof-3", 'transform':"translate(0,4)"});
			g2.append($(svgNode('path')).attr({'d':"M -10.606601 10.606601 A 15 15 0 1 0 0 -15", 'style':"fill:none"}));
			g2.append($(svgNode('line')).attr({'x1':1, 'y1':15, 'x2':8, 'y2':18, 'transform':"rotate(45)"}));
			g2.append($(svgNode('line')).attr({'x1':1, 'y1':15, 'x2':6, 'y2':10, 'transform':"rotate(45)"}));
			g2.append($(svgNode('text')).attr({'x':15, 'y':-15, 'transform':"scale(1,-1)"}).text(3));
		g1.append(g2);
		
	g.append(g1);
	
	if (disp_dof) {g.css({'display':"block"});} else {g.css({'display':"none"});}		//set display dof
	
	return g;
}

//SVG element results
Element.prototype.svgRes = function(disp_nx, disp_ny, disp_nmz){
	var xc = (this.p1.x + this.p2.x)/2;
	var yc = (this.p1.y + this.p2.y)/2;
	var string = "";
	
	var g = $(svgNode('g')).attr({'class':"elm-res"});
	var g1;
	
	//draw nx
	g1 = $(svgNode('g')).attr({'class':"nx", 'fill':"none", 'transform':"translate("+xc+","+yc+") rotate("+this.arc+")"});
		string = "M "+(-this.L/2)+" 0 ";
		for (var i = -this.L/2; i <= this.L/2+1; i += 10) {
			string += "L "+i+" "+(-100 / this.maxRes.nx * this.resNx(i+this.L/2))+" ";
		}
		string += "L "+(this.L/2)+" 0";
		g1.append($(svgNode('path')).attr({'d':string}));
		if (disp_nx) {g1.css({'display':"block"});} else {g1.css({'display':"none"});}		//display nx
	g.append(g1);
	
	//draw ny
	g1 = $(svgNode('g')).attr({'class':"ny", 'fill':"none", 'transform':"translate("+xc+","+yc+") rotate("+this.arc+")"});
		string = "M "+(-this.L/2)+" 0 ";
		for (var i = -this.L/2; i <= this.L/2+1; i += 10) {
			string += "L "+i+" "+(-100 / this.maxRes.ny * this.resNy(i+this.L/2))+" ";
		}
		string += "L "+(this.L/2)+" 0";
		g1.append($(svgNode('path')).attr({'d':string}));
		if (disp_ny) {g1.css({'display':"block"});} else {g1.css({'display':"none"});}		//display ny
	g.append(g1);
	
	//draw nmz
	g1 = $(svgNode('g')).attr({'class':"nmz", 'fill':"none", 'transform':"translate("+xc+","+yc+") rotate("+this.arc+")"});
		string = "M "+(-this.L/2)+" 0 ";
		for (var i = -this.L/2; i <= this.L/2+1; i += 10) {
			string += "L "+i+" "+(-100 / this.maxRes.nmz * this.resNmz(i+this.L/2))+" ";
		}
		string += "L "+(this.L/2)+" 0";
		g1.append($(svgNode('path')).attr({'d':string}));
		if (disp_nmz) {g1.css({'display':"block"});} else {g1.css({'display':"none"});}		//display nmz
	g.append(g1);
		
	return g;
}

//SVG element draw
Element.prototype.svgAdd = function(disp_eindex, disp_dof, disp_linx, disp_liny)
{
	var g = $(svgNode('g')).attr({'id':"element"+this.id});
		g.append(this.svgElement());
		g.append(this.svgLabel(disp_eindex));
		g.append(this.svgRel());
		g.append(this.svgLoad(disp_linx, disp_liny));
		g.append(this.svgDofs(disp_dof));
		
	return g;
}

//SVG element remove
Element.prototype.svgRemove = function()
{
	$('#element'+this.id).remove();
}

//SVG element remove
Element.prototype.svgLoadRefresh = function(disp_linx, disp_liny)
{
	$('#element'+this.id+' > g:eq(3)').remove();
	$(this.svgLoad(disp_linx, disp_liny)).insertAfter($('#element'+this.id+' > g:eq(2)'));
}
	
//---------------------------------------- EVENTS ----------------------------------------//

//enable or disable events
Element.prototype.events = function(value)
{
	if (value) {
		$('#element'+this.id+' > g:eq(0)').attr({'class':"elm"});
	} else {
		$('#element'+this.id+' > g:eq(0)').attr({'class':""});
	}
}

//change element id
Element.prototype.changeID = function(value)
{
	var old_id = this.id;
	this.id += value;
	$('#element'+old_id).attr({'id':"element"+this.id});
	$('#element'+this.id+' > g:eq(1) > text:eq(0)').text(this.id);
}

//reposition element
Element.prototype.reposition = function()
{
	var xc = (this.p1.x + this.p2.x)/2;
	var yc = (this.p1.y + this.p2.y)/2;
	var dx = this.p2.x - this.p1.x;
	var dy = this.p2.y - this.p1.y;
	this.L = this.setLength();
	this.arc = this.realArc();
	var angle = (this.arc > 90 && this.arc <= 270) ? this.arc + 180 : this.arc;

	//element, labels, dofs
	$('#element'+this.id).children('g:eq(0), g:eq(2)').attr({'transform':"translate("+xc+","+yc+") rotate("+this.arc+")"});
	$('#element'+this.id).children('g:eq(1), g:eq(3)').attr({'transform':"translate("+xc+","+yc+") rotate("+angle+")"});
	$('#element'+this.id+' > g:eq(0) > line, #element'+this.id+' > g:eq(1) .elm-length > line:eq(0)').attr({'x1':-this.L/2, 'x2':this.L/2});
	$('#element'+this.id+' > g:eq(1) .elm-length > line:eq(1)').attr({'x1':-this.L/2, 'x2':-this.L/2});
	$('#element'+this.id+' > g:eq(1) .elm-length > line:eq(2)').attr({'x1':this.L/2, 'x2':this.L/2});
	$('#element'+this.id+' > g:eq(1) .elm-length > text').text(Math.round(this.L*10)/10+" cm");
	$('#element'+this.id+' > g:eq(4)').attr({'transform':"translate("+xc+","+yc+")"});
	$('#element'+this.id+' > g:eq(4) > g').attr({'transform':"rotate("+this.arc+")"});
	
	//releases on element
	for (var i = 0; i < 2; i++) {
		$('#element'+this.id+' > g:eq(2) > circle:eq('+i+')').attr({'cx':-this.L/2+7 + i*(this.L-14)});
	}
}

//mouseover display event
Element.prototype.mOverDisp = function(dips_res)
{
	$('#element'+this.id+' > g:eq(0)').children('line:eq(0), line:eq(1)').css({'display':"block"});
	$('#element'+this.id+' > g:eq(1)').css({'stroke':"#484848", 'fill':"#484848"});		//default hover label color
	if (this.e.sL === true) {
		$('#element'+this.id+' > g:eq(0) > line:eq(2)').attr({'stroke':"red"});				//default selected line
	} else {
		$('#element'+this.id+' > g:eq(0) > line:eq(2)').attr({'stroke':"white"});			//default hover line
	}
	//only do if results
	if (dips_res) { $('#element'+this.id+' > g:eq(0)').children('.res-elm-marker, .res-elm-line, .res-elm-text').css({'display':"block"}); }
}

//mouseout display event
Element.prototype.mOutDisp = function(dips_res)
{
	$('#element'+this.id+' > g:eq(1)').css({'stroke':"#808080", 'fill':"#808080"});
	if (this.e.sL === true) {
		//default selected line
		$('#element'+this.id+' > g:eq(0)').children('line:eq(0), line:eq(1)').css({'display':"block"});
		$('#element'+this.id+' > g:eq(0) > line:eq(2)').attr({'stroke':"red"});
	} else {
		//default line
		$('#element'+this.id+' > g:eq(0)').children('line:eq(0), line:eq(1)').css({'display':"none"});
		if (dips_res) { $('#element'+this.id+' > g:eq(0)').children('.res-elm-marker, .res-elm-line, .res-elm-text').css({'display':"none"}); }
		$('#element'+this.id+' > g:eq(0) > line:eq(2)').attr({'stroke':"black"});
	}
}

//left mouseup event
Element.prototype.mUpLeft = function()
{
	//LMB element select
	if (this.e.sL === true) {
		this.e.sL = false;
		$('#element'+this.id+' > g:eq(0) > line:eq(2)').attr({'stroke':"white"});	//default hover line
	} else {
		this.e.sL = true;
		$('#element'+this.id+' > g:eq(0) > line:eq(2)').attr({'stroke':"red"});		//default selected line
	}
}

//right mouseup event
Element.prototype.mUpRight = function()
{
	if (this.e.sR  === true) {this.e.sR = false;} else {this.e.sR = true;}			//RMB element select
}

//display result marker event
Element.prototype.resMarker = function(x, y, disp_nx, disp_ny, disp_nmz)
{
	var dx = this.p2.x - this.p1.x;
	var dy = this.p2.y - this.p1.y;
	var x_m, res_val, res_disp, x_t;
 
	//calculates x in local coordinates
	if ((this.arc >= 45 && this.arc <=135) || (this.arc >= 225 && this.arc <=315)) {
		x_m = Math.abs(y - this.p1.y) * this.L / Math.abs(dy);
	} else {
		x_m = Math.abs(x - this.p1.x) * this.L / Math.abs(dx);
	}
	
	//calculates result values
	if (disp_nx) {
		res_val = Math.round(this.resNx(x_m)*100)/100+" kN";
		res_disp = -100 / this.maxRes.nx * this.resNx(x_m);
	} else if (disp_ny) {
		res_val = Math.round(this.resNy(x_m)*100)/100 + " kN";
		res_disp = -100 / this.maxRes.ny * this.resNy(x_m);
	} else if (disp_nmz) {
		res_val = Math.round(this.resNmz(x_m)*100)/100+" kNcm";
		res_disp = -100 / this.maxRes.nmz * this.resNmz(x_m);
	}
	
	$('#element'+this.id+' > g:eq(0) .res-elm-marker').attr({'cx':x_m - this.L/2});										//change marker dot location		
	$('#element'+this.id+' > g:eq(0) .res-elm-line').attr({'x1':x_m - this.L/2, 'x2':x_m - this.L/2, 'y2':res_disp});	//change marker line location
	if (this.arc > 90 && this.arc <= 270) { x_t = -x_m + this.L/2 + 5; } else { x_t = x_m - this.L/2 + 5; }
	$('#element'+this.id+' > g:eq(0) .res-elm-text').attr({'x':x_t}).text(res_val);										//change marker text
}

//edit release
Element.prototype.editRelease = function(i, e1, e2, e3)
{	
	this.dof[3*i].exist = e1;
	this.dof[3*i+1].exist = e2;
	this.dof[3*i+2].exist = e3;
	
	$('#element'+this.id+' > g:eq(2)').remove();					//remove release
	this.svgRel().insertAfter('#element'+this.id+' > g:eq(1)');		//create and insert new release
}

//set new loads
Element.prototype.setLoad = function(disp_linx, disp_liny)
{
	this.eload.linx = $('#linXedit input').val();	//set linX load
	this.eload.liny = $('#linYedit input').val();	//set linY load
		
	$('#element'+this.id+' > g:eq(3)').remove();											//remove loads
	this.svgLoad(disp_linx, disp_liny).insertAfter('#element'+this.id+' > g:eq(2)');		//create and insert new loads
}

//---------------------------------------- RESULT CALCULATION ----------------------------------------//

//element results
Element.prototype.resNx = function(x)
{
	var f_x = -this.result.forces[0].value - this.eload.linx * x;
	return f_x;
}

Element.prototype.resNy = function(x)
{
	var f_x = -this.result.forces[1].value - this.eload.liny * x;
	return f_x;
}

Element.prototype.resNmz = function(x)
{
	var f_x = -this.result.forces[2].value + this.result.forces[1].value * x + this.eload.liny * Math.pow(x,2) / 2;
	return f_x;
}

//individual maximum element results
Element.prototype.maxNx = function()
{	
	var maxArr = [0, this.result.forces[0].value];
	maxArr = (Math.abs(this.result.forces[3].value) > Math.abs(maxArr[1])) ? [this.L, -this.result.forces[3].value] : maxArr;
	return maxArr;
}

Element.prototype.maxNy = function()
{
	var maxArr = [0, this.result.forces[1].value];
	maxArr = (Math.abs(this.result.forces[4].value) > Math.abs(maxArr[1])) ? [this.L, -this.result.forces[4].value] : maxArr;
	return maxArr;
}

Element.prototype.maxNmz = function()
{
	var x = - this.result.forces[1].value / this.eload.liny;
	var maxArr = [0, this.result.forces[2].value];
	maxArr = (Math.abs(this.result.forces[5].value) > Math.abs(maxArr[1])) ? [this.L, -this.result.forces[5].value] : maxArr;
	maxArr = (Math.abs(this.resNmz(x)) > Math.abs(maxArr[1])) ? [x, this.resNmz(x)] : maxArr;
	return maxArr;
}