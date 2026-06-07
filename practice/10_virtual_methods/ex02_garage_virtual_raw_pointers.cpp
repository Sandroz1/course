// Как работать с задачей:
// 1. Откройте сайт курса в браузере.
// 2. Найдите эту задачу на сайте.
// 3. Напишите код ниже вместо TODO.
// 4. Запустите этот файл локально в Visual Studio или другим C++17 компилятором.

// Упражнение. Гараж 1: Vehicle, Car, Bus
// Тема: виртуальные методы через базовый указатель.
//
// Что нужно сделать:
// 1. Создать class Vehicle.
// 2. Добавить virtual void printInfo() const.
// 3. Добавить virtual destructor.
// 4. Создать class Car : public Vehicle.
// 5. Создать class Bus : public Vehicle.
// 6. В Car и Bus переопределить printInfo() через override.
// 7. В main создать несколько объектов Car и Bus.
// 8. Создать vector<Vehicle*> garage.
// 9. Добавить адреса объектов в garage.
// 10. Пройти циклом по garage и вызвать printInfo().
//
// Важно:
// - vector<Vehicle*> здесь не владеет объектами, а только ссылается на них;
// - не вызывайте delete для объектов, созданных как обычные переменные в main;
// - smart pointers появятся в следующей теме, пока цель — увидеть virtual dispatch.
//
// Напишите решение ниже.
// Не смотрите в solutions до самостоятельной попытки.

#include <iostream>
#include <string>
#include <vector>

using namespace std;

class Vehicle {
public:
    virtual void printInfo() const;
    virtual ~Vehicle() = default;
};

class Car : public Vehicle {
private:
    string model;
    int year;
    int power;

public:
    Car(string model, int year, int power);
    void printInfo() const override;
};

class Bus : public Vehicle {
private:
    string model;
    int seats;

public:
    Bus(string model, int seats);
    void printInfo() const override;
};

int main() {
    // TODO: создайте объекты Car и Bus
    // TODO: создайте vector<Vehicle*> garage
    // TODO: добавьте адреса объектов в garage
    // TODO: вызовите printInfo() для каждого Vehicle* в garage

    return 0;
}
