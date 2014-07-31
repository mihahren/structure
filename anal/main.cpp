#include <iostream>
#include "data.h"
#include "matrix2d.h"
#include "finite_element.h"
#include "xml_io.h"

void staticAnalysis(char* lInStr, char* lOutStr)
{
	//get information from xml
	XmlReader xml(lInStr);				//input.xml
	int poiNumb = xml.getPoiNumb();		//number of points
	int elmNumb = xml.getElmNumb();		//number of elements
	point* poi = xml.getPoints();		//save point data
	element* elm = xml.getElements();	//save element data

	/*------------------------------- SET GLOBAL MATRICES -------------------------------*/

	//declare global variables
	int dof = 3*poiNumb;		//number of available DOFs

	//declare global matrices
	Matrix2D<double> gStiffMatrix(dof, dof);		//global stiffness matrix
	Matrix2D<double> gLoadMatrix(dof, 1);			//global load matrix
	Matrix2D<double> gDispMatrix(dof, 1);			//global displacement matrix
	Matrix2D<double> gReactMatrix(dof, 1);			//global reaction matrix

	//set finite element array
	FiniteElement** fElm = new FiniteElement*[elmNumb];

	// loop through elements - set global stiffness and load matrix
	for (int e=0; e<elmNumb; e++) {
		fElm[e] = new FiniteElement(&elm[e]);	//finite element object for current element
		int indDof[6];					//global indexes for available degrees
		Matrix2D<double> stiffElm;		//stiffness matrix for element
		Matrix2D<double> loadElm;		//load matrix for element

		//set global available DOFs (6 x 1)
		for (int i=0; i<6; i++) {
			if (i < 3) {
				indDof[i] = elm[e].node[0]->dof[i].dId;		//global DOFs 1-3
			} else {
				indDof[i] = elm[e].node[1]->dof[i-3].dId;	//global DOFs 4-6
			}
		}
			
		stiffElm = fElm[e]->getStiffGlob();		//get condensed stifness matrix (6 x 6) in global coordinates
		loadElm = fElm[e]->getLoadGlob();		//get load matrix (6 x 1) in global coordinates

		//set global stiffness and load matrix
		for (int i=0; i<6; i++) {
			for (int j=0; j<6; j++)	{
				gStiffMatrix[indDof[i]][indDof[j]] += stiffElm[i][j];
			}
			gLoadMatrix[indDof[i]][0] += loadElm[i][0];
		}
	}

	// loop through points - add point loads to load matrix
	for (int p=0; p<poiNumb; p++) {
		// set point loads in global
		gLoadMatrix[poi[p].dof[0].dId][0] += poi[p].pLoad.pX;
		gLoadMatrix[poi[p].dof[1].dId][0] += poi[p].pLoad.pY;
		gLoadMatrix[poi[p].dof[2].dId][0] += poi[p].pLoad.pMz;
		// set known displacements in global
		/*for (int i=0; i<3; i++) {
			if (poi[p].dof[i].rest)
				gDispMatrix[poi[p].dof[i].dId][0] = 0;
		}*/
	}

	/*--------------------------------CALCULATE GLOBAL DISPLACEMENTS -------------------------------*/

	//declare indexing variables
	int nn = 0;					//unrestrained existing DOFs iterator
	int zz = 0;					//restrained existing DOFs iterator
	int iKnn = 0;				//iterator for unrestrained stiffness matrix indexes
	int iKzz = 0;				//iterator for restrained stiffness matrix indexes

	// count indexes from unrestrained and restrained degrees
	for (int p=0; p<poiNumb; p++) {
		for (int d=0; d<3; d++) {
			if (gStiffMatrix[poi[p].dof[d].dId][poi[p].dof[d].dId] != 0 && !poi[p].dof[d].rest) {
				nn++;
			}
			if (poi[p].dof[d].rest) zz++;
		}
	}

	//declare matrices
	int* indKnn = new int[nn];		//indexes for unrestrained stiffness matrix
	int* indKzz = new int[zz];		//indexes for restrained stiffness matrix 
	Matrix2D<double> knn(nn, nn);	//unrestrained stiffness matrix
	Matrix2D<double> kzn(zz, nn);	//restrained/unrestrained stiffness matrix
	Matrix2D<double> Fn(nn, 1);		//unrestrained load
	Matrix2D<double> Fz(zz, 1);		//restrained load
	Matrix2D<double> un(nn, 1);		//unrestrained nodes - global dispalcement
	Matrix2D<double> Rz(zz, 1);		//restrained nodes - global reactions

	//set index matrices 
	for (int p=0; p<poiNumb; p++) {
		for (int d=0; d<3; d++) {
			if (gStiffMatrix[poi[p].dof[d].dId][poi[p].dof[d].dId] != 0 && !poi[p].dof[d].rest) {
				indKnn[iKnn++] = poi[p].dof[d].dId;
			}
			if (poi[p].dof[d].rest) indKzz[iKzz++] = poi[p].dof[d].dId;
		}
	}

	//set knn and Fn
	for (int i=0; i<nn; i++) {
		Fn[i][0] = gLoadMatrix[indKnn[i]][0];
		for (int j=0; j<nn; j++) {
			knn[i][j] = gStiffMatrix[indKnn[i]][indKnn[j]];
		}
	}

	//set kzn and Fz
	for (int i=0; i<zz; i++) {
		Fz[i][0] = gLoadMatrix[indKzz[i]][0];
		for (int j=0; j<nn; j++) {
			kzn[i][j] = gStiffMatrix[indKzz[i]][indKnn[j]];
		}
	}

	//solve un and get Rz
	un = knn.solveLU(Fn);
	Rz = kzn * un - Fz;

	//add global displacements together
	for (int i=0; i<nn; i++)
		gDispMatrix[indKnn[i]][0] = un[i][0];

	//add global reactions together
	for (int i=0; i<zz; i++)
		gReactMatrix[indKzz[i]][0] = Rz[i][0];

	/*--------------------------------ELEMENT FORCES AND DISPLACEMENTS -------------------------------*/

	//set local element forces and dispalcements
	Matrix2D<double> lElmLoadMat(elmNumb, 6);		//local element end-forces
	Matrix2D<double> lElmDispMat(elmNumb, 6);		//local element internal displacements

	//Matrix2D<double> nx(elmNumb, elm[0].n+1);		//nx element internal forces
	//Matrix2D<double> ny(elmNumb, elm[0].n+1);		//ny element internal forces
	//Matrix2D<double> mz(elmNumb, elm[0].n+1);		//mz element internal forces

	//Matrix2D<double> enx(elmNumb, 2);			//nx element internal forces - extreme
	//Matrix2D<double> eny(elmNumb, 2);			//ny element internal forces - extreme
	//Matrix2D<double> emz(elmNumb, 2);			//mz element internal forces - extreme


	//loop through elements - set all displacements and loads in local elements
	for (int e=0; e<elmNumb; e++) {
		Matrix2D<double> dElmTempMat;
		Matrix2D<double> fElmTempMat;
		//Matrix2D<double> lNx, lNy, lMz, elNx, elNy, elMz;

		dElmTempMat = fElm[e]->disp(gDispMatrix, false);	//get displacements without subtracted external forces
		
		fElmTempMat = fElm[e]->force(dElmTempMat);			//get forces
		
		dElmTempMat = fElm[e]->disp(gDispMatrix, true);		//get displacements with subtracted external forces

		for (int i=0; i<6; i++) {
			lElmDispMat[e][i] = dElmTempMat[i][0];
			lElmLoadMat[e][i] = fElmTempMat[i][0];
		}

		/*-----------------------------

		lNx = fElm[e]->nxMat(fElmTempMat);
		lNy = fElm[e]->nyMat(fElmTempMat);
		lMz = fElm[e]->mzMat(fElmTempMat);

		elNx = fElm[e]->eNxMat(fElmTempMat);
		elNy = fElm[e]->eNyMat(fElmTempMat);
		elMz = fElm[e]->eMzMat(fElmTempMat);

		for (int i=0; i<=elm[0].n; i++) {
			nx[e][i] = lNx[i][0];
			ny[e][i] = lNy[i][0];
			mz[e][i] = lMz[i][0];

			if (i<2) {
				enx[e][i] = elNx[i][0];
				eny[e][i] = elNy[i][0];
				emz[e][i] = elMz[i][0];
			}
		}
		
		-----------------------------*/
	}

	//write results to XML
	XmlWriter xmlWr;
	xmlWr.setPoints(gReactMatrix, gDispMatrix, poiNumb);
	xmlWr.setElements(lElmLoadMat, lElmDispMat, elmNumb);
	xmlWr.writeFile(lOutStr);
	xmlWr.printFile();

	//collect garbage
	for (int e=0; e<elmNumb; e++)
		delete fElm[e];
	delete[] fElm;
	delete[] indKnn;
	delete[] indKzz;
}

int main(int argc, char* argv[])
{
	/*staticAnalysis("D:/Documents/Projekti/Programiranje/Eclipse/structure/anal/str.xml", "D:/Documents/Projekti/Programiranje/Eclipse/structure/anal/res.xml");
	return 1;*/
	
	if (argc != 3) {
		std::cout << "Program sprejme natanko 2 parametra, input file in output file!" << std::endl;
		return 0;
	} else {
		staticAnalysis(argv[1], argv[2]);
		return 1;
	}
}
