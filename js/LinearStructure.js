function LinearStructure(svg_cont, t_x, t_y, s_x, s_y, delta_x, delta_y)
{
	this.points = Array();
	this.points[0] = this.addPoi();
	this.elements = Array();
	this.svg_id = "#vectGfx";
	this.svg_cont = svg_cont;
	this.trans = {'tx':t_x, 'ty':t_y, 'sx':s_x, 'sy':s_y, 'dx':delta_x*100, 'dy':delta_y*100, 'gx':0, 'gy':0, 'gnx':0, 'gny':0, 'w':$(this.svg_cont).width(), 'h':$(this.svg_cont).height()};	//translate variables
	this.mouse = {'x':false, 'y':false, 'snapX':false, 'snapY':false, 'resX':false, 'resY':false, 'mDown':false, 'mUp':true, 'mPos':false, 'mDownM':false, 'mUpM':true, 'mPosM':false, 'mDownR':false, 'mUpR':true, 'mPosR':false, 'mWheel':0, 'mSnap':false, 'mPoi':false, 'mElm':false, 'mPoiR':false, 'mElmR':false};
	var options;
	$.ajax({
	  'type': 'POST', 'url': 'lib/ajax/load_data.php', 'data': {'load':'options'}, 'async': false,
	  'success': function(result) { options = $.parseJSON(result); }
	});
	if (options === undefined) { this.opt = {'grid':true, 'pindex':true, 'eindex':true, 'pdof':false, 'edof':false, 'snap':true, 'result':false, 'loadPoi':{'px':true, 'py':true, 'pmz':true}, 'loadElm':{'linx':true, 'liny':true}, 'reactions':true, 'resElm':{'nx':false, 'ny':false, 'nmz':true}}; }
	else { this.opt = options; }
}

//---------------------------------------- POINT DATA METHODS ----------------------------------------//

//Remove element data
LinearStructure.prototype.addPoi = function(poi, x, y)
{
	var new_poi;
	
	if (poi !== undefined && poi !== null) {
		new_poi = new Point(poi);
	} else if (x !== undefined && y !== undefined && x !== null && y !== null) {
		new_poi = new Point({'id':this.points.length, 'angle':0, 'x':x, 'y':y, 'dof':[{'id':0, 'rest':false}, {'id':1, 'rest':false}, {'id':2, 'rest':false}], 'pload':{'px':0, 'py':0, 'pmz':0}});
	} else {
		new_poi = new Point({'id':this.points.length, 'angle':0, 'x':0, 'y':0, 'dof':[{'id':0, 'rest':false}, {'id':1, 'rest':false}, {'id':2, 'rest':false}], 'pload':{'px':0, 'py':0, 'pmz':0}});
	}
	
	return new_poi;
}

//Remove point data
LinearStructure.prototype.removePoi = function(point)
{
	this.points.splice(point.id,1);	//delete point
	
	for (var i = point.id; i < this.points.length; i++) {
		this.points[i].changeID(-1);
	}
}

//Check if point exists based on x and y
LinearStructure.prototype.poiExists = function(point)
{
	for (var i = 0; i < this.points.length; i++) {
		if (this.points[i].equals(point)) { return this.points[i]; }
	}
	
	return false;
}

//---------------------------------------- ELEMENT DATA METHODS ----------------------------------------//

//Remove element data
LinearStructure.prototype.addElm = function(elm, first, second)
{
	var new_elm;
	
	if (elm !== undefined && elm !== null) {
		new_elm = new Element(elm);
	} else if (first !== undefined && second !== undefined && first !== null && second !== null) {
		new_elm = new Element({'id':this.elements.length, 'E':21000, 'A':200, 'Iz':53333.33, 'p1':first, 'p2':second, 'dof':[{'id':0, 'exist':true}, {'id':0, 'exist':true}, {'id':0, 'exist':true}, {'id':0, 'exist':true}, {'id':0, 'exist':true}, {'id':0, 'exist':true}], 'eload':{'linx':0, 'liny':0}});
	} else {
		new_elm = new Element({'id':this.elements.length, 'E':21000, 'A':200, 'Iz':53333.33, 'p1':null, 'p2':null, 'dof':[{'id':0, 'exist':true}, {'id':0, 'exist':true}, {'id':0, 'exist':true}, {'id':0, 'exist':true}, {'id':0, 'exist':true}, {'id':0, 'exist':true}], 'eload':{'linx':0, 'liny':0}});
	}
	
	new_elm.p1.addElm(new_elm);
	new_elm.p2.addElm(new_elm);
	
	return new_elm;
}

//Remove element data
LinearStructure.prototype.removeElm = function(element)
{
	//remove element from points
	this.elements[element.id].p1.removeElm(this.elements[element.id]);
	this.elements[element.id].p2.removeElm(this.elements[element.id]);
	
	this.elements.splice(element.id,1);	//delete element
	
	for (var i = element.id; i < this.elements.length; i++) {
		this.elements[i].changeID(-1);		//decrement id for elements
	}
}

//Check if point exists based on x and y
LinearStructure.prototype.elmExists = function(element)
{
	for (var i = 0; i < this.elements.length; i++) {
		if (this.elements[i].equals(element)) { return this.elements[i]; }
	}
	
	return false;
}

//---------------------------------------- SVG DRAW METHODS ----------------------------------------//

//SVG gridlines
LinearStructure.prototype.svgGrid = function()
{
	var startX = - Math.round((this.trans.w/(this.trans.dx * 0.5))/2) - 2;
	var endX = - startX;
	var deltaX = this.trans.dx;
	var startWidth = endX * deltaX;
	this.trans.gx = this.trans.tx % deltaX;
	this.trans.gnx = endX;
	
	var startY = - Math.round((this.trans.h/(this.trans.dy * 0.5))/2) - 1;
	var endY = - startY;
	var deltaY = this.trans.dy;
	var startHeight = endY * deltaY;
	this.trans.gy = this.trans.ty % deltaY;
	this.trans.gny = endY;
	
	var height = 0;
	var width = 0;
	
	var g = $(svgNode('g')).attr({'id':"grid", 'shape-rendering':"geometricPrecision", 'transform':"translate("+this.trans.w/2+","+this.trans.h/2+")"});
	var g1 = $(svgNode('g')).attr({'class':"scale", 'transform':"scale("+this.trans.sx+","+this.trans.sy+")"});
	var g2 = $(svgNode('g')).attr({'class':"trans", 'transform':"translate("+this.trans.gx+","+this.trans.gy+")"});
		for (var i = startX; i <= endX; i++){
			width = i * deltaX;
			g2.append($(svgNode('line')).attr({'class':"gridx", 'x1':width, 'y1':-startHeight, 'x2':width, 'y2':startHeight}));
			g2.append($(svgNode('line')).attr({'class':"snap gridx", 'x1':width, 'y1':-startHeight, 'x2':width, 'y2':startHeight, 'stroke-width':8, 'stroke-opacity':0.0}));
		}

		for (var j = startY; j <= endY; j++){
			height = j * deltaY;
			g2.append($(svgNode('line')).attr({'class':"gridy", 'x1':-startWidth, 'y1':height, 'x2':startWidth, 'y2':height}));
			g2.append($(svgNode('line')).attr({'class':"snap gridy", 'x1':-startWidth, 'y1':height, 'x2':startWidth, 'y2':height, 'stroke-width':8, 'stroke-opacity':0.0}));

			for (var i = startX; i <= endX; i++){
				width = i * deltaX;
				g2.append($(svgNode('circle')).attr({'class':"snap snap-grid", 'cx':width, 'cy':height, 'r':5, 'fill-opacity':0.0, 'stroke-opacity':0.0}));
			}
		}
	g1.append(g2)
	g.append(g1)
	if (this.opt.grid) {g.css({'display':"block"});} else {g.css({'display':"none"});}	//dispaly grid
	
	return g;
}

//Draw SVG structure elements
LinearStructure.prototype.svgStructure = function()
{
	//narisi strukturo
	var g = $(svgNode('g')).attr({'id':"struct", 'transform':"translate("+this.trans.w/2+","+this.trans.h/2+")"});
	var g1 = $(svgNode('g')).attr({'class':"scale", 'transform':"scale("+this.trans.sx+","+this.trans.sy+")"});
	var g2 = $(svgNode('g')).attr({'class':"trans", 'transform':"translate("+this.trans.tx+","+this.trans.ty+")"});
	var g3;
	
		//elementi
		for (var i = 0; i < this.elements.length; i++) {
			g2.append(this.elements[i].svgAdd(this.opt.eindex, this.opt.edof, this.opt.loadElm.linx, this.opt.loadElm.liny));
		}
		
		//tocke in podpore
		for (var i = 0; i < this.points.length; i++) {
			g2.append(this.points[i].svgAdd(this.opt.pindex, this.opt.pdof, this.opt.loadPoi.px, this.opt.loadPoi.py, this.opt.loadPoi.pmz));
		}
		
	g1.append(g2);
	g.append(g1);
	
	return g;
}

//Draw SVG point results
LinearStructure.prototype.svgPoiResults = function()
{
	var g = $(svgNode('g')).attr({'id':"poiResult"});
	
	//tocke in podpore
	for (var i = 0; i < this.points.length; i++) {
		g.append(this.points[i].svgRes(this.opt.reactions));
	}
	
	return g;
}

//Draw SVG element results
LinearStructure.prototype.svgElmResults = function()
{
	var g = $(svgNode('g')).attr({'id':"elmResult"});

	//elementi
	for (var i = 0; i < this.elements.length; i++) {
		g.append(this.elements[i].svgRes(this.opt.resElm.nx, this.opt.resElm.ny, this.opt.resElm.nmz));
	}
	
	return g;
}

//Draw all SVG elements
LinearStructure.prototype.drawSVG = function()
{
	var svg = $(svgNode('svg')).attr({'id':this.svg_id.substring(1), 'width':"100%", 'height':"100%", 'xmlns':"http://www.w3.org/2000/svg", 'version':"1.1"});
	
	//narisi gridline
	svg.append(this.svgGrid());
	
	//narisi strukturo
	svg.append(this.svgStructure());
	
	//zakljuci svg
	$(this.svg_cont).append(svg)
	
	//narisi menuje - v ozadju
	$(this.svg_cont).append(this.divGlobRmbMenu());
	$(this.svg_cont).append(this.divPoiRmbMenu());
	$(this.svg_cont).append(this.divElmRmbMenu());
}

//---------------------------------------- DIV MENU DRAW METHODS ----------------------------------------//

//DIV global RMB menu
LinearStructure.prototype.divGlobRmbMenu = function()
{
	var string = "<div id='gRmbMenu' class='menu-container'><ul class='menu'>";
		string += "<li id='loadStruct' class='enable'><span>Open</span></li>";
		string += "<li id='saveStruct' class='enable'><span>Save</span></li>";
		string += "<li id='saveOpt' class='enable'><span>Save Opt</span></li>";
		string += "<div class='separator' />";
		string += "<li id='resultDisp' class='enable'>Result<div class='icon-pad'/><div class='icon "; string += (this.opt.result) ? "icon-lock" : ""; string += "'/></li>";
		string += "<li id='resultMenu' style='display:"; string += (this.opt.result) ? "block" : "none"; string += "'>Results<div class='icon-pad'/><div class='icon icon-rarrow' /><ul class='menu'>";
			string += "<li id='reactionsDisp' class='enable'>Reactions<div class='icon-pad'/><div class='icon "; string += (this.opt.reactions) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
			string += "<div class='separator' />";
			string += "<li id='nxDisp' class='enable'>Nx<div class='icon-pad'/><div class='icon "; string += (this.opt.resElm.nx) ? "icon-radio-star" : ""; string += "' /></li>";
			string += "<li id='nyDisp' class='enable'>Ny<div class='icon-pad'/><div class='icon "; string += (this.opt.resElm.ny) ? "icon-radio-star" : ""; string += "' /></li>";
			string += "<li id='nmzDisp' class='enable'>Nmz<div class='icon-pad'/><div class='icon "; string += (this.opt.resElm.nmz) ? "icon-radio-star" : ""; string += "' /></li>";
		string += "</ul></li>";
		string += "<div class='separator' />";
		string += "<li id='createPoi' class='enable'>Create Point</li>";
		string += "<li id='deletePois' class='enable'>Delete Points</li>";
		string += "<div class='separator' />";
		string += "<li id='snapEnable' class='enable'>Snap<div class='icon-pad'/><div class='icon "; string += (this.opt.snap) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
		string += "<li id='display'>Display<div class='icon-pad'/><div class='icon icon-rarrow' /><ul class='menu'>";
			string += "<li id='gridDisp' class='enable'>Grid<div class='icon-pad'/><div class='icon "; string += (this.opt.grid) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
			string += "<div class='separator' />";
			string += "<li id='poiDisp'>Point<div class='icon-pad'/><div class='icon icon-rarrow' /><ul class='menu'>";
				string += "<li id='poiLabelDisp' class='enable'>Point Label<div class='icon-pad'/><div class='icon "; string += (this.opt.pindex) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
				string += "<li id='poiDofDisp' class='enable'>Point DOF<div class='icon-pad'/><div class='icon "; string += (this.opt.pdof) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
				string += "<div class='separator' />";
				string += "<li id='pxDisp' class='enable'>Px<div class='icon-pad'/><div class='icon "; string += (this.opt.loadPoi.px) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
				string += "<li id='pyDisp' class='enable'>Py<div class='icon-pad'/><div class='icon "; string += (this.opt.loadPoi.py) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
				string += "<li id='pmzDisp' class='enable'>Pmz<div class='icon-pad'/><div class='icon "; string += (this.opt.loadPoi.pmz) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
			string += "</ul></li>";
			string += "<li id='elmDisp'>Element<div class='icon-pad'/><div class='icon icon-rarrow' /><ul class='menu'>";
				string += "<li id='elmLabelDisp' class='enable'>Elm Label<div class='icon-pad'/><div class='icon "; string += (this.opt.eindex) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
				string += "<li id='elmDofDisp' class='enable'>Element DOF<div class='icon-pad'/><div class='icon "; string += (this.opt.edof) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";				
				string += "<div class='separator' />";
				string += "<li id='linXdisp' class='enable'>Lin X<div class='icon-pad'/><div class='icon "; string += (this.opt.loadElm.linx) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
				string += "<li id='linYdisp' class='enable'>Lin Y<div class='icon-pad'/><div class='icon "; string += (this.opt.loadElm.liny) ? "icon-bracket-tick" : "icon-bracket-empty"; string += "' /></li>";
			string += "</ul></li>";
		string += "</ul></li>";
	string += "</ul></div>";
	
	return string;
}

//DIV point RMB menu
LinearStructure.prototype.divPoiRmbMenu = function()
{
	var string = "<ul id='pRmbMenu' class='menu menu-container'>";
		string += "<li id='createElm' class='enable'>Create Element</li>";
		string += "<li id='deletePoi' class='enable'>Delete Point</li>";
		string += "<li id='movePoi' class='enable'>Move Point</li>";
		string += "<li id='rotatePoi' class='enable'>Rotate Point</li>";
		string += "<div class='separator' />";
		string += "<li id='restraintEdit'>Restraint<div class='icon-pad'/><div class='icon icon-rarrow' /><ul class='menu'>";
			string += "<li id='111' class='enable'>111</li>";
			string += "<li id='110' class='enable'>110</li>";
			string += "<li id='010' class='enable'>010</li>";
			string += "<li id='000' class='enable'>000</li>";
		string += "</ul></li>";
		string += "<li id='poiLoadEdit'>Load<div class='icon-pad'/><div class='icon icon-rarrow' /><ul class='menu'>";
			string += "<li id='pxEdit' class='enable input'>Px: <div class='input-pad'/><input type='text' value=''/></li>";
			string += "<li id='pyEdit' class='enable input'>Py: <div class='input-pad'/><input type='text' value=''/></li>";
			string += "<li id='pmzEdit' class='enable input'>Pmz: <div class='input-pad'/><input type='text' value=''/></li>";
		string += "</ul></li>";
	string += "</ul>";
	
	return string;
}

//DIV element RMB menu
LinearStructure.prototype.divElmRmbMenu = function()
{
	var string = "<ul id='eRmbMenu' class='menu menu-container'>";
		string += "<li id='deleteElm' class='enable'>Delete Element</li>";
		string += "<li id='releaseEdit'>Release<div class='icon-pad'/><div class='icon icon-rarrow' /><ul class='menu'>";
			string += "<li id='releaseF110' class='enable'>First O</li>";
			string += "<li id='releaseF111' class='enable'>First I</li>";
			string += "<li id='releaseS110' class='enable'>Second O</li>";
			string += "<li id='releaseS111' class='enable'>Second I</li>";
		string += "</ul></li>";
		string += "<li id='elmLoadEdit'>Load<div class='icon-pad'/><div class='icon icon-rarrow' /><ul class='menu'>";
			string += "<li id='linXedit' class='enable input'>Lin X: <div class='input-pad'/><input type='text' value=''/></li>";
			string += "<li id='linYedit' class='enable input'>Lin Y: <div class='input-pad'/><input type='text' value=''/></li>";
		string += "</ul></li>";
	string += "</ul>";
	
	return string;
}

//---------------------------------------- HANDLE EVENTS ----------------------------------------//

//Set events
LinearStructure.prototype.setEvents = function()
{
	//---------- global events ----------//
	$(this.svg_id).on('mousemove', {'self':this}, this.gMousemove);						//MOUSEMOVE
	$(this.svg_id).on('mousedown', {'self':this}, this.gMousedown);						//MOUSEDOWN
	$(this.svg_id).on('mouseup', {'self':this}, this.gMouseup);							//MOUSEUP
	$(this.svg_id).on('mousewheel DOMMouseScroll', {'self':this}, this.gMousewheel);	//ZOOM event
	
	//---------- point events ----------//
	$(this.svg_id).on('mouseover', '.poi', {'self':this}, this.poiEventMouseover);	//MOUSEOVER point
	$(this.svg_id).on('mouseout', '.poi', {'self':this}, this.poiEventMouseout);	//MOUSEOUT point
	$(this.svg_id).on('mouseup', '.poi', {'self':this}, this.poiEventMouseup);		//MOUSEUP point
	
	//---------- element events ----------//
	$(this.svg_id).on('mouseover', '.elm', {'self':this}, this.elmEventMouseover);	//MOUSEOVER element
	$(this.svg_id).on('mouseout', '.elm', {'self':this}, this.elmEventMouseout);	//MOUSEOUT element
	$(this.svg_id).on('mouseup', '.elm', {'self':this}, this.elmEventMouseup);		//MOUSEUP element
	$(this.svg_id).on('mousemove', '.elm', {'self':this}, this.elmEventResult);		//MOUSEMOVE element result
	
	//----------snap events ----------//
	$(this.svg_id).on('mouseover', '.snap', {'self':this}, this.snapEnable);			//MOUSEOVER snap
	$(this.svg_id).on('mouseout', '.snap', {'self':this}, this.snapDisable);			//MOUSEOUT snap
	
	$(this.svg_id).on('mouseover', '.snap-point', {'self':this}, this.snapPoints);		//MOUSEOVER point

	$(this.svg_id).on('mouseover', '.snap-grid', {'self':this}, this.snapGrid);			//MOUSEOVER grid intersect
	$(this.svg_id).on('mouseover mousemove', '.gridx', {'self':this}, this.snapGridX);	//MOUSEOVER	grid x-line
	$(this.svg_id).on('mouseover mousemove', '.gridy', {'self':this}, this.snapGridY);	//MOUSEOVER grid y-line
	
	//---------- RMB Global events ----------//
	$('#gRmbMenu').on('click', '#loadStruct.enable', {'self':this}, this.rmbGlobalLoad);				//CLICK LOAD
	$('#gRmbMenu').on('click', '#saveStruct.enable', {'self':this}, this.rmbGlobalSave);				//CLICK SAVE
	$('#gRmbMenu').on('click', '#saveOpt.enable', {'self':this}, this.rmbGlobalSaveOpt);				//CLICK SAVE
	$('#gRmbMenu').on('click', '#resultDisp.enable', {'self':this}, this.rmbGlobalResult);				//CLICK RESULT
	$('#gRmbMenu').on('click', '#createPoi.enable', {'self':this}, this.rmbPointCreate);				//CLICK CREATE
	$('#gRmbMenu').on('click', '#deletePois.enable', {'self':this}, this.rmbPointsDelete);				//CLICK DELETE
	$('#gRmbMenu').on('click', '#gridDisp.enable', {'self':this}, this.rmbGlobalGrid);					//CLICK GRID
	$('#gRmbMenu').on('click', '#snapEnable.enable', {'self':this}, this.rmbGlobalSnap);				//CLICK SNAP
	$('#gRmbMenu').on('click', '#poiLabelDisp.enable', {'self':this}, this.rmbGlobalPointLabel);		//CLICK POINT LABEL
	$('#gRmbMenu').on('click', '#elmLabelDisp.enable', {'self':this}, this.rmbGlobalElementLabel);		//CLICK ELEMENT LABEL
	$('#gRmbMenu').on('click', '#pxDisp.enable', {'self':this}, this.rmbGlobalPx);						//CLICK Px
	$('#gRmbMenu').on('click', '#pyDisp.enable', {'self':this}, this.rmbGlobalPy);						//CLICK Py
	$('#gRmbMenu').on('click', '#pmzDisp.enable', {'self':this}, this.rmbGlobalPmz);					//CLICK Pmz
	$('#gRmbMenu').on('click', '#linXdisp.enable', {'self':this}, this.rmbGlobalLinx);					//CLICK lin-X
	$('#gRmbMenu').on('click', '#linYdisp.enable', {'self':this}, this.rmbGlobalLiny);					//CLICK lin-Y
	$('#gRmbMenu').on('click', '#poiDofDisp.enable', {'self':this}, this.rmbGlobalPointDof);			//CLICK POINT DOF
	$('#gRmbMenu').on('click', '#elmDofDisp.enable', {'self':this}, this.rmbGlobalElementDof);			//CLICK ELEMENT DOF
	$('#gRmbMenu').on('click', '#reactionsDisp.enable', {'self':this}, this.rmbGlobalReactions);		//CLICK reactions
	$('#gRmbMenu').on('click', '#nxDisp.enable', {'self':this}, this.rmbGlobalNx);						//CLICK nx
	$('#gRmbMenu').on('click', '#nyDisp.enable', {'self':this}, this.rmbGlobalNy);						//CLICK ny
	$('#gRmbMenu').on('click', '#nmzDisp.enable', {'self':this}, this.rmbGlobalNmz);					//CLICK nmz
	
	//---------- RMB Point events ----------//
	$('#pRmbMenu').on('click', '#createElm.enable', {'self':this}, this.rmbElementCreate);				//CLICK CREATE
	$('#pRmbMenu').on('click', '#deletePoi.enable', {'self':this}, this.rmbPointDelete);				//CLICK DELETE
	$('#pRmbMenu').on('click', '#movePoi.enable', {'self':this}, this.rmbPointMove);					//CLICK MOVE
	$('#pRmbMenu').on('click', '#rotatePoi.enable', {'self':this}, this.rmbPointRotate);				//CLICK ROTATE
	$('#pRmbMenu').on('click', '#111.enable', {'self':this}, this.rmbPoint111);							//CLICK 111
	$('#pRmbMenu').on('click', '#110.enable', {'self':this}, this.rmbPoint110);							//CLICK 110
	$('#pRmbMenu').on('click', '#010.enable', {'self':this}, this.rmbPoint010);							//CLICK 010
	$('#pRmbMenu').on('click', '#000.enable', {'self':this}, this.rmbPoint000);							//CLICK 000
	$('#pRmbMenu').on('keypress', '#poiLoadEdit .input.enable', {'self':this}, this.rmbPoiLoadEdit);	//PRESS ENTER POI LOAD
		
	//---------- RMB Element events ----------//
	$('#eRmbMenu').on('click', '#deleteElm.enable', {'self':this}, this.rmbElementDelete);				//CLICK DELETE
	$('#eRmbMenu').on('click', '#releaseF110.enable', {'self':this}, this.rmbElmRelF110);				//CLICK LEFT RELEASE-O
	$('#eRmbMenu').on('click', '#releaseF111.enable', {'self':this}, this.rmbElmRelF111);				//CLICK LEFT RELEASE-I
	$('#eRmbMenu').on('click', '#releaseS110.enable', {'self':this}, this.rmbElmRelS110);				//CLICK RIGHT RELEASE-O
	$('#eRmbMenu').on('click', '#releaseS111.enable', {'self':this}, this.rmbElmRelS111);				//CLICK RIGHT RELEASE-I
	$('#eRmbMenu').on('keypress', '#elmLoadEdit .input.enable', {'self':this}, this.rmbElmLoadEdit);	//PRESS ENTER ELM LOAD
}

//---------------------------------------- GLOBAL EVENTS ----------------------------------------//

//Global mousemove
LinearStructure.prototype.gMousemove = function(e)
{
	e.data.self.mouse.x = e.pageX - $(e.data.self.svg_cont).offset().left;
	e.data.self.mouse.y = e.pageY - $(e.data.self.svg_cont).offset().top;
	
	//premikanje po prostoru - pan
	if (e.data.self.mouse.mDownM){
		//main strucutre translate
		$('#struct .trans').attr({'transform': "translate("+(e.data.self.trans.tx + (e.data.self.mouse.x - e.data.self.mouse.mPosM.x)/e.data.self.trans.sx)+","+(e.data.self.trans.ty + (e.data.self.mouse.y - e.data.self.mouse.mPosM.y)/e.data.self.trans.sy)+")"});	
		//move gridlines
		$('#grid .trans').attr({'transform': "translate("+((e.data.self.trans.gx + (e.data.self.mouse.x - e.data.self.mouse.mPosM.x)/e.data.self.trans.sx) % e.data.self.trans.dx)+","+((e.data.self.trans.gy + (e.data.self.mouse.y - e.data.self.mouse.mPosM.y)/e.data.self.trans.sy) % e.data.self.trans.dy)+")"});	
	}
	
	$('#test1').html(e.data.self.mouse.x+", "+e.data.self.mouse.y+" | "+e.data.self.getTransX(e.data.self.mouse.x)+", "+e.data.self.getTransY(e.data.self.mouse.y)+" | "+e.data.self.mouse.snapX+", "+e.data.self.mouse.snapY+" | "+e.data.self.mouse.resX+", "+e.data.self.mouse.resY+" | "+e.data.self.mouse.mDown+", "+e.data.self.mouse.mUp+" | "+e.data.self.mouse.mDownM+", "+e.data.self.mouse.mUpM+" | "+e.data.self.mouse.mDownR+", "+e.data.self.mouse.mUpR+" | "+e.data.self.mouse.mSnap+" | "+e.data.self.mouse.mPoi+", "+e.data.self.mouse.mPoiR+" | "+e.data.self.mouse.mElm+", "+e.data.self.mouse.mElmR+" | "+e.data.self.trans.tx+", "+e.data.self.trans.ty+" | "+e.data.self.trans.sx+", "+e.data.self.trans.sy+" | "+e.data.self.trans.dx+", "+e.data.self.trans.dy+" | "+e.data.self.trans.gx+", "+e.data.self.trans.gy);
	$('#test2').html(e.data.self.print());
}

//Global mousedown
LinearStructure.prototype.gMousedown = function(e)
{
	switch(e.which)
	{
	case 1:
		//left click
		e.data.self.mouse.mDown = true;
		e.data.self.mouse.mUp = false;
		e.data.self.mouse.mPos = {x:e.pageX, y:e.pageY};
		$('.menu-container').css({'display':"none"});	//hide selected RMB menus
		break;
		
	case 2:
		//middle click
		e.preventDefault();
		e.data.self.mouse.mDownM = true;
		e.data.self.mouse.mUpM = false;
		e.data.self.mouse.mPosM = {x:e.pageX, y:e.pageY};
		$('.menu-container').css({'display':"none"});	//hide selected RMB menus
		break;
		
	case 3:
		//right click
		e.data.self.mouse.mDownR = true;
		e.data.self.mouse.mUpR = false;
		e.data.self.mouse.mPosR = {x:e.pageX, y:e.pageY};
		$('.menu-container').css({'display':"none"});	//hide selected RMB menus
		break;
	}
}

//Global mouseup
LinearStructure.prototype.gMouseup = function(e)
{
	switch(e.which)
	{
	case 1:
		//left click
		e.data.self.mouse.mDown = false;
		e.data.self.mouse.mUp = true;
		break;
		
	case 2:
		//middle click
		e.data.self.mouse.mDownM = false;
		e.data.self.mouse.mUpM = true;
		e.data.self.trans.tx += (e.data.self.mouse.x - e.data.self.mouse.mPosM.x)/e.data.self.trans.sx;
		e.data.self.trans.ty += (e.data.self.mouse.y - e.data.self.mouse.mPosM.y)/e.data.self.trans.sy;
		e.data.self.trans.gx = (e.data.self.trans.gx + (e.data.self.mouse.x - e.data.self.mouse.mPosM.x)/e.data.self.trans.sx) % e.data.self.trans.dx;
		e.data.self.trans.gy = (e.data.self.trans.gy + (e.data.self.mouse.y - e.data.self.mouse.mPosM.y)/e.data.self.trans.sy) % e.data.self.trans.dy;
		e.data.self.mouse.mPosM = false;
		break;
		
	case 3:
		//right click
		e.data.self.mouse.mDownR = false;
		e.data.self.mouse.mUpR = true;
		//RMB global menu
		if (e.target === this) {$('#gRmbMenu').css({'display':"block", 'left':e.data.self.mouse.x, 'top':e.data.self.mouse.y});}
		break;
	}
}

//Global mousewheel
LinearStructure.prototype.gMousewheel = function(e)
{
	e.preventDefault();
	
	//pridobi zoom level
	if (e.originalEvent.wheelDelta) {e.data.self.mouse.mWheel = e.originalEvent.wheelDelta/1200;} else {e.data.self.mouse.mWheel = -e.originalEvent.detail/30;}
	
	e.data.self.trans.sx = Math.round((e.data.self.trans.sx + e.data.self.mouse.mWheel) * 10)/10;
	e.data.self.trans.sy = Math.round((e.data.self.trans.sy - e.data.self.mouse.mWheel) * 10)/10;
	
	//omejitev zooma
	if (e.data.self.trans.sx>2) {
		e.data.self.trans.sx = 2;
		e.data.self.trans.sy = -2;
	} else if (e.data.self.trans.sx < 0.5) {
		e.data.self.trans.sx = 0.5;
		e.data.self.trans.sy = -0.5;
	}
	
	//main strucutre scale
	$('#struct .scale').attr({'transform': "scale("+e.data.self.trans.sx+"," +e.data.self.trans.sy+")"});
	
	//scale gridlines
	$('#grid .scale').attr({'transform': "scale("+e.data.self.trans.sx+","+e.data.self.trans.sy+")"});
	
	//reposition gridlines
	e.data.self.trans.gx = Math.round(e.data.self.trans.tx % e.data.self.trans.dx);
	e.data.self.trans.gy = Math.round(e.data.self.trans.ty % e.data.self.trans.dy);
	$('#grid .trans').attr({'transform': "translate("+e.data.self.trans.gx+","+e.data.self.trans.gy+")"});
	
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//---------------------------------------- GLOBAL RMB EVENTS ----------------------------------------//

//RMB global load
LinearStructure.prototype.rmbGlobalLoad = function(e)
{
	var points, elements;
	
	//opravi ajax load
	$.ajax({
	  'type': 'POST', 'url': 'lib/ajax/load_data.php', 'data': {'load':'points'}, 'async': false,
	  'success': function(result) { points = $.parseJSON(result); }
	});
	$.ajax({
	  'type': 'POST', 'url': 'lib/ajax/load_data.php', 'data': {'load':'elements'}, 'async': false,
	  'success': function(result) { elements = $.parseJSON(result); }
	});
	
	//ustvari tocke in elemente
	for (var i = 0; i < points.length; i++) {
		e.data.self.points[i] = e.data.self.addPoi(points[i])
	}
	
	for (var i = 0; i < elements.length; i++) {
		elements[i].p1 = e.data.self.points[elements[i].p1];
		elements[i].p2 = e.data.self.points[elements[i].p2];
		e.data.self.elements[i] = e.data.self.addElm(elements[i])
	}
	
	$('#struct').remove();										//remove structure
	$(e.data.self.svg_id).append(e.data.self.svgStructure());	//redraw structure
	$('.menu-container').css({'display':"none"});				//hide selected RMB menus
}

//RMB global save
LinearStructure.prototype.rmbGlobalSave = function(e)
{	
	var points = Array();
	var elements = Array();
	
	//ustvari objekt za shranjevanje
	for (var i = 0; i < e.data.self.points.length; i++) {
		points[i] = e.data.self.points[i].outJSON();
	}
	
	for (var i = 0; i < e.data.self.elements.length; i++) {
		elements[i] = e.data.self.elements[i].outJSON();
	}
	
	//get structure through ajaxa
	$.ajax({
	  'type': 'POST', 'url': 'lib/ajax/save_data.php', 'data': {'save':'structure', 'points':points, 'elements':elements}, 'async': false
	});
	
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//RMB global save options
LinearStructure.prototype.rmbGlobalSaveOpt = function(e)
{		
	//get structure through ajaxa
	$.ajax({
	  'type': 'POST', 'url': 'lib/ajax/save_data.php', 'data': {'save':'options', 'options':e.data.self.opt}, 'async': false
	});
	
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//RMB global result
LinearStructure.prototype.rmbGlobalResult = function(e)
{
	var points, elements, maxRes;
	
	//save data
	e.data.self.rmbGlobalSave(e);
	
	//get results through ajax
	$.ajax({
	  type: 'POST', url: 'lib/ajax/compute_results.php', data: {'result':'points'}, async: false,
	  success: function(result) { points = $.parseJSON(result); }
	});
	$.ajax({
	  type: 'POST', url: 'lib/ajax/compute_results.php', data: {'result':'elements'}, async: false,
	  success: function(result) { elements = $.parseJSON(result); }
	});
	
	if (e.data.self.opt.result) {
		e.data.self.opt.result = false;
		
		$('#gRmbMenu li, #pRmbMenu li, #eRmbMenu li').not('#resultDisp, #resultMenu, #resultMenu li').removeClass("disable").addClass("enable");	//enable menus
		$('#poiLoadEdit input, #elmLoadEdit input').prop('disabled',false);																			//enable menu inputs
		
		$('.restraint, .elm-length, .poi-index, .elm-load, .poi-load, .dof-1, .dof-2, .dof-3').css({'display':"block"});													//display a bunch of things																						//display element length
		
		$('#poiResult').remove();	//remove point results
		$('#elmResult').remove();	//remove element results
	} else {
		e.data.self.opt.result = true;
		
		maxRes = e.data.self.globMaxReact(points);
		
		//save all results in points and elements
		for (var i = 0; i < points.length; i++) {
			e.data.self.points[i].result = points[i];
			e.data.self.points[i].maxRes = maxRes;
		}
		
		for (var i = 0; i < elements.length; i++) {
			e.data.self.elements[i].result = elements[i];
		}	
		
		maxRes = {'nx':e.data.self.globMaxNx(elements), 'ny': e.data.self.globMaxNy(elements), 'nmz':e.data.self.globMaxNmz(elements)};
		
		for (var i = 0; i < elements.length; i++) {
			e.data.self.elements[i].maxRes = maxRes;
		}
		
		$('#gRmbMenu li, #pRmbMenu li, #eRmbMenu li').not('#resultDisp, #resultMenu, #resultMenu li').removeClass("enable").addClass("disable");	//disable menus
		$('#poiLoadEdit input, #elmLoadEdit input').prop('disabled',true);																			//disable menu inputs
		
		$('.restraint, .elm-length, .poi-index, .elm-load, .poi-load, .dof-1, .dof-2, .dof-3').css({'display':"none"});														//hide a bunch of things
		
		$(e.data.self.svg_id+' #struct .trans').append(e.data.self.svgPoiResults());																//get point results
		$(e.data.self.svg_id+' #struct .trans').prepend(e.data.self.svgElmResults());																//get element results
	}
	
	e.data.self.resultDisplay();					//display appropriate results
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//RMB global reactions
LinearStructure.prototype.rmbGlobalReactions = function(e)
{
	if (e.data.self.opt.reactions) { e.data.self.opt.reactions = false; } else { e.data.self.opt.reactions = true; }
	e.data.self.resultDisplay();					//display appropriate results
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//RMB global nx
LinearStructure.prototype.rmbGlobalNx = function(e)
{
	e.data.self.opt.resElm.nx = true; e.data.self.opt.resElm.ny = false; e.data.self.opt.resElm.nmz = false;
	e.data.self.resultDisplay();					//display appropriate results
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}
	
//RMB global ny
LinearStructure.prototype.rmbGlobalNy = function(e)
{
	e.data.self.opt.resElm.ny = true; e.data.self.opt.resElm.nx = false; e.data.self.opt.resElm.nmz = false;
	e.data.self.resultDisplay();					//display appropriate results
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//RMB global nmz
LinearStructure.prototype.rmbGlobalNmz = function(e)
{
	e.data.self.opt.resElm.nmz = true; e.data.self.opt.resElm.nx = false; e.data.self.opt.resElm.ny = false;
	e.data.self.resultDisplay();					//display appropriate results
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//RMB global create point
LinearStructure.prototype.rmbPointCreate = function(e)
{
	var new_poi = e.data.self.addPoi(null, e.data.self.getTransX(e.data.self.mouse.x), e.data.self.getTransY(e.data.self.mouse.y));		//create new point
	e.data.self.points[e.data.self.points.length] = new_poi;																			//add new point
	var new_svg = new_poi.svgAdd(e.data.self.opt.pindex, e.data.self.opt.pdof, e.data.self.opt.loadPoi.px, e.data.self.opt.loadPoi.py, e.data.self.opt.loadPoi.pmz);
	//draw point
	if (e.data.self.points.length == 1) { $('#struct .trans').append(new_svg); }
	else { new_svg.insertAfter($('#struct .trans > g[id*="point"]:last')); }
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//RMB global create point
LinearStructure.prototype.rmbPointsDelete = function(e)
{
	for (var i = 0; i < e.data.self.points.length; i++) {
		if (e.data.self.points[i].elms.length == 0) {
			//remove point from database
			e.data.self.points[i].svgRemove();
			e.data.self.removePoi(e.data.self.points[i]);
			i--;
		}
	}
	$('.menu-container').css({'display':"none"});	//hide selected RMB menus
}

//RMB global grid
LinearStructure.prototype.rmbGlobalGrid = function(e)
{
	if (e.data.self.opt.grid) {
		e.data.self.opt.grid = false; $('#grid').css({'display':"none"}); $('#gridDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.grid = true; $('#grid').css({'display':"block"}); $('#gridDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global snap
LinearStructure.prototype.rmbGlobalSnap = function(e)
{
	if (e.data.self.opt.snap) {
		e.data.self.opt.snap = false; $('#snapEnable div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.snap = true; $('#snapEnable div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global point label
LinearStructure.prototype.rmbGlobalPointLabel = function(e)
{
	if (e.data.self.opt.pindex) {
		e.data.self.opt.pindex = false; $('.poi-label').css({'display':"none"}); $('#poiLabelDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.pindex = true; $('.poi-label').css({'display':"block"}); $('#poiLabelDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global element label
LinearStructure.prototype.rmbGlobalElementLabel = function(e)
{
	if (e.data.self.opt.eindex) {
		e.data.self.opt.eindex = false; $('.elm-label').css({'display':"none"}); $('#elmLabelDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.eindex = true; $('.elm-label').css({'display':"block"}); $('#elmLabelDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global point label
LinearStructure.prototype.rmbGlobalPointDof = function(e)
{
	if (e.data.self.opt.pdof) {
		e.data.self.opt.pdof = false; $('.poi-dofs').css({'display':"none"}); $('#poiDofDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.pdof = true; $('.poi-dofs').css({'display':"block"}); $('#poiDofDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global element label
LinearStructure.prototype.rmbGlobalElementDof = function(e)
{
	if (e.data.self.opt.edof) {
		e.data.self.opt.edof = false; $('.elm-dofs').css({'display':"none"}); $('#elmDofDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.edof = true; $('.elm-dofs').css({'display':"block"}); $('#elmDofDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global Px
LinearStructure.prototype.rmbGlobalPx = function(e)
{
	if (e.data.self.opt.loadPoi.px) {
		e.data.self.opt.loadPoi.px = false; $('.poi-load .px').css({'display':"none"}); $('#pxDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.loadPoi.px = true; $('.poi-load .px').css({'display':"block"}); $('#pxDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global Py
LinearStructure.prototype.rmbGlobalPy = function(e)
{
	if (e.data.self.opt.loadPoi.py) {
		e.data.self.opt.loadPoi.py = false; $('.poi-load .py').css({'display':"none"}); $('#pyDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.loadPoi.py = true; $('.poi-load .py').css({'display':"block"}); $('#pyDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global Pmz
LinearStructure.prototype.rmbGlobalPmz = function(e)
{
	if (e.data.self.opt.loadPoi.pmz) {
		e.data.self.opt.loadPoi.pmz = false; $('.poi-load .pmz').css({'display':"none"}); $('#pmzDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.loadPoi.pmz = true; $('.poi-load .pmz').css({'display':"block"}); $('#pmzDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global linx
LinearStructure.prototype.rmbGlobalLinx = function(e)
{
	if (e.data.self.opt.loadElm.linx) {
		e.data.self.opt.loadElm.linx = false; $('.elm-load .linx').css({'display':"none"}); $('#linXdisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.loadElm.linx = true; $('.elm-load .linx').css({'display':"block"}); $('#linXdisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//RMB global liny
LinearStructure.prototype.rmbGlobalLiny = function(e)
{
	if (e.data.self.opt.loadElm.liny) {
		e.data.self.opt.loadElm.liny = false; $('.elm-load .liny').css({'display':"none"}); $('#linYdisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});
	} else {
		e.data.self.opt.loadElm.liny = true; $('.elm-load .liny').css({'display':"block"}); $('#linYdisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});
	}
}

//---------------------------------------- SNAP EVENTS ----------------------------------------//

//Snap events mouseover
LinearStructure.prototype.snapEnable = function(e) { e.data.self.mouse.mSnap = true; }

//Snap events mouseout
LinearStructure.prototype.snapDisable = function(e) { e.data.self.mouse.mSnap = false; }

//Snap points
LinearStructure.prototype.snapPoints = function(e)
{
	e.data.self.mouse.snapX = parseInt($(this).attr('cx'), 10);
	e.data.self.mouse.snapY = parseInt($(this).attr('cy'), 10);
}

//Snap grid
LinearStructure.prototype.snapGrid = function(e)
{
	e.data.self.mouse.snapX = e.data.self.getGridTransX(parseInt($(this).attr('cx'), 10));
	e.data.self.mouse.snapY = e.data.self.getGridTransY(parseInt($(this).attr('cy'), 10));
}

//Snap grid x axis
LinearStructure.prototype.snapGridX = function(e)
{
	e.data.self.mouse.snapX = e.data.self.getGridTransX(parseInt($(this).attr('x1'), 10));
	e.data.self.mouse.snapY = e.data.self.getTransY(e.data.self.mouse.y);
}

//Snap grid y axis
LinearStructure.prototype.snapGridY = function(e)
{
	e.data.self.mouse.snapX = e.data.self.getTransX(e.data.self.mouse.x);
	e.data.self.mouse.snapY = e.data.self.getGridTransY(parseInt($(this).attr('y1'), 10));
}

//---------------------------------------- POINT EVENTS ----------------------------------------//

//Point event mouseover
LinearStructure.prototype.poiEventMouseover = function(e)
{
	var i = parseInt($(this).parent().attr('id').replace("point",""));	//get point id
	e.data.self.points[i].mOverDisp();									//display mouseover point event
	
	//only do if results
	if (e.data.self.opt.result) {
		var dof, unit;
		var elm = 0;
		var values = Array();
		
		//loop through elements
		for (var j = 0; j < e.data.self.elements.length; j++) {
			if (e.data.self.elements[j].p1.id == i) {
				if (e.data.self.opt.resElm.nx) {dof = 0; unit = " kN";} else if (e.data.self.opt.resElm.ny) {dof = 1; unit = " kN";} else if (e.data.self.opt.resElm.nmz) {dof = 2; unit = " kNcm";}
				values[elm++] = j + ": " + Math.round(-e.data.self.elements[j].result.forces[dof].value*100)/100 + unit;
			} else if (e.data.self.elements[j].p2.id == i) {
				if (e.data.self.opt.resElm.nx) {dof = 3; unit = " kN";} else if (e.data.self.opt.resElm.ny) {dof = 4; unit = " kN";} else if (e.data.self.opt.resElm.nmz) {dof = 5; unit = " kNcm";}
				values[elm++] = j + ": " + Math.round(e.data.self.elements[j].result.forces[dof].value*100)/100 + unit;
			}
		}
		
		e.data.self.points[i].resTextDisp(values);			//display result text
	}
}

//Point event mouseout
LinearStructure.prototype.poiEventMouseout = function(e)
{
	var i = parseInt($(this).parent().attr('id').replace("point",""));		//get point id
	e.data.self.points[i].mOutDisp(e.data.self.opt.result);					//display mouseout point event
}

//Point event mouseup
LinearStructure.prototype.poiEventMouseup = function(e)
{
	var i = parseInt($(this).parent().attr('id').replace("point",""));		//get point id
	switch (e.which)
	{
	case 1:
		e.data.self.points[i].mUpLeft();		//LMB point event
		e.data.self.mouse.mPoi = i;				//set last clicked
		break;
		
	case 3:
		e.data.self.points[i].mUpRight();		//RMB point event
		$('#pRmbMenu').css({'display':"block", 'left':e.data.self.mouse.x, 'top':e.data.self.mouse.y});		//RMB point menu event
		$('#pxEdit input').val(e.data.self.points[i].pload.px);												//set current menu values for px
		$('#pyEdit input').val(e.data.self.points[i].pload.py);												//set current menu values for py
		$('#pmzEdit input').val(e.data.self.points[i].pload.pmz);											//set current menu values for pmz
		e.data.self.mouse.mPoiR = i;																		//default hover point
		break;
	}
}

//---------------------------------------- POINT RMB EVENTS ----------------------------------------//

//RMB point create
LinearStructure.prototype.rmbElementCreate = function(e)
{
	//declare initial variables
	var i = e.data.self.mouse.mPoiR;
	var mClick = false, mClickR = false;
	var check_poi, elm = e.data.self.elements.length, poi = e.data.self.points.length;
	
	var new_poi = e.data.self.addPoi(null, e.data.self.points[i].x, e.data.self.points[i].y);		//create new point
	var new_elm = e.data.self.addElm(null, e.data.self.points[i], new_poi);							//create new element
	
	$('#struct .trans').prepend(new_elm.svgAdd(e.data.self.opt.eindex, e.data.self.opt.edof, e.data.self.opt.loadElm.linx, e.data.self.opt.loadElm.liny));	//draw element
	$('#grid').insertAfter($('#struct'));				//struct behind grid
	new_elm.events(false);								//disable events on new element
	$('.menu-container').css({'display':"none"});		//hide menus

	//postavi drugo tocko
	var interval = setInterval(function(){
		if (e.data.self.mouse.mDown) { mClick = true; }			//check LMDown click
		if (e.data.self.mouse.mDownR) { mClickR = true; }		//check RMDown click
	
		//x, y tracking
		if (e.data.self.mouse.mDownM){
			new_poi.x = e.data.self.getTransX(e.data.self.mouse.mPosM.x);
			new_poi.y = e.data.self.getTransY(e.data.self.mouse.mPosM.y);
		} else if (e.data.self.mouse.mSnap && e.data.self.opt.snap){
			new_poi.x = e.data.self.mouse.snapX;
			new_poi.y = e.data.self.mouse.snapY;
		} else {
			new_poi.x = e.data.self.getTransX(e.data.self.mouse.x);
			new_poi.y = e.data.self.getTransY(e.data.self.mouse.y);
		}
		
		//reposition element
		new_elm.reposition();								
	
		//finish positioning
		if (e.data.self.mouse.mUp  && mClick) {
			e.data.self.elements[elm] = new_elm;		//add element as new element
			check_poi = e.data.self.poiExists(new_poi);
			if (check_poi) {
				new_elm.p2 = check_poi;
				check_poi.addElm(new_elm);
			} else {
				e.data.self.points[poi] = new_poi;		//add point as new point
				new_poi.svgAdd(e.data.self.opt.pindex, e.data.self.opt.pdof, e.data.self.opt.loadPoi.px, e.data.self.opt.loadPoi.py, e.data.self.opt.loadPoi.pmz).insertAfter($('#struct .trans > g[id*="point"]:last'));	//draw point
			}
			
			$('#element'+elm).insertAfter($('#struct .trans > g[id*="element"]:last'));	//element after all other element
			$('#struct').insertAfter($('#grid'));			//grid behind struct
			new_elm.events(true);							//enable general events on new element
			
			clearInterval(interval);						//clear interval
		}
	
		//cancel positioning
		if (e.data.self.mouse.mUpR && mClickR) {
			$('.menu-container').css({'display':"none"});			//hide menus
			$('#struct').insertAfter($('#grid'));					//grid behind struct
			new_elm.svgRemove();									//remove new drawn element
			
			clearInterval(interval);								//clear interval
		}
	},20);
}

//RMB point delete
LinearStructure.prototype.rmbPointDelete = function(e)
{
	//declare initial variables
	var poi = e.data.self.points[e.data.self.mouse.mPoiR];
	
	//delete connecting elements
	while (poi.elms.length > 0) {
		poi.elms[0].svgRemove();
		e.data.self.removeElm(poi.elms[0]);
	}
	
	//remove point from database
	poi.svgRemove();
	e.data.self.removePoi(poi);
	
	$('.menu-container').css({'display':"none"});	//hide menus
}

//RMB point move
LinearStructure.prototype.rmbPointMove = function(e)
{
	var i = e.data.self.mouse.mPoiR;
	var old_x = e.data.self.points[i].x, old_y = e.data.self.points[i].y;
	var mClick = false, mClickR = false;
	var x, y, elm;
	
	$('#grid').insertAfter($('#struct'));										//struct behind grid
	$('#point'+i).insertBefore($('#struct .trans > g[id*="point"]:first'));		//point behind all other points
	e.data.self.points[i].events(false);										//disable events on point
	$('.elm-load, .poi-load').attr({'style':"display:none"});					//hide loads
	$('.menu-container').css({'display':"none"});								//hide menus
	
	//premakni drugo tocko
	var interval = setInterval(function(){
		if (e.data.self.mouse.mDown) {mClick = true;}		//check LMDown click
		if (e.data.self.mouse.mDownR) {mClickR = true;}		//check RMDown click
					
		//x, y tracking
		if (e.data.self.mouse.mDownM) {
			x = e.data.self.getTransX(e.data.self.mouse.mPosM.x);
			y = e.data.self.getTransY(e.data.self.mouse.mPosM.y);
		} else if (e.data.self.mouse.mSnap && e.data.self.opt.snap) {
			x = e.data.self.mouse.snapX;
			y = e.data.self.mouse.snapY;
		} else {
			x = e.data.self.getTransX(e.data.self.mouse.x);
			y = e.data.self.getTransY(e.data.self.mouse.y);
		}
		
		//reposition point
		e.data.self.points[i].reposition(x, y);
		//reposition elements
		for (var j = 0; j < e.data.self.points[i].elms.length; j++) {
			elm = e.data.self.points[i].elms[j];
			e.data.self.elements[elm.id].reposition();
		}

		//finish positioning
		if (e.data.self.mouse.mUp && mClick) {
			//redraw loads
			for (var j = 0; j < e.data.self.points[i].elms.length; j++) {
				elm = e.data.self.points[i].elms[j];
				elm.svgLoadRefresh(e.data.self.opt.loadElm.linx, e.data.self.opt.loadElm.liny);
			}
			
			$('#struct').insertAfter($('#grid'));										//grid behind struct
			$('#point'+i).insertAfter($('#struct .trans > g[id="point'+(i-1)+'"]'));	//point after all other points
			e.data.self.points[i].events(true);											//enable events on point
			$('.elm-load, .poi-load').attr({'style':"display:block"});					//show loads
			
			clearInterval(interval);													//clear interval
		}

		//cancel positioning
		if (e.data.self.mouse.mUpR && mClickR) {
			//reposition point
			e.data.self.points[i].reposition(old_x, old_y);
			//reposition elements
			for (var j = 0; j < e.data.self.points[i].elms.length; j++) {
				elm = e.data.self.points[i].elms[j];
				e.data.self.elements[elm.id].reposition();
			}
			
			$('#struct').insertAfter($('#grid'));										//grid behind struct
			$('#point'+i).insertAfter($('#struct .trans > g[id="point'+(i-1)+'"]'));	//point after all other points
			e.data.self.points[i].events(true);											//enable events on point
			$('.elm-load, .poi-load').attr({'style':"display:block"});					//show loads
			
			clearInterval(interval);													//clear interval
		}
	},20);
}

//RMB point rotate dofs
LinearStructure.prototype.rmbPointRotate= function(e)
{
	var i = e.data.self.mouse.mPoiR;
	var mClick = false, mClickR = false;
	var x, y;
	var angle = e.data.self.points[i].angle;
	
	$('#point'+i+' > g:eq(4)').css({'display':"block"});
	$('.menu-container').css({'display':"none"});			//hide menus
	
	//zavrti tocko
	var interval = setInterval(function(){
		if (e.data.self.mouse.mDown) {mClick = true;}		//check LMDown click
		if (e.data.self.mouse.mDownR) {mClickR = true;}		//check RMDown click
					
		//x, y tracking
		if (e.data.self.mouse.mDownM) {
			x = e.data.self.getTransX(e.data.self.mouse.mPosM.x);
			y = e.data.self.getTransY(e.data.self.mouse.mPosM.y);
		} else if (e.data.self.mouse.mSnap && e.data.self.opt.snap) {
			x = e.data.self.mouse.snapX;
			y = e.data.self.mouse.snapY;
		} else {
			x = e.data.self.getTransX(e.data.self.mouse.x);
			y = e.data.self.getTransY(e.data.self.mouse.y);
		}
		
		e.data.self.points[i].rotate(null, x, y);

		//finish positioning
		if (e.data.self.mouse.mUp && mClick) {
			if (!e.data.self.opt.pdof) { $('#point'+i+' > g:eq(4)').css({'display':"none"}); }
			clearInterval(interval);	//clear interval
		}

		//cancel positioning
		if (e.data.self.mouse.mUpR && mClickR) {
			$('.menu-container').css({'display':"none"});			//hide menus
			e.data.self.points[i].rotate(angle);
			if (!e.data.self.opt.pdof) { $('#point'+i+' > g:eq(4)').css({'display':"none"}); }
			clearInterval(interval);	//clear interval
		}
	},20);
}

//RMB restraint 111
LinearStructure.prototype.rmbPoint111 = function(e)
{
	var i = e.data.self.mouse.mPoiR;							//get point index
	e.data.self.points[i].editRestraint(true, true, true);		//edit restraint data
	$('.menu-container').css({'display':"none"});				//hide menus
}

//RMB restraint 110
LinearStructure.prototype.rmbPoint110 = function(e)
{
	var i = e.data.self.mouse.mPoiR;							//get point index
	e.data.self.points[i].editRestraint(true, true, false);		//edit restraint data
	$('.menu-container').css({'display':"none"});				//hide menus
}

//RMB restraint 010
LinearStructure.prototype.rmbPoint010 = function(e)
{
	var i = e.data.self.mouse.mPoiR;							//get point index
	e.data.self.points[i].editRestraint(false, true, false);	//edit restraint data
	$('.menu-container').css({'display':"none"});				//hide menus
}

//RMB restraint 000
LinearStructure.prototype.rmbPoint000 = function(e)
{
	var i = e.data.self.mouse.mPoiR;							//get point index
	e.data.self.points[i].editRestraint(false, false, false);	//edit restraint data
	$('.menu-container').css({'display':"none"});				//hide menus
}

//RMB point load change
LinearStructure.prototype.rmbPoiLoadEdit = function(e)
{
	if (e.which == 13) {
		var i = e.data.self.mouse.mPoiR;									//get point index
		e.preventDefault();													//prevent defaults from executing
		e.data.self.points[i].setLoad(e.data.self.opt.loadPoi.px, e.data.self.opt.loadPoi.py, e.data.self.opt.loadPoi.pmz);	//set load
		$('.menu-container').css({'display':"none"});						//hide menus
	}
}

//---------------------------------------- ELEMENT EVENTS ----------------------------------------//

//Element event mouseover
LinearStructure.prototype.elmEventMouseover = function(e)
{
	var i = parseInt($(this).parent().attr('id').replace("element",""));
	e.data.self.elements[i].mOverDisp(e.data.self.opt.result);
}

//Element event mouseout
LinearStructure.prototype.elmEventMouseout = function(e)
{
	var i = parseInt($(this).parent().attr('id').replace("element",""));
	e.data.self.elements[i].mOutDisp(e.data.self.opt.result);
}

//Element event mouseup
LinearStructure.prototype.elmEventMouseup = function(e)
{
	var i = parseInt($(this).parent().attr('id').replace("element",""));
	switch (e.which)
	{
	case 1:
		e.data.self.elements[i].mUpLeft();		//LMB element event
		e.data.self.mouse.mElm = i;				//set last clicked
		break;
		
	case 3:
		e.data.self.elements[i].mUpRight();		//RMB element event
		$('#eRmbMenu').css({'display':"block", 'left':e.data.self.mouse.x, 'top':e.data.self.mouse.y});									//RMB element menu event
		$('#linXedit input').val(e.data.self.elements[i].eload.linx);																	//set current menu values for linx
		$('#linYedit input').val(e.data.self.elements[i].eload.liny);																	//set current menu values for liny
		e.data.self.mouse.mElmR = i;																									//set last clicked
		break;
	}
}

//Element event result mousemove
LinearStructure.prototype.elmEventResult = function(e)
{
	if (e.data.self.opt.result) {
		var i = parseInt($(this).parent().attr('id').replace("element",""));
		var x = e.data.self.getTransX(e.data.self.mouse.x);
		var y = e.data.self.getTransY(e.data.self.mouse.y);
		e.data.self.elements[i].resMarker(x, y, e.data.self.opt.resElm.nx, e.data.self.opt.resElm.ny, e.data.self.opt.resElm.nmz);		
	}
}

//---------------------------------------- ELEMENT RMB EVENTS ----------------------------------------//

//RMB point delete
LinearStructure.prototype.rmbElementDelete= function(e)
{
	//declare initial variables
	var elm = e.data.self.elements[e.data.self.mouse.mElmR];
	
	//delete element
	elm.svgRemove();
	e.data.self.removeElm(elm);
	
	$('.menu-container').css({'display':"none"});	//hide menus
}

//RMB element release-LO
LinearStructure.prototype.rmbElmRelF110 = function(e)
{
	var i = e.data.self.mouse.mElmR;								//get element index
	e.data.self.elements[i].editRelease(0, true, true, false);		//set release data
	$('.menu-container').css({'display':"none"});					//hide menus
}

//RMB element release-LI
LinearStructure.prototype.rmbElmRelF111 = function(e){
	var i = e.data.self.mouse.mElmR;								//get element index
	e.data.self.elements[i].editRelease(0, true, true, true);		//set release data
	$('.menu-container').css({'display':"none"});					//hide menus
}

//RMB element release-RO
LinearStructure.prototype.rmbElmRelS110 = function(e){
	var i = e.data.self.mouse.mElmR;								//get element index
	e.data.self.elements[i].editRelease(1, true, true, false);		//set release data
	$('.menu-container').css({'display':"none"});					//hide menus
}

//RMB element release-RI
LinearStructure.prototype.rmbElmRelS111 = function(e){
	var i = e.data.self.mouse.mElmR;								//get element index
	e.data.self.elements[i].editRelease(1, true, true, true);		//set release data
	$('.menu-container').css({'display':"none"});					//hide menus
}

//RMB element load change
LinearStructure.prototype.rmbElmLoadEdit = function(e){
	if (e.which == 13) {
		var i = e.data.self.mouse.mElmR;									//get element index
		e.preventDefault();													//prevent defaults from executing
		e.data.self.elements[i].setLoad(e.data.self.opt.loadElm.linx, e.data.self.opt.loadElm.liny);
		$('.menu-container').css({'display':"none"});						//hide menus
	}
}

//---------------------------------------- MISC METHODS ----------------------------------------//

//get translated x coordinate
LinearStructure.prototype.getTransX = function(x)
{
	return Math.round((x - this.trans.w/2 - this.trans.tx*this.trans.sx)/this.trans.sx);
}

//get translated y coordinate
LinearStructure.prototype.getTransY = function(y)
{
	return Math.round((y - this.trans.h/2 - this.trans.ty*this.trans.sy)/this.trans.sy);
}

//get grid translated x coordinate
LinearStructure.prototype.getGridTransX = function(x)
{
	var tempX = this.trans.w/2 + (this.trans.gx + x) * this.trans.sx;
	return this.getTransX(tempX);
}

//get grid translated y coordinate
LinearStructure.prototype.getGridTransY = function(y)
{
	var tempY = this.trans.h/2 + (this.trans.gy + y) * this.trans.sy;
	return this.getTransY(tempY);
}

//global maximum element results
LinearStructure.prototype.globMaxNx = function(results)
{
	var maximum = 1;
	for (var i = 0; i < this.elements.length; i++) {
		if (Math.abs(this.elements[i].maxNx(results[i])[1]) > Math.abs(maximum)) {maximum = this.elements[i].maxNx(results[i])[1]};
	}
	return Math.abs(maximum);
}

LinearStructure.prototype.globMaxNy = function(results)
{
	var maximum = 1;
	for (var i = 0; i < this.elements.length; i++) {
		if (Math.abs(this.elements[i].maxNy(results[i])[1]) > Math.abs(maximum)) {maximum = this.elements[i].maxNy(results[i])[1]};
	}
	return Math.abs(maximum);
}

LinearStructure.prototype.globMaxNmz = function(results)
{
	var maximum = 1;
	for (var i = 0; i < this.elements.length; i++) {
		if (Math.abs(this.elements[i].maxNmz(results[i])[1]) > Math.abs(maximum)) {maximum = this.elements[i].maxNmz(results[i])[1]};
	}
	return Math.abs(maximum);
}

//global maximum reaction results
LinearStructure.prototype.globMaxReact = function(results)
{
	var maximum = results[0].react[0].value;
	for (var i = 0; i < this.points.length; i++) {
		for (var j = 0; j < 3; j++){
			if (Math.abs(results[i].react[j].value) > Math.abs(maximum)) { maximum = results[i].react[j].value };
		}
	}
	return Math.abs(maximum);
}

//result display values
LinearStructure.prototype.resultDisplay = function()
{
	if (this.opt.result) {$('#resultMenu').css({'display':"block"});} else {$('#resultMenu').css({'display':"none"});}						//display result menu
	if (this.opt.reactions) {$('#poiResult .poi-res').css({'display':"block"});} else {$('#poiResult .poi-res').css({'display':"none"});}	//display reactions
	if (this.opt.resElm.nx) {$('#elmResult .nx').css({'display':"block"});} else {$('#elmResult .nx').css({'display':"none"});}				//display nx
	if (this.opt.resElm.ny) {$('#elmResult .ny').css({'display':"block"});} else {$('#elmResult .ny').css({'display':"none"});}				//display ny
	if (this.opt.resElm.nmz) {$('#elmResult .nmz').css({'display':"block"});} else {$('#elmResult .nmz').css({'display':"none"});}			//display nmz
	
	if (this.opt.result) {$('#resultDisp div:eq(1)').attr({'class':"icon icon-lock"});} else {$('#resultDisp div:eq(1)').attr({'class':""});}											//display result menu icon
	if (this.opt.reactions) {$('#reactionsDisp div:eq(1)').attr({'class':"icon icon-bracket-tick"});} else {$('#reactionsDisp div:eq(1)').attr({'class':"icon icon-bracket-empty"});}	//display reactions menu icon
	if (this.opt.resElm.nx) {$('#nxDisp div:eq(1)').attr({'class':"icon icon-radio-star"});} else {$('#nxDisp div:eq(1)').attr({'class':""});}											//display nx menu icon
	if (this.opt.resElm.ny) {$('#nyDisp div:eq(1)').attr({'class':"icon icon-radio-star"});} else {$('#nyDisp div:eq(1)').attr({'class':""});}											//display ny menu icon
	if (this.opt.resElm.nmz) {$('#nmzDisp div:eq(1)').attr({'class':"icon icon-radio-star"});} else {$('#nmzDisp div:eq(1)').attr({'class':""});}										//display nmz menu icon
}

//print out all point and elements
LinearStructure.prototype.print = function() {
	var string = "";

	for (var i=0; i<this.points.length; i++) {
		string += i+" | "+this.points[i].x+", "+this.points[i].y+" | ";
		for (var j=0; j<3; j++) {
			string += this.points[i].dof[j].id+", "+this.points[i].dof[j].rest+" | ";
		}
		string += this.points[i].pload.px+", "+this.points[i].pload.py+", "+this.points[i].pload.pmz+" | ";
		string += this.points[i].e.sL+", "+this.points[i].e.sR+"<br/>";
	}
	
	string += "<br/>";
	
	for (var i=0; i<this.elements.length; i++) {
		string += i+" | "+this.elements[i].E+", "+this.elements[i].A+", "+this.elements[i].Iz+" | ";
		string += this.elements[i].p1.id+", "+this.elements[i].p2.id+" | ";
		string += this.elements[i].eload.linx+", "+this.elements[i].eload.liny+" | ";
		string += this.elements[i].e.sL+", "+this.elements[i].e.sR+"<br/>";
	}

	return string;
}