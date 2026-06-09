// Раздел 10. Делегирование конструкторов.
//
// Задача: создать Worker с несколькими конструкторами.
//
// Что нужно сделать:
// 1. Хранить id, ФИО, пол, возраст, должность и отдел.
// 2. Сделать цепочку конструкторов через делегирование.
// 3. Не добавлять setter для id.
// 4. Вывести несколько рабочих с разным набором данных.

#include <iostream>
#include <string>

class Worker {
private:
    int id;
    std::string fullName;
    std::string gender;
    int age;
    std::string position;
    std::string department;

public:
    Worker(int id, const std::string& fullName);
    Worker(int id, const std::string& fullName, const std::string& gender);
    Worker(int id, const std::string& fullName, const std::string& gender, int age);
    Worker(int id, const std::string& fullName, const std::string& gender, int age, const std::string& position);
    Worker(int id, const std::string& fullName, const std::string& gender, int age, const std::string& position, const std::string& department);

    int getId() const;
    void print() const;
};

// TODO: реализуйте конструкторы через делегирование.
// TODO: реализуйте getId() и print().

int main() {
    // TODO: создайте несколько Worker с разным числом аргументов.
    // TODO: вызовите print() для каждого объекта.

    return 0;
}
