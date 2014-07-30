#include <iostream>
#include "xml_io.h"

XmlReader::XmlReader(const char* string)
{
	//create document and allocate space
	doc = new XMLDocument();
	doc->LoadFile(string);

	XMLElement* points = doc->FirstChildElement("structure")->FirstChildElement("points");
	XMLElement* elements = doc->FirstChildElement("structure")->FirstChildElement("elements");

	pn = points->IntAttribute("n");
	en = elements->IntAttribute("n");;

	p = new point[pn];
	e = new element[en];

	//loop through points
	XMLElement* poi = points->FirstChildElement("point");

	for (int i=0; i<pn; i++) {
		poi->QueryIntAttribute("id", &p[i].pId);
		poi->FirstChildElement("angle")->QueryDoubleText(&p[i].angle);
		poi->FirstChildElement("x")->QueryDoubleText(&p[i].x);
		poi->FirstChildElement("y")->QueryDoubleText(&p[i].y);

		XMLElement* dof = poi->FirstChildElement("dofs")->FirstChildElement("dof");
		for (int j=0; j<3; j++) {
			dof->QueryIntAttribute("id", &p[i].dof[j].dId);
			dof->FirstChildElement("rest")->QueryBoolText(&p[i].dof[j].rest);

			dof = dof->NextSiblingElement("dof");
		}

		poi->FirstChildElement("pload")->FirstChildElement("px")->QueryDoubleText(&p[i].pLoad.pX);
		poi->FirstChildElement("pload")->FirstChildElement("py")->QueryDoubleText(&p[i].pLoad.pY);
		poi->FirstChildElement("pload")->FirstChildElement("pmz")->QueryDoubleText(&p[i].pLoad.pMz);

		poi = poi->NextSiblingElement("point");
	}

	//loop through elements
	XMLElement* elm = elements->FirstChildElement("element");

	for (int i=0; i<en; i++) {
		elm->QueryIntAttribute("id", &e[i].eId);
		elm->FirstChildElement("E")->QueryDoubleText(&e[i].E);
		elm->FirstChildElement("A")->QueryDoubleText(&e[i].A);
		elm->FirstChildElement("Iz")->QueryDoubleText(&e[i].Iz);

		int t0, t1;
		elm->FirstChildElement("p1")->QueryIntText(&t0);
		elm->FirstChildElement("p2")->QueryIntText(&t1);
		e[i].node[0] = &p[t0];
		e[i].node[1] = &p[t1];

		XMLElement* dof = elm->FirstChildElement("dofs")->FirstChildElement("dof");
		for (int j=0; j<6; j++) {
			dof->QueryIntAttribute("id", &e[i].dof[j].dId);
			dof->FirstChildElement("exist")->QueryBoolText(&e[i].dof[j].exist);

			dof = dof->NextSiblingElement("dof");
		}

		elm->FirstChildElement("eload")->FirstChildElement("linx")->QueryDoubleText(&e[i].eLoad.linX);
		elm->FirstChildElement("eload")->FirstChildElement("liny")->QueryDoubleText(&e[i].eLoad.linY);

		elm = elm->NextSiblingElement("element");
	}
}

XmlReader::~XmlReader()
{
	delete doc;
	delete[] p;
	delete[] e;
}

point* XmlReader::getPoints()
{
	return p;
}

element* XmlReader::getElements()
{
	return e;
}

int XmlReader::getPoiNumb()
{
	return pn;
}

int XmlReader::getElmNumb()
{
	return en;
}

XmlWriter::XmlWriter()
{
	doc = new XMLDocument();
	XMLElement* currentPos;

	doc->InsertFirstChild(doc->NewElement("structure"));
	currentPos = doc->FirstChildElement("structure");

	currentPos->InsertFirstChild(doc->NewElement("points"));
	currentPos->InsertEndChild(doc->NewElement("elements"));
}

XmlWriter::~XmlWriter()
{
	delete doc;
}

void XmlWriter::setPoints(Matrix2D<double>& forceMat, Matrix2D<double>& dispMat, int pN)
{
	XMLElement* points;
	XMLElement* point;
	XMLElement* force;
	XMLElement* disp;
	XMLElement* fDof;
	XMLElement* dDof;
	char text[20];

	points = doc->FirstChildElement("structure")->FirstChildElement("points");

	points->InsertFirstChild(doc->NewElement("point"));
	point = points->FirstChildElement("point");

	//loop through points
	for (int i=0; i<pN; i++) {
		point->SetAttribute("id", i);

		point->InsertFirstChild(doc->NewElement("reactions"));
		force = point->FirstChildElement("reactions");
		force->InsertFirstChild(doc->NewElement("dof"));
		fDof = force->FirstChildElement("dof");

		point->InsertEndChild(doc->NewElement("displacements"));
		disp = point->FirstChildElement("displacements");
		disp->InsertFirstChild(doc->NewElement("dof"));
		dDof = disp->FirstChildElement("dof");

		for (int j=0; j<3; j++) {
			fDof->SetAttribute("id", 3*i+j);
			dDof->SetAttribute("id", 3*i+j);

			sprintf(text, "%.10f", forceMat[3*i+j][0]);
			fDof->InsertFirstChild(doc->NewText(text));

			sprintf(text, "%.10f", dispMat[3*i+j][0]);
			dDof->InsertFirstChild(doc->NewText(text));

			if (j<2) {
				force->InsertAfterChild(fDof, doc->NewElement("dof"));
				disp->InsertAfterChild(dDof, doc->NewElement("dof"));
				fDof = fDof->NextSiblingElement("dof");
				dDof = dDof->NextSiblingElement("dof");
			}
		}

		if (i<pN-1) {
			points->InsertAfterChild(point, doc->NewElement("point"));
			point = point->NextSiblingElement("point");
		}
	}
}

void XmlWriter::setElements(Matrix2D<double>& forceMat, Matrix2D<double>& dispMat, int eN)
{
	XMLElement* elements;
	XMLElement* element;
	XMLElement* force;
	XMLElement* disp;
	XMLElement* fDof;
	XMLElement* dDof;
	char text[20];

	elements = doc->FirstChildElement("structure")->FirstChildElement("elements");

	elements->InsertFirstChild(doc->NewElement("element"));
	element = elements->FirstChildElement("element");

	//loop through points
	for (int i=0; i<eN; i++) {
		element->SetAttribute("id", i);

		element->InsertFirstChild(doc->NewElement("forces"));
		force = element->FirstChildElement("forces");
		force->InsertFirstChild(doc->NewElement("dof"));
		fDof = force->FirstChildElement("dof");

		element->InsertEndChild(doc->NewElement("displacements"));
		disp = element->FirstChildElement("displacements");
		disp->InsertFirstChild(doc->NewElement("dof"));
		dDof = disp->FirstChildElement("dof");

		for (int j=0; j<6; j++) {
			fDof->SetAttribute("id", j);
			dDof->SetAttribute("id", j);

			sprintf(text, "%.10f", forceMat[i][j]);
			fDof->InsertFirstChild(doc->NewText(text));

			sprintf(text, "%.10f", dispMat[i][j]);
			dDof->InsertFirstChild(doc->NewText(text));

			if (j<5) {
				force->InsertAfterChild(fDof, doc->NewElement("dof"));
				disp->InsertAfterChild(dDof, doc->NewElement("dof"));
				fDof = fDof->NextSiblingElement("dof");
				dDof = dDof->NextSiblingElement("dof");
			}
		}

		if (i<eN-1) {
			elements->InsertAfterChild(element, doc->NewElement("element"));
			element = element->NextSiblingElement("element");
		}
	}
}

void XmlWriter::writeFile(const char* string)
{
	doc->SaveFile(string);

}

void XmlWriter::printFile()
{
	doc->Print();
}
	