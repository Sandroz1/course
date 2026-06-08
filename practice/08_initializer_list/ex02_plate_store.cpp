// Раздел 8. Список инициализации конструктора.
//
// Задача: сделать список плиток.
//
// Что нужно сделать:
// 1. Создать class Plate.
// 2. Написать конструктор Plate через список инициализации.
// 3. Создать vector<Plate>.
// 4. Добавить 3 плитки заранее.
// 5. Сделать вывод списка.
// 6. Добавить новую плитку по введённым размерам.
// 7. Удалить плитку по номеру с проверкой.
//
// Важно:
// - Перед erase проверяйте номер.
// - Пользователь вводит номер с 1, а индекс vector начинается с 0.
// - Список инициализации пишется только у конструктора.

#include <iostream>
#include <vector>

class Plate {
private:
    int width;
    int height;
    int thickness;

public:
    Plate(int width, int height, int thickness);
    void print() const;
};

// TODO: реализуйте конструктор через список инициализации.

void Plate::print() const {
    std::cout << width << "x" << height
              << ", thickness " << thickness << '\n';
}

void printPlates(const std::vector<Plate>& plates) {
    // TODO: выведите список плиток с номерами от 1.
}

int main() {
    std::vector<Plate> plates;

    // TODO: добавьте 3 заранее созданные плитки через push_back.

    int choice = 0;

    while (choice != 4) {
        std::cout << "\n1. Show plates\n";
        std::cout << "2. Add plate\n";
        std::cout << "3. Delete plate\n";
        std::cout << "4. Exit\n";
        std::cout << "Choice: ";
        std::cin >> choice;

        if (choice == 1) {
            printPlates(plates);
        } else if (choice == 2) {
            // TODO: считать размеры и добавить новую Plate.
        } else if (choice == 3) {
            // TODO: считать номер, проверить границы и удалить плитку.
        }
    }

    return 0;
}
