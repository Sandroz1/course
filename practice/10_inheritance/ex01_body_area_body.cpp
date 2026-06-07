// Как работать с задачей:
// 1. Откройте сайт курса в браузере.
// 2. Найдите эту задачу на сайте.
// 3. Напишите код ниже вместо TODO.
// 4. Запустите этот файл локально в Visual Studio или другим C++17 компилятором.

// Упражнение. Body и AreaBody
// Тема: наследование, public/protected/private.
//
// Что нужно сделать:
// 1. Создать class Body.
// 2. Добавить private-поля: width, height, depth, mass.
// 3. Написать конструктор Body.
// 4. Добавить public-метод printBodyInfo().
// 5. Добавить protected-метод getVolume(), если нужен объём для наследника.
// 6. Создать class AreaBody : public Body.
// 7. Добавить private-поля координат x и y.
// 8. Написать конструктор AreaBody и вызвать конструктор Body.
// 9. Добавить метод printAreaInfo(), который выводит данные Body и координаты.
// 10. В main создать Body и AreaBody, затем проверить вывод.
//
// Важно:
// - не забывайте public при наследовании;
// - не обращайтесь к private-полям Body напрямую из AreaBody;
// - не дублируйте поля Body в AreaBody;
// - в этой задаче не нужны virtual, smart pointers, abstract classes и interfaces.
//
// Напишите решение ниже.
// Не смотрите в solutions до самостоятельной попытки.

#include <iostream>

using namespace std;

class Body {
private:
    double width;
    double height;
    double depth;
    double mass;

protected:
    double getVolume() const;

public:
    Body(double width, double height, double depth, double mass);
    void printBodyInfo() const;
};

class AreaBody : public Body {
private:
    double x;
    double y;

public:
    AreaBody(double width, double height, double depth, double mass, double x, double y);
    void printAreaInfo() const;
};

int main() {
    // TODO: создайте объект Body и вызовите printBodyInfo()
    // TODO: создайте объект AreaBody
    // TODO: вызовите printBodyInfo() у AreaBody
    // TODO: вызовите printAreaInfo() у AreaBody

    return 0;
}
