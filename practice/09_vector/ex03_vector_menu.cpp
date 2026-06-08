// Раздел 9. std::vector.
//
// Задача: сделать меню для списка студентов.
//
// Что нужно сделать:
// 1. Создать class Student.
// 2. Создать std::vector<Student> students до цикла меню.
// 3. Сделать пункты: показать, добавить, удалить, очистить, выйти.
// 4. При удалении проверять номер.
// 5. При выводе пустого списка показывать понятное сообщение.

#include <iostream>
#include <string>
#include <vector>

class Student {
private:
    std::string name;
    int age;

public:
    Student(const std::string& name, int age);
    void print() const;
};

// TODO: реализуйте Student.

void printStudents(const std::vector<Student>& students) {
    // TODO: если список пуст, выведите сообщение.
    // TODO: иначе выведите всех студентов с номерами.
}

int main() {
    std::vector<Student> students;
    int choice = 0;

    while (choice != 5) {
        std::cout << "\n1. Show students\n";
        std::cout << "2. Add student\n";
        std::cout << "3. Delete student\n";
        std::cout << "4. Clear list\n";
        std::cout << "5. Exit\n";
        std::cout << "Choice: ";
        std::cin >> choice;

        // TODO: обработайте пункты меню.
    }

    return 0;
}
