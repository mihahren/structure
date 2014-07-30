#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

#include <cmath>
#include "data.h"
#include "matrix2d.h"

#ifndef FINITE_ELEMENT_H
#define FINITE_ELEMENT_H

class FiniteElement
{
public:
	FiniteElement(element* elem = nullptr);		//constructor, takes element structure in data.h
	~FiniteElement();							//destructor, destroys dynamic memory

	void setStiff();							//set default stiffness matrix - local uncondensed
	void setLoad();								//set default load matrix - local uncondensed
	void setTrans();							//set default transformation matrix - local-to-global uncondensed

	Matrix2D<double> getStiffLoc();				//get local stiffness
	Matrix2D<double> getLoadLoc();				//get local load
	Matrix2D<double> getTrans();				//get transformation matrix
	Matrix2D<double> getStiffGlob();			//get global stiffness - condensed
	Matrix2D<double> getLoadGlob();				//get global load

	Matrix2D<double> disp(Matrix2D<double>& dispVect, bool incLoadDisp);		//set displacement matrix 6x1
	Matrix2D<double> force(Matrix2D<double>& dispVect);							//set default force matrix 6x1
	Matrix2D<double> linCoef();													//set default force matrix 6x1

private:
	double E;						// elastic modulus
	double A;						// cross section area
	double Iz;						// section inertia
	double L;						// element length
	double arc;						// element arc
	double alpha;					// node 0 global arc
	double beta;					// node 1 global arc
	double p;						// p load in x axis
	double q;						// q load in y axis

	int nrr;						// condensed matrix size
	int* indR;						// restrained DOFs local 
	int* ind0;						// unrestrained DOFs local 
	int* indRglob;					// restrained DOFs global
	int ind[6];						// all DOFs global

	Matrix2D<double> kMatrix;		// stiffness matrix
	Matrix2D<double> lMatrix;		// load matrix
	Matrix2D<double> tMatrix;		// transform matrix

	Matrix2D<double> krr;			// stiffness matrix of available DOFs
	Matrix2D<double> kr0;			// stiffness matrix of available/unavailable DOFs
	Matrix2D<double> k0r;			// stiffness matrix of unavailable/available DOFs
	Matrix2D<double> k00;			// stiffness matrix of unavailable DOFs

protected:
};

#endif
