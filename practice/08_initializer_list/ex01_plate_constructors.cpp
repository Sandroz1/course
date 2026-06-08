// Раздел 8. Список инициализации конструктора.
//
// Задача: создать класс Plate с двумя конструкторами.
//
// Что нужно сделать:
// 1. Добавить private-поля width, height, thickness.
// 2. Написать конструктор по умолчанию через список инициализации.
// 3. Написать полный конструктор через список инициализации.
// 4. Добавить print() const.
// 5. Проверить оба конструктора в main().
//
// Важно:
// - Не присваивайте поля в теле конструктора.
// - В width(width) левый width — поле класса, правый width — параметр.
// - Пишите поля в списке в том же порядке, что и они объявлены в классе.

#include <iostream>

class Plate {
private:
    int width;
    int height;
    int thickness;

public:
    Plate();
    Plate(int width, int height, int thickness);
    void print() const;
};

// TODO: реализуйте конструктор по умолчанию через список инициализации.

// TODO: реализуйте полный конструктор через список инициализации.

void Plate::print() const {
    std::cout << "Plate: "
              << width << "x" << height
              << ", thickness " << thickness << '\n';
}

int main() {
    Plate emptyPlate;
    Plate wallPlate(30, 20, 8);

    emptyPlate.print();
    wallPlate.print();

    return 0;
}
