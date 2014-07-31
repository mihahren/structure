TO DO LIST
=====
- moznost gledanja razlicnih rezultatov
- moznost gledanja premikov
- moznost vstavljanja obtezb
- moznost podajanja koordinat tock (absolute in relative)
- moznost podajanja zasuka
- zamrznitev funkcij za spreminjanje geometrije, ko se gleda rezultate
- izračun minimuma in maksimuma vseh rezultatov
- možnost vnosa obtežbe
- izris reakcij
- popravit zoomanje, da bo bolj naravno
- testirat C++ app za računanje, na podlagi rezultatov
- popravit in izboljsat C++ app
- dodat racunanje nps v C++ app
- NAPETOSTI

STRUCT, OPT AND RESULTS
=====
```javascript
var points = [{x:0, y:0, dof:[{id:0, exist:true, rest:true},{id:1, exist:true, rest:true},{id:2, exist:true, rest:true},], pload:{px:0, py:0, pmz:0}, e:{sL:false, sR:false}},
			  {x:0, y:200, dof:[{id:0, exist:true, rest:false},{id:1, exist:true, rest:false},{id:2, exist:true, rest:false},], pload:{px:0, py:0, pmz:0}, e:{sL:false, sR:false}},
			  {x:300, y:100, dof:[{id:0, exist:true, rest:false},{id:1, exist:true, rest:false},{id:2, exist:true, rest:false},], pload:{px:100, py:0, pmz:0}, e:{sL:false, sR:false}},
			  {x:500, y:0, dof:[{id:0, exist:true, rest:true},{id:1, exist:true, rest:true},{id:2, exist:true, rest:false},], pload:{px:0, py:0, pmz:0}, e:{sL:false, sR:false}},];
			  
var elements = [{n:10, E:21000, A:400, Iz:53333.33, point:{first:0, second:1}, dof:[{id:0, exist:true, rest:true},{id:1, exist:true, rest:true},{id:2, exist:true, rest:true},{id:3, exist:true, rest:true},{id:4, exist:true, rest:true},{id:5, exist:true, rest:true},], eload:{linx:0, liny:0}, e:{sL:false, sR:false}},
				{n:10, E:21000, A:400, Iz:53333.33, point:{first:1, second:2}, dof:[{id:0, exist:true, rest:true},{id:1, exist:true, rest:true},{id:2, exist:true, rest:true},{id:3, exist:true, rest:true},{id:4, exist:true, rest:true},{id:5, exist:true, rest:true},], eload:{linx:0, liny:-0.1}, e:{sL:false, sR:false}},
				{n:10, E:21000, A:400, Iz:53333.33, point:{first:2, second:3}, dof:[{id:0, exist:true, rest:true},{id:1, exist:true, rest:true},{id:2, exist:true, rest:true},{id:3, exist:true, rest:true},{id:4, exist:true, rest:true},{id:5, exist:true, rest:true},], eload:{linx:0, liny:0}, e:{sL:false, sR:false}},];
				
var opt = {grid:true, pindex:false, eindex:true, elength:true, axis:false, snap:true, result:false, loadPoi:{px:true, py:false, pmz:false}, loadElm:{linx:false, liny:true}, reactions:false, resElm:{nx:false, ny:false, nmz:false}};

var resPoi = [{react:[{id:0, value:-94.350769},{id:1, value:19.227732},{id:2, value:15353.467773},], disp:[{id:0, value:0.000000},{id:1, value:0.000000},{id:2, value:0.000000},]},
			  {react:[{id:3, value:0.000000},{id:4, value:0.000000},{id:5, value:0.000000},], disp:[{id:3, value:0.161847},{id:4, value:-0.000458},{id:5, value:-0.001057},]},
			  {react:[{id:6, value:0.000000},{id:7, value:0.000000},{id:8, value:0.000000},], disp:[{id:6, value:0.166339},{id:7, value:-0.084125},{id:8, value:0.000620},]},
			  {react:[{id:9, value:-5.652802},{id:10, value:20.772240},{id:11, value:0.000000},], disp:[{id:9, value:0.000000},{id:10, value:0.000000},{id:11, value:0.000940},]},];

var resElm = [{forces:[{id:0, value:19.227736},{id:1, value:94.350769},{id:2, value:15353.467773},{id:3, value:-19.227736},{id:4, value:-94.350769},{id:5, value:3516.685547},], disp:[{id:0, value:0.000000},{id:1, value:0.000000},{id:2, value:0.000000},{id:3, value:-0.000458},{id:4, value:-0.161847},{id:5, value:-0.001057},]},
			  {forces:[{id:0, value:-94.346680},{id:1, value:19.227732},{id:2, value:-3516.684082},{id:3, value:94.346680},{id:4, value:20.772268},{id:5, value:3207.776367},], disp:[{id:0, value:0.161847},{id:1, value:-0.000458},{id:2, value:-0.001057},{id:3, value:0.166339},{id:4, value:-0.084125},{id:5, value:0.000620},]},
			  {forces:[{id:0, value:-16.051161},{id:1, value:-14.345589},{id:2, value:-3207.775391},{id:3, value:16.051161},{id:4, value:14.345589},{id:5, value:0.000000},], disp:[{id:0, value:-0.000855},{id:1, value:-0.186400},{id:2, value:0.000620},{id:3, value:0.000000},{id:4, value:0.000000},{id:5, value:0.000940},]},];
```
