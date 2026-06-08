// Раздел 9. std::vector.
//
// Задача: хранить объекты Student в vector.
//
// Что нужно сделать:
// 1. Создать class Student с name и age.
// 2. Добавить конструктор и print() const.
// 3. Создать std::vector<Student>.
// 4. Добавить несколько студентов через emplace_back.
// 5. Вывести список с номерами.
// 6. Удалить студента по номеру с проверкой.

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

// TODO: реализуйте конструктор и print().

void printStudents(const std::vector<Student>& students) {
    // TODO: выведите студентов с номерами от 1.
}

int main() {
    std::vector<Student> students;

    // TODO: добавьте 2-3 студентов через emplace_back.
    // TODO: выведите список.
    // TODO: считайте номер и удалите студента с проверкой.
    // TODO: выведите список после удаления.

    return 0;
}
