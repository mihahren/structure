#ifndef DATA_H
#define DATA_H

struct pload
{
	double pX;		// point load in X local axis
	double pY;		// point load in Y local axis
	double pMz;		// point moment around Z local axis
};

struct eload
{
	//double pX;		// point load in X local axis - middle
	//double pY;		// point load in Y local axis - middle
	//double pMz;	// point moment around Z local axis - middle
	double linX;		// linear load in X local axis
	double linY;		// linear load in Y local axis
};

struct degree
{
	int dId;		// degree coordinate
	bool exist;		// 0 = non existant, 1 = exists
	bool rest;		// 0 = free, 1 = restrained
};

struct point
{
	int pId;		// point ID
	double angle;	// arc displacement from global position
	double x;		// x coordinate
	double y;		// y coordinate
	degree dof[3];	// three degrees of freedom
	pload pLoad;	// point load
};

struct element
{
	int eId;		// element ID
	int n;			// section
	double E;		// elastic modulus
	double A;		// cross section area
	double Iz;		// section inertia
	point* node[2];	// first and second connecting point
	degree dof[6];	// six degrees of freedom
	eload eLoad;	// element load
};

#endif