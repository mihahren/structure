<?php
//---------------------------------------- XML MANAGER ----------------------------------------//
class XmlManager
{
	private $xml;
    
	// constructor
	public function __construct($name, $is_file = false)
	{
		$this->xml = new SimpleXMLIterator($name, 0, $is_file);
	}

	// destructor
	public function __destruct() {}

	//---------------------------------------- XML CREATION METHODS - FILES ----------------------------------------//

	// ustvari points predel XML datoteke
	public function parsePoints($pointsArray)
	{
		//<points>
		$points = $this->xml->addChild("points");
		$points->addAttribute("n", count($pointsArray));
		foreach ($pointsArray as $pointId => $pointArray) {
			//<point>
			$point = $points->addChild("point");
			$point->addAttribute("id", $pointId);
			foreach ($pointArray as $key => $value) {
				switch ($key) {
					//<dofs>
					case "dof":
						$dofs = $point->addChild("dofs");
						$dofs->addAttribute("n", count($value));
						foreach ($value as $dofId => $dofArray) {
							//<dof>
							$dof = $dofs->addChild("dof");
							$dof->addAttribute("id", 3*$pointId+$dofId);
							$dof->addChild("rest", $dofArray["rest"]);
						}
						break;
					//<x><y><pload>...
					default:
						$this->parseGeneric($value, $key, $point);
						break;
				}
			}
		}
	}
	
	// ustvari elements predel XML datoteke
	public function parseElements($elementsArray)
	{
		//<elements>
		$elements = $this->xml->addChild("elements");
		$elements->addAttribute("n", count($elementsArray));
		foreach ($elementsArray as $elementId => $elementArray) {
			//<element>
			$element = $elements->addChild("element");
			$element->addAttribute("id", $elementId);
			foreach ($elementArray as $key => $value) {
				switch ($key) {
					//<dofs>
					case "dof":
						$dofs = $element->addChild("dofs");
						$dofs->addAttribute("n", count($value));
						foreach ($value as $dofId => $dofArray) {
							//<dof>
							$dof = $dofs->addChild("dof");
							$dof->addAttribute("id", $dofArray["id"]);
							$dof->addChild("exist", $dofArray["exist"]);
						}
						break;
					//<A><E><eload>...
					default:
						$this->parseGeneric($value, $key, $element);
						break;
				}
			}
		}
	}
	
	// genericno ustvarjanje XML elementov - recursive
	public function parseGeneric($element, $elementKey, $inputParent)
	{
		//doloci parent element
		$parent = (isset($inputParent)) ? $inputParent : $this->xml;
		//preveri, ce je array
		if (is_array($element)) {
			//doloci otroka in sesteje elemente v array-ju
			$child = ($elementKey != "") ? $parent->addChild($elementKey) : $parent;
			$child->addAttribute("n", count($element));
			//rekurzicno gre ponovno v funkcijo
			foreach ($element as $key => $value) {
				$this->parseGeneric($value, $key, $child);
			}
		} else {
			//doda element in vrednost, ce ni array
			$parent->addChild($elementKey, $element);
		}
	}
	
	//---------------------------------------- XML READING METHODS - JAVASCRIPT ----------------------------------------//
	
	// nalozi XML points v javascript spremenljivko - JSON
	public function pointsJs()
	{
		$points = '[';
		
		//loop through points
		$iter1 = 0;
		foreach ($this->xml->points->point as $point) {
			$points .= '{"id":'.$iter1.', "angle":'.$point->angle.', "x":'.$point->x.', "y":'.$point->y.', "dof":[';
			//loop through dofs
			$iter2 = 0;
			foreach ($point->dofs->dof as $dofId => $dof) {
				$points .= '{"id":'.$dof['id'].', "rest":'.$dof->rest.'}';
				$points .= ($iter2 != count($point->dofs->dof)-1) ? ',' : '';
				$iter2++;
			}
			$points .= '], "pload":{"px":'.$point->pload->px.', "py":'.$point->pload->py.', "pmz":'.$point->pload->pmz.'}';
			$points .= '}';
			$points .= ($iter1 != count($this->xml->points->point)-1) ? ',' : '';
			$iter1++;
		}
			
		$points .= ']';
		
		return $points;
	}
	
	// nalozi XML elements v javascript spremenljivko - JSON
	public function elementsJs()
	{
		$elements = '[';
		
		//loop through elements
		$iter1 = 0;
		foreach ($this->xml->elements->element as $element) {
			$elements .= '{"id":'.$iter1.', "E":'.$element->E.', "A":'.$element->A.', "Iz":'.$element->Iz.', "p1":'.$element->p1.', "p2":'.$element->p2.', "dof":[';
			//loop through dofs
			$iter2 = 0;
			foreach ($element->dofs->dof as $dofId => $dof) {
				$elements .= '{"id":'.$dof['id'].', "exist":'.$dof->exist.'}';
				$elements .= ($iter2 != count($element->dofs->dof)-1) ? ',' : '';
				$iter2++;
			}
			$elements .= '], "eload":{"linx":'.$element->eload->linx.', "liny":'.$element->eload->liny.'}';
			$elements .= '}';
			$elements .= ($iter1 != count($this->xml->elements->element)-1) ? ',' : '';
			$iter1++;
		}
			
		$elements .= ']';
		
		return $elements;
	}
	
	// nalozi XML results points v javascript spremenljivko - JSON
	public function resPoiJs()
	{
		$points = '[';
		
		//loop through points
		$iter1 = 0;
		foreach ($this->xml->points->point as $point) {
			$points .= '{"react":[';
			//loop through reaction dofs
			$iter2 = 0;
			foreach ($point->reactions->dof as $dofId => $dof) {
				$points .= '{"id":'.$dof['id'].', "value":'.$dof.'}';
				$points .= ($iter2 != count($point->reactions->dof)-1) ? ',' : '';
				$iter2++;
			}
			$points .= '], "disp":[';
			//loop through displacement dofs
			$iter3 = 0;
			foreach ($point->displacements->dof as $dofId => $dof) {
				$points .= '{"id":'.$dof['id'].', "value":'.$dof.'}';
				$points .= ($iter3 != count($point->reactions->dof)-1) ? ',' : '';
				$iter3++;
			}
			$points .= ']}';
			$points .= ($iter1 != count($this->xml->points->point)-1) ? ',' : '';
			$iter1++;
		}
			
		$points .= ']';
		
		return $points;
	}
	
	// nalozi XML results elements v javascript spremenljivko - JSON
	public function resElmJs()
	{
		$elements = '[';
		
		//loop through points
		$iter1 = 0;
		foreach ($this->xml->elements->element as $element) {
			$elements .= '{"forces":[';
			//loop through reaction dofs
			$iter2 = 0;
			foreach ($element->forces->dof as $dofId => $dof) {
				$elements .= '{"id":'.$dof['id'].', "value":'.$dof.'}';
				$elements .= ($iter2 != count($element->forces->dof)-1) ? ',' : '';
				$iter2++;
			}
			$elements .= '], "disp":[';
			//loop through displacement dofs
			$iter3 = 0;
			foreach ($element->displacements->dof as $dofId => $dof) {
				$elements .= '{"id":'.$dof['id'].', "value":'.$dof.'}';
				$elements .= ($iter3 != count($element->displacements->dof)-1) ? ',' : '';
				$iter3++;
			}
			$elements .= ']}';
			$elements .= ($iter1 != count($this->xml->elements->element)-1) ? ',' : '';
			$iter1++;
		}
			
		$elements .= ']';
		
		return $elements;
	}
	
	// nalozi generici XML v javascript spremenljivko - JSON
	public function genericJs($element, $elmName)
	{	
		$current = (isset($element)) ? $element : $this->xml;
		$curName = (isset($elmName)) ? $elmName : '';
		
		$string .= $curName.'{';
		
		$iter = 0;
		for($current->rewind(); $current->valid(); $current->next()) {
			if ($current->hasChildren()) {
				$string .= $this->genericJs($current->getChildren(), '"'.$current->key().'":');
			} else {
				$string .= '"'.$current->key().'":'.(string)$current->current();
			}
			$string .= ($iter != count($current)-1) ? ',' : '';
			$iter++;
		}
		
		$string .= '}';
		
		return $string;
	}
	
	//---------------------------------------- MISC ----------------------------------------//
	
	// vrze XML datoteko v stringu
	public function dataPhp()
	{
		return $this->xml->asXML();
	}
	
	// shrani Xml data v file
	public function SaveData($save_path = "data.xml")
	{
		$this->xml->saveXML($save_path);
	}
}
?>
