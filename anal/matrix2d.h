#include <cmath>

#ifndef MATRIX2D_H
#define MATRIX2D_H

template <typename T>
class Matrix2D
{
public:
	Matrix2D(int lM = 1, int lN = 1);
	Matrix2D(const Matrix2D<T>& lMatrix);
	~Matrix2D();

	void setElement(int lM, int lN, T value);
	void setM(int lM);
	void setN(int lN);
	T getElement(int lM, int lN) const;
	int getM() const;
	int getN() const;
	void resize(int lM, int lN);

	Matrix2D<T> inverse();
	Matrix2D<T> transpose();
	Matrix2D<T> solveLU(Matrix2D<T>& lMatrix);
	T abs(const T temp) const;

	T* operator[](int lM) const;
	const Matrix2D<T> operator+(const Matrix2D<T>& lMatrix) const;
	const Matrix2D<T> operator-(const Matrix2D<T>& lMatrix) const;
	const Matrix2D<T> operator*(const Matrix2D<T>& lMatrix) const;
	const Matrix2D<T> operator*(const T scalar) const;
	Matrix2D<T>& operator+=(const Matrix2D<T>& lMatrix);
	Matrix2D<T>& operator-=(const Matrix2D<T>& lMatrix);
	Matrix2D<T>& operator*=(const Matrix2D<T>& lMatrix);
	Matrix2D<T>& operator=(const Matrix2D<T>& lMatrix);
	const Matrix2D<T> operator-() const;

private:
	T** matrix;
	int m;
	int n;
	
protected:
};

template <typename T>
Matrix2D<T>::Matrix2D(int lM, int lN)
{
	m = lM;
	n = lN;

	matrix = new T*[m];
	for (int i=0; i<m; i++)
		matrix[i] = new T[n];

	for (int i=0; i<m; i++)
		for (int j=0; j<n; j++)
			matrix[i][j] = 0;
}

template <typename T>
Matrix2D<T>::Matrix2D(const Matrix2D<T>& lMatrix)
{
	m = lMatrix.getM();
	n = lMatrix.getN();

	matrix = new T*[m];
	for (int i=0; i<m; i++)
		matrix[i] = new T[n];
	
	for (int i=0; i<m; i++)
		for (int j=0; j<n; j++)
			matrix[i][j] = lMatrix[i][j];
}

template <typename T>
Matrix2D<T>::~Matrix2D()
{
	for (int i=0; i<m; i++)
		delete[] matrix[i];

	delete[] matrix;
}

template <typename T>
void Matrix2D<T>::setElement(int lM, int lN, T value)
{
	matrix[lM][lN] = value;
}
template <typename T>
void Matrix2D<T>::setM(int lM)
{
	m = lM;
}

template <typename T>
void Matrix2D<T>::setN(int lN)
{
	n = lN;
}

template <typename T>
T Matrix2D<T>::getElement(int lM, int lN) const
{
	return matrix[lM][lN];
}

template <typename T>
int Matrix2D<T>::getM() const
{
	return m;
}

template <typename T>
int Matrix2D<T>::getN() const
{
	return n;
}

template <typename T>
void  Matrix2D<T>::resize(int lM, int lN)
{
	for (int i=0; i<m; i++)
		delete[] matrix[i];

	delete[] matrix;

	m = lM;
	n = lN;

	matrix = new T*[m];
	for (int i=0; i<m; i++)
		matrix[i] = new T[n];

	for (int i=0; i<m; i++)
		for (int j=0; j<n; j++)
			matrix[i][j] = 0;
}

template <typename T>
Matrix2D<T> Matrix2D<T>::inverse()
{
	Matrix2D<T> retMatrix(n, n);
	Matrix2D<T> tempMatrix(n, 2*n);

	for (int i=0; i<n; i++){
		for (int j = 0; j < 2*n; j++) {
			if (j<n)
				tempMatrix[i][j] = matrix[i][j];
			else if (i==(j-n))
				tempMatrix[i][j] = 1.0;
			else
				tempMatrix[i][j] = 0.0;
		}
	}

	for (int i=0; i<n; i++)
		for (int j=0; j<n; j++)
			if (i!=j) {
				double ratio = tempMatrix[j][i]/tempMatrix[i][i];
				for (int k=0; k<2*n; k++)
					tempMatrix[j][k] -= ratio * tempMatrix[i][k];
			}

	for (int i=0; i<n; i++)
		for (int j=2*n-1; j>=0; j--)
			tempMatrix[i][j] /= tempMatrix[i][i];

	for (int i=0; i<n; i++)
		for (int j=0; j<n; j++)
			retMatrix[i][j] = tempMatrix[i][j+n];

	return retMatrix;
}

template <typename T>
Matrix2D<T> Matrix2D<T>::transpose()
{
	Matrix2D<T> retMatrix(n, m);

	for (int i=0; i<n; i++)
		for (int j=0; j<m; j++)
			retMatrix[i][j] = matrix[j][i];

	return retMatrix;
}

template <typename T>
Matrix2D<T> Matrix2D<T>::solveLU(Matrix2D<T>& lMatrix)
{
	
	// solves Ax=b; A=LU => LUx=b; Ux=y => Ly=b
	Matrix2D<T> L(n,n);
	Matrix2D<T> U(n,n);
	Matrix2D<T> x(n,1);
	Matrix2D<T> y(n,1);

	if (m == n)
	{
		//permutation matrix generation
		Matrix2D<int> ind(n,1);

		for (int i=0 ; i<n; i++)
			ind[i][0] = i;

		for (int p=1 ; p<n; p++) {
			for (int i=p; i<n; i++) {
				if (abs(matrix[ind[i][0]][p-1]) > abs(matrix[ind[p-1][0]][p-1])) {
					int t = ind[p-1][0];
					ind[p-1][0] = ind[i][0];
					ind[i][0] = t;
				}
			}

			/*if (matrix[ind[p-1][0]][p-1] == 0)
				return false;*/
		}
		 
		// get U and L from A
		for (int i=0; i<n; i++) {
			for (int j=0; j<n; j++) {
				// set diagonal L to 1
				if (i == j) {
					L[i][j] = 1;
				}

				// set other L elements
				if (i > j) {
					L[i][j] = matrix[ind[i][0]][j];
					for (int k=0; k<j; k++)
						L[i][j] -= L[i][k] * U[k][j];
					L[i][j] = L[i][j]/U[j][j];
				}

				// set U elements
				if (i <= j) {
					U[i][j] = matrix[ind[i][0]][j];
					for (int k=0; k<i; k++)
						U[i][j] -= L[i][k] * U[k][j];
				}
			}
		}

		// get y from Ly=b
		for (int i=0; i<n; i++) {
			y[i][0] = lMatrix[ind[i][0]][0];
			for (int j=0; j<i; j++) {
				y[i][0] -= L[i][j] * y[j][0];
			}
		}

		// get x from Ux=y
		for (int i=(n-1); i>=0; i--) {
			x[i][0] = y[i][0];
			for (int j=i+1; j<n; j++) {
				x[i][0] -= U[i][j] * x[j][0];
			}
			x[i][0] = x[i][0]/U[i][i];
		}
	}

	return x;
}

template <typename T>
T Matrix2D<T>::abs(const T temp) const
{
	if (temp < 0) {
		return -temp;
	}
	return temp;
}

template <typename T>
T* Matrix2D<T>::operator[](int lM) const
{
	return matrix[lM];
}

template <typename T>
const Matrix2D<T> Matrix2D<T>::operator+(const Matrix2D<T>& lMatrix) const
{
	Matrix2D<T> retMatrix(*this);
	retMatrix += lMatrix;
	return retMatrix;
}

template <typename T>
const Matrix2D<T> Matrix2D<T>::operator-(const Matrix2D<T>& lMatrix) const
{
	Matrix2D<T> retMatrix(*this);
	retMatrix -= lMatrix;
	return retMatrix;
}

template <typename T>
const Matrix2D<T> Matrix2D<T>::operator*(const Matrix2D<T>& lMatrix) const
{
	Matrix2D<T> retMatrix(*this);
	retMatrix *= lMatrix;
	return retMatrix;
}

template <typename T>
const Matrix2D<T> Matrix2D<T>::operator*(const T scalar) const
{
	Matrix2D<T> retMatrix(*this);

	for (int i=0; i<m; i++)
		for (int j=0; j<n; j++)
			retMatrix[i][j] *= scalar;

	return retMatrix;
}

template <typename T>
Matrix2D<T>& Matrix2D<T>::operator+=(const Matrix2D<T>& lMatrix)
{
	for (int i=0; i<m; i++)
		for (int j=0; j<n; j++)
			matrix[i][j] = matrix[i][j] + lMatrix[i][j];

	return *this;
}

template <typename T>
Matrix2D<T>& Matrix2D<T>::operator-=(const Matrix2D<T>& lMatrix)
{
	for (int i=0; i<m; i++)
		for (int j=0; j<n; j++)
			matrix[i][j] = matrix[i][j] - lMatrix[i][j];

	return *this;
}

template <typename T>
Matrix2D<T>& Matrix2D<T>::operator*=(const Matrix2D<T>& lMatrix)
{
	Matrix2D<T> retMatrix(m, lMatrix.getN());

	for (int i=0; i<m; i++)
		for (int j=0; j<lMatrix.getN(); j++)
			for (int k=0; k<n; k++)
				retMatrix[i][j] += matrix[i][k] * lMatrix[k][j];

	resize(m, lMatrix.getN());

	for (int i=0; i<m; i++)
		for (int j=0; j<lMatrix.getN(); j++)
			matrix[i][j] = retMatrix[i][j];

	return *this;
}

template <typename T>
Matrix2D<T>& Matrix2D<T>::operator=(const Matrix2D<T>& lMatrix)
{
	resize(lMatrix.getM(), lMatrix.getN());

	for (int i=0; i<m; i++)
		for (int j=0; j<n; j++)
			matrix[i][j] = lMatrix[i][j];

	return *this;
}

template <typename T>
const Matrix2D<T> Matrix2D<T>::operator-() const
{
	Matrix2D<T> retMatrix(m, n);

	for (int i=0; i<m; i++)
		for (int j=0; j<n; j++)
			retMatrix[i][j] = -matrix[i][j];

	return retMatrix;
}

#endif
