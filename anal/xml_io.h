#include <stdio.h>
#include "tinyxml2.h"
#include "data.h"
#include "matrix2d.h"

#ifndef XML_IO_H
#define XML_IO_H

using namespace tinyxml2;

class XmlReader
{
public:
	XmlReader(const char* string);
	~XmlReader();

	point* getPoints();
	element* getElements();
	int getPoiNumb();
	int getElmNumb();

private:
	XMLDocument* doc;
	point* p;
	element* e;
	int pn, en;
};

class XmlWriter
{
public:
	XmlWriter();
	~XmlWriter();

	void setPoints(Matrix2D<double>& forceMat, Matrix2D<double>& dispMat, int pN);
	void setElements(Matrix2D<double>& forceMat, Matrix2D<double>& dispMat, int eN);
	void writeFile(const char* string);
	void printFile();

private:
	XMLDocument* doc;
};

#endif