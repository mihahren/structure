#include "finite_element.h"

FiniteElement::FiniteElement(element* lElement)
{
	E = lElement->E;
	A = lElement->A;
	Iz = lElement->Iz;

	L = sqrt(pow(lElement->node[1]->x - lElement->node[0]->x, 2) + pow(lElement->node[1]->y - lElement->node[0]->y, 2));

	//calculate arc
	if ((lElement->node[1]->y - lElement->node[0]->y) >= 0) {
		if ((lElement->node[1]->x - lElement->node[0]->x) >= 0) arc = asin((lElement->node[1]->y - lElement->node[0]->y)/L);
		else arc = -asin((lElement->node[1]->y - lElement->node[0]->y)/L) + M_PI;
	} else {
		if ((lElement->node[1]->x - lElement->node[0]->x) <= 0) arc = -asin((lElement->node[1]->y - lElement->node[0]->y)/L) + M_PI;
		else arc = asin((lElement->node[1]->y - lElement->node[0]->y)/L) + 2 * M_PI;
	}

	//global DOF rotation
	alpha = - lElement->node[0]->angle * M_PI / 180 ;
	beta = - lElement->node[1]->angle * M_PI / 180;

	//linear loads
	p = lElement->eLoad.linX;
	q = lElement->eLoad.linY;

	//set global index and local DOFs array
	nrr = 0;
	for (int i=0; i<6; i++)
		if (lElement->dof[i].exist) nrr++;
	
	int iterR = 0;
	int iter0 = 0;
	indR = new int[nrr];
	ind0 = new int[6-nrr];
	indRglob = new int[nrr];

	for (int i=0; i<6; i++) {
		if (i < 3) {
			ind[i] = lElement->node[0]->dof[i].dId;					//global DOFs
			if (lElement->dof[i].exist) {
				indRglob[iterR] = lElement->node[0]->dof[i].dId;	//global restrained DOFs
				indR[iterR++] = i;									//local restrained DOFs
			} else {
				ind0[iter0++] = i;									//local unrestrained DOFs
			}
		} else {
			ind[i] = lElement->node[1]->dof[i-3].dId;				//global DOFs
			if (lElement->dof[i].exist) {
				indRglob[iterR] = lElement->node[1]->dof[i-3].dId;	//global restrained DOFs
				indR[iterR++] = i;									//local restrained DOFs
			} else {
				ind0[iter0++] = i;									//local unrestrained DOFs
			}
		}
		
	}

	//prepare condension matrices
	krr.resize(nrr, nrr);
	kr0.resize(nrr, 6-nrr);
	k0r.resize(6-nrr, nrr);
	k00.resize(6-nrr, 6-nrr);

	//set stiffness matrix
	setStiff();

	//set load matrix
	setLoad();

	//set transform matrix
	setTrans();
}

FiniteElement::~FiniteElement()
{
	delete[] indR;
	delete[] ind0;
	delete[] indRglob;
}

void FiniteElement::setStiff()
{
	//stiffness matirx resize
	kMatrix.resize(6, 6);

	//stiffness matrix elements
	double k1 = (E * A)/L;
	double k2 = (12 * E * Iz)/pow(L, 3);
	double k3 = (6 * E * Iz)/pow(L, 2);
	double k4 = (4 * E * Iz)/L;
	double k5 = (2 * E * Iz)/L;

	//set specific parts of the stifness matrix
	kMatrix[0][0] = kMatrix[3][3] = k1;
	kMatrix[0][3] = kMatrix[3][0] = -k1;
	kMatrix[1][1] = kMatrix[4][4] = k2;
	kMatrix[1][4] = kMatrix[4][1] = -k2;
	kMatrix[1][2] = kMatrix[2][1] = kMatrix[1][5] = kMatrix[5][1] = k3;
	kMatrix[2][4] = kMatrix[4][2] = kMatrix[4][5] = kMatrix[5][4] = -k3;
	kMatrix[2][2] = kMatrix[5][5] = k4;
	kMatrix[2][5] = kMatrix[5][2] = k5;
}

void FiniteElement::setLoad()
{
	//load matirx resize
	lMatrix.resize(6, 1);

	//get {Ax, Ay, Ma, C1, C2, C3}
	Matrix2D<double> tempMatrix = linCoef();

	//set load in local coordinates
	lMatrix[0][0] = -tempMatrix[0][0];
	lMatrix[1][0] = -tempMatrix[1][0];
	lMatrix[2][0] = -tempMatrix[2][0];
	lMatrix[3][0] = p*L + tempMatrix[0][0];
	lMatrix[4][0] = q*L + tempMatrix[1][0];
	lMatrix[5][0] = -q*pow(L, 2)/2 - L*tempMatrix[1][0] + tempMatrix[2][0];
}

void FiniteElement::setTrans()
{
	//transform matirx resize
	tMatrix.resize(6, 6);

	//transform matrix elements
	double t1 = cos(arc + alpha);
	double t2 = sin(arc + alpha);
	double t3 = cos(arc + beta);
	double t4 = sin(arc + beta);
	double t5 = 1;

	//set specific parts of the transform matrix
	tMatrix[0][0] = tMatrix[1][1] = t1;
	tMatrix[0][1] = -t2;
	tMatrix[1][0] = t2;
	tMatrix[3][3] = tMatrix[4][4] = t3;
	tMatrix[3][4] = -t4;
	tMatrix[4][3] = t4;
	tMatrix[2][2] = tMatrix[5][5] = t5;
}

Matrix2D<double> FiniteElement::getStiffLoc()
{
	return kMatrix;
}

Matrix2D<double> FiniteElement::getLoadLoc()
{
	return lMatrix;
}

Matrix2D<double> FiniteElement::getTrans()
{
	return tMatrix;
}

Matrix2D<double> FiniteElement::getStiffGlob()
{
	Matrix2D<double> tempMatrix = tMatrix * kMatrix * tMatrix.transpose();
	Matrix2D<double> retMatrix(6, 6);

	if (nrr < 6)
	{
		for (int i=0; i<nrr; i++)
			for (int j=0; j<nrr; j++)
				krr[i][j] = tempMatrix[indR[i]][indR[j]];

		for (int i=0; i<nrr; i++)
			for (int j=0; j<(6-nrr); j++)
				kr0[i][j] = tempMatrix[indR[i]][ind0[j]];

		for (int i=0; i<(6-nrr); i++)
			for (int j=0; j<nrr; j++)
				k0r[i][j] = tempMatrix[ind0[i]][indR[j]];

		for (int i=0; i<(6-nrr); i++)
			for (int j=0; j<(6-nrr); j++)
				k00[i][j] = tempMatrix[ind0[i]][ind0[j]];

		//condense stiffness matrix
		tempMatrix = krr - kr0 * k00.inverse() * k0r;

		for (int i=0; i<nrr; i++)
			for (int j=0; j<nrr; j++)
				retMatrix[indR[i]][indR[j]] = tempMatrix[i][j];
	} 
	else
	{
		retMatrix = tempMatrix;
	}

	return retMatrix;
}

Matrix2D<double> FiniteElement::getLoadGlob()
{
	return tMatrix * lMatrix;
}

Matrix2D<double> FiniteElement::disp(Matrix2D<double>& dispVect, bool incLoadDisp)
{
	//initialize matrices
	Matrix2D<double> tempMatrix = linCoef();
	Matrix2D<double> retMatrix(6, 1);
	Matrix2D<double> ur(nrr, 1);
	Matrix2D<double> u0(6-nrr, 1);

	//get displacements from global
	for (int i=0; i<nrr; i++) {
		retMatrix[indR[i]][0] = dispVect[indRglob[i]][0];
	}

	//set ur from global displacement vector
	for (int i=0; i<nrr; i++) {
		ur[i][0] = retMatrix[indR[i]][0];
	}

	if(nrr < 6) {
		//set u0
		u0 = - k00.inverse() * k0r * ur;

		//add u0
		for (int i=0; i<(6-nrr); i++)
			retMatrix[ind0[i]][0] += u0[i][0];

		//translate to local coordinates
		retMatrix = tMatrix.transpose() * retMatrix;

		//add load displacements
		if (incLoadDisp == true) {
			for (int i=0; i<6; i++) {
				switch (i)
				{
				case 0:
					retMatrix[i][0] += tempMatrix[3][0];
					break;
				case 1:
					retMatrix[i][0] += tempMatrix[5][0];
					break;
				case 2:
					retMatrix[i][0] += tempMatrix[4][0];
					break;
				case 3:
					retMatrix[i][0] += -tempMatrix[0][0]*L/(E*A) + tempMatrix[3][0];
					break;
				case 4:
					retMatrix[i][0] += (1/(E*Iz))*(q*pow(L,4)/24 + tempMatrix[1][0]*pow(L,3)/6 - tempMatrix[2][0]*pow(L,2)) + tempMatrix[4][0]*L + tempMatrix[5][0];
					break;
				case 5:
					retMatrix[i][0] += (1/(E*Iz))*(q*pow(L,3)/6 + tempMatrix[1][0]*pow(L,2)/2 - tempMatrix[2][0]*L) + tempMatrix[4][0];
					break;
				}
			}
		}
	} else {
		retMatrix = tMatrix.transpose() * retMatrix;
	}

	return retMatrix;
}

Matrix2D<double> FiniteElement::force(Matrix2D<double>& lDispVect)
{
	//initialize matrices
	Matrix2D<double> retMatrix(6, 1);

	retMatrix = kMatrix * lDispVect;

	retMatrix -= lMatrix;

	return retMatrix;
}

Matrix2D<double> FiniteElement::linCoef()
{
	//set temp matrices
	Matrix2D<double> Ak(6, 6);
	Matrix2D<double> b(6, 1);
	Matrix2D<double> retMatrix;

	if (p != 0 || q != 0) {
		//set A and b matrices for restrained movement (u = 0)
		for (int i=0; i<nrr; i++) {
			switch (indR[i])
			{
			case 0:
				Ak[3][3] = cos(alpha);
				Ak[3][5] = -sin(alpha);
				b[3][0] = 0;
				break;
			case 1:
				Ak[4][3] = sin(alpha);
				Ak[4][5] = cos(alpha);
				b[4][0] = 0;
				break;
			case 2:
				Ak[5][4] = 1;
				b[5][0] = 0;
				break;
			case 3:
				Ak[0][0] = -L*cos(beta) / (E*A);
				Ak[0][1] = -pow(L, 3)*sin(beta) / (6*E*Iz);
				Ak[0][2] = pow(L, 2)*sin(beta) / (2*E*Iz);
				Ak[0][3] = cos(beta);
				Ak[0][4] = -L*sin(beta);
				Ak[0][5] = -sin(beta);
				b[0][0] = p*pow(L, 2)*cos(beta) / (2*E*A) + q*pow(L, 4)*sin(beta) / (24*E*Iz);
				break;
			case 4:
				Ak[1][0] = -L*sin(beta) / (E*A);
				Ak[1][1] = pow(L, 3)*cos(beta) / (6*E*Iz);
				Ak[1][2] = -pow(L, 2)*cos(beta) / (2*E*Iz);
				Ak[1][3] = sin(beta);
				Ak[1][4] = L*cos(beta);
				Ak[1][5] = cos(beta);
				b[1][0] = p*pow(L, 2)*sin(beta) / (2*E*A) - q*pow(L, 4)*cos(beta) / (24*E*Iz);
				break;
			case 5:
				Ak[2][1] = pow(L, 2) / (2*E*Iz);
				Ak[2][2] = -L/(E*Iz);
				Ak[2][4] = 1;
				b[2][0] = -q*pow(L, 3) / (6*E*Iz);
				break;
			}
		}

		//set A and b matrices for unavailable forces (N = 0)
		for (int i=0; i<6-nrr; i++) {
			switch (ind0[i])
			{
			case 0:
				Ak[3][0] = -cos(alpha);
				Ak[3][1] = sin(alpha);
				b[3][0] = 0;
				break;
			case 1:
				Ak[4][0] = -sin(alpha);
				Ak[4][1] = -cos(alpha);
				b[4][0] = 0;
				break;
			case 2:
				Ak[5][2] = -1;
				b[5][0] = 0;
				break;
			case 3:
				Ak[0][0] = -cos(beta);
				Ak[0][1] = sin(beta);
				b[0][0] = p*L*cos(beta) - q*L*sin(beta);
				break;
			case 4:
				Ak[1][0] = -sin(beta);
				Ak[1][1] = -cos(beta);
				b[1][0] = p*L*sin(beta) + q*L*cos(beta);
				break;
			case 5:
				Ak[2][1] = L;
				Ak[2][2] = -1;
				b[2][0] = -q*pow(L, 2) / 2;
				break;
			}
		}

		//returns {Ax, Ay, Ma, C1, C2, C3}
		retMatrix = Ak.solveLU(b);

		return retMatrix;
	} 
	else
	{
		retMatrix.resize(6, 1);
		return retMatrix;
	}
}

/*double FiniteElement::nx(Matrix2D<double>& locMat, double x)
{
	double ret  = - locMat[0][0];

	return ret;
}

double FiniteElement::ny(Matrix2D<double>& locMat, double x)
{
	double ret = -elm->eLoad.linY * x - locMat[1][0];;

	return ret;
}

double FiniteElement::mz(Matrix2D<double>& locMat, double x)
{
	double ret = elm->eLoad.linY * pow(x, 2)/2 + locMat[1][0] * x - locMat[2][0];

	return ret;
}

Matrix2D<double> FiniteElement::nxMat(Matrix2D<double>& locMat)
{
	int n = elm->n;
	Matrix2D<double> retMatrix(n+1, 1);

	for (int i=0; i<=n; i++) {
		retMatrix[i][0] = nx(locMat, i*L/n);
	}

	return retMatrix;
}

Matrix2D<double> FiniteElement::nyMat(Matrix2D<double>& locMat)
{
	int n = elm->n;
	Matrix2D<double> retMatrix(n+1, 1);

	for (int i=0; i<=n; i++) {
		retMatrix[i][0] = ny(locMat, i*L/n);
	}

	return retMatrix;
}

Matrix2D<double> FiniteElement::mzMat(Matrix2D<double>& locMat)
{
	int n = elm->n;
	Matrix2D<double> retMatrix(n+1, 1);

	for (int i=0; i<=n; i++) {
		retMatrix[i][0] = mz(locMat, i*L/n);
	}

	return retMatrix;
}

Matrix2D<double> FiniteElement::eNxMat(Matrix2D<double>& locMat)
{
	Matrix2D<double> retMatrix(2, 1);

	if (abs(nx(locMat, 0)) > abs(retMatrix[0][0])) {
		retMatrix[0][0] = nx(locMat, 0);;
		retMatrix[1][0] = 0;
	}
	
	return retMatrix;
}

Matrix2D<double> FiniteElement::eNyMat(Matrix2D<double>& locMat)
{
	Matrix2D<double> retMatrix(2, 1);

	if (abs(ny(locMat, 0)) > abs(retMatrix[0][0])) {
		retMatrix[0][0] = ny(locMat, 0);
		retMatrix[1][0] = 0;
	}

	if (abs(ny(locMat, L)) > abs(retMatrix[0][0])) {
		retMatrix[0][0] = ny(locMat, L);
		retMatrix[1][0] = L;
	}

	return retMatrix;
}

Matrix2D<double> FiniteElement::eMzMat(Matrix2D<double>& locMat)
{
	Matrix2D<double> retMatrix(2, 1);

	if (abs(mz(locMat, 0)) > abs(retMatrix[0][0])) {
		retMatrix[0][0] = mz(locMat, 0);
		retMatrix[1][0] = 0;
	}

	if (abs(mz(locMat, L)) > abs(retMatrix[0][0])) {
		retMatrix[0][0] = mz(locMat, L);
		retMatrix[1][0] = L;
	}

	if ((abs(mz(locMat, -locMat[1][0]/elm->eLoad.linY)) > abs(retMatrix[0][0])) && (-locMat[1][0]/elm->eLoad.linY > 0) && (-locMat[1][0]/elm->eLoad.linY < L)) {
		retMatrix[0][0] = mz(locMat, -locMat[1][0]/elm->eLoad.linY);
		retMatrix[1][0] = -locMat[1][0]/elm->eLoad.linY;
	}

	return retMatrix;
}

Matrix2D<int> FiniteElement::getIndLocR()
{
	return indLocR;
}

Matrix2D<int> FiniteElement::getIndLoc0()
{
	return indLoc0;
}

Matrix2D<int> FiniteElement::getIndR()
{
	return indR;
}

Matrix2D<int> FiniteElement::getInd0()
{
	return ind0;
}

Matrix2D<int> FiniteElement::getInd()
{
	return ind;
}

Matrix2D<double> FiniteElement::getTransCondStiff()
{
	return kctMatrix;
}


Matrix2D<double> FiniteElement::getTransCondLoad()
{
	return lctMatrix;
}

Matrix2D<double> FiniteElement::getTrans()
{
	return tMatrix;
}

Matrix2D<double> FiniteElement::getDisp()
{
	return dMatrix;
}

Matrix2D<double> FiniteElement::getForce()
{
	return fMatrix;
}

int FiniteElement::getNrr()
{
	return nrr;
}*/
